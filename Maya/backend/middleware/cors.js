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
    // Allow requests with no origin (file:// protocol, mobile apps, Postman, etc.) in development
    if (!origin && config.isDevelopment) {
      return callback(null, true);
    }
    
    // Allow null origin (file:// protocol) in development
    if (origin === 'null' && config.isDevelopment) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (!origin || config.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
    }
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

