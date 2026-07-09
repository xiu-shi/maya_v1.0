/**
 * S3 Logger Utility
 *
 * Uploads chat logs to AWS S3 for persistent storage
 * Works alongside file-based logging (dual logging strategy)
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { logInfo, logError, logWarning } from "./logger.js";
import { withTimeout, TIMEOUTS } from "./timeout.js";
import config from "../config/env.js";
import { assertIpHashSecretConfigured, hashIp } from "./ip-hash.js";

// S3 Configuration
const AWS_REGION = process.env.AWS_REGION || "eu-west-1"; // Ireland region
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || "maya-ai-builder-prod-logs"; // Default bucket name
const ENABLE_S3_LOGGING = process.env.ENABLE_S3_LOGGING === "true";
const CONVERSATION_MESSAGE_CAP = 30;

// Initialize S3 client (only if S3 is enabled and configured)
let s3Client = null;

// Circuit breaker state for S3 operations
let circuitBreakerState = {
  failures: 0,
  lastFailureTime: null,
  isOpen: false,
  OPEN_THRESHOLD: 5, // Open circuit after 5 consecutive failures
  RESET_TIMEOUT: 60000, // Reset after 60 seconds
};

/**
 * Check if circuit breaker should allow operation
 */
function isCircuitBreakerOpen() {
  if (!circuitBreakerState.isOpen) {
    return false;
  }
  
  // Check if reset timeout has passed
  if (circuitBreakerState.lastFailureTime) {
    const timeSinceFailure = Date.now() - circuitBreakerState.lastFailureTime;
    if (timeSinceFailure > circuitBreakerState.RESET_TIMEOUT) {
      // Reset circuit breaker
      circuitBreakerState.isOpen = false;
      circuitBreakerState.failures = 0;
      logInfo("S3 circuit breaker reset", { timeSinceFailure });
      return false;
    }
  }
  
  return true;
}

/**
 * Record successful operation (reset circuit breaker)
 */
function recordSuccess() {
  if (circuitBreakerState.failures > 0) {
    logInfo("S3 operation succeeded, resetting circuit breaker", {
      previousFailures: circuitBreakerState.failures
    });
  }
  circuitBreakerState.failures = 0;
  circuitBreakerState.isOpen = false;
  circuitBreakerState.lastFailureTime = null;
}

/**
 * Record failed operation (may open circuit breaker)
 */
function recordFailure() {
  circuitBreakerState.failures++;
  circuitBreakerState.lastFailureTime = Date.now();
  
  if (circuitBreakerState.failures >= circuitBreakerState.OPEN_THRESHOLD) {
    circuitBreakerState.isOpen = true;
    logWarning("S3 circuit breaker opened", {
      failures: circuitBreakerState.failures,
      threshold: circuitBreakerState.OPEN_THRESHOLD,
      resetAfter: `${circuitBreakerState.RESET_TIMEOUT / 1000}s`
    });
  }
}

/**
 * Validate AWS credentials are available
 */
function validateAWSCredentials() {
  const hasEnvCredentials = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
  const hasIAMRole = !!process.env.AWS_EXECUTION_ENV; // EC2/ECS/Lambda indicator
  
  if (!hasEnvCredentials && !hasIAMRole) {
    // Check if credentials file exists (best effort check)
    // Note: AWS SDK will handle credential chain automatically
    logWarning("AWS credentials not found in environment", {
      hasEnvCredentials,
      hasIAMRole,
      note: "AWS SDK will check credentials file and IAM roles automatically"
    });
  }
  
  return true; // AWS SDK handles credential chain, so we don't fail here
}

