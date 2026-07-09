/**
 * Timeout Utility for Async Operations
 * 
 * Prevents hangs by adding timeouts to async operations.
 * Based on root causes identified in Issue #10 and Issue #11.
 */

import { logError, logWarning } from './logger.js';

/**
 * Default timeout values (in milliseconds)
 */
export const TIMEOUTS = {
  KB_LOAD: 30000,           // 30 seconds for KB loading
  KB_REFRESH: 30000,        // 30 seconds for KB refresh
  // MCP_CONNECT removed - API calls are immediate, no connection timeout needed
  FILE_READ: 5000,           // 5 seconds for file read
  FILE_WRITE: 5000,         // 5 seconds for file write
  MODULE_IMPORT: 10000,     // 10 seconds for dynamic module import
  BULK_OPERATIONS: 60000,   // 60 seconds for bulk file operations
  S3_UPLOAD: 30000,         // 30 seconds for S3 upload operations
  S3_FETCH: 60000,          // 60s for S3 fetch (used by upload-queue merge and admin read; admin API has its own 45s request timeout)
  S3_CONNECTION_TEST: 10000, // 10 seconds for S3 connection test
};

/**
 * Wrap an async operation with a timeout
 * @param {Promise<T>} promise - The async operation to wrap
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} operationName - Name of the operation for logging
 * @returns {Promise<T>} Promise that resolves/rejects with timeout handling
 */
export async function withTimeout(promise, timeoutMs, operationName = 'Operation') {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.message.includes('timed out')) {
      logError(`${operationName} timed out`, error, { timeoutMs });
      throw new Error(`${operationName} timed out after ${timeoutMs}ms. This may indicate a blocking operation or system issue.`);
    }
    throw error;
  }
}

/**
 * Wrap a file read operation with timeout
 * @param {Promise<string>} readPromise - Promise from fs.promises.readFile
 * @param {string} filePath - File path for logging
 * @returns {Promise<string>} File content with timeout protection
 */
export async function readFileWithTimeout(readPromise, filePath) {
  return withTimeout(
    readPromise,
    TIMEOUTS.FILE_READ,
    `File read: ${filePath}`
  );
}

/**
 * Wrap a file write operation with timeout
 * @param {Promise<void>} writePromise - Promise from fs.promises.writeFile
 * @param {string} filePath - File path for logging
 * @returns {Promise<void>} Write operation with timeout protection
 */
export async function writeFileWithTimeout(writePromise, filePath) {
  return withTimeout(
    writePromise,
    TIMEOUTS.FILE_WRITE,
    `File write: ${filePath}`
  );
}

/**
 * Wrap a module import with timeout
 * @param {Promise<Module>} importPromise - Promise from dynamic import()
 * @param {string} modulePath - Module path for logging
 * @returns {Promise<Module>} Imported module with timeout protection
 */
export async function importWithTimeout(importPromise, modulePath) {
  return withTimeout(
    importPromise,
    TIMEOUTS.MODULE_IMPORT,
    `Module import: ${modulePath}`
  );
}

/**
 * Execute multiple async operations in parallel with timeout
 * Useful for bulk file operations
 * @param {Array<Promise<T>>} promises - Array of promises to execute
 * @param {number} timeoutMs - Timeout per operation (default: FILE_READ)
 * @param {string} operationName - Name of bulk operation
 * @returns {Promise<Array<T>>} Results array
 */
export async function bulkOperationWithTimeout(promises, timeoutMs = TIMEOUTS.FILE_READ, operationName = 'Bulk operation') {
  const wrappedPromises = promises.map((promise, index) => 
    withTimeout(promise, timeoutMs, `${operationName} #${index + 1}`)
  );
  
  try {
    return await Promise.all(wrappedPromises);
  } catch (error) {
      logWarning(`${operationName} failed`, { error: error.message, totalOperations: promises.length });
    throw error;
  }
}

/**
 * Retry an operation with exponential backoff and timeout
 * @param {Function} operation - Async function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} timeoutMs - Timeout per attempt
 * @param {number} initialDelayMs - Initial delay before retry (exponential backoff)
 * @returns {Promise<T>} Result of operation
 */
export async function retryWithTimeout(operation, maxRetries = 3, timeoutMs = TIMEOUTS.FILE_READ, initialDelayMs = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await withTimeout(operation(), timeoutMs, `Retry attempt ${attempt + 1}`);
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries - 1) {
        const delay = initialDelayMs * Math.pow(2, attempt);
        logWarning(`Operation failed, retrying in ${delay}ms`, { attempt: attempt + 1, maxRetries, error: error.message });
        await new Promise(resolve => { const t = setTimeout(resolve, delay); if (t.unref) t.unref(); });
      }
    }
  }
  
  throw lastError;
}
