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

// S3 Configuration
const AWS_REGION = process.env.AWS_REGION || "eu-west-1"; // Ireland region
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || "maya-ai-builder-prod-logs"; // Default bucket name
const ENABLE_S3_LOGGING = process.env.ENABLE_S3_LOGGING === "true";

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

/**
 * Get S3 key for a log file (date-based path)
 * Format: chat-logs/YYYY/MM/DD/YYYY-MM-DD.json (UTC/GMT normalized)
 * 
 * Ensures dates are normalized to UTC/GMT regardless of server timezone
 */
export function getS3Key(date = new Date()) {
  // Normalize to UTC/GMT - use UTC methods to ensure consistent date regardless of server timezone
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;

  return `chat-logs/${year}/${month}/${day}/${dateStr}.json`;
}

/**
 * Upload log entry to S3
 *
 * Strategy: Read existing logs for the day, append new entry, upload entire file
 * This batches uploads and reduces API calls
 *
 * @param {Object} logEntry - Log entry to upload
 * @param {Array} existingLogs - Existing logs for the day (from file system)
 * @returns {Promise<boolean>} True if upload successful
 */
/**
 * Sanitize error message to prevent information leakage
 */
function sanitizeError(error) {
  if (!error) return error;
  
  // Handle Error objects and plain objects
  const sanitized = {
    name: error.name,
    message: error.message,
    code: error.code,
    stack: error.stack,
  };
  
  // Remove sensitive information from error messages
  if (sanitized.message) {
    // Remove AWS access keys from error messages
    sanitized.message = sanitized.message.replace(/AKIA[0-9A-Z]{16}/g, '[REDACTED]');
    sanitized.message = sanitized.message.replace(/aws_access_key_id[=:]\s*[^\s]+/gi, 'aws_access_key_id=[REDACTED]');
    sanitized.message = sanitized.message.replace(/aws_secret_access_key[=:]\s*[^\s]+/gi, 'aws_secret_access_key=[REDACTED]');
  }
  
  return sanitized;
}

export async function uploadLogToS3(logEntry, existingLogs = []) {
  // Skip if S3 not configured
  if (!s3Client || !AWS_S3_BUCKET) {
    return false;
  }

  // Check circuit breaker
  if (isCircuitBreakerOpen()) {
    logWarning("S3 upload skipped - circuit breaker open", {
      failures: circuitBreakerState.failures,
      lastFailureTime: circuitBreakerState.lastFailureTime,
    });
    return false;
  }

  try {
    const date = new Date(logEntry.timestamp || new Date());
    const s3Key = getS3Key(date);

    // Merge existing logs with new entry
    const allLogs = [...existingLogs, logEntry];

    // Upload entire daily log file with timeout protection
    const command = new PutObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: s3Key,
      Body: JSON.stringify(allLogs, null, 2),
      ContentType: "application/json",
      // Server-side encryption (SSE-S3 - free tier)
      ServerSideEncryption: "AES256",
      // Enforce encryption (required by bucket policy)
      // This ensures data at rest is encrypted
      // Metadata
      Metadata: {
        "log-date": date.toISOString().split("T")[0],
        "log-count": String(allLogs.length),
        "uploaded-at": new Date().toISOString(),
        encryption: "SSE-S3",
      },
    });

    // Wrap S3 operation with timeout
    await withTimeout(
      s3Client.send(command),
      TIMEOUTS.S3_UPLOAD,
      `S3 upload: ${s3Key}`
    );

    // Record success (reset circuit breaker)
    recordSuccess();

    logInfo("Log uploaded to S3", {
      bucket: AWS_S3_BUCKET,
      key: s3Key,
      logCount: allLogs.length,
    });

    return true;
  } catch (error) {
    // Record failure (may open circuit breaker)
    recordFailure();
    
    // Sanitize error before logging
    const sanitizedError = sanitizeError(error);
    const errorDate = new Date(logEntry.timestamp || new Date());
    
    // Log error but don't throw - S3 failure shouldn't break chat
    logError("Failed to upload log to S3", sanitizedError, {
      bucket: AWS_S3_BUCKET,
      errorCode: error.code,
      errorMessage: sanitizedError.message || error.message,
      errorName: error.name,
      s3Key: getS3Key(errorDate),
      logEntryId: logEntry.id,
      timestamp: logEntry.timestamp,
      isCredentialsError: error.code === 'CredentialsError' || error.code === 'InvalidAccessKeyId',
      isPermissionError: error.code === 'AccessDenied',
      isNetworkError: error.code === 'NetworkingError' || error.code === 'TimeoutError',
      isTimeoutError: error.message && error.message.includes('timed out'),
      retryable: error.code !== 'AccessDenied' && error.code !== 'InvalidAccessKeyId' && error.code !== 'NoSuchBucket',
      circuitBreakerFailures: circuitBreakerState.failures,
    });
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

    // Fetch logs in parallel for better performance
    const fetchPromises = datesToFetch.map(async (date) => {
      const s3Key = getS3Key(date);
      
      try {
        const command = new GetObjectCommand({
          Bucket: AWS_S3_BUCKET,
          Key: s3Key,
        });

        // Wrap each fetch with timeout
        // Use minimum 5s per request, or distribute total timeout across requests
        const perRequestTimeout = Math.max(5000, TIMEOUTS.S3_FETCH / datesToFetch.length);
        const response = await withTimeout(
          s3Client.send(command),
          perRequestTimeout,
          `S3 fetch: ${s3Key}`
        );
        
        const body = await response.Body.transformToString();
        const dayLogs = JSON.parse(body);

        return Array.isArray(dayLogs) ? dayLogs : [];
      } catch (error) {
        // File doesn't exist for this date - skip (not an error)
        if (error.name === "NoSuchKey" || (error.message && error.message.includes("NoSuchKey"))) {
          return [];
        }
        
        // Timeout or other error - log but don't fail entire fetch
        const sanitizedError = sanitizeError(error);
        logWarning("Failed to fetch log from S3", {
          key: s3Key,
          error: sanitizedError.message || error.message,
          errorCode: error.code,
          isTimeout: error.message && error.message.includes('timed out'),
        });
        return [];
      }
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