if (ENABLE_S3_LOGGING && AWS_S3_BUCKET) {
  try {
    // Validate credentials (best effort)
    validateAWSCredentials();
    
    s3Client = new S3Client({
      region: AWS_REGION,
      // Credentials will be picked up from:
      // 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
      // 2. IAM role (if running on EC2/ECS/Lambda)
      // 3. AWS credentials file (~/.aws/credentials)
      // AWS SDK handles credential chain automatically
      maxAttempts: 3, // SDK-level retry attempts
    });

    logInfo("S3 logging enabled", {
      region: AWS_REGION,
      bucket: AWS_S3_BUCKET,
      clientConfigured: !!s3Client,
    });
  } catch (error) {
    logError("Failed to initialize S3 client", error);
    s3Client = null;
  }
} else {
  logInfo("S3 logging disabled", {
    enabled: ENABLE_S3_LOGGING,
    bucket: AWS_S3_BUCKET || "not configured",
  });
}

if (ENABLE_S3_LOGGING) {
  assertIpHashSecretConfigured();
}

/**
 * Get S3 key for a log file (date-based path): legacy single-file-per-day
 * Format: chat-logs/YYYY/MM/DD/YYYY-MM-DD.json (UTC/GMT normalized)
 * Used for listing/fetching; new writes use getS3KeyForEntry for unique keys.
 */
export function getS3Key(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;
  return `chat-logs/${year}/${month}/${day}/${dateStr}.json`;
}

/**
 * Get unique S3 key for a single log entry (no overwrite).
 * Format: chat-logs/YYYY/MM/DD/YYYY-MM-DDTHH-mm-ss-sssZ_<ipHash>_<region>_<short-id>.json
 * ipHash is HMAC-SHA256(ip, IP_HASH_SECRET) truncated to 16 hex chars (no raw IP in key).
 *
 * @param {Object} logEntry - Log entry with timestamp, ip, id, and optional region
 * @returns {string} Unique S3 key
 */
export function getS3KeyForEntry(logEntry) {
  const date = new Date(logEntry.timestamp || Date.now());
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const iso = date.toISOString();
  const safeTimestamp = iso.replace(/:/g, "-").replace(/\./g, "-");
  const ipHash = hashIp(logEntry.ip);
  const sanitizedRegion = (logEntry.region || "unknown")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .slice(0, 10);
  const shortId = (logEntry.id || "unknown").replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20);
  const filename = `${safeTimestamp}_${ipHash}_${sanitizedRegion}_${shortId || "id"}.json`;
  return `chat-logs/${year}/${month}/${day}/${filename}`;
}

export { hashIp } from "./ip-hash.js";

/** True if key is the legacy single-file-per-day key (no unique suffix). */
export function isLegacyDayKey(s3Key) {
  return /\/\d{4}-\d{2}-\d{2}\.json$/.test(s3Key);
}

/**
 * Sanitize error message to prevent information leakage
 */
function sanitizeError(error) {
  if (!error) return error;
  
  const sanitized = {
    name: error.name,
    message: error.message,
    code: error.code,
    stack: error.stack,
  };
  
  if (sanitized.message) {
    sanitized.message = sanitized.message.replace(/AKIA[0-9A-Z]{16}/g, '[REDACTED]');
    sanitized.message = sanitized.message.replace(/aws_access_key_id[=:]\s*[^\s]+/gi, 'aws_access_key_id=[REDACTED]');
    sanitized.message = sanitized.message.replace(/aws_secret_access_key[=:]\s*[^\s]+/gi, 'aws_secret_access_key=[REDACTED]');
  }
  
  return sanitized;
}

/**
 * Get S3 key for a conversation document.
 * Format: chat-logs/conversations/YYYY/MM/DD/<conversationId>.json
 * Date is derived from the conversationId timestamp for cross-midnight consistency.
 *
 * @param {string} conversationId - Conversation ID (format: conv_<timestamp>_<random>)
 * @returns {string} S3 key
 */
