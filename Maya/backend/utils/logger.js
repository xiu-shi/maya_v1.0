/**
 * Secure Logging Utility
 * 
 * Logs events without exposing sensitive information
 */

import config from '../config/env.js';
import { sanitizeTestOutput } from './sanitize-output.js';

/**
 * Log levels
 */
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const currentLogLevel = config.isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;

/**
 * Sanitize log data (remove sensitive information)
 */
function sanitizeLogData(data) {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sensitiveKeys = ['token', 'password', 'secret', 'key', 'auth', 'authorization'];
  const sanitized = { ...data };
  
  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      sanitized[key] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * Log error
 * Sanitizes error messages and stack traces to prevent information leakage
 */
export function logError(message, error, metadata = {}) {
  if (currentLogLevel >= LOG_LEVELS.ERROR) {
    // Sanitize error message and stack trace
    const sanitizedError = error?.message ? sanitizeTestOutput(error.message) : undefined;
    const sanitizedStack = error?.stack && config.isDevelopment 
      ? sanitizeTestOutput(error.stack) 
      : undefined;
    
    console.error(`[ERROR] ${message}`, {
      ...sanitizeLogData(metadata),
      error: sanitizedError,
      stack: sanitizedStack
    });
  }
}

/**
 * Log warning
 * Sanitizes metadata to prevent information leakage
 */
export function logWarning(message, metadata = {}) {
  if (currentLogLevel >= LOG_LEVELS.WARN) {
    // Sanitize string values in metadata
    const sanitizedMetadata = sanitizeLogData(metadata);
    
    // Also sanitize any string values recursively
    for (const [key, value] of Object.entries(sanitizedMetadata)) {
      if (typeof value === 'string') {
        sanitizedMetadata[key] = sanitizeTestOutput(value);
      }
    }
    
    console.warn(`[WARN] ${message}`, sanitizedMetadata);
  }
}

/**
 * Log info
 */
export function logInfo(message, metadata = {}) {
  if (currentLogLevel >= LOG_LEVELS.INFO) {
    console.log(`[INFO] ${message}`, sanitizeLogData(metadata));
  }
}

/**
 * Log debug (development only)
 */
export function logDebug(message, metadata = {}) {
  if (currentLogLevel >= LOG_LEVELS.DEBUG && config.isDevelopment) {
    console.debug(`[DEBUG] ${message}`, sanitizeLogData(metadata));
  }
}

/**
 * Log API request
 */
export function logRequest(req, metadata = {}) {
  logInfo('API Request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    ...metadata
  });
}

/**
 * Log API response
 */
export function logResponse(req, res, metadata = {}) {
  logInfo('API Response', {
    method: req.method,
    path: req.path,
    statusCode: res.statusCode,
    ...metadata
  });
}

