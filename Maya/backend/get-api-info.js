/**
 * Get API Specification from MCP Server
 * 
 * Uses the MCP get_api_specification tool to find the correct API endpoint
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import config from './config/env.js';

async function getAPIInfo() {
  console.log('🔍 Getting API specification from MCP server...\n');

  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@aibuilders/mcp-coach-server'],
    env: {
      ...process.env,
      AI_BUILDER_TOKEN: config.aiBuilderToken
    }
  });

  const client = new Client({
    name: 'api-info-finder',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  try {
    await client.connect(transport);
    console.log('✅ Connected to MCP server\n');

    // Call get_api_specification tool
    console.log('📡 Calling get_api_specification tool...\n');
    const result = await client.callTool({
      name: 'get_api_specification',
      arguments: {}
    });

    console.log('📋 API Specification:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Try to extract endpoint info
    if (result.content) {
      console.log('📄 Content:');
      console.log(result.content);
    }

    if (result.text) {
      console.log('📄 Text:');
      console.log(result.text);
    }

    await client.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

getAPIInfo();



