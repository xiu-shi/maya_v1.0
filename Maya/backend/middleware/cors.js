/**
 * CORS Configuration Middleware
 * 
 * Controls cross-origin resource sharing securely
 */

import cors from 'cors';
import config from '../config/env.js';

/**
 * CORS options
 */
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin requests don't send Origin header)
    // This is the most common case for same-origin requests
    if (!origin) {
      return callback(null, true);
    }
    
    // Allow null origin (file:// protocol, some mobile apps)
    if (origin === 'null') {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (config.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // In production, if origin matches the deployment domain pattern, allow it
    // This handles cases where browser sends Origin header for same-origin requests
    if (config.isProduction) {
      try {
        const originUrl = new URL(origin);
        // Check if any allowed origin has the same hostname
        const hostnameMatch = config.allowedOrigins.some(allowed => {
          try {
            const allowedUrl = new URL(allowed);
            return allowedUrl.hostname === originUrl.hostname;
          } catch {
            // If allowed origin is not a full URL, check if it matches hostname pattern
            return allowed.includes(originUrl.hostname);
          }
        });
        
        if (hostnameMatch) {
          return callback(null, true);
        }
      } catch (e) {
        // Invalid origin URL, fall through to reject
      }
    }
    
    // Reject if not in allowed list
    callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
  },
  credentials: false, // Don't allow cookies
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

/**
 * CORS middleware
 */
export const corsMiddleware = cors(corsOptions);

/**
 * Handle CORS errors
 */
export function corsErrorHandler(err, req, res, next) {
  if (err && err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      error: 'CORS policy violation',
      message: 'Your origin is not allowed to access this API'
    });
  }
  next(err);
}

