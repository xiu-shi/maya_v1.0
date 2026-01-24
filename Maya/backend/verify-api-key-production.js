#!/usr/bin/env node

/**
 * Production API Key Verification Script
 * 
 * CRITICAL: Runs BEFORE deployment to verify API key works with production endpoint
 * This prevents deploying keys that work locally but fail in production
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const NC = '\x1b[0m';

// Load .env directly
dotenv.config({ path: join(__dirname, '.env') });

const API_KEY = process.env.AI_BUILDER_TOKEN;
const PROD_ENDPOINT = 'https://space.ai-builders.com/backend/v1/chat/completions';

async function verifyAPIKey() {
  console.log(`${BLUE}🔍 Verifying API Key with Production Endpoint${NC}`);
  console.log(`   Endpoint: ${PROD_ENDPOINT}`);
  
  if (!API_KEY) {
    console.error(`${RED}❌ AI_BUILDER_TOKEN not found in .env${NC}`);
    process.exit(1);
  }

  console.log(`   API Key: ${API_KEY.substring(0, 12)}...${API_KEY.substring(API_KEY.length - 4)}`);

  // Check for known revoked keys
  const revokedPrefixes = ['sk_937d9f12', 'sk_9a342713'];
  if (revokedPrefixes.some(prefix => API_KEY.startsWith(prefix))) {
    console.error(`${RED}❌ API key is in revoked list!${NC}`);
    console.error(`   This key will NOT work in production`);
    process.exit(1);
  }

  console.log(`${YELLOW}⏳ Testing API key...${NC}`);

  try {
    const response = await fetch(PROD_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'grok-4-fast',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 10
      }),
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });

    console.log(`   Response Status: ${response.status}`);

    if (response.status === 401) {
      console.error(`${RED}❌ CRITICAL: API key REJECTED by production API (401)${NC}`);
      console.error(`   This key will NOT work when deployed!`);
      console.error(`   Please generate a new API key from https://space.ai-builders.com`);
      process.exit(1);
    }

    if (response.status === 403) {
      console.error(`${RED}❌ CRITICAL: API key FORBIDDEN (403)${NC}`);
      console.error(`   Key lacks required permissions`);
      process.exit(1);
    }

    if (response.status >= 200 && response.status < 300) {
      const data = await response.json();
      console.log(`${GREEN}✅ API key authenticated successfully!${NC}`);
      console.log(`   Model: ${data.model || 'unknown'}`);
      console.log(`   ${GREEN}This key WILL work in production${NC}`);
      process.exit(0);
    }

    if (response.status === 429) {
      console.log(`${YELLOW}⚠️  Rate limited (429) - but key authenticated${NC}`);
      console.log(`${GREEN}✅ API key is valid (test passes)${NC}`);
      process.exit(0);
    }

    console.warn(`${YELLOW}⚠️  Unexpected status: ${response.status}${NC}`);
    const text = await response.text();
    console.warn(`   Response: ${text.substring(0, 200)}`);
    process.exit(1);

  } catch (error) {
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      console.error(`${RED}❌ Request timeout after 15 seconds${NC}`);
      console.error(`   Production API not responding`);
      process.exit(1);
    }

    console.error(`${RED}❌ Error: ${error.message}${NC}`);
    process.exit(1);
  }
}

verifyAPIKey();
