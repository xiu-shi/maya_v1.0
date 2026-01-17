/**
 * Test Setup
 * 
 * Configures test environment variables before tests run
 */

// Set required environment variables for tests
process.env.AI_BUILDER_TOKEN = process.env.AI_BUILDER_TOKEN || 'test-token-for-testing';
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';



