/**
 * Input Validation Middleware
 * 
 * Validates and sanitizes all incoming requests
 */

import { sanitizeChatInput } from '../utils/sanitize.js';
import config from '../config/env.js';

/**
 * Validate chat request body
 */
export function validateChatRequest(req, res, next) {
  try {
    // Check content type
    if (req.get('content-type') && !req.get('content-type').includes('application/json')) {
      return res.status(400).json({
        error: 'Invalid content type. Expected application/json'
      });
    }
    
    // Check request body exists
    if (!req.body) {
      return res.status(400).json({
        error: 'Request body is required'
      });
    }
    
    // Sanitize and validate input
    const sanitized = sanitizeChatInput({
      message: req.body.message,
      history: req.body.history
    });
    
    // Check for errors
    if (sanitized.errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: sanitized.errors
      });
    }
    
    // Attach sanitized data to request
    req.sanitized = {
      message: sanitized.message,
      history: sanitized.history,
      warnings: sanitized.warnings
    };
    
    // Log warnings if any
    if (sanitized.warnings.length > 0) {
      console.warn('⚠️  Input validation warnings:', sanitized.warnings);
    }
    
    next();
  } catch (error) {
    console.error('Validation error:', error);
    return res.status(400).json({
      error: 'Invalid request format'
    });
  }
}

/**
 * Validate request size
 */
export function validateRequestSize(req, res, next) {
  const contentLength = parseInt(req.get('content-length') || '0', 10);
  const maxSize = parseSize(config.maxRequestSize);
  
  if (contentLength > maxSize) {
    return res.status(413).json({
      error: `Request too large. Maximum size is ${config.maxRequestSize}`
    });
  }
  
  next();
}

/**
 * Parse size string (e.g., "1mb") to bytes
 */
function parseSize(size) {
  const units = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  };
  
  const match = size.toLowerCase().match(/^(\d+)([a-z]+)$/);
  if (!match) {
    return 1024 * 1024; // Default 1MB
  }
  
  const [, value, unit] = match;
  return parseInt(value, 10) * (units[unit] || 1);
}



