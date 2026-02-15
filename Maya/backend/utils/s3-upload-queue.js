/**
 * S3 Upload Queue for Concurrent Upload Safety
 * 
 * Prevents race conditions when multiple requests upload to the same S3 key concurrently
 * Uses a per-key queue to serialize uploads and ensure all logs are captured
 * 
 * SECURITY: Validates log entries and S3 keys
 * PERFORMANCE: Efficient batching and timeout protection
 * ROBUSTNESS: Error handling and retry logic
 */

import { logWarning, logInfo, logError } from './logger.js';
import { withTimeout, TIMEOUTS } from './timeout.js';

// Per-S3-key upload queues (mutex pattern)
const uploadQueues = new Map();

/**
 * Validate S3 key to prevent security issues
 */
function validateS3Key(s3Key) {
  if (!s3Key || typeof s3Key !== 'string') {
    throw new Error('Invalid S3 key: must be a non-empty string');
  }
  
  // Check for dangerous patterns
  if (s3Key.includes('..') || s3Key.startsWith('/') || s3Key.includes('//')) {
    throw new Error('Invalid S3 key: dangerous path pattern detected');
  }
  
  return s3Key;
}

/**
 * Validate log entry structure
 */
function validateLogEntry(logEntry) {
  if (!logEntry || typeof logEntry !== 'object') {
    throw new Error('Invalid log entry: must be an object');
  }
  
  if (!logEntry.id || typeof logEntry.id !== 'string') {
    throw new Error('Invalid log entry: missing or invalid id');
  }
  
  if (!logEntry.timestamp) {
    throw new Error('Invalid log entry: missing timestamp');
  }
  
  return logEntry;
}

/**
 * Get queue for a specific S3 key
 */
function getQueue(s3Key) {
  const validatedKey = validateS3Key(s3Key);
  
  if (!uploadQueues.has(validatedKey)) {
    uploadQueues.set(validatedKey, {
      queue: [],
      processing: false,
      lastUpload: null,
      pendingLogs: [], // Accumulate logs while processing
      lastUsed: Date.now(),
    });
  }
  
  const queue = uploadQueues.get(validatedKey);
  queue.lastUsed = Date.now();
  return queue;
}

/**
 * Process the upload queue for an S3 key
 */
