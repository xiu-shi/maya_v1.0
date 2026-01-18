#!/usr/bin/env node
/**
 * MCP Server Discovery Script
 * 
 * This script connects to the AI Builders MCP server and discovers:
 * - Available tools (functions)
 * - Available resources (data/files)
 * - Available prompts (templates)
 * 
 * Usage: npm run discover
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load MCP config to get the token
function loadMCPConfig() {
  try {
    const configPath = join(__dirname, '../../mcp_config.json');
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    const serverConfig = config.mcpServers['ai-builders-coach'];
    return serverConfig.env.AI_BUILDER_TOKEN;
  } catch (error) {
    console.error('⚠️  Could not load mcp_config.json, using environment variable');
    return process.env.AI_BUILDER_TOKEN || 'sk_937d9f12_5e4fc7f11ca47cf77cefec16b8611132466d';
  }
}

const AI_BUILDER_TOKEN = loadMCPConfig();

console.log('🔍 Discovering AI Builders MCP Server Capabilities...\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function discoverMCPCapabilities() {
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@aibuilders/mcp-coach-server'],
    env: {
      ...process.env,
      AI_BUILDER_TOKEN: AI_BUILDER_TOKEN
    }
  });

  const client = new Client({
    name: 'mcp-discovery',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  const results = {
    connected: false,
    serverInfo: null,
    tools: [],
    resources: [],
    prompts: [],
    errors: []
  };

  try {
    console.log('📡 Connecting to MCP server...');
    await client.connect(transport);
    results.connected = true;
    console.log('✅ Connected successfully!\n');

    // Get server info
    console.log('📋 Fetching server information...');
    try {
      // Note: The SDK doesn't expose initialize directly, but we can try to get server info
      console.log('   Server: ai-builders-coach');
      console.log('   Package: @aibuilders/mcp-coach-server\n');
    } catch (e) {
      results.errors.push(`Server info: ${e.message}`);
    }

    // List tools
    console.log('🛠️  Discovering Tools...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    try {
      const toolsResponse = await client.listTools();
      results.tools = toolsResponse.tools || [];
      
      if (results.tools.length > 0) {
        results.tools.forEach((tool, index) => {
          console.log(`${index + 1}. ${tool.name}`);
          console.log(`   Description: ${tool.description || 'N/A'}`);
          if (tool.inputSchema) {
            console.log(`   Parameters:`);
            if (tool.inputSchema.properties) {
              Object.entries(tool.inputSchema.properties).forEach(([key, value]) => {
                const prop = value;
                console.log(`     - ${key}: ${prop.type || 'any'} ${prop.description ? `(${prop.description})` : ''}`);
              });
            }
          }
          console.log('');
        });
      } else {
        console.log('   No tools available\n');
      }
    } catch (e) {
      const errorMsg = `Tools discovery failed: ${e.message}`;
      results.errors.push(errorMsg);
      console.log(`   ❌ ${errorMsg}\n`);
    }

    // List resources
    console.log('📚 Discovering Resources...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    try {
      const resourcesResponse = await client.listResources();
      results.resources = resourcesResponse.resources || [];
      
      if (results.resources.length > 0) {
        results.resources.forEach((resource, index) => {
          console.log(`${index + 1}. ${resource.name}`);
          console.log(`   URI: ${resource.uri}`);
          console.log(`   Description: ${resource.description || 'N/A'}`);
          if (resource.mimeType) {
            console.log(`   MIME Type: ${resource.mimeType}`);
          }
          console.log('');
        });
      } else {
        console.log('   No resources available\n');
      }
    } catch (e) {
      const errorMsg = `Resources discovery failed: ${e.message}`;
      results.errors.push(errorMsg);
      console.log(`   ❌ ${errorMsg}\n`);
    }

    // List prompts
    console.log('💬 Discovering Prompts...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    try {
      const promptsResponse = await client.listPrompts();
      results.prompts = promptsResponse.prompts || [];
      
      if (results.prompts.length > 0) {
        results.prompts.forEach((prompt, index) => {
          console.log(`${index + 1}. ${prompt.name}`);
          console.log(`   Description: ${prompt.description || 'N/A'}`);
          if (prompt.arguments && prompt.arguments.length > 0) {
            console.log(`   Arguments:`);
            prompt.arguments.forEach(arg => {
              console.log(`     - ${arg.name}: ${arg.description || 'N/A'}`);
            });
          }
          console.log('');
        });
      } else {
        console.log('   No prompts available\n');
      }
    } catch (e) {
      const errorMsg = `Prompts discovery failed: ${e.message}`;
      results.errors.push(errorMsg);
      console.log(`   ❌ ${errorMsg}\n`);
    }

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Discovery Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`✅ Connection: ${results.connected ? 'Success' : 'Failed'}`);
    console.log(`🛠️  Tools Found: ${results.tools.length}`);
    console.log(`📚 Resources Found: ${results.resources.length}`);
    console.log(`💬 Prompts Found: ${results.prompts.length}`);
    if (results.errors.length > 0) {
      console.log(`⚠️  Errors: ${results.errors.length}`);
    }
    console.log('');

    await client.close();
    console.log('✅ Discovery complete!\n');

    return results;

  } catch (error) {
    console.error('\n❌ Error during discovery:', error.message);
    console.error('Stack:', error.stack);
    results.errors.push(`Connection error: ${error.message}`);
    
    try {
      await client.close();
    } catch (e) {
      // Ignore close errors
    }
    
    process.exit(1);
  }
}

// Run discovery
discoverMCPCapabilities()
  .then(async results => {
    // Write results to a JSON file for reference
    const fs = await import('fs');
    const resultsPath = join(__dirname, '../../mcp-discovery-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`📄 Results saved to: mcp-discovery-results.json`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

