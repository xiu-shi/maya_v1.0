/**
 * Error Handling Middleware
 * 
 * Provides secure error handling without leaking sensitive information
 */

import config from '../config/env.js';

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
  // Log error details (server-side only)
  console.error('Error:', {
    message: err.message,
    stack: config.isDevelopment ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  // Determine status code
  const statusCode = err.statusCode || err.status || 500;
  
  // Prepare error response
  const errorResponse = {
    error: getErrorMessage(err, statusCode),
    ...(config.isDevelopment && {
      details: err.message,
      stack: err.stack
    })
  };
  
  // Add error ID for tracking (without exposing internals)
  if (statusCode >= 500) {
    const errorId = Date.now().toString(36);
    errorResponse.errorId = errorId;
    console.error(`Error ID: ${errorId}`);
  }
  
  res.status(statusCode).json(errorResponse);
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(err, statusCode) {
  // Custom API errors
  if (err instanceof APIError) {
    return err.message;
  }
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return 'Invalid input provided';
  }
  
  // Rate limit errors
  if (statusCode === 429) {
    return 'Too many requests. Please try again later.';
  }
  
  // 4xx errors - client errors
  if (statusCode >= 400 && statusCode < 500) {
    return err.message || 'Invalid request';
  }
  
  // 5xx errors - server errors
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



