/**
 * Audit Logging Middleware
 * 
 * Logs security-relevant events for monitoring and compliance
 */

import { logInfo, logWarning, logError } from '../utils/logger.js';

/**
 * Audit log middleware
 */
export function auditLog(req, res, next) {
  const startTime = Date.now();
  
  // Log request
  logInfo('Request received', {
    method: req.method,
    path: req.path,
    ip: req.ip,
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
      ip: req.ip
    });
    
    // Log security events
    if (res.statusCode === 429) {
      logWarning('Rate limit exceeded', {
        ip: req.ip,
        path: req.path
      });
    }
    
    if (res.statusCode === 403) {
      logWarning('Access forbidden', {
        ip: req.ip,
        path: req.path,
        reason: 'CORS or security policy violation'
      });
    }
    
    if (res.statusCode >= 500) {
      logError('Server error', null, {
        statusCode: res.statusCode,
        path: req.path,
        ip: req.ip
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