export function getS3KeyForConversation(conversationId) {
  if (!conversationId || typeof conversationId !== 'string') {
    throw new Error('Invalid conversationId for S3 key generation');
  }

  const parts = conversationId.split('_');
  let date;
  if (parts.length >= 2 && !isNaN(parseInt(parts[1], 10))) {
    date = new Date(parseInt(parts[1], 10));
  } else {
    date = new Date();
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  const safeConvId = conversationId.replace(/[^a-zA-Z0-9_-]/g, "");
  return `chat-logs/conversations/${year}/${month}/${day}/${safeConvId}.json`;
}

/**
 * Fetch an existing conversation document from S3.
 * Returns null if not found or on error.
 */
async function getConversationFromS3(s3Key) {
  if (!s3Client || !AWS_S3_BUCKET) return null;

  try {
    const command = new GetObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: s3Key,
    });

    const response = await withTimeout(
      s3Client.send(command),
      TIMEOUTS.S3_FETCH || 10000,
      `S3 get conversation: ${s3Key}`
    );

    const body = await response.Body.transformToString();
    return JSON.parse(body);
  } catch (error) {
    if (error.name === 'NoSuchKey' ||
        (error.$metadata && error.$metadata.httpStatusCode === 404) ||
        (error.message && error.message.includes('NoSuchKey'))) {
      return null;
    }
    logWarning('Failed to fetch existing conversation from S3', {
      s3Key,
      error: error.message,
    });
    return null;
  }
}

/**
 * Upload a conversation to S3 (append new messages to existing conversation).
 * Creates a new conversation document if none exists.
 * Enforces a message cap of CONVERSATION_MESSAGE_CAP (30).
 *
 * @param {string} s3Key - S3 key for the conversation
 * @param {Array} newEntries - Array of new log entries to append
 * @returns {Promise<boolean>} True if upload successful
 */
export async function uploadConversationToS3(s3Key, newEntries) {
  if (!s3Client || !AWS_S3_BUCKET) return false;
  if (!newEntries || newEntries.length === 0) return false;

  if (isCircuitBreakerOpen()) {
    logWarning("S3 conversation upload skipped - circuit breaker open", {
      failures: circuitBreakerState.failures,
      lastFailureTime: circuitBreakerState.lastFailureTime,
    });
    return false;
  }

  try {
    let conversation = await getConversationFromS3(s3Key);

    const firstEntry = newEntries[0];

    if (!conversation || !conversation.messages) {
      conversation = {
        conversationId: firstEntry.conversationId,
        conversationStatus: "active",
        startedAt: firstEntry.timestamp,
        lastMessageAt: firstEntry.timestamp,
        messageCount: 0,
        messageCap: CONVERSATION_MESSAGE_CAP,
        environment: firstEntry.environment,
        serverHost: firstEntry.serverHost,
        ip: firstEntry.ip,
        region: firstEntry.region || "unknown",
        userAgent: firstEntry.userAgent || "unknown",
        messages: [],
      };
    }

    const existingIds = new Set(conversation.messages.map(m => m.id));
    for (const entry of newEntries) {
      if (existingIds.has(entry.id)) continue;
      if (conversation.messages.length >= CONVERSATION_MESSAGE_CAP) {
        logWarning('Conversation message cap reached', {
          conversationId: conversation.conversationId,
          cap: CONVERSATION_MESSAGE_CAP,
          droppedMessageId: entry.id,
        });
        break;
      }

      conversation.messages.push({
        id: entry.id,
        timestamp: entry.timestamp,
        status: entry.status,
        statusCode: entry.statusCode,
        userMessage: entry.userMessage,
        assistantResponse: entry.assistantResponse,
        responseTime: entry.responseTime,
        messageLength: entry.messageLength,
        responseLength: entry.responseLength,
        historyLength: entry.historyLength,
        warnings: entry.warnings || [],
        errorType: entry.errorType || null,
        errorMessage: entry.errorMessage || null,
      });

      existingIds.add(entry.id);
    }

    conversation.messageCount = conversation.messages.length;
    if (conversation.messages.length > 0) {
      conversation.lastMessageAt =
        conversation.messages[conversation.messages.length - 1].timestamp;
    }

    const command = new PutObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: s3Key,
      Body: JSON.stringify(conversation, null, 2),
      ContentType: "application/json",
      ServerSideEncryption: "AES256",
      Metadata: {
        "conversation-id": conversation.conversationId,
        "message-count": String(conversation.messageCount),
        "started-at": conversation.startedAt,
        "uploaded-at": new Date().toISOString(),
        encryption: "SSE-S3",
      },
    });

    await withTimeout(
      s3Client.send(command),
      TIMEOUTS.S3_UPLOAD,
      `S3 conversation upload: ${s3Key}`
    );

    recordSuccess();

    logInfo("Conversation uploaded to S3", {
      bucket: AWS_S3_BUCKET,
      key: s3Key,
      conversationId: conversation.conversationId,
      messageCount: conversation.messageCount,
      newMessages: newEntries.length,
    });

    return true;
  } catch (error) {
    recordFailure();

    const sanitizedError = sanitizeError(error);
    logError("Failed to upload conversation to S3", sanitizedError, {
      bucket: AWS_S3_BUCKET,
      s3Key,
      errorCode: error.code,
      errorMessage: sanitizedError.message || error.message,
      conversationId: newEntries[0]?.conversationId,
      isCredentialsError: error.code === 'CredentialsError' || error.code === 'InvalidAccessKeyId',
      isPermissionError: error.code === 'AccessDenied',
      isNetworkError: error.code === 'NetworkingError' || error.code === 'TimeoutError',
      isTimeoutError: error.message && error.message.includes('timed out'),
      circuitBreakerFailures: circuitBreakerState.failures,
    });
    return false;
  }
}

