/**
 * Maya Backend Server
 * 
 * Express server for Maya's Digital Twin chat interface
 * Integrates with AI Builders MCP server
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
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
// Lazy load MCP client to prevent blocking during module import
let MayaMCPClient = null;
let mcpClientModule = null;

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

app.use(express.static(frontendPath));

// Body parsing with size limits (only for API routes)
app.use(express.json({ limit: config.maxRequestSize }));
app.use(express.urlencoded({ extended: true, limit: config.maxRequestSize }));

// Request size validation
app.use(validateRequestSize);

// Audit logging
app.use(auditLog);

logInfo('Setting up routes...');

// Lazy initialize MCP client (only when needed, not at startup)
let mcpClient = null;

/**
 * Get or create MCP client instance (lazy loading)
 * This prevents blocking during server startup
 */
async function getMCPClient() {
  if (mcpClient) {
    return mcpClient;
  }
  
  try {
    // Lazy import the MCP client module with timeout protection (Issue #10)
    if (!mcpClientModule) {
      logInfo('Lazy loading MCP client module...');
      const { importWithTimeout, TIMEOUTS } = await import('./utils/timeout.js');
      mcpClientModule = await importWithTimeout(
        import('./mcp-client.js'),
        './mcp-client.js'
      );
      MayaMCPClient = mcpClientModule.MayaMCPClient;
    }
    
    if (!mcpClient && MayaMCPClient) {
      logInfo('Creating MCP client instance...');
      mcpClient = new MayaMCPClient();
      logInfo('MCP client created, connecting in background...');
      // Connect in background (non-blocking)
      mcpClient.connect().catch(err => {
        logError('MCP client initialization failed (will retry on first request)', err);
      });
    }
    
    return mcpClient;
  } catch (error) {
    logError('Failed to lazy load MCP client', error);
    return null;
  }
}

logInfo('Setting up routes...');

// Root endpoint - redirect to frontend
app.get('/', (req, res) => {
  res.redirect('/maya.html');
});

// Health check endpoint
app.get('/health', async (req, res) => {
  // Don't wait for MCP client to avoid blocking health checks
  // Just check if it exists, don't force connection
  const client = mcpClient; // Use the existing instance if available
  
  // Get KB status if MCP client is available (now async with timeout protection)
  let kbStatus = null;
  if (client && typeof client.getKBStatus === 'function') {
    try {
      kbStatus = await client.getKBStatus(); // Now async
    } catch (error) {
      // Ignore KB status errors in health check
    }
  }
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    mcpConnected: client?.connected || false,
    kb: kbStatus || { status: 'not_available' }
  });
});

// KB Status endpoint (includes cache information)
app.get('/api/kb/status', asyncHandler(async (req, res) => {
  const client = await getMCPClient();
  if (!client || typeof client.getKBStatus !== 'function') {
    return res.status(503).json({
      error: 'KB status not available',
      message: 'MCP client not initialized'
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
  const client = await getMCPClient();
  if (!client || typeof client.refreshKBContext !== 'function') {
    return res.status(503).json({
      error: 'KB refresh not available',
      message: 'MCP client not initialized'
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
    
    // Ensure MCP client is loaded and connected (lazy loading)
    const client = await getMCPClient();
    if (!client) {
      return res.status(503).json({
        error: 'Service temporarily unavailable',
        message: 'Unable to initialize AI service. Please try again in a moment.'
      });
    }
    
    if (!client.connected) {
      try {
        await client.connect();
      } catch (error) {
        logError('Failed to connect to MCP server', error);
        return res.status(503).json({
          error: 'Service temporarily unavailable',
          message: 'Unable to connect to AI service. Please try again in a moment.'
        });
      }
    }
    
    try {
      // Get response from MCP client
      const result = await client.chat(message, history);
      
      // Return response
      res.json({
        response: result.content,
        warnings: warnings || []
      });
    } catch (error) {
      logError('Chat error', error, {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause
      });
      res.status(500).json({
        error: 'Internal server error',
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
  const client = await getMCPClient();
  if (client) {
    await client.close();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logInfo('SIGINT received, shutting down gracefully...');
  const client = await getMCPClient();
  if (client) {
    await client.close();
  }
  process.exit(0);
});

// Start server
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

export default app;

