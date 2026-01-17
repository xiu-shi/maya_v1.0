/**
 * Test AI Builders API Endpoint
 * 
 * This script tests different possible API endpoints to find the correct one
 */

import config from './config/env.js';
import { logInfo, logError } from './utils/logger.js';

const token = config.aiBuilderToken;
const testMessage = "Hello, this is a test";

// Possible API endpoints to try
const possibleEndpoints = [
  'https://api.aibuilders.co/v1/chat/completions',
  'https://api.aibuilders.io/v1/chat/completions',
  'https://aibuilders.co/api/v1/chat/completions',
  'https://api.aibuilders.com/v1/chat/completions',
];

// Possible models
const possibleModels = [
  'gpt-4',
  'gpt-3.5-turbo',
  'claude-3-opus',
  'claude-3-sonnet',
  'gemini-pro',
];

async function testEndpoint(url, model) {
  try {
    console.log(`\n🧪 Testing: ${url}`);
    console.log(`   Model: ${model}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: testMessage }
        ],
        temperature: 0.7,
        max_tokens: 100
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`   ✅ SUCCESS!`);
      console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 200));
      return { success: true, url, model, data };
    } else {
      console.log(`   ❌ Failed: ${response.status}`);
      console.log(`   Error:`, data.error?.message || data.message || 'Unknown error');
      return { success: false, url, model, error: data };
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, url, model, error: error.message };
  }
}

async function findWorkingEndpoint() {
  console.log('🔍 Searching for working AI Builders API endpoint...\n');
  console.log(`Token: ${token.substring(0, 10)}...`);
  console.log('');

  const results = [];

  // Try each endpoint with each model
  for (const endpoint of possibleEndpoints) {
    for (const model of possibleModels) {
      const result = await testEndpoint(endpoint, model);
      results.push(result);
      
      if (result.success) {
        console.log('\n🎉 Found working endpoint!');
        console.log(`   URL: ${result.url}`);
        console.log(`   Model: ${result.model}`);
        return result;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('\n❌ No working endpoint found.');
  console.log('\n💡 Next steps:');
  console.log('   1. Check AI Builders documentation');
  console.log('   2. Use MCP tool: get_api_specification');
  console.log('   3. Contact AI Builders support');
  
  return null;
}

// Run test
findWorkingEndpoint().then(result => {
  if (result && result.success) {
    console.log('\n📝 Update your .env file:');
    console.log(`   AI_BUILDERS_API_URL=${result.url}`);
    console.log(`   AI_BUILDERS_MODEL=${result.model}`);
  }
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});



