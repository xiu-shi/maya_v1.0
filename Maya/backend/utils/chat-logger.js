/**
 * Chat Logger Utility
 *
 * Stores chat conversations for monitoring and analysis
 * Privacy: Logs are stored server-side only, not exposed to users
 */

import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { logInfo, logError, logWarning } from "./logger.js";
import { withFileLock } from "./file-lock.js";
import {
  trackConversationMessage,
  setConversationEndHandler,
} from "./conversation-session.js";
import config from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage directory: Maya/backend/data/chat-logs/
const LOGS_DIR = path.join(__dirname, "..", "data", "chat-logs");

// Register the S3 finalization handler for conversation end (5-min inactivity).
// When a conversation goes inactive, this writes conversationStatus: "completed" to S3.
setConversationEndHandler(async (conversationId, session) => {
  if (process.env.ENABLE_S3_LOGGING !== 'true' || !process.env.AWS_S3_BUCKET) return;

  try {
    const { getS3KeyForConversation, finalizeConversationInS3 } =
      await import('./s3-logger.js');
    const s3Key = getS3KeyForConversation(conversationId);
    await finalizeConversationInS3(s3Key, {
      endedAt: session.endedAt,
      endReason: 'inactivity_timeout',
      finalMessageCount: session.messageCount,
      durationMs: session.durationMs,
    });
  } catch (error) {
    logWarning('Failed to finalize conversation in S3', {
      conversationId,
      error: error.message,
    });
  }
});

// S3 upload metrics tracking
let s3UploadMetrics = {
  totalAttempts: 0,
  totalSuccesses: 0,
  totalFailures: 0,
  lastUploadTime: null,
  lastUploadError: null,
  consecutiveFailures: 0,
};

/**
 * Check if an error is retryable
 */
function isRetryableError(error) {
  if (!error || !error.code) {
    // Check if it's a timeout error (always retryable)
    if (error.message && error.message.includes('timed out')) {
      return true;
    }
    return true; // Default to retryable if unknown
  }
  
  // Non-retryable errors
  const nonRetryableErrors = [
    'AccessDenied',
    'InvalidAccessKeyId',
    'SignatureDoesNotMatch',
    'InvalidBucketName',
    'NoSuchBucket',
  ];
  
  if (nonRetryableErrors.includes(error.code)) {
    return false;
  }
  
  // Retryable errors (network, timeout, throttling, etc.)
  return true;
}

/**
 * S3 upload function with retry logic and queue management (lazy-loaded, optional)
 * Implements exponential backoff retry strategy and concurrent upload safety
 */
let uploadToS3Async = async (logEntry, retries = 3) => {
  if (process.env.ENABLE_S3_LOGGING !== 'true' || !process.env.AWS_S3_BUCKET) {
    return false;
  }

  s3UploadMetrics.totalAttempts++;

  const { getS3KeyForConversation } = await import('./s3-logger.js');
  const s3Key = getS3KeyForConversation(logEntry.conversationId);

  const { queueS3Upload } = await import('./s3-upload-queue.js');

  return queueS3Upload(s3Key, logEntry, async (newEntries) => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const { uploadConversationToS3 } = await import('./s3-logger.js');
        const success = await uploadConversationToS3(s3Key, newEntries);

        if (success) {
          s3UploadMetrics.totalSuccesses++;
          s3UploadMetrics.lastUploadTime = new Date().toISOString();
          s3UploadMetrics.lastUploadError = null;
          s3UploadMetrics.consecutiveFailures = 0;
          return true;
        } else {
          s3UploadMetrics.totalFailures++;
          s3UploadMetrics.consecutiveFailures++;

          if (attempt < retries - 1) {
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      } catch (error) {
        s3UploadMetrics.totalFailures++;
        s3UploadMetrics.lastUploadError = {
          code: error.code || 'UnknownError',
          message: error.message,
          timestamp: new Date().toISOString(),
        };
        s3UploadMetrics.consecutiveFailures++;

        if (!isRetryableError(error)) {
          logError('S3 conversation upload failed (non-retryable)', error, {
            bucket: process.env.AWS_S3_BUCKET,
            errorCode: error.code,
            conversationId: logEntry.conversationId,
            retryable: false,
          });
          return false;
        }

        if (attempt < retries - 1) {
          logWarning('S3 conversation upload failed, retrying', {
            bucket: process.env.AWS_S3_BUCKET,
            errorCode: error.code,
            attempt: attempt + 1,
            maxRetries: retries,
            nextRetryIn: `${Math.pow(2, attempt) * 1000}ms`,
          });
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          logError('S3 conversation upload failed after retries', error, {
            bucket: process.env.AWS_S3_BUCKET,
            errorCode: error.code,
            conversationId: logEntry.conversationId,
            retries,
          });
        }
      }
    }

    return false;
  });
};

