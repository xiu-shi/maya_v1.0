/**
 * Error Handling Middleware
 * 
 * Provides secure error handling without leaking sensitive information
 */

import config from '../config/env.js';
import { sanitizeTestOutput } from '../utils/sanitize-output.js';
import { logError } from '../utils/logger.js';

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Error handler middleware
 */
export function errorHandler(err, req, res, next) {
  // Sanitize error message and stack trace before logging
  const sanitizedMessage = sanitizeTestOutput(err.message || 'Unknown error');
  const sanitizedStack = err.stack ? sanitizeTestOutput(err.stack) : undefined;
  
  // Log error details (server-side only) - use logger utility for consistent sanitization
  logError('Request error', err, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    statusCode: err.statusCode || err.status || 500,
    timestamp: new Date().toISOString()
  });
  
  // Determine status code
  const statusCode = err.statusCode || err.status || 500;
  
  // Prepare user-friendly error response (never expose internals)
  const errorResponse = {
    error: getErrorMessage(err, statusCode),
    ...(config.isDevelopment && {
      // In development, show sanitized details for debugging
      details: sanitizedMessage,
      stack: sanitizedStack
    })
  };
  
  // Add error ID for tracking (without exposing internals)
  if (statusCode >= 500) {
    const errorId = Date.now().toString(36);
    errorResponse.errorId = errorId;
    // Log error ID server-side only (not in response)
    logError(`Error ID: ${errorId}`, null, {
      originalMessage: sanitizedMessage,
      url: req.url
    });
  }
  
  res.status(statusCode).json(errorResponse);
}

/**
 * Get user-friendly error message
 * Never exposes internal implementation details
 */
function getErrorMessage(err, statusCode) {
  // Custom API errors (already user-friendly)
  if (err instanceof APIError) {
    return err.message;
  }
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return 'Invalid input provided. Please check your request and try again.';
  }
  
  // Rate limit errors
  if (statusCode === 429) {
    return 'Too many requests. Please try again later.';
  }
  
  // CORS errors
  if (err.message && err.message.includes('CORS')) {
    return 'Request blocked by security policy. Please check your request origin.';
  }
  
  // Timeout errors
  if (err.message && (err.message.includes('timeout') || err.message.includes('ETIMEDOUT'))) {
    return 'Request timed out. Please try again.';
  }
  
  // 4xx errors - client errors (sanitize message to avoid exposing internals)
  if (statusCode >= 400 && statusCode < 500) {
    // Only return safe, user-friendly messages
    const safeMessages = {
      'ENOTFOUND': 'Unable to connect to service. Please try again later.',
      'ECONNREFUSED': 'Service temporarily unavailable. Please try again later.',
      'ValidationError': 'Invalid input provided. Please check your request.',
    };
    
    // Check for known safe error types
    for (const [key, message] of Object.entries(safeMessages)) {
      if (err.message && err.message.includes(key)) {
        return message;
      }
    }
    
    // Generic client error message (don't expose internal error details)
    return 'Invalid request. Please check your input and try again.';
  }
  
  // 5xx errors - server errors (never expose internal details)
  return 'An internal error occurred. Please try again later.';
}

/**
 * 404 handler
 */
export function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The requested endpoint ${req.method} ${req.path} does not exist`
  });
}

/**
 * Async error wrapper
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

