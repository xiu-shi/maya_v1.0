/**
 * Test Different AI Builders Models for Speed
 * 
 * Tests various models to find faster alternatives to supermind-agent-v1
 */

import config from './config/env.js';
import { logInfo, logError } from './utils/logger.js';

const token = config.aiBuilderToken;
const apiUrl = process.env.AI_BUILDERS_API_URL || 'https://space.ai-builders.com/backend/v1/chat/completions';
const testMessage = "Hello, this is a quick test. Please respond briefly.";

// Models to test (ordered by likely speed - fastest first)
const modelsToTest = [
  'grok-4-fast',           // Fast Grok model
  'deepseek',              // Fast and cost-effective
  'gemini-3-flash-preview', // Fast Gemini reasoning
  'gemini-2.5-pro',        // Google's Gemini model
  'gpt-5',                 // OpenAI-compatible
  'supermind-agent-v1',    // Current (slow) model
];

async function testModel(model) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant. Respond briefly.' },
          { role: 'user', content: testMessage }
        ],
        temperature: 0.7,
        max_tokens: 100
      })
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    const data = await response.json();
    
    if (response.ok) {
      const content = data.choices?.[0]?.message?.content || data.content || '';
      return {
        success: true,
        model,
        duration,
        responseLength: content.length,
        content: content.substring(0, 100)
      };
    } else {
      return {
        success: false,
        model,
        duration,
        error: data.error?.message || data.message || `HTTP ${response.status}`
      };
    }
  } catch (error) {
    const endTime = Date.now();
    return {
      success: false,
      model,
      duration: endTime - startTime,
      error: error.message
    };
  }
}

async function testAllModels() {
  console.log('🚀 Testing AI Builders Models for Speed\n');
  console.log(`API URL: ${apiUrl}`);
  console.log(`Token: ${token.substring(0, 10)}...\n`);
  console.log('Testing models (fastest to slowest expected):\n');

  const results = [];

  for (const model of modelsToTest) {
    console.log(`Testing: ${model}...`);
    const result = await testModel(model);
    results.push(result);

    if (result.success) {
      console.log(`  ✅ Success - ${result.duration}ms - ${result.responseLength} chars`);
      console.log(`  Response preview: ${result.content}...\n`);
    } else {
      console.log(`  ❌ Failed - ${result.duration}ms - ${result.error}\n`);
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n📊 Results Summary:\n');
  const successful = results.filter(r => r.success);
  
  if (successful.length === 0) {
    console.log('❌ No models worked. Check your API token and endpoint.');
    return;
  }

  // Sort by speed
  successful.sort((a, b) => a.duration - b.duration);

  console.log('Fastest to Slowest (working models):\n');
  successful.forEach((result, index) => {
    const speed = result.duration < 2000 ? '⚡ Very Fast' :
                  result.duration < 5000 ? '✅ Fast' :
                  result.duration < 10000 ? '⚠️  Moderate' :
                  '🐌 Slow';
    console.log(`${index + 1}. ${result.model.padEnd(25)} ${result.duration.toString().padStart(6)}ms ${speed}`);
  });

  // Recommendations
  console.log('\n💡 Recommendations:\n');
  const fastest = successful[0];
  console.log(`Fastest: ${fastest.model} (${fastest.duration}ms)`);
  
  if (fastest.model !== 'supermind-agent-v1') {
    console.log(`\n📝 Update your .env file:`);
    console.log(`   AI_BUILDERS_MODEL=${fastest.model}`);
    console.log(`\nThen restart your server: npm start`);
  } else {
    console.log(`\n⚠️  Current model (supermind-agent-v1) is already the fastest available.`);
    console.log(`   Consider optimizing max_tokens or using streaming for better UX.`);
  }

  // Show current vs fastest
  const current = results.find(r => r.model === 'supermind-agent-v1');
  if (current && current.success && fastest.model !== 'supermind-agent-v1') {
    const speedup = ((current.duration - fastest.duration) / current.duration * 100).toFixed(1);
    console.log(`\n🎯 Speed improvement: ${speedup}% faster with ${fastest.model}`);
  }
}

// Run tests
testAllModels().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});