/**
 * Get S3 upload metrics
 */
export function getS3UploadMetrics() {
  return {
    ...s3UploadMetrics,
    successRate: s3UploadMetrics.totalAttempts > 0
      ? (s3UploadMetrics.totalSuccesses / s3UploadMetrics.totalAttempts * 100).toFixed(2) + '%'
      : '0%',
  };
}

/**
 * Ensure logs directory exists
 * More robust implementation with better error handling
 */
async function ensureLogsDirectory() {
  try {
    // Check if directory already exists
    try {
      await fs.access(LOGS_DIR);
      // Directory exists, verify it's writable
      const testFile = path.join(LOGS_DIR, `.test-write-${Date.now()}`);
      await fs.writeFile(testFile, "test");
      await fs.unlink(testFile);
      return; // Directory exists and is writable
    } catch (accessError) {
      // Directory doesn't exist or not accessible, create it
      if (accessError.code === 'ENOENT') {
        // Create directory recursively (creates parent directories if needed)
        await fs.mkdir(LOGS_DIR, { recursive: true });
        
        // Verify directory was created successfully
        await fs.access(LOGS_DIR);
        
        // Test write permissions
        const testFile = path.join(LOGS_DIR, `.test-write-${Date.now()}`);
        await fs.writeFile(testFile, "test");
        await fs.unlink(testFile);
        
        logInfo("Logs directory created successfully", { path: LOGS_DIR });
        return;
      } else {
        // Other access error (permissions, etc.)
        throw accessError;
      }
    }
  } catch (error) {
    // Enhanced error logging
    logError("Failed to ensure logs directory exists", error, {
      logsDir: LOGS_DIR,
      errorCode: error.code,
      errorMessage: error.message,
      cwd: process.cwd(),
    });
    // Don't throw - logging failure shouldn't break chat functionality
    // But log the error so we can monitor it
    return;
  }
}

/**
 * Get log file path for a given date
 * Format: YYYY-MM-DD.json (UTC/GMT normalized)
 * 
 * Ensures dates are normalized to UTC/GMT regardless of server timezone
 */
function getLogFilePath(date = new Date()) {
  // Normalize to UTC/GMT - use UTC methods to ensure consistent date regardless of server timezone
  const utcDate = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  ));
  const dateStr = utcDate.toISOString().split("T")[0]; // YYYY-MM-DD in UTC
  return path.join(LOGS_DIR, `${dateStr}.json`);
}

/**
 * Generate unique conversation ID
 */