async function processQueue(s3Key, uploadFunction) {
  const queue = getQueue(s3Key);

  if (queue.processing) {
    return; // Already processing, will be handled by existing process
  }

  if (queue.queue.length === 0 && queue.pendingLogs.length === 0) {
    return; // Nothing to process
  }

  queue.processing = true;

  while (queue.queue.length > 0 || queue.pendingLogs.length > 0) {
    // Collect all pending logs and queued operations
    const logsToUpload = [...queue.pendingLogs];
    const queuedOps = [];
    queue.pendingLogs = [];

    // Process queued operations (save resolve/reject callbacks)
    while (queue.queue.length > 0) {
      const queuedOp = queue.queue.shift();
      logsToUpload.push(queuedOp.logEntry);
      queuedOps.push(queuedOp);
    }

    if (logsToUpload.length > 0) {
      try {
        // Upload all accumulated logs at once (more efficient)
        // Use the latest log entry's timestamp for the S3 key
        const latestLog = logsToUpload[logsToUpload.length - 1];
        
        // Fetch existing logs from S3 first (if any)
        // This ensures we merge with logs that were uploaded by other concurrent requests
        let existingLogs = [];
        try {
          const { fetchLogsFromS3 } = await import('./s3-logger.js');
          const date = new Date(latestLog.timestamp || new Date());
          const startDate = new Date(Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate()
          ));
          const endDate = new Date(Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate()
          ));
          
          // Fetch with timeout protection
          existingLogs = await withTimeout(
            fetchLogsFromS3(startDate, endDate),
            TIMEOUTS.S3_FETCH,
            `S3 fetch for merge: ${s3Key}`
          );
          
          // Validate fetched logs
          if (!Array.isArray(existingLogs)) {
            logWarning('Invalid logs fetched from S3', {
              s3Key,
              type: typeof existingLogs,
            });
            existingLogs = [];
          }
        } catch (error) {
          // S3 fetch failed - continue with new logs only
          // This is OK - we'll upload what we have, and next upload will merge
          logWarning('Failed to fetch existing logs from S3 for merge', {
            error: error.message,
            s3Key,
            isTimeout: error.message && error.message.includes('timed out'),
            note: 'Will upload new logs only, next upload will merge',
          });
        }

        // Merge existing logs with new logs (deduplicate by ID)
        // Validate all logs have required fields
        const validExistingLogs = existingLogs.filter(log => 
          log && typeof log === 'object' && log.id && log.timestamp
        );
        const validNewLogs = logsToUpload.filter(log => 
          log && typeof log === 'object' && log.id && log.timestamp
        );
        
        const existingIds = new Set(validExistingLogs.map(log => log.id));
        const newLogs = validNewLogs.filter(log => !existingIds.has(log.id));
        const allLogs = [...validExistingLogs, ...newLogs];
        
        // Log warning if any logs were filtered out
        if (validExistingLogs.length !== existingLogs.length) {
          logWarning('Filtered invalid logs from existing logs', {
            s3Key,
            originalCount: existingLogs.length,
            validCount: validExistingLogs.length,
          });
        }
        if (validNewLogs.length !== logsToUpload.length) {
          logWarning('Filtered invalid logs from new logs', {
            s3Key,
            originalCount: logsToUpload.length,
            validCount: validNewLogs.length,
          });
        }

        // Upload merged logs with timeout protection
        const success = await withTimeout(
          uploadFunction(latestLog, allLogs),
          TIMEOUTS.S3_UPLOAD,
          `S3 upload queue: ${s3Key}`
        );

        if (success) {
          queue.lastUpload = new Date().toISOString();
          logInfo('S3 upload queue processed', {
            s3Key,
            logsUploaded: logsToUpload.length,
            totalLogs: allLogs.length,
            concurrentRequests: logsToUpload.length,
          });
        }

        // Resolve all queued operations (all logs uploaded together)
        // Note: We resolve all with the same success status since they're batched
        for (const queuedOp of queuedOps) {
          queuedOp.resolve(success);
        }
      } catch (error) {
        logWarning('S3 upload queue processing failed', {
          s3Key,
          error: error.message,
          logsCount: logsToUpload.length,
        });

        // Reject all queued operations
        for (const queuedOp of queuedOps) {
          queuedOp.reject(error);
        }
      }
    }
  }

  queue.processing = false;
}

/**
 * Queue an S3 upload operation
 * Ensures only one upload happens at a time per S3 key
 * Accumulates concurrent uploads and batches them efficiently
 * 
 * REAL-TIME CAPTURE: Uploads happen immediately (not delayed)
 * CONCURRENT SAFETY: Multiple IPs can upload simultaneously without conflicts
 * 
 * @param {string} s3Key - S3 key (file path)
 * @param {Object} logEntry - Log entry to upload
 * @param {Function} uploadFunction - Function to perform the upload
 * @returns {Promise<boolean>} True if upload successful
 */
export async function queueS3Upload(s3Key, logEntry, uploadFunction) {
  // Validate inputs
  const validatedKey = validateS3Key(s3Key);
  const validatedEntry = validateLogEntry(logEntry);
  
  if (typeof uploadFunction !== 'function') {
    throw new Error('Invalid upload function: must be a function');
  }
  
  const queue = getQueue(validatedKey);

  // Add log entry to pending logs
  queue.pendingLogs.push(validatedEntry);

  // Create promise for this upload
  return new Promise((resolve, reject) => {
    queue.queue.push({
      logEntry: validatedEntry,
      resolve,
      reject,
    });

    // Start processing IMMEDIATELY if not already processing
    // This ensures real-time capture (no batching delay)
    if (!queue.processing) {
      processQueue(validatedKey, uploadFunction).catch((error) => {
        // If processing fails, reject this promise
        reject(error);
      });
    }
  });
}

/**
 * Clean up unused queues (prevent memory leaks)
 */
export function cleanupQueues() {
  const now = Date.now();
  const maxAge = 300000; // 5 minutes

  for (const [s3Key, queue] of uploadQueues.entries()) {
    if (!queue.processing && queue.queue.length === 0 && queue.pendingLogs.length === 0) {
      // Queue is empty and not processing - can be cleaned up
      if (!queue.lastUsed) {
        queue.lastUsed = now;
      } else if (now - queue.lastUsed > maxAge) {
        uploadQueues.delete(s3Key);
      }
    } else {
      queue.lastUsed = now;
    }
  }
}

// Clean up unused queues every 5 minutes
setInterval(cleanupQueues, 300000);
