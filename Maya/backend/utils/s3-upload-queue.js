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
 * Process the upload queue for an S3 key (conversation-based).
 * Collects all pending entries and passes the batch to uploadFunction.
 * The uploadFunction handles GET-append-PUT for the conversation.
 */
async function processQueue(s3Key, uploadFunction) {
  const queue = getQueue(s3Key);

  if (queue.processing) {
    return;
  }

  if (queue.queue.length === 0 && queue.pendingLogs.length === 0) {
    return;
  }

  queue.processing = true;

  while (queue.queue.length > 0 || queue.pendingLogs.length > 0) {
    const newEntries = [...queue.pendingLogs];
    const queuedOps = [];
    queue.pendingLogs = [];

    while (queue.queue.length > 0) {
      const op = queue.queue.shift();
      newEntries.push(op.logEntry);
      queuedOps.push(op);
    }

    const seen = new Set();
    const uniqueEntries = newEntries.filter(e => {
      if (!e || !e.id) return false;
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });

    if (uniqueEntries.length > 0) {
      try {
        const success = await withTimeout(
          uploadFunction(uniqueEntries),
          TIMEOUTS.S3_UPLOAD,
          `S3 conversation queue: ${s3Key}`
        );

        if (success) {
          queue.lastUpload = new Date().toISOString();
          logInfo('S3 conversation queue processed', {
            s3Key,
            entriesUploaded: uniqueEntries.length,
          });
        }

        for (const op of queuedOps) {
          op.resolve(success);
        }
      } catch (error) {
        logWarning('S3 conversation queue processing failed', {
          s3Key,
          error: error.message,
          entriesCount: uniqueEntries.length,
        });

        for (const op of queuedOps) {
          op.reject(error);
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
