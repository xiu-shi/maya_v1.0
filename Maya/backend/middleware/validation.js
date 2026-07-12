/**
 * Input Validation Middleware
 * 
 * Validates and sanitizes all incoming requests
 */

import { sanitizeChatInput } from '../utils/sanitize.js';
import { logWarning, logError } from '../utils/logger.js';
import { logChatAttempt } from '../utils/chat-logger.js';
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
      // Log validation error for chat requests
      if (req.path === '/api/chat' && req.body?.message && req.body?.logging !== false) {
        logChatAttempt({
          userMessage: req.body.message,
          ip: req.ip,
          userAgent: req.get('user-agent'),
          status: 'validation_error',
          statusCode: 400,
          errorType: 'validation_failed',
          errorMessage: sanitized.errors.join('; ').substring(0, 500),
          requestHost: req.get('host') || req.hostname || null,
        }).catch(err => {
          logWarning('Failed to log validation error', { error: err.message });
        });
      }
      
      return res.status(400).json({
        error: 'Validation failed',
        details: sanitized.errors
      });
    }
    
    // Attach sanitized data to request
    const conversationLogging = req.body?.logging !== false;

    req.sanitized = {
      message: sanitized.message,
      history: sanitized.history,
      warnings: sanitized.warnings,
      conversationLogging,
    };
    
    // Log warnings if any (sanitized)
    if (sanitized.warnings.length > 0) {
      logWarning('Input validation warnings', { warnings: sanitized.warnings });
    }
    
    next();
  } catch (error) {
    logError('Validation error', error, { path: req.path });
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

const CONSENT_VERSION_PATTERN = /^[\w.-]{1,32}$/;
const ISO8601_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;

/**
 * Validate POST /api/consent body (GDPR Art 7(1) receipt).
 */
export function validateConsentRequest(req, res, next) {
  try {
    if (req.get('content-type') && !req.get('content-type').includes('application/json')) {
      return res.status(400).json({
        error: 'Invalid content type. Expected application/json',
      });
    }

    const { version, choice, ts } = req.body || {};
    const validChoices = ['accepted', 'declined', 'withdrawn'];

    if (!version || typeof version !== 'string' || !CONSENT_VERSION_PATTERN.test(version)) {
      return res.status(400).json({ error: 'Invalid or missing version' });
    }
    if (!choice || !validChoices.includes(choice)) {
      return res.status(400).json({ error: 'Invalid or missing choice' });
    }
    if (!ts || typeof ts !== 'string' || !ISO8601_PATTERN.test(ts)) {
      return res.status(400).json({ error: 'Invalid or missing ts (ISO8601 UTC required)' });
    }

    req.consentPayload = { version, choice, ts };
    next();
  } catch (error) {
    logError('Consent validation error', error, { path: req.path });
    return res.status(400).json({ error: 'Invalid request format' });
  }
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

