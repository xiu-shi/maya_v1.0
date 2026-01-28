#!/usr/bin/env node
/**
 * Check Production Logging Status
 * 
 * Diagnoses why chat logs might not be stored properly in production
 * Usage: node check-production-logging.js
 */

const PRODUCTION_URL = 'https://maya-agent.ai-builders.space';

async function checkProductionLogging() {
  console.log('🔍 Diagnosing Production Chat Logging');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Production URL: ${PRODUCTION_URL}`);
  console.log('');

  try {
    // 1. Check if health endpoint works
    console.log('1️⃣  Checking health endpoint...');
    const healthResponse = await fetch(`${PRODUCTION_URL}/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log(`   ✅ Health check OK`);
      console.log(`   Environment: ${healthData.environment || 'unknown'}`);
      console.log(`   API Ready: ${healthData.apiReady || false}`);
      console.log('');
    } else {
      console.log(`   ❌ Health check failed: ${healthResponse.status}`);
      console.log('');
    }

    // 2. Check if chat logs endpoint is accessible
    console.log('2️⃣  Checking chat logs endpoint...');
    const logsResponse = await fetch(`${PRODUCTION_URL}/api/admin/chat-logs?startDate=2026-01-01&endDate=2026-01-28`);
    if (logsResponse.ok) {
      const logsData = await logsResponse.json();
      console.log(`   ✅ Logs endpoint accessible`);
      console.log(`   Total logs found: ${logsData.count || 0}`);
      console.log(`   Date range: ${logsData.startDate} to ${logsData.endDate}`);
      console.log('');
      
      if (logsData.count === 0) {
        console.log('   ⚠️  WARNING: No logs found despite usage increase!');
        console.log('');
      }
    } else {
      const errorText = await logsResponse.text();
      console.log(`   ❌ Logs endpoint failed: ${logsResponse.status}`);
      console.log(`   Error: ${errorText.substring(0, 200)}`);
      console.log('');
    }

    // 3. Check stats endpoint
    console.log('3️⃣  Checking stats endpoint...');
    const statsResponse = await fetch(`${PRODUCTION_URL}/api/admin/chat-logs/stats`);
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      if (statsData.success) {
        const stats = statsData.stats;
        console.log(`   ✅ Stats endpoint accessible`);
        console.log(`   Total Messages: ${stats.totalMessages || 0}`);
        console.log(`   Total Conversations: ${stats.totalConversations || 0}`);
        console.log(`   Storage Size: ${stats.totalSizeMB || '0.00'} MB`);
        console.log(`   Log Files: ${stats.totalFiles || 0}`);
        console.log('');
        
        if (stats.totalFiles > 0 && stats.files) {
          console.log('   📁 Log files found:');
          stats.files.slice(0, 5).forEach(file => {
            console.log(`      - ${file.date}: ${file.messages} messages, ${file.conversations} conversations`);
          });
          console.log('');
        }
      }
    } else {
      console.log(`   ❌ Stats endpoint failed: ${statsResponse.status}`);
      console.log('');
    }

    // 4. Test a chat request to see if logging happens
    console.log('4️⃣  Testing chat endpoint (to trigger logging)...');
    console.log('   (This will make a test request to Maya)');
    
    const testChatResponse = await fetch(`${PRODUCTION_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        message: 'Test message for logging verification',
        history: []
      })
    });

    if (testChatResponse.ok) {
      const chatData = await testChatResponse.json();
      console.log(`   ✅ Chat endpoint responded`);
      console.log(`   Response received: ${chatData.response ? 'Yes' : 'No'}`);
      console.log('');
      
      // Wait a moment for log to be written
      console.log('   ⏳ Waiting 2 seconds for log to be written...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if new log appeared
      const newLogsResponse = await fetch(`${PRODUCTION_URL}/api/admin/chat-logs?startDate=${new Date().toISOString().split('T')[0]}&endDate=${new Date().toISOString().split('T')[0]}`);
      if (newLogsResponse.ok) {
        const newLogsData = await newLogsResponse.json();
        const testLogs = Array.isArray(newLogsData.logs) ? newLogsData.logs : [];
        const testMessageFound = testLogs.some(log => 
          log.userMessage && log.userMessage.includes('Test message for logging verification')
        );
        
        if (testMessageFound) {
          console.log(`   ✅ SUCCESS: Test message was logged!`);
          console.log(`   ✅ Logging is working correctly`);
        } else {
          console.log(`   ❌ WARNING: Test message was NOT found in logs`);
          console.log(`   ❌ This indicates logging is NOT working properly`);
          console.log(`   Possible causes:`);
          console.log(`      - Logs directory not writable`);
          console.log(`      - Logs directory doesn't exist`);
          console.log(`      - Permission issues`);
          console.log(`      - Logs written to different location`);
        }
      }
      console.log('');
    } else {
      const errorText = await testChatResponse.text();
      console.log(`   ❌ Chat endpoint failed: ${testChatResponse.status}`);
      console.log(`   Error: ${errorText.substring(0, 200)}`);
      console.log('');
    }

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('💡 Next Steps:');
    console.log('   1. Check production server logs for errors');
    console.log('   2. Verify data/chat-logs/ directory exists and is writable');
    console.log('   3. Check Docker volume mounts (if using containers)');
    console.log('   4. Verify NODE_ENV is set to "production"');
    console.log('   5. Check file system permissions');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Error during diagnosis:');
    console.error(`   ${error.message}`);
    console.error('');
    process.exit(1);
  }
}

// Run
checkProductionLogging();
