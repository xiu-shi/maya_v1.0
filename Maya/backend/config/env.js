/**
 * Environment Configuration & Validation
 * 
 * Validates and loads environment variables securely
 * Ensures all required variables are present before server starts
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
dotenv.config({ path: join(__dirname, '../.env') });

/**
 * Get environment variable with validation
 */
function getEnv(key, defaultValue = null, required = false) {
  const value = process.env[key] || defaultValue;
  
  if (required && !value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  
  return value;
}

/**
 * Validate AI_BUILDER_TOKEN format
 * Enhanced validation to prevent deployment with invalid/revoked keys
 */
function validateToken(token) {
  // Allow test tokens in test environment
  if (process.env.NODE_ENV === 'test' && (token === 'test-token' || token === 'test-token-for-testing')) {
    return token;
  }
  
  // During Docker build or initial startup, token might not be set yet
  // Allow null/undefined - will be validated when MCP client is actually used
  if (!token) {
    // In production, log warning but don't fail immediately
    // Token will be validated when MCP client tries to connect
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️  Warning: AI_BUILDER_TOKEN is not set. Service may not function correctly.');
      return null; // Return null instead of throwing
    }
    // In development, require token
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error: AI_BUILDER_TOKEN is required in development');
      console.error('   Please set AI_BUILDER_TOKEN in your .env file');
      throw new Error('AI_BUILDER_TOKEN is required');
    }
    return null;
  }
  
  // Validate format
  if (!token.startsWith('sk_')) {
    console.error('❌ Error: AI_BUILDER_TOKEN must start with "sk_"');
    console.error(`   Current value starts with: ${token.substring(0, 5)}...`);
    throw new Error('AI_BUILDER_TOKEN format is invalid - must start with "sk_"');
  }
  
  // Validate length
  if (token.length < 20) {
    console.error('❌ Error: AI_BUILDER_TOKEN appears to be invalid (too short)');
    console.error(`   Minimum length: 20, Current length: ${token.length}`);
    throw new Error('AI_BUILDER_TOKEN appears to be invalid (too short)');
  }
  
  // Check for revoked keys (documented as revoked)
  const revokedKeyPrefixes = [
    'sk_937d9f12', // Revoked January 24, 2026 - see ROOT_CAUSE_ANALYSIS.md
    'sk_9a342713'  // Revoked January 24, 2026 - production deployment failed
  ];
  
  const isRevoked = revokedKeyPrefixes.some(prefix => token.startsWith(prefix));
  if (isRevoked) {
    console.error('❌ Error: This API key has been revoked and cannot be used');
    console.error(`   Key prefix: ${token.substring(0, 12)}...`);
    console.error('   Please obtain a new API key from https://space.ai-builders.com');
    throw new Error('AI_BUILDER_TOKEN is revoked - please use a new key');
  }
  
  // Check for placeholder/example keys
  const placeholderKeys = [
    'sk_your_token_here',
    'sk_example',
    'sk_test_example'
  ];
  
  if (placeholderKeys.includes(token)) {
    console.error('❌ Error: API key is a placeholder value');
    console.error('   Please replace with your actual API key from https://space.ai-builders.com');
    throw new Error('AI_BUILDER_TOKEN is a placeholder - please use your actual key');
  }
  
  // Log success (with masked key)
  const maskedToken = `${token.substring(0, 12)}...${token.substring(token.length - 4)}`;
  console.log(`   AI_BUILDER_TOKEN validated: ${maskedToken}`);
  
  return token;
}

/**
 * Parse comma-separated origins
 */
function parseOrigins(originsString) {
  if (!originsString) {
    return ['http://localhost:3001', 'http://localhost:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:3000']; // Default includes both ports
  }
  
  const origins = originsString.split(',').map(origin => origin.trim()).filter(Boolean);
  // Always include localhost:3001 and 127.0.0.1:3001 for development
  const defaultOrigins = ['http://localhost:3001', 'http://127.0.0.1:3001'];
  const allOrigins = [...new Set([...defaultOrigins, ...origins])]; // Remove duplicates
  return allOrigins;
}

// Environment configuration
const config = {
  // Required (but allow null during build - will be validated at runtime)
  aiBuilderToken: validateToken(getEnv('AI_BUILDER_TOKEN', null, false)), // Changed to false - don't require during build
  
  // Server
  nodeEnv: getEnv('NODE_ENV', 'development'),
  port: parseInt(getEnv('PORT', '3001'), 10), // Changed default to 3001 to avoid conflicts
  
  // CORS
  allowedOrigins: parseOrigins(getEnv('ALLOWED_ORIGINS')),
  
  // Rate Limiting
  rateLimitWindowMs: parseInt(getEnv('RATE_LIMIT_WINDOW_MS', '900000'), 10), // 15 minutes
  rateLimitMaxRequests: parseInt(getEnv('RATE_LIMIT_MAX_REQUESTS', '20'), 10),
  
  // Request Limits
  maxRequestSize: getEnv('MAX_REQUEST_SIZE', '1mb'),
  maxMessageLength: parseInt(getEnv('MAX_MESSAGE_LENGTH', '2000'), 10),
  maxHistoryLength: parseInt(getEnv('MAX_HISTORY_LENGTH', '50'), 10),
  
  // Security
  enableHttpsRedirect: getEnv('ENABLE_HTTPS_REDIRECT', 'false') === 'true',
  trustProxy: getEnv('TRUST_PROXY', 'false') === 'true',
  
  // Validation
  isDevelopment: getEnv('NODE_ENV', 'development') === 'development',
  isProduction: getEnv('NODE_ENV', 'development') === 'production',
};

// Validate configuration
if (config.port < 1 || config.port > 65535) {
  throw new Error(`Invalid PORT: ${config.port}. Must be between 1 and 65535`);
}

if (config.maxMessageLength < 1 || config.maxMessageLength > 10000) {
  throw new Error(`Invalid MAX_MESSAGE_LENGTH: ${config.maxMessageLength}. Must be between 1 and 10000`);
}

if (config.rateLimitMaxRequests < 1) {
  throw new Error(`Invalid RATE_LIMIT_MAX_REQUESTS: ${config.rateLimitMaxRequests}. Must be at least 1`);
}

// Log configuration (without sensitive data)
console.log('🔐 Environment Configuration:');
console.log(`   NODE_ENV: ${config.nodeEnv}`);
console.log(`   PORT: ${config.port}`);
console.log(`   Allowed Origins: ${config.allowedOrigins.length} configured`);
console.log(`   Rate Limit: ${config.rateLimitMaxRequests} requests per ${config.rateLimitWindowMs / 1000}s`);
console.log(`   Max Message Length: ${config.maxMessageLength} characters`);
console.log(`   AI_BUILDER_TOKEN: ${config.aiBuilderToken ? '✅ Set' : '❌ Missing'}`);

export default config;