/**
 * Finalize a conversation in S3 after inactivity timeout.
 * Marks the conversation as "completed" with endedAt, duration, and endReason.
 *
 * @param {string} s3Key - S3 key for the conversation document
 * @param {Object} metadata - Finalization metadata
 * @param {string} metadata.endedAt - ISO timestamp when the conversation ended
 * @param {string} metadata.endReason - Reason for ending (e.g., "inactivity_timeout")
 * @param {number} metadata.finalMessageCount - Total messages tracked in session
 * @param {number} metadata.durationMs - Duration of the conversation in milliseconds
 * @returns {Promise<boolean>} True if finalization succeeded
 */
export async function finalizeConversationInS3(s3Key, metadata) {
  if (!s3Client || !AWS_S3_BUCKET) return false;
  if (isCircuitBreakerOpen()) return false;

  try {
    const conversation = await getConversationFromS3(s3Key);
    if (!conversation) {
      logWarning('Cannot finalize conversation - not found in S3', { s3Key });
      return false;
    }

    conversation.conversationStatus = 'completed';
    conversation.endedAt = metadata.endedAt;
    conversation.endReason = metadata.endReason;
    conversation.durationMs = metadata.durationMs || null;

    const command = new PutObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: s3Key,
      Body: JSON.stringify(conversation, null, 2),
      ContentType: 'application/json',
      ServerSideEncryption: 'AES256',
      Metadata: {
        'conversation-id': conversation.conversationId,
        'message-count': String(conversation.messageCount),
        'conversation-status': 'completed',
        'ended-at': metadata.endedAt,
        encryption: 'SSE-S3',
      },
    });

    await withTimeout(
      s3Client.send(command),
      TIMEOUTS.S3_UPLOAD,
      `S3 finalize conversation: ${s3Key}`
    );

    recordSuccess();
    logInfo('Conversation finalized in S3', {
      s3Key,
      conversationId: conversation.conversationId,
      messageCount: conversation.messageCount,
      durationMs: metadata.durationMs,
    });

    return true;
  } catch (error) {
    recordFailure();
    logError('Failed to finalize conversation in S3', sanitizeError(error), { s3Key });
    return false;
  }
}

/** @deprecated Use uploadConversationToS3 for new code. Kept for backward compatibility. */
export async function uploadLogToS3(logEntry, existingLogs = []) {
  if (!s3Client || !AWS_S3_BUCKET) return false;
  if (isCircuitBreakerOpen()) return false;

  if (logEntry.conversationId) {
    const s3Key = getS3KeyForConversation(logEntry.conversationId);
    return uploadConversationToS3(s3Key, [logEntry]);
  }

  try {
    const s3Key = getS3KeyForEntry(logEntry);
    const command = new PutObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: s3Key,
      Body: JSON.stringify([logEntry], null, 2),
      ContentType: "application/json",
      ServerSideEncryption: "AES256",
    });
    await withTimeout(s3Client.send(command), TIMEOUTS.S3_UPLOAD, `S3 upload: ${s3Key}`);
    recordSuccess();
    return true;
  } catch (error) {
    recordFailure();
    logError("Failed to upload log to S3", sanitizeError(error));
    return false;
  }
}

