/**
 * Audit Logging Middleware
 * 
 * Logs security-relevant events for monitoring and compliance
 */

import { logInfo, logWarning, logError } from '../utils/logger.js';
import { hashIp } from '../utils/ip-hash.js';

function auditIp(req) {
  try {
    return hashIp(req.ip);
  } catch {
    return 'unknown';
  }
}

/**
 * Audit log middleware
 */
export function auditLog(req, res, next) {
  const startTime = Date.now();
  const ipHash = auditIp(req);
  
  // Log request
  logInfo('Request received', {
    method: req.method,
    path: req.path,
    ipHash,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  });
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    
    // Log response
    logInfo('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ipHash,
    });
    
    // Log security events
    if (res.statusCode === 429) {
      logWarning('Rate limit exceeded', {
        ipHash,
        path: req.path
      });
    }
    
    if (res.statusCode === 403) {
      logWarning('Access forbidden', {
        ipHash,
        path: req.path,
        reason: 'CORS or security policy violation'
      });
    }
    
    if (res.statusCode >= 500) {
      logError('Server error', null, {
        statusCode: res.statusCode,
        path: req.path,
        ipHash,
      });
    }
    
    originalEnd.apply(this, args);
  };
  
  next();
}

/**
 * Log security event
 */
export function logSecurityEvent(eventType, details) {
  logWarning(`Security Event: ${eventType}`, {
    ...details,
    timestamp: new Date().toISOString()
  });
}
