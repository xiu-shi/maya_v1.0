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
import config from "../config/env.js";

// S3 Configuration
const AWS_REGION = process.env.AWS_REGION || "eu-west-1"; // Ireland region
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || "maya-ai-builder-prod-logs"; // Default bucket name
const ENABLE_S3_LOGGING = process.env.ENABLE_S3_LOGGING === "true";

// Initialize S3 client (only if S3 is enabled and configured)
let s3Client = null;

if (ENABLE_S3_LOGGING && AWS_S3_BUCKET) {
  try {
    s3Client = new S3Client({
      region: AWS_REGION,
      // Credentials will be picked up from:
      // 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
      // 2. IAM role (if running on EC2/ECS/Lambda)
      // 3. AWS credentials file (~/.aws/credentials)
    });

    logInfo("S3 logging enabled", {
      region: AWS_REGION,
      bucket: AWS_S3_BUCKET,
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
 * Format: chat-logs/YYYY/MM/DD/YYYY-MM-DD.json
 */
function getS3Key(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
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
export async function uploadLogToS3(logEntry, existingLogs = []) {
  // Skip if S3 not configured
  if (!s3Client || !AWS_S3_BUCKET) {
    return false;
  }

  try {
    const date = new Date(logEntry.timestamp || new Date());
    const s3Key = getS3Key(date);

    // Merge existing logs with new entry
    const allLogs = [...existingLogs, logEntry];

    // Upload entire daily log file
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

    await s3Client.send(command);

    logInfo("Log uploaded to S3", {
      bucket: AWS_S3_BUCKET,
      key: s3Key,
      logCount: allLogs.length,
    });

    return true;
  } catch (error) {
    // Log error but don't throw - S3 failure shouldn't break chat
    logError("Failed to upload log to S3", error, {
      bucket: AWS_S3_BUCKET,
      errorCode: error.code,
      errorMessage: error.message,
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

  try {
    const logs = [];
    const currentDate = new Date(startDate);

    // Iterate through date range
    while (currentDate <= endDate) {
      const s3Key = getS3Key(currentDate);

      try {
        const command = new GetObjectCommand({
          Bucket: AWS_S3_BUCKET,
          Key: s3Key,
        });

        const response = await s3Client.send(command);
        const body = await response.Body.transformToString();
        const dayLogs = JSON.parse(body);

        if (Array.isArray(dayLogs)) {
          logs.push(...dayLogs);
        }
      } catch (error) {
        // File doesn't exist for this date - skip
        if (error.name !== "NoSuchKey") {
          logWarning("Failed to fetch log from S3", {
            key: s3Key,
            error: error.message,
          });
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Sort by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    logInfo("Fetched logs from S3", {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      logCount: logs.length,
    });

    return logs;
  } catch (error) {
    logError("Failed to fetch logs from S3", error);
    return [];
  }
}

/**
 * Get S3 logging status
 *
 * @returns {Object} Status information
 */
export function getS3LoggingStatus() {
  return {
    enabled: ENABLE_S3_LOGGING && !!AWS_S3_BUCKET,
    configured: !!process.env.AWS_S3_BUCKET, // Only true if explicitly set in env (not default)
    region: AWS_REGION,
    bucket: AWS_S3_BUCKET || "not configured",
    clientInitialized: !!s3Client,
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

    await s3Client.send(command);
    return true;
  } catch (error) {
    logError("S3 connection test failed", error, {
      bucket: AWS_S3_BUCKET,
      errorCode: error.code,
    });
    return false;
  }
}
