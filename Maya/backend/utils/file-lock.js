/**
 * File Lock Utility for Concurrent Write Safety
 * 
 * Prevents race conditions when multiple requests write to the same file concurrently
 * Uses a mutex/queue pattern to serialize writes per file
 * 
 * SECURITY: Validates file paths to prevent directory traversal
 * PERFORMANCE: Efficient queue processing with minimal overhead
 * ROBUSTNESS: Timeout protection and error handling
 */

import { logWarning, logError } from './logger.js';
import { withTimeout, TIMEOUTS } from './timeout.js';
import path from 'path';

// Per-file write queues (mutex pattern)
const writeQueues = new Map();

// Maximum lock wait time (30 seconds)
const MAX_LOCK_WAIT = 30000;

/**
 * Validate file path to prevent directory traversal attacks
 */
function validateFilePath(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Invalid file path: must be a non-empty string');
  }
  
  // Normalize path to prevent directory traversal
  const normalized = path.normalize(filePath);
  
  // Check for directory traversal attempts
  if (normalized.includes('..')) {
    throw new Error('Invalid file path: directory traversal detected');
  }
  
  return normalized;
}

/**
 * Acquire a lock for a file path
 * Returns a promise that resolves with a release function
 */
function acquireLock(filePath) {
  const validatedPath = validateFilePath(filePath);
  
  if (!writeQueues.has(validatedPath)) {
    writeQueues.set(validatedPath, {
      queue: [],
      processing: false,
      lastUsed: Date.now(),
    });
  }

  const queue = writeQueues.get(validatedPath);

  return new Promise((resolve) => {
    queue.queue.push(resolve);
    queue.lastUsed = Date.now();

    // Start processing if not already processing
    if (!queue.processing) {
      processQueue(validatedPath);
    }
  });
}

/**
 * Process the write queue for a file
 */
function processQueue(filePath) {
  const queue = writeQueues.get(filePath);
  if (!queue || queue.queue.length === 0) {
    queue.processing = false;
    return;
  }

  // Prevent concurrent processing
  if (queue.processing) {
    return;
  }

  queue.processing = true;
  const resolve = queue.queue.shift();
  
  // Resolve with release function immediately
  // The release function will be called after the operation completes
  resolve(() => {
    queue.processing = false;
    // Process next item in queue (use setImmediate to avoid stack overflow)
    if (queue.queue.length > 0) {
      setImmediate(() => processQueue(filePath));
    }
  });
}

/**
 * Execute a write operation with file locking
 * Ensures only one write happens at a time per file
 * 
 * SECURITY: Validates file paths to prevent directory traversal
 * PERFORMANCE: Timeout protection prevents indefinite waits
 * ROBUSTNESS: Error handling ensures locks are always released
 * 
 * @param {string} filePath - Path to the file
 * @param {Function} operation - Async function that performs the write
 * @returns {Promise} Result of the operation
 */
export async function withFileLock(filePath, operation) {
  const validatedPath = validateFilePath(filePath);
  
  // Acquire lock with timeout protection
  const release = await withTimeout(
    acquireLock(validatedPath),
    MAX_LOCK_WAIT,
    `File lock acquisition: ${validatedPath}`
  );

  let lockReleased = false;
  
  try {
    // Execute operation with timeout protection (AFTER acquiring lock)
    const result = await withTimeout(
      operation(),
      TIMEOUTS.FILE_WRITE,
      `File write operation: ${validatedPath}`
    );
    
    // Release lock
    if (!lockReleased) {
      lockReleased = true;
      release();
    }
    
    return result;
  } catch (error) {
    // Release lock even on error
    if (!lockReleased) {
      lockReleased = true;
      release();
    }
    
    logError('File lock operation failed', error, {
      filePath: validatedPath,
      errorMessage: error.message,
      isTimeout: error.message && error.message.includes('timed out'),
    });
    throw error;
  }
}

/**
 * Clean up unused queues (prevent memory leaks)
 */
export function cleanupQueues() {
  const now = Date.now();
  const maxAge = 60000; // 1 minute

  for (const [filePath, queue] of writeQueues.entries()) {
    if (!queue.processing && queue.queue.length === 0) {
      // Queue is empty and not processing - can be cleaned up
      // But keep it for a bit in case it's needed again soon
      if (!queue.lastUsed) {
        queue.lastUsed = now;
      } else if (now - queue.lastUsed > maxAge) {
        writeQueues.delete(filePath);
      }
    } else {
      queue.lastUsed = now;
    }
  }
}

// Clean up unused queues every 5 minutes.
// .unref() prevents this interval from keeping the process alive in tests.
setInterval(cleanupQueues, 300000).unref();
