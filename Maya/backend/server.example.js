/**
 * Example Server Implementation with Security
 * 
 * This file demonstrates how to integrate all security middleware
 * Copy this to server.js and implement your actual endpoints
 */

import express from 'express';
import config from './config/env.js';
import { corsMiddleware, corsErrorHandler } from './middleware/cors.js';
import { securityHeaders, customSecurityHeaders } from './middleware/securityHeaders.js';
import { apiLimiter, chatLimiter } from './middleware/rateLimit.js';
import { validateChatRequest, validateRequestSize } from './middleware/validation.js';
import { errorHandler, notFoundHandler, asyncHandler } from './middleware/errorHandler.js';
import { auditLog } from './middleware/audit.js';
import { logInfo } from './utils/logger.js';

const app = express();

// Trust proxy (if behind reverse proxy)
if (config.trustProxy) {
  app.set('trust proxy', 1);
}

// Security headers (must be first)
app.use(securityHeaders);
app.use(customSecurityHeaders);

// CORS (before routes)
app.use(corsMiddleware);

// Body parsing with size limits
app.use(express.json({ limit: config.maxRequestSize }));
app.use(express.urlencoded({ extended: true, limit: config.maxRequestSize }));

// Request size validation
app.use(validateRequestSize);

// Audit logging
app.use(auditLog);

// Health check endpoint (lenient rate limit)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// API routes with rate limiting
app.use('/api', apiLimiter);

// Chat endpoint with stricter rate limiting and validation
app.post('/api/chat',
  chatLimiter,
  validateChatRequest,
  asyncHandler(async (req, res) => {
    // Access sanitized input
    const { message, history, warnings } = req.sanitized;
    
    // Log warnings if any
    if (warnings && warnings.length > 0) {
      logInfo('Input warnings', { warnings });
    }
    
    // TODO: Implement actual chat logic with API client
    // For now, return a placeholder response
    res.json({
      response: `You said: ${message}`,
      warnings: warnings || []
    });
  })
);

// 404 handler
app.use(notFoundHandler);

// Error handlers (must be last)
app.use(corsErrorHandler);
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  logInfo(`Server started`, {
    port: PORT,
    environment: config.nodeEnv,
    nodeVersion: process.version
  });
});

export default app;

