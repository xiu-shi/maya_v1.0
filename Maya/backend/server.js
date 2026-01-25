/**
 * Maya Backend Server
 * 
 * Express server for Maya's Digital Twin chat interface
 * Integrates with AI Builders API via direct HTTP calls
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import config from './config/env.js';
import { corsMiddleware, corsErrorHandler } from './middleware/cors.js';
import { securityHeaders, customSecurityHeaders } from './middleware/securityHeaders.js';
import { apiLimiter, chatLimiter } from './middleware/rateLimit.js';
import { validateChatRequest, validateRequestSize } from './middleware/validation.js';
import { errorHandler, notFoundHandler, asyncHandler } from './middleware/errorHandler.js';
import { auditLog } from './middleware/audit.js';
import { logInfo, logError } from './utils/logger.js';
import { sanitizeTestOutput, sanitizeJestResults } from './utils/sanitize-output.js';
import { logChatMessage, getChatLogs, getChatLogsByConversation, getStorageStats } from './utils/chat-logger.js';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
// Lazy load API client to prevent blocking during module import
let MayaAPIClient = null;
let apiClientModule = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// Root endpoint - MUST be BEFORE static middleware
// Express static middleware returns 404 if file not found, doesn't call next()
// So we need to handle root path explicitly BEFORE static middleware
// Use app.all() to catch all HTTP methods for root path
app.all('/', (req, res, next) => {
  logInfo('Root route handler called', { 
    method: req.method, 
    path: req.path,
    url: req.url,
    originalUrl: req.originalUrl
  });
  res.redirect(301, '/maya.html');
});

// Serve static files from frontend directory (for development)
// This must be BEFORE body parsing to avoid interfering with static file requests
// This allows accessing maya.html via http://localhost:3000 instead of file://
const frontendPath = join(__dirname, '../frontend');

// Fix for browsers that add trailing periods to URLs
app.use((req, res, next) => {
  if (req.path.endsWith('.') && req.path.length > 1) {
    // Remove trailing period and redirect
    const cleanPath = req.path.slice(0, -1);
    return res.redirect(301, cleanPath + (req.query ? '?' + new URLSearchParams(req.query).toString() : ''));
  }
  next();
});

// Serve static files (index: false prevents serving index.html automatically)
app.use(express.static(frontendPath, {
  index: false // Don't serve index.html automatically
}));

// Body parsing with size limits (only for API routes)
app.use(express.json({ limit: config.maxRequestSize }));
app.use(express.urlencoded({ extended: true, limit: config.maxRequestSize }));

// Request size validation
app.use(validateRequestSize);

// Audit logging
app.use(auditLog);

// Track request start time for response time calculation
app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

logInfo('Setting up routes...');

// Lazy initialize API client (only when needed, not at startup)
let apiClient = null;

/**
 * Get or create API client instance (lazy loading)
 * This prevents blocking during server startup
 */
async function getAPIClient() {
  if (apiClient) {
    return apiClient;
  }
  
  try {
    // Lazy import the API client module with timeout protection (Issue #10)
    if (!apiClientModule) {
      logInfo('Lazy loading API client module...');
      const { importWithTimeout, TIMEOUTS } = await import('./utils/timeout.js');
      apiClientModule = await importWithTimeout(
        import('./api-client.js'),
        './api-client.js'
      );
      MayaAPIClient = apiClientModule.MayaAPIClient;
    }
    
    if (!apiClient && MayaAPIClient) {
      logInfo('Creating API client instance...');
      apiClient = new MayaAPIClient();
      logInfo('API client created and ready');
    }
    
    return apiClient;
  } catch (error) {
    logError('Failed to lazy load API client', error);
    return null;
  }
}

logInfo('Setting up routes...');

// Health check endpoint
app.get('/health', async (req, res) => {
  // Don't wait for API client to avoid blocking health checks
  // Just check if it exists
  const client = apiClient; // Use the existing instance if available
  
  // Get KB status if API client is available (now async with timeout protection)
  let kbStatus = null;
  if (client && typeof client.getKBStatus === 'function') {
    try {
      kbStatus = await client.getKBStatus(); // Now async
    } catch (error) {
      // Ignore KB status errors in health check
    }
  }
  
  // Note: API client is lazy-loaded on first chat request
  // Service is healthy if token is configured
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    apiReady: !!config.aiBuilderToken,
    tokenConfigured: !!config.aiBuilderToken,
    kb: kbStatus || { status: 'not_available' }
  });
});

