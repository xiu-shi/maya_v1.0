/**
 * Rate Limiting Middleware
 * 
 * Prevents API abuse and DoS attacks
 */

import rateLimit from 'express-rate-limit';
import config from '../config/env.js';
import { logChatAttemptIfAllowed } from '../utils/conversation-logging.js';
import { logWarning } from '../utils/logger.js';

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs, // 15 minutes default
  max: config.rateLimitMaxRequests, // 20 requests per window
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.rateLimitWindowMs / 1000)
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: async (req, res) => {
    // Log rate-limited chat attempt
    const userMessage = req.body?.message || '';
    if (req.path === '/api/chat' && userMessage) {
      logChatAttemptIfAllowed(req, {
        userMessage: userMessage,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        status: 'rate_limited',
        statusCode: 429,
        errorType: 'rate_limit_exceeded',
        errorMessage: `Rate limit exceeded. Maximum ${config.rateLimitMaxRequests} requests per ${config.rateLimitWindowMs / 1000} seconds.`,
        requestHost: req.get('host') || req.hostname || null,
      }).catch(err => {
        logWarning('Failed to log rate-limited attempt', { error: err.message });
      });
    }
    
    res.status(429).json({
      error: 'Too many requests',
      message: `Rate limit exceeded. Maximum ${config.rateLimitMaxRequests} requests per ${config.rateLimitWindowMs / 1000} seconds.`,
      retryAfter: Math.ceil(config.rateLimitWindowMs / 1000)
    });
  },
  // Skip successful requests in counting (only count errors)
  skipSuccessfulRequests: false,
  // Skip failed requests in counting
  skipFailedRequests: false,
});

/**
 * Stricter rate limiter for chat endpoint
 */
export const chatLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: Math.floor(config.rateLimitMaxRequests * 0.8), // 80% of general limit
  message: {
    error: 'Too many chat requests. Please slow down.',
    retryAfter: Math.ceil(config.rateLimitWindowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Lenient rate limiter for health checks
 */
export const healthCheckLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    error: 'Too many health check requests'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