/**
 * Fetch logs from S3 for a date range
 *
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Array of log entries
 */
export async function fetchLogsFromS3(startDate, endDate) {
  if (!s3Client || !AWS_S3_BUCKET) {
    return [];
  }

  // Check circuit breaker
  if (isCircuitBreakerOpen()) {
    logWarning("S3 fetch skipped - circuit breaker open", {
      failures: circuitBreakerState.failures,
      lastFailureTime: circuitBreakerState.lastFailureTime,
    });
    return [];
  }

  try {
    // Normalize dates to UTC for consistent iteration
    const startUTC = new Date(Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate()
    ));
    const endUTC = new Date(Date.UTC(
      endDate.getUTCFullYear(),
      endDate.getUTCMonth(),
      endDate.getUTCDate()
    ));

    // Build list of dates to fetch
    const datesToFetch = [];
    const currentDate = new Date(startUTC);
    while (currentDate <= endUTC) {
      datesToFetch.push(new Date(currentDate));
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    const fetchPromises = datesToFetch.map(async (date) => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      const perListTimeout = Math.max(5000, TIMEOUTS.S3_FETCH / datesToFetch.length);
      const dayLogs = [];

      // 1) Fetch conversation documents (new format)
      const convPrefix = `chat-logs/conversations/${year}/${month}/${day}/`;
      try {
        const listCommand = new ListObjectsV2Command({
          Bucket: AWS_S3_BUCKET, Prefix: convPrefix, MaxKeys: 1000,
        });
        const listResponse = await withTimeout(
          s3Client.send(listCommand), perListTimeout, `S3 list conversations: ${convPrefix}`
        );
        const keys = (listResponse.Contents || []).map((o) => o.Key).filter(Boolean);

        for (const key of keys) {
          try {
            const perGetTimeout = Math.max(3000, TIMEOUTS.S3_FETCH / (datesToFetch.length * Math.max(keys.length, 1)));
            const response = await withTimeout(
              s3Client.send(new GetObjectCommand({ Bucket: AWS_S3_BUCKET, Key: key })),
              perGetTimeout, `S3 get: ${key}`
            );
            const parsed = JSON.parse(await response.Body.transformToString());
            if (parsed && Array.isArray(parsed.messages)) {
              const msgs = parsed.messages.map(msg => ({
                ...msg,
                conversationId: parsed.conversationId,
                environment: parsed.environment,
                serverHost: parsed.serverHost,
                ip: parsed.ip,
                region: parsed.region,
                userAgent: parsed.userAgent,
              }));
              dayLogs.push(...msgs);
            }
          } catch (error) {
            if (error.name !== "NoSuchKey" && !(error.message && error.message.includes("NoSuchKey"))) {
              logWarning("Failed to fetch conversation from S3", { key, error: sanitizeError(error).message });
            }
          }
        }
      } catch (error) {
        logWarning("Failed to list conversation keys", { convPrefix, error: sanitizeError(error).message });
      }

      // 2) Fetch legacy per-message objects (backward compatibility)
      const legacyPrefix = `chat-logs/${year}/${month}/${day}/`;
      try {
        const listCommand = new ListObjectsV2Command({
          Bucket: AWS_S3_BUCKET, Prefix: legacyPrefix, MaxKeys: 1000,
        });
        const listResponse = await withTimeout(
          s3Client.send(listCommand), perListTimeout, `S3 list legacy: ${legacyPrefix}`
        );
        const keys = (listResponse.Contents || []).map((o) => o.Key).filter(Boolean);

        for (const key of keys) {
          try {
            const perGetTimeout = Math.max(3000, TIMEOUTS.S3_FETCH / (datesToFetch.length * Math.max(keys.length, 1)));
            const response = await withTimeout(
              s3Client.send(new GetObjectCommand({ Bucket: AWS_S3_BUCKET, Key: key })),
              perGetTimeout, `S3 get: ${key}`
            );
            const parsed = JSON.parse(await response.Body.transformToString());
            if (Array.isArray(parsed)) {
              dayLogs.push(...parsed);
            } else if (parsed && typeof parsed === "object" && (parsed.id || parsed.timestamp) && !parsed.messages) {
              dayLogs.push(parsed);
            }
          } catch (error) {
            if (error.name !== "NoSuchKey" && !(error.message && error.message.includes("NoSuchKey"))) {
              logWarning("Failed to fetch legacy log from S3", { key, error: sanitizeError(error).message });
            }
          }
        }
      } catch (error) {
        logWarning("Failed to list legacy keys", { legacyPrefix, error: sanitizeError(error).message });
      }

      return dayLogs;
    });

    // Wait for all fetches to complete (parallel execution)
    const results = await Promise.all(fetchPromises);
    
    // Flatten results
    const logs = results.flat();

    // Sort by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Record success if we got any logs
    if (logs.length > 0) {
      recordSuccess();
    }

    logInfo("Fetched logs from S3", {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      logCount: logs.length,
      datesFetched: datesToFetch.length,
    });

    return logs;
  } catch (error) {
    // Record failure
    recordFailure();
    
    const sanitizedError = sanitizeError(error);
    logError("Failed to fetch logs from S3", sanitizedError, {
      errorCode: error.code,
      errorMessage: sanitizedError.message || error.message,
      isTimeout: error.message && error.message.includes('timed out'),
      circuitBreakerFailures: circuitBreakerState.failures,
    });
    return [];
  }
}