// KB Status endpoint (includes cache information)
app.get('/api/kb/status', asyncHandler(async (req, res) => {
    const client = await getAPIClient();
  if (!client || typeof client.getKBStatus !== 'function') {
    return res.status(503).json({
      error: 'KB status not available',
      message: 'API client not initialized'
    });
  }
  
  const status = await client.getKBStatus(); // Now async with timeout protection
  
  // Add detailed cache information
  res.json({
    ...status,
    cacheDetails: {
      ...status.cache,
      recommendations: generateCacheRecommendations(status.cache)
    }
  });
}));

// Helper function to generate cache recommendations
function generateCacheRecommendations(cache) {
  const recommendations = [];
  
  if (!cache.cache) {
    recommendations.push({
      type: 'no_cache',
      priority: 'info',
      message: 'KB cache not yet initialized. It will be created on first request.',
      action: 'Send a chat request to initialize cache'
    });
    return recommendations;
  }
  
  // Check cache validity
  if (!cache.validation.valid) {
    recommendations.push({
      type: 'invalid_cache',
      priority: 'high',
      message: `Cache is invalid: ${cache.validation.reason}`,
      action: 'Call /api/admin/kb-refresh to refresh cache'
    });
  }
  
  // Check memory usage
  if (cache.memory.cached) {
    const percentage = parseFloat(cache.memory.percentageOfLimit);
    if (percentage > 80) {
      recommendations.push({
        type: 'high_memory_usage',
        priority: 'medium',
        message: `Cache using ${cache.memory.percentageOfLimit} of memory limit`,
        action: 'Consider reducing KB document size or increasing KB_MAX_CACHE_SIZE'
      });
    }
  }
  
  // Check hit rate
  const hitRate = parseFloat(cache.statistics.hitRate);
  if (hitRate < 50 && cache.statistics.hits + cache.statistics.misses > 10) {
    recommendations.push({
      type: 'low_hit_rate',
      priority: 'low',
      message: `Cache hit rate is ${cache.statistics.hitRate}. Consider increasing KB_CACHE_TTL.`,
      action: 'Review cache TTL settings'
    });
  }
  
  return recommendations;
}

