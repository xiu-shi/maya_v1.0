/**
 * Test Remote Logs Fetching
 * 
 * Tests fetching logs from production server
 */

import { fetchRemoteLogs, fetchRemoteStats } from './utils/remote-logs.js';
import { logInfo, logError } from './utils/logger.js';

const PRODUCTION_URL = 'https://maya-agent.ai-builders.space';

async function testRemoteLogs() {
  console.log('🧪 Testing Remote Logs Fetching\n');
  console.log(`Production URL: ${PRODUCTION_URL}\n`);
  
  const startDate = new Date('2026-01-17');
  const endDate = new Date('2026-01-17');
  
  try {
    console.log('1️⃣ Testing Stats Endpoint...');
    const stats = await fetchRemoteStats(PRODUCTION_URL);
    console.log('✅ Stats fetched successfully:');
    console.log(`   Total Messages: ${stats.totalMessages}`);
    console.log(`   Total Conversations: ${stats.totalConversations}`);
    console.log(`   Storage: ${stats.totalSizeMB} MB`);
    console.log(`   Sources: ${JSON.stringify(stats.sources || [], null, 2)}\n`);
  } catch (error) {
    console.error('❌ Failed to fetch stats:', error.message);
    console.error('   Error details:', error);
  }
  
  try {
    console.log('2️⃣ Testing Logs Endpoint...');
    const logs = await fetchRemoteLogs(PRODUCTION_URL, startDate, endDate, 'none');
    console.log(`✅ Logs fetched successfully: ${logs.length} messages`);
    
    if (logs.length > 0) {
      console.log('\n📋 Sample log entry:');
      const sample = logs[0];
      console.log(`   ID: ${sample.id}`);
      console.log(`   Timestamp: ${sample.timestamp}`);
      console.log(`   Environment: ${sample.environment || 'unknown'}`);
      console.log(`   User Message: ${sample.userMessage.substring(0, 50)}...`);
      console.log(`   Is Remote: ${sample.isRemote}`);
      console.log(`   Remote Server: ${sample.remoteServer}`);
    } else {
      console.log('   No logs found for the selected date range');
    }
  } catch (error) {
    console.error('❌ Failed to fetch logs:', error.message);
    console.error('   Error details:', error);
  }
  
  console.log('\n✅ Test completed');
}

testRemoteLogs().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