function generateConversationId() {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log a chat attempt (successful or failed)
 *
 * @param {Object} data - Chat data
 * @param {string} data.userMessage - User's message
 * @param {string} data.assistantResponse - Maya's response (optional for failed attempts)
 * @param {Array} data.history - Conversation history (optional)
 * @param {string} data.ip - Client IP address
 * @param {string} data.region - Optional client region (e.g. CloudFront-Viewer-Country or GeoIP)
 * @param {string} data.userAgent - User agent string
 * @param {Array} data.warnings - Validation warnings (optional)
 * @param {number} data.responseTime - Response time in ms (optional)
 * @param {string} data.conversationId - Conversation ID (optional, auto-generated if not provided)
 * @param {string} data.status - Status: 'success', 'rate_limited', 'validation_error', 'cors_error', 'timeout', 'config_error', 'api_error', 'unknown_error'
 * @param {number} data.statusCode - HTTP status code (optional)
 * @param {string} data.errorType - Error type/category (optional)
 * @param {string} data.errorMessage - Error message (optional, sanitized)
 * @param {string} data.requestHost - Request Host header for production detection (optional)
 */
export async function logChatAttempt({
  userMessage,
  assistantResponse = null,
  history = [],
  ip,
  region = null,
  userAgent,
  warnings = [],
  responseTime = null,
  conversationId,
  status = 'success',
  statusCode = 200,
  errorType = null,
  errorMessage = null,
  requestHost = null,
}) {
  try {
    await ensureLogsDirectory();

    // Normalize to UTC/GMT - ensure consistent timezone regardless of server settings
    const now = new Date();
    // Timestamp is already in ISO format (UTC) when stored, but ensure date path uses UTC
    const logFilePath = getLogFilePath(now);

    const convId = conversationId || generateConversationId();

    // Sanitize user message (limit length, handle null/undefined)
    const sanitizedMessage = userMessage ? userMessage.substring(0, 5000) : '';
    
    const resolvedHost = requestHost
      || process.env.SERVER_HOST
      || os.hostname()
      || "unknown";

    const isProductionHost = resolvedHost.includes("ai-builders.space")
      || resolvedHost.includes("janetxiushi.me");
    const resolvedEnv = isProductionHost ? "production" : config.nodeEnv;

    // Create log entry with status information
    const logEntry = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conversationId: convId,
      timestamp: now.toISOString(),
      status: status, // 'success', 'rate_limited', 'validation_error', 'cors_error', 'timeout', 'config_error', 'api_error', 'unknown_error'
      statusCode: statusCode,
      environment: resolvedEnv,
      serverHost: resolvedHost,
      userMessage: sanitizedMessage,
      assistantResponse: assistantResponse ? assistantResponse.substring(0, 5000) : null,
      historyLength: history ? history.length : 0,
      ip: ip || "unknown",
      region: region || "unknown",
      userAgent: userAgent || "unknown",
      warnings: warnings || [],
      responseTime: responseTime,
      messageLength: sanitizedMessage.length,
      responseLength: assistantResponse ? assistantResponse.length : 0,
      errorType: errorType || null,
      errorMessage: errorMessage ? errorMessage.substring(0, 500) : null, // Limit error message length
    };

    // Use file locking to prevent race conditions with concurrent writes
    // This ensures thread-safety when multiple requests from different IPs write simultaneously
    await withFileLock(logFilePath, async () => {
      // Read existing logs for today (inside lock to prevent race conditions)
      let logs = [];
      try {
        const existingData = await fs.readFile(logFilePath, "utf-8");
        const parsed = JSON.parse(existingData);
        
        // Validate logs array
        if (Array.isArray(parsed)) {
          logs = parsed;
        } else {
          logWarning("Invalid log file format, resetting", {
            filePath: logFilePath,
            type: typeof parsed,
          });
          logs = [];
        }
      } catch (error) {
        // File doesn't exist yet, start with empty array
        if (error.code !== "ENOENT") {
          logError("Failed to read existing logs", error, {
            filePath: logFilePath,
            errorCode: error.code,
          });
        }
      }

      // Validate log entry before appending
      if (!logEntry || !logEntry.id || !logEntry.timestamp) {
        logError("Invalid log entry, skipping", null, {
          logEntryId: logEntry?.id,
          hasTimestamp: !!logEntry?.timestamp,
        });
        throw new Error("Invalid log entry: missing required fields");
      }

      // Append new log entry
      logs.push(logEntry);

      // Write back to file (atomic write within lock)
      await fs.writeFile(logFilePath, JSON.stringify(logs, null, 2), "utf-8");
    });

    // Upload to S3 as conversation document (async, non-blocking)
    // The queue serializes by conversationId so messages accumulate in one S3 object
    uploadToS3Async(logEntry).catch(err => {
      logWarning('S3 conversation upload failed (continuing with file logging)', {
        error: err.message,
        logEntryId: logEntry.id,
        conversationId: convId,
      });
    });

    // Track conversation session for inactivity-based finalization.
    // After 5 minutes of no messages, the session manager marks the
    // conversation as "completed" in S3 with duration and end timestamp.
    trackConversationMessage(convId, {
      ip: logEntry.ip,
      userAgent: logEntry.userAgent,
    });

    logInfo("Chat attempt logged", {
      conversationId: convId,
      status: status,
      statusCode: statusCode,
      messageLength: sanitizedMessage.length,
      date: now.toISOString().split("T")[0],
    });

    return logEntry;
  } catch (error) {
    // Enhanced error logging for debugging
    let hasLogsDir = false;
    try {
      await fs.access(LOGS_DIR);
      hasLogsDir = true;
    } catch {
      hasLogsDir = false;
    }

    logError("Failed to log chat attempt", error, {
      logsDir: LOGS_DIR,
      errorCode: error.code,
      errorMessage: error.message,
      nodeEnv: config.nodeEnv,
      cwd: process.cwd(),
      hasLogsDir: hasLogsDir,
      status: status,
    });
    // Don't throw - logging failure shouldn't break chat functionality
    return null;
  }
}