// Run E2E Tests endpoint (admin - before rate limiting)
app.post('/api/admin/run-tests', asyncHandler(async (req, res) => {
  logInfo('E2E test run requested via API');
  
  // Set timeout for test execution (5 minutes)
  const testTimeout = 300000; // 5 minutes
  
  try {
    // Run tests with JSON output
    const testCommand = `npm test -- --json --outputFile=../tests/jest-results.json`;
    
    logInfo(`Running tests: ${testCommand}`);
    
    // Execute tests asynchronously
    const { stdout, stderr } = await execAsync(testCommand, {
      cwd: __dirname,
      timeout: testTimeout,
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    
    // Check if jest-results.json was created
    const fs = await import('fs');
    const resultsPath = join(__dirname, '../tests/jest-results.json');
    let testResults = null;
    
    if (fs.existsSync(resultsPath)) {
      try {
        const resultsData = fs.readFileSync(resultsPath, 'utf-8');
        testResults = JSON.parse(resultsData);
      } catch (error) {
        logError('Failed to parse test results JSON', error);
      }
    }
    
    const passed = testResults?.numPassedTests || 0;
    const failed = testResults?.numFailedTests || 0;
    const total = testResults?.numTotalTests || 0;
    
    logInfo(`Tests completed: ${passed}/${total} passed, ${failed} failed`);
    
    // Security: Limit output size and sanitize before sending to client
    const sanitizedOutput = sanitizeTestOutput(stdout.substring(0, 500)); // Reduced from 1000
    const sanitizedErrors = stderr ? sanitizeTestOutput(stderr.substring(0, 250)) : null; // Reduced from 500
    const sanitizedResults = testResults ? sanitizeJestResults(testResults) : null;
    
    res.json({
      success: true,
      message: 'Tests completed successfully',
      results: {
        passed,
        failed,
        total,
        passRate: total > 0 ? ((passed / total) * 100).toFixed(1) : 0,
        timestamp: new Date().toISOString()
      },
      output: sanitizedOutput, // Sanitized output
      errors: sanitizedErrors, // Sanitized errors
      testResults: sanitizedResults // Sanitized Jest results
    });
  } catch (error) {
    logError('Test execution failed', error);
    
    // Check if it's a timeout
    if (error.signal === 'SIGTERM' || error.code === 'ETIMEDOUT') {
      return res.status(504).json({
        success: false,
        error: 'Test execution timeout',
        message: 'Tests took longer than 5 minutes to complete',
        timestamp: new Date().toISOString()
      });
    }
    
    // Sanitize error output before processing
    const sanitizedStdout = sanitizeTestOutput(error.stdout || '');
    const sanitizedStderr = sanitizeTestOutput(error.stderr || '');
    
    // Parse error output for better error reporting
    let errorDetails = {
      command: error.cmd || 'npm test',
      message: sanitizeTestOutput(error.message || 'Unknown error'),
      stdout: sanitizedStdout,
      stderr: sanitizedStderr,
      code: error.code || 'UNKNOWN',
      signal: error.signal || null
    };
    
    // Try to extract test failures from sanitized stdout/stderr
    const allOutput = sanitizedStdout + sanitizedStderr;
    const testFailures = [];
    const warnings = [];
    const errors = [];
    
    // Extract test failures (lines starting with FAIL or test file paths)
    const failPattern = /FAIL\s+([^\s]+)/gi;
    const failMatches = [...allOutput.matchAll(failPattern)];
    failMatches.forEach(match => {
      if (match[1] && !testFailures.includes(match[0].trim())) {
        testFailures.push(match[0].trim());
      }
    });
    
    // Also extract FAIL lines directly
    const failLines = allOutput.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed.startsWith('FAIL') && !testFailures.includes(trimmed);
    });
    failLines.forEach(line => {
      testFailures.push(line.trim());
    });
    
    // Extract test suite/case failures (more detailed)
    const testCasePattern = /(✕|×)\s+([^\n]+)/g;
    const testCaseMatches = [...allOutput.matchAll(testCasePattern)];
    testCaseMatches.forEach(match => {
      if (match[2] && match[2].trim().length > 0) {
        const testCase = match[2].trim();
        if (!testFailures.some(f => f.includes(testCase))) {
          testFailures.push(`Test Case: ${testCase}`);
        }
      }
    });
    
    // Extract warnings (ExperimentalWarning, etc.) - filter duplicates
    const warningPattern = /(ExperimentalWarning|Warning|WARN)/gi;
    const warningLines = allOutput.split('\n').filter(line => {
      const trimmed = line.trim();
      return warningPattern.test(trimmed) && 
             trimmed.length > 0 &&
             !warnings.includes(trimmed);
    });
    warningLines.forEach(line => {
      const trimmed = line.trim();
      // Only add unique warnings
      if (!warnings.some(w => w.includes(trimmed.substring(0, 50)))) {
        warnings.push(trimmed);
      }
    });
    
    // Security: Do not extract assertion patterns or detailed error messages
    // Only extract generic error categories to prevent information leakage
    // Clear existing errors array and repopulate with generic categories only
    errors.length = 0; // Clear array instead of redeclaring
    
    // Security: Limit error extraction to generic categories only
    // Do not extract Expected/Received values, assertion patterns, or detailed error messages
    if (allOutput.includes('FAIL')) {
      errors.push('Test execution failed');
    }
    if (allOutput.includes('timeout') || allOutput.includes('ETIMEDOUT')) {
      errors.push('Test execution timeout');
    }
    if (allOutput.includes('Error:')) {
      errors.push('Test execution error');
    }
    
    // Security: Sanitize and limit error output
    // Maximum 5 generic error messages (reduced from 20)
    const sanitizedTestFailures = testFailures.slice(0, 5).map(f => {
      const sanitized = sanitizeTestOutput(f);
      // Truncate to 100 characters
      return sanitized.length > 100 ? sanitized.substring(0, 97) + '...' : sanitized;
    });
    // Security: Remove warning extraction entirely
    const sanitizedWarnings = [];
    // Security: Limit to 5 generic error messages
    const sanitizedErrorMessages = errors.slice(0, 5).map(e => {
      const sanitized = sanitizeTestOutput(e);
      return sanitized.length > 100 ? sanitized.substring(0, 97) + '...' : sanitized;
    });
    
    res.status(500).json({
      success: false,
      error: 'Test execution failed',
      message: sanitizeTestOutput(error.message || 'Test execution failed').substring(0, 100), // Security: Limit to 100 chars
      details: errorDetails,
      testFailures: sanitizedTestFailures,
      warnings: sanitizedWarnings,
      errors: sanitizedErrorMessages,
      timestamp: new Date().toISOString()
    });
  }
}));