/**
 * Get S3 logging status
 *
 * @returns {Object} Status information
 */
export function getS3LoggingStatus() {
  // Check process.env at runtime (not module-level constants) for accurate status
  // This allows tests to change env vars and see updated status
  const runtimeEnableS3 = process.env.ENABLE_S3_LOGGING === "true";
  const runtimeBucket = process.env.AWS_S3_BUCKET || "maya-ai-builder-prod-logs";
  
  return {
    enabled: runtimeEnableS3 && !!runtimeBucket,
    configured: !!process.env.AWS_S3_BUCKET, // Only true if explicitly set in env (not default)
    region: process.env.AWS_REGION || AWS_REGION,
    bucket: runtimeBucket || "not configured",
    clientInitialized: !!s3Client,
    circuitBreaker: {
      isOpen: circuitBreakerState.isOpen,
      failures: circuitBreakerState.failures,
      lastFailureTime: circuitBreakerState.lastFailureTime,
    },
  };
}

/**
 * Test S3 connection
 *
 * @returns {Promise<boolean>} True if connection successful
 */
export async function testS3Connection() {
  if (!s3Client || !AWS_S3_BUCKET) {
    return false;
  }

  try {
    // Try to list objects in the bucket (minimal permission check)
    const command = new ListObjectsV2Command({
      Bucket: AWS_S3_BUCKET,
      MaxKeys: 1,
    });

    // Wrap connection test with timeout
    // Note: Timeout is handled by AWS SDK's maxAttempts, but we add extra protection
    const sendPromise = s3Client.send(command);
    await withTimeout(
      sendPromise,
      TIMEOUTS.S3_CONNECTION_TEST,
      `S3 connection test: ${AWS_S3_BUCKET}`
    );
    
    // Record success
    recordSuccess();
    
    return true;
  } catch (error) {
    // Record failure
    recordFailure();
    
    const sanitizedError = sanitizeError(error);
    const errorMessage = sanitizedError.message || error.message || String(error);
    const errorCode = error.code || error.name;
    
    logError("S3 connection test failed", error, {
      bucket: AWS_S3_BUCKET,
      errorCode: errorCode,
      errorMessage: errorMessage,
      isTimeout: errorMessage.includes('timed out'),
      circuitBreakerFailures: circuitBreakerState.failures,
    });
    return false;
  }
}
