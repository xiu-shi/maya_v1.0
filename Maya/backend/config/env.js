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
 */
function validateToken(token) {
  if (!token) {
    throw new Error('AI_BUILDER_TOKEN is required');
  }
  
  if (!token.startsWith('sk_')) {
    console.warn('⚠️  Warning: AI_BUILDER_TOKEN does not start with "sk_" - may be invalid');
  }
  
  if (token.length < 20) {
    throw new Error('AI_BUILDER_TOKEN appears to be invalid (too short)');
  }
  
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
  // Required
  aiBuilderToken: validateToken(getEnv('AI_BUILDER_TOKEN', null, true)),
  
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

