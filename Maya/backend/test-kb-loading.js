/**
 * Test KB Loading
 * 
 * Quick test script to verify KB loading works
 */

import { loadKBContext, isKBConfigured } from './utils/kb-loader.js';
import { logInfo } from './utils/logger.js';

async function testKBLoading() {
  console.log('🧪 Testing KB Loading...\n');

  // Check if KB is configured
  const configured = isKBConfigured();
  console.log(`KB Configured: ${configured ? '✅ Yes' : '❌ No'}\n`);

  if (!configured) {
    console.log('⚠️  KB priorities.json not found. Create it at: Maya/knowledge/config/priorities.json');
    process.exit(0);
    return;
  }

  // Load KB context with timeout
  console.log('Loading KB context...');
  
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('KB loading timeout after 30 seconds')), 30000);
  });
  
  let context;
  try {
    context = await Promise.race([
      loadKBContext(),
      timeoutPromise
    ]);
  } catch (error) {
    console.error('❌ Error loading KB context:', error.message);
    console.error(error.stack);
    process.exit(1);
    return;
  }

  if (context) {
    console.log('\n✅ KB Context Loaded Successfully!\n');
    console.log('Context Preview:');
    console.log('─'.repeat(80));
    console.log(context.substring(0, 500));
    console.log('─'.repeat(80));
    console.log(`\nTotal length: ${context.length} characters`);
  } else {
    console.log('\n⚠️  KB Context is empty');
    console.log('Check that documents exist in the paths specified in priorities.json');
  }
  
  // Explicitly exit to prevent hanging
  process.exit(0);
}

testKBLoading().catch(error => {
  console.error('❌ Error testing KB loading:', error);
  console.error(error.stack);
  process.exit(1);
});