/**
 * Log a successful chat message (backward compatibility)
 *
 * @param {Object} data - Chat data (same as logChatAttempt)
 */
/**
 * Log a successful chat message (backward compatibility)
 *
 * @param {Object} data - Chat data (same as logChatAttempt)
 */
export async function logChatMessage({
  userMessage,
  assistantResponse,
  history = [],
  ip,
  region = null,
  userAgent,
  warnings = [],
  responseTime,
  conversationId,
  requestHost = null,
}) {
  return logChatAttempt({
    userMessage,
    assistantResponse,
    history,
    ip,
    region,
    userAgent,
    warnings,
    responseTime,
    conversationId,
    status: 'success',
    statusCode: 200,
    requestHost,
  });
}

/**
 * Get chat logs for a date range
 * Includes logs from both local files and S3 (if enabled)
 *
 * @param {Date} startDate - Start date (inclusive)
 * @param {Date} endDate - End date (inclusive)
 * @returns {Promise<Array>} Array of log entries
 */
export async function getChatLogs(startDate, endDate) {
  try {
    const logs = [];
    
    // Normalize dates to UTC for consistent processing
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
    
    // Fetch from S3 first when enabled (production logs live in S3; avoids dependency on local dir)
    if (process.env.ENABLE_S3_LOGGING === 'true' && process.env.AWS_S3_BUCKET) {
      try {
        const { fetchLogsFromS3 } = await import('./s3-logger.js');
        const s3Logs = await fetchLogsFromS3(startUTC, endUTC);
        logs.push(...s3Logs);
      } catch (error) {
        logWarning('Failed to fetch logs from S3, using file logs only', {
          error: error.message
        });
      }
    }

    // Also fetch from local files if directory is available (merge with S3 logs)
    await ensureLogsDirectory();
    const currentDate = new Date(startUTC);

    while (currentDate <= endUTC) {
      const logFilePath = getLogFilePath(currentDate);

      try {
        const fileData = await fs.readFile(logFilePath, "utf-8");
        const dayLogs = JSON.parse(fileData);
        logs.push(...dayLogs);
      } catch (error) {
        if (error.code !== "ENOENT") {
          logError(
            `Failed to read log file for ${currentDate.toISOString().split("T")[0]}`,
            error,
          );
        }
      }

      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    // Remove duplicates (same log might be in both S3 and local)
    const uniqueLogs = logs.filter((log, index, self) =>
      index === self.findIndex(l => l.id === log.id)
    );

    // Sort by timestamp (newest first)
    uniqueLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return uniqueLogs;
  } catch (error) {
    logError("Failed to get chat logs", error);
    throw error;
  }
}

/**
 * Get chat logs grouped by conversation
 *
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Object with conversationId as keys
 */
export async function getChatLogsByConversation(startDate, endDate) {
  const logs = await getChatLogs(startDate, endDate);

  // Group by conversationId
  const grouped = {};
  logs.forEach((log) => {
    if (!grouped[log.conversationId]) {
      grouped[log.conversationId] = {
        conversationId: log.conversationId,
        messages: [],
        firstMessage: log.timestamp,
        lastMessage: log.timestamp,
        totalMessages: 0,
        ip: log.ip,
        userAgent: log.userAgent,
      };
    }

    grouped[log.conversationId].messages.push(log);
    grouped[log.conversationId].totalMessages++;

    // Update timestamps
    if (
      new Date(log.timestamp) <
      new Date(grouped[log.conversationId].firstMessage)
    ) {
      grouped[log.conversationId].firstMessage = log.timestamp;
    }
    if (
      new Date(log.timestamp) >
      new Date(grouped[log.conversationId].lastMessage)
    ) {
      grouped[log.conversationId].lastMessage = log.timestamp;
    }
  });

  // Sort messages within each conversation
  Object.values(grouped).forEach((conv) => {
    conv.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  });

  return grouped;
}

/**
 * Get storage statistics
 *
 * @returns {Promise<Object>} Storage stats
 */
export async function getStorageStats() {
  const emptyStats = () => ({
    totalFiles: 0,
    totalSize: 0,
    totalSizeMB: "0.00",
    totalMessages: 0,
    totalConversations: 0,
    averageMessagesPerConversation: 0,
    averageSizePerMessage: 0,
    files: [],
  });

  try {
    await ensureLogsDirectory();

    let files = [];
    try {
      files = await fs.readdir(LOGS_DIR);
    } catch (err) {
      if (err.code === "ENOENT" && process.env.ENABLE_S3_LOGGING === "true") {
        return emptyStats();
      }
      throw err;
    }

    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    let totalSize = 0;
    let totalConversations = 0;
    let totalMessages = 0;
    const fileStats = [];

    for (const file of jsonFiles) {
      const filePath = path.join(LOGS_DIR, file);
      const stats = await fs.stat(filePath);
      const fileData = await fs.readFile(filePath, "utf-8");
      const logs = JSON.parse(fileData);

      const uniqueConversations = new Set(
        logs.map((log) => log.conversationId),
      );

      totalSize += stats.size;
      totalMessages += logs.length;
      totalConversations += uniqueConversations.size;

      fileStats.push({
        date: file.replace(".json", ""),
        size: stats.size,
        messages: logs.length,
        conversations: uniqueConversations.size,
      });
    }

    return {
      totalFiles: jsonFiles.length,
      totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      totalMessages,
      totalConversations,
      averageMessagesPerConversation:
        totalConversations > 0
          ? (totalMessages / totalConversations).toFixed(2)
          : 0,
      averageSizePerMessage:
        totalMessages > 0 ? (totalSize / totalMessages).toFixed(2) : 0,
      files: fileStats.sort((a, b) => b.date.localeCompare(a.date)),
    };
  } catch (error) {
    logError("Failed to get storage stats", error);
    if (process.env.ENABLE_S3_LOGGING === "true") {
      return emptyStats();
    }
    throw error;
  }
}

/**
 * Delete old logs (older than specified days)
 *
 * @param {number} daysToKeep - Number of days to keep (default: 90)
 * @returns {Promise<number>} Number of files deleted
 */
export async function cleanupOldLogs(daysToKeep = 90) {
  try {
    await ensureLogsDirectory();

    const files = await fs.readdir(LOGS_DIR);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let deletedCount = 0;

    for (const file of jsonFiles) {
      const dateStr = file.replace(".json", "");
      const fileDate = new Date(dateStr);

      if (fileDate < cutoffDate) {
        const filePath = path.join(LOGS_DIR, file);
        await fs.unlink(filePath);
        deletedCount++;
        logInfo("Deleted old log file", { file, date: dateStr });
      }
    }

    return deletedCount;
  } catch (error) {
    logError("Failed to cleanup old logs", error);
    throw error;
  }
}