// KB Refresh endpoint (admin - no auth for now, add in production)
app.post('/api/admin/kb-refresh', asyncHandler(async (req, res) => {
    const client = await getAPIClient();
  if (!client || typeof client.refreshKBContext !== 'function') {
    return res.status(503).json({
      error: 'KB refresh not available',
      message: 'API client not initialized'
    });
  }
  
  logInfo('KB refresh requested via API');
  const newContext = await client.refreshKBContext();
  
  res.json({
    success: true,
    message: 'KB context refreshed successfully',
    contextLength: newContext ? newContext.length : 0,
    timestamp: new Date().toISOString()
  });
}));

// Admin endpoints for chat logs (before rate limiting - admin endpoints should have different limits)
app.get('/api/admin/chat-logs', asyncHandler(async (req, res) => {
  // TODO: Add authentication/authorization check here
  // For now, this endpoint is accessible - consider adding API key or IP whitelist
  
  const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: last 7 days
  const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
  const groupBy = req.query.groupBy || 'none'; // 'none', 'conversation', 'day', 'month', 'year'
  const includeRemote = req.query.includeRemote === 'true'; // Option to include remote logs
  const remoteServer = req.query.remoteServer || 'https://maya-agent.ai-builders.space'; // Remote server URL
  
  try {
    let logs;
    
    if (groupBy === 'conversation') {
      logs = await getChatLogsByConversation(startDate, endDate);
    } else {
      logs = await getChatLogs(startDate, endDate);
    }
    
    // If includeRemote is true, fetch and merge remote logs
    if (includeRemote && !config.isProduction) {
      try {
        const { fetchRemoteLogs, mergeLogs } = await import('./utils/remote-logs.js');
        const remoteLogs = await fetchRemoteLogs(remoteServer, startDate, endDate, groupBy);
        
        if (groupBy === 'conversation') {
          // Merge conversation objects
          const localConvs = logs;
          const remoteConvs = remoteLogs.reduce((acc, log) => {
            if (!acc[log.conversationId]) {
              acc[log.conversationId] = {
                conversationId: log.conversationId,
                messages: [],
                firstMessage: log.timestamp,
                lastMessage: log.timestamp,
                totalMessages: 0,
                ip: log.ip,
                userAgent: log.userAgent,
                remoteServer: log.remoteServer
              };
            }
            acc[log.conversationId].messages.push(log);
            acc[log.conversationId].totalMessages++;
            return acc;
          }, {});
          
          logs = { ...localConvs, ...remoteConvs };
        } else {
          // Merge arrays
          logs = mergeLogs(Array.isArray(logs) ? logs : [], remoteLogs);
        }
      } catch (remoteError) {
        logError('Failed to fetch remote logs (continuing with local only)', remoteError, {
          remoteServer: remoteServer,
          errorMessage: remoteError.message,
          errorName: remoteError.name
        });
        // Continue with local logs only if remote fetch fails
        // Log warning but don't fail the request
      }
    }
    
    res.json({
      success: true,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      groupBy: groupBy,
      includeRemote: includeRemote,
      remoteFetched: includeRemote && !config.isProduction,
      count: Array.isArray(logs) ? logs.length : Object.keys(logs).length,
      logs: logs
    });
  } catch (error) {
    logError('Failed to retrieve chat logs', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve chat logs',
      message: error.message
    });
  }
}));

