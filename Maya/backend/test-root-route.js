/**
 * Manual Root Route Test
 * 
 * Tests root route functionality directly
 * Run: node test-root-route.js
 */

import request from 'supertest';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set test environment
process.env.NODE_ENV = 'test';
process.env.SKIP_SERVER_START = 'true';
process.env.PORT = '3002';

async function testRootRoute() {
  console.log('🧪 Testing Root Route...\n');
  
  // Import server
  const serverModule = await import('./server.js');
  const app = serverModule.default;
  
  // Start test server
  const TEST_PORT = 3002;
  const server = app.listen(TEST_PORT, '127.0.0.1', () => {
    console.log(`✅ Test server started on port ${TEST_PORT}\n`);
  });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  // Test 1: Root route redirect
  console.log('Test 1: Root route (/) should redirect to /maya.html');
  try {
    const response = await request(app).get('/');
    if (response.status === 301 && response.headers.location === '/maya.html') {
      console.log('  ✅ PASS: Root route redirects correctly\n');
      testsPassed++;
    } else {
      console.log(`  ❌ FAIL: Expected 301 redirect to /maya.html, got ${response.status} ${response.headers.location}\n`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}\n`);
    testsFailed++;
  }
  
  // Test 2: Root route should NOT return 404
  console.log('Test 2: Root route (/) should NOT return 404');
  try {
    const response = await request(app).get('/');
    if (response.status !== 404) {
      console.log(`  ✅ PASS: Root route returns ${response.status} (not 404)\n`);
      testsPassed++;
    } else {
      console.log('  ❌ FAIL: Root route returned 404\n');
      testsFailed++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}\n`);
    testsFailed++;
  }
  
  // Test 3: maya.html should be served
  console.log('Test 3: /maya.html should be served with 200');
  try {
    const response = await request(app).get('/maya.html');
    if (response.status === 200) {
      console.log('  ✅ PASS: maya.html served correctly\n');
      testsPassed++;
    } else {
      console.log(`  ❌ FAIL: Expected 200, got ${response.status}\n`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}\n`);
    testsFailed++;
  }
  
  // Test 4: Non-existent route should return 404
  console.log('Test 4: Non-existent route should return 404');
  try {
    const response = await request(app).get('/nonexistent-xyz-123');
    if (response.status === 404) {
      console.log('  ✅ PASS: 404 returned for non-existent route\n');
      testsPassed++;
    } else {
      console.log(`  ❌ FAIL: Expected 404, got ${response.status}\n`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}\n`);
    testsFailed++;
  }
  
  // Test 5: Health endpoint
  console.log('Test 5: /health should return 200');
  try {
    const response = await request(app).get('/health');
    if (response.status === 200 && response.body.status === 'ok') {
      console.log('  ✅ PASS: Health endpoint works\n');
      testsPassed++;
    } else {
      console.log(`  ❌ FAIL: Expected 200 with status ok, got ${response.status}\n`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}\n`);
    testsFailed++;
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('='.repeat(50) + '\n');
  
  // Close server
  server.close(() => {
    console.log('✅ Test server closed');
    process.exit(testsFailed > 0 ? 1 : 0);
  });
}

testRootRoute().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
