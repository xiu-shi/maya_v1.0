/**
 * Test Maya with KB Integration
 * 
 * Test chat functionality with KB context loaded
 */

import { MayaMCPClient } from './mcp-client.js';
import { logInfo } from './utils/logger.js';

async function testMayaWithKB() {
  console.log('🧪 Testing Maya with KB Integration...\n');

  const client = new MayaMCPClient();
  
  const testQuestions = [
    "Tell me about Janet",
    "What is Janet's expertise?",
    "Where does Janet work?",
    "What companies has Janet worked with?"
  ];

  for (const question of testQuestions) {
    console.log(`\n📝 Question: ${question}`);
    console.log('─'.repeat(80));
    
    try {
      const result = await client.chat(question, []);
      const response = result.content;
      
      console.log(`✅ Response (${response.split(/\s+/).length} words):`);
      console.log(response);
      console.log('─'.repeat(80));
      
      // Check if response uses KB information
      const kbKeywords = ['IADT', 'Lakera', 'Workday', 'Huawei', 'Ireland', 'Dublin', 'AI security', 'digital transformation'];
      const hasKBInfo = kbKeywords.some(keyword => 
        response.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (hasKBInfo) {
        console.log('✅ Response includes KB information');
      } else {
        console.log('⚠️  Response may not be using KB information');
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
    
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testMayaWithKB().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});