// Storage statistics endpoint
app.get('/api/admin/chat-logs/stats', asyncHandler(async (req, res) => {
  // TODO: Add authentication/authorization check here
  
  const includeRemote = req.query.includeRemote === 'true';
  const remoteServer = req.query.remoteServer || 'https://maya-agent.ai-builders.space';
  
  try {
    const stats = await getStorageStats();
    
    // If includeRemote is true, fetch and merge remote stats
    if (includeRemote && !config.isProduction) {
      try {
        const { fetchRemoteStats, mergeStats } = await import('./utils/remote-logs.js');
        const remoteStats = await fetchRemoteStats(remoteServer);
        const mergedStats = mergeStats(stats, remoteStats);
        
        return res.json({
          success: true,
          stats: mergedStats
        });
      } catch (remoteError) {
        logError('Failed to fetch remote stats (continuing with local only)', remoteError);
        // Continue with local stats only if remote fetch fails
      }
    }
    
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    logError('Failed to get storage stats', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get storage stats',
      message: error.message
    });
  }
}));

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
    
    // Check if AI_BUILDER_TOKEN is configured
    if (!config.aiBuilderToken) {
      logError('AI_BUILDER_TOKEN is not configured', null, {
        nodeEnv: config.nodeEnv,
        hasToken: !!process.env.AI_BUILDER_TOKEN
      });
      return res.status(503).json({
        error: 'Service configuration error',
        message: 'AI service is not properly configured. Please contact the administrator.',
        details: config.isDevelopment ? 'AI_BUILDER_TOKEN environment variable is not set' : undefined
      });
    }
    
    // Get API client (lazy loading)
    const client = await getAPIClient();
    if (!client) {
      logError('API client initialization failed', null, {
        hasToken: !!config.aiBuilderToken,
        tokenLength: config.aiBuilderToken ? config.aiBuilderToken.length : 0
      });
      return res.status(503).json({
        error: 'Service temporarily unavailable',
        message: 'Unable to initialize AI service. Please try again in a moment.'
      });
    }
    
    // No connection check needed - direct API calls work immediately
    
    try {
      // Validate API client has chat method
      if (typeof client.chat !== 'function') {
        logError('API client chat method not available', null, {
          clientType: typeof client,
          clientMethods: client ? Object.keys(client) : []
        });
        return res.status(503).json({
          error: 'Service temporarily unavailable',
          message: 'AI service is not properly configured. Please contact the administrator.'
        });
      }
      
      // Get response from API client with timeout protection
      const chatTimeout = 60000; // 60 seconds timeout
      const chatPromise = client.chat(message, history);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Chat request timeout')), chatTimeout);
      });
      
      const result = await Promise.race([chatPromise, timeoutPromise]);
      
      // Validate result structure
      if (!result || typeof result !== 'object') {
        logError('Invalid API client response', null, {
          resultType: typeof result,
          resultValue: result
        });
        return res.status(500).json({
          error: 'Internal server error',
          message: 'Invalid response from AI service. Please try again.'
        });
      }
      
      // Extract content safely
      const content = result.content || result.response || result.message || '';
      if (!content || typeof content !== 'string') {
        logError('Empty or invalid content in API response', null, {
          contentType: typeof content,
          hasContent: !!content
        });
        return res.status(500).json({
          error: 'Internal server error',
          message: 'Empty response from AI service. Please try again.'
        });
      }
      
      // Log chat message (async, non-blocking)
      const requestStartTime = req.startTime || Date.now();
      const responseTime = Date.now() - requestStartTime;
      
      logChatMessage({
        userMessage: message,
        assistantResponse: content,
        history: history,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        warnings: warnings || [],
        responseTime: responseTime,
        conversationId: req.body.conversationId // Optional: frontend can send conversationId
      }).catch(err => {
        // Log error but don't fail the request
        logError('Failed to log chat message', err);
      });
      
      // Return response
      res.json({
        response: content,
        warnings: warnings || []
      });
    } catch (error) {
      // Handle timeout specifically
      if (error.message === 'Chat request timeout') {
        logError('Chat request timeout', error, {
          timeout: chatTimeout,
          messageLength: message.length,
          historyLength: history.length
        });
        return res.status(504).json({
          error: 'Request timeout',
          message: 'The request took too long to process. Please try again with a shorter message.'
        });
      }
      
      // Handle other errors
      logError('Chat error', error, {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause,
        messageLength: message.length,
        historyLength: history.length
      });
      
      // Determine appropriate status code
      const statusCode = error.statusCode || error.status || 500;
      res.status(statusCode).json({
        error: statusCode === 503 ? 'Service temporarily unavailable' : 'Internal server error',
        message: 'An error occurred while processing your request. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  })
);

// 404 handler
app.use(notFoundHandler);

// Error handlers (must be last)
app.use(corsErrorHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logInfo('SIGTERM received, shutting down gracefully...');
    const client = await getAPIClient();
  if (client) {
    await client.close();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logInfo('SIGINT received, shutting down gracefully...');
    const client = await getAPIClient();
  if (client) {
    await client.close();
  }
  process.exit(0);
});

// Start server (skip in test environment to allow tests to control server)
if (process.env.NODE_ENV !== 'test' && !process.env.SKIP_SERVER_START) {
  logInfo('About to start server...');
  const PORT = config.port;
  logInfo(`Calling app.listen on port ${PORT}...`);
  // Bind to 0.0.0.0 to accept connections from all interfaces (required for Docker/containers)
  app.listen(PORT, '0.0.0.0', () => {
    logInfo(`Maya backend server started`, {
      port: PORT,
      host: '0.0.0.0',
      environment: config.nodeEnv,
      nodeVersion: process.version
    });
    logInfo(`Frontend available at: http://0.0.0.0:${PORT}/maya.html`);
    logInfo(`Health check: http://0.0.0.0:${PORT}/health`);
  });

  logInfo('app.listen() called, server should be starting...');
}

export default app;

