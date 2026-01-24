/**
 * Production API Key Validation Test
 * 
 * CRITICAL: This test actually calls the AI Builders production API
 * to verify the API key works BEFORE deployment.
 * 
 * This prevents deploying with keys that work locally but fail in production.
 */

import { describe, test, expect } from '@jest/globals';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

describe('Production API Key Validation (CRITICAL)', () => {
  const API_KEY = process.env.AI_BUILDER_TOKEN;
  const PROD_ENDPOINT = 'https://space.ai-builders.com/backend/v1/chat/completions';
  
  test('API key should be configured', () => {
    expect(API_KEY).toBeDefined();
    expect(API_KEY).not.toBe('');
    expect(API_KEY).toMatch(/^sk_/);
  });

  test('CRITICAL: API key should work with production AI Builders API', async () => {
    // Skip in CI/test environments without real key
    if (API_KEY === 'test-token' || API_KEY === 'test-token-for-testing') {
      console.log('⚠️  Skipping production API test (test token detected)');
      return;
    }

    console.log('🔍 Testing API key against production endpoint...');
    console.log(`   Endpoint: ${PROD_ENDPOINT}`);
    console.log(`   Key: ${API_KEY.substring(0, 12)}...`);

    try {
      const response = await fetch(PROD_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'grok-4-fast',
          messages: [
            {
              role: 'user',
              content: 'Hello, this is a test message to validate the API key.'
            }
          ],
          max_tokens: 50
        })
      });

      console.log(`   Response status: ${response.status}`);

      // Check for authentication errors
      if (response.status === 401) {
        const errorText = await response.text();
        console.error('❌ API key rejected by production API (401 Unauthorized)');
        console.error(`   Response: ${errorText}`);
        throw new Error(`API key does not work with production AI Builders API. Status: 401. This key will NOT work when deployed!`);
      }

      if (response.status === 403) {
        const errorText = await response.text();
        console.error('❌ API key forbidden by production API (403 Forbidden)');
        console.error(`   Response: ${errorText}`);
        throw new Error(`API key forbidden by production AI Builders API. Status: 403. Check key permissions!`);
      }

      // Any 2xx status means authentication worked
      if (response.status >= 200 && response.status < 300) {
        const data = await response.json();
        console.log('✅ API key authenticated successfully with production API');
        console.log(`   Model: ${data.model || 'unknown'}`);
        console.log(`   Has response: ${!!data.choices}`);
        
        expect(response.status).toBeLessThan(300);
        expect(data).toBeDefined();
        return;
      }

      // Other errors
      const errorText = await response.text();
      console.warn(`⚠️  Unexpected status: ${response.status}`);
      console.warn(`   Response: ${errorText.substring(0, 200)}`);
      
      // Don't fail on rate limits or other non-auth errors
      if (response.status === 429) {
        console.log('⚠️  Rate limited, but key authenticated (test passes)');
        return;
      }

      throw new Error(`Unexpected response from production API: ${response.status}`);

    } catch (error) {
      if (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND')) {
        console.error('❌ Cannot reach production API endpoint');
        console.error(`   Error: ${error.message}`);
        throw new Error('Cannot reach production AI Builders API. Check network connection.');
      }
      
      throw error;
    }
  }, 30000); // 30 second timeout for network call

  test('should fail fast if key is known to be revoked', () => {
    const revokedPrefixes = [
      'sk_937d9f12', // Revoked Jan 24, 2026
      'sk_9a342713'  // Revoked Jan 24, 2026
    ];

    const isRevoked = revokedPrefixes.some(prefix => API_KEY.startsWith(prefix));
    
    if (isRevoked) {
      throw new Error(`API key is in revoked list! Prefix: ${API_KEY.substring(0, 12)}...`);
    }

    expect(isRevoked).toBe(false);
  });
});

describe('Production Deployment Readiness', () => {
  test('environment should have required variables', () => {
    expect(process.env.AI_BUILDER_TOKEN).toBeDefined();
    expect(process.env.NODE_ENV).toBeDefined();
  });

  test('API key should not be a placeholder', () => {
    const API_KEY = process.env.AI_BUILDER_TOKEN;
    const placeholders = [
      'sk_your_token_here',
      'sk_example',
      'sk_test_example'
    ];

    expect(placeholders).not.toContain(API_KEY);
  });
});
