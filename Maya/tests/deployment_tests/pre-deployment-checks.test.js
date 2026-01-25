/**
 * Pre-Deployment Validation Tests
 * 
 * CRITICAL: These tests MUST pass before deployment
 * 
 * Test Coverage:
 * 1. System prompt file exists and is valid
 * 2. System prompt can be JSON-escaped
 * 3. API key is configured
 * 4. Deployment configuration is valid
 * 5. Code is ready for environment variable loading
 * 6. No secrets in repository
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BACKEND_DIR = join(__dirname, '../../backend');
const REPO_ROOT = join(__dirname, '../../../');

describe('Pre-Deployment Validation', () => {
  describe('System Prompt Validation', () => {
    let systemPromptPath;
    let systemPromptContent;

    beforeAll(async () => {
      systemPromptPath = join(BACKEND_DIR, 'system_prompt.txt');
    });

    test('system prompt file exists', async () => {
      await expect(fs.access(systemPromptPath)).resolves.not.toThrow();
    });

    test('system prompt file is readable', async () => {
      systemPromptContent = await fs.readFile(systemPromptPath, 'utf-8');
      expect(systemPromptContent).toBeTruthy();
      expect(systemPromptContent.length).toBeGreaterThan(0);
    });

    test('system prompt has expected content structure', async () => {
      if (!systemPromptContent) {
        systemPromptContent = await fs.readFile(systemPromptPath, 'utf-8');
      }

      // Must contain key sections
      expect(systemPromptContent).toContain('MAYA SYSTEM INSTRUCTIONS');
      expect(systemPromptContent).toContain('Role & Identity');
      expect(systemPromptContent).toContain('Knowledge Base Sources');
      expect(systemPromptContent).toContain('Prompt Boundaries');
    });

    test('system prompt is not empty and has sufficient length', async () => {
      if (!systemPromptContent) {
        systemPromptContent = await fs.readFile(systemPromptPath, 'utf-8');
      }

      // Should be substantial (at least 10,000 characters)
      expect(systemPromptContent.length).toBeGreaterThan(10000);
      
      // Should have multiple lines
      const lines = systemPromptContent.split('\n');
      expect(lines.length).toBeGreaterThan(100);
    });

    test('system prompt can be JSON-escaped without errors', async () => {
      if (!systemPromptContent) {
        systemPromptContent = await fs.readFile(systemPromptPath, 'utf-8');
      }

      // Test JSON escaping (as would be done in deployment)
      let jsonEscaped;
      expect(() => {
        jsonEscaped = JSON.stringify(systemPromptContent);
      }).not.toThrow();

      // Verify it can be parsed back
      expect(() => {
        JSON.parse(jsonEscaped);
      }).not.toThrow();

      // Verify content is preserved
      const parsedBack = JSON.parse(jsonEscaped);
      expect(parsedBack).toBe(systemPromptContent);
    });

    test('system prompt does not contain deployment secrets', async () => {
      if (!systemPromptContent) {
        systemPromptContent = await fs.readFile(systemPromptPath, 'utf-8');
      }

      // Should not contain actual API keys or tokens
      expect(systemPromptContent).not.toMatch(/sk_[a-z0-9]{8}_[a-z0-9]{32}/i);
      expect(systemPromptContent).not.toMatch(/Bearer [a-zA-Z0-9_-]+/);
      expect(systemPromptContent).not.toMatch(/password.*=.*[^\s]+/i);
    });
  });

  describe('Environment Variable Loading Code Validation', () => {
    test('mcp-client.js exists and is readable', async () => {
      const mcpClientPath = join(BACKEND_DIR, 'mcp-client.js');
      await expect(fs.access(mcpClientPath)).resolves.not.toThrow();
    });

    test('mcp-client.js checks for SYSTEM_INSTRUCTION environment variable', async () => {
      const mcpClientPath = join(BACKEND_DIR, 'mcp-client.js');
      const content = await fs.readFile(mcpClientPath, 'utf-8');

      // Must check for process.env.SYSTEM_INSTRUCTION
      expect(content).toContain('process.env.SYSTEM_INSTRUCTION');
      
      // Must have conditional logic for environment variable
      expect(content).toMatch(/if\s*\(\s*process\.env\.SYSTEM_INSTRUCTION\s*\)/);
    });

    test('mcp-client.js has fallback for missing environment variable', async () => {
      const mcpClientPath = join(BACKEND_DIR, 'mcp-client.js');
      const content = await fs.readFile(mcpClientPath, 'utf-8');

      // Must have else clause or fallback
      expect(content).toContain('else');
      
      // Should attempt to load from file as fallback
      expect(content).toContain('system_prompt.txt');
    });

    test('mcp-client.js logs when loading from environment variable', async () => {
      const mcpClientPath = join(BACKEND_DIR, 'mcp-client.js');
      const content = await fs.readFile(mcpClientPath, 'utf-8');

      // Should log when loading from environment
      expect(content).toMatch(/log.*Loaded system instructions from environment/i);
    });
  });

  describe('Deployment Configuration Validation', () => {
    test('deployment script exists', async () => {
      const scriptPath = join(REPO_ROOT, 'DEPLOY_WITH_ENV_VAR.sh');
      await expect(fs.access(scriptPath)).resolves.not.toThrow();
    });

    test('deployment script is executable', async () => {
      const scriptPath = join(REPO_ROOT, 'DEPLOY_WITH_ENV_VAR.sh');
      const stats = await fs.stat(scriptPath);
      
      // Check if executable bit is set (mode & 0o111)
      const isExecutable = (stats.mode & 0o111) !== 0;
      expect(isExecutable).toBe(true);
    });

    test('deployment config template exists', async () => {
      const configPath = join(REPO_ROOT, 'deploy-config.json');
      await expect(fs.access(configPath)).resolves.not.toThrow();
    });

    test('deployment config has valid structure', async () => {
      const configPath = join(REPO_ROOT, 'deploy-config.json');
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      // Required fields
      expect(config).toHaveProperty('repo_url');
      expect(config).toHaveProperty('service_name');
      expect(config).toHaveProperty('branch');
      expect(config).toHaveProperty('port');
      expect(config).toHaveProperty('env_vars');

      // Validate values
      expect(config.repo_url).toContain('github.com');
      expect(config.service_name).toBe('maya-agent');
      expect(config.branch).toBe('main');
      expect(config.port).toBe(3000);
      expect(config.env_vars).toHaveProperty('SYSTEM_INSTRUCTION');
    });
  });

  describe('Repository Security Validation', () => {
    test('system_prompt.txt is gitignored', async () => {
      const gitignorePath = join(REPO_ROOT, '.gitignore');
      const content = await fs.readFile(gitignorePath, 'utf-8');

      // Should be gitignored in backend or root
      const hasSystemPrompt = content.includes('system_prompt.txt') || 
                             content.includes('**/system_prompt.txt');
      expect(hasSystemPrompt).toBe(true);
    });

    test('.env file is gitignored', async () => {
      const gitignorePath = join(REPO_ROOT, '.gitignore');
      const content = await fs.readFile(gitignorePath, 'utf-8');

      expect(content).toMatch(/\.env/);
    });

    test('no API keys in tracked files', async () => {
      // Check common files that should not contain API keys
      const filesToCheck = [
        'README.md',
        'package.json',
        'Maya/backend/package.json',
        'Maya/backend/server.js'
      ];

      for (const file of filesToCheck) {
        const filePath = join(REPO_ROOT, file);
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          
          // Should not contain actual API keys
          expect(content).not.toMatch(/sk_[a-z0-9]{8}_[a-z0-9]{32}/i);
        } catch (error) {
          // File might not exist, that's okay
          if (error.code !== 'ENOENT') throw error;
        }
      }
    });
  });

  describe('API Endpoint Validation', () => {
    test('deployment endpoint is documented', async () => {
      const guidePath = join(REPO_ROOT, 'DEPLOYMENT_WITH_ENV_VARS_GUIDE.md');
      const content = await fs.readFile(guidePath, 'utf-8');

      expect(content).toContain('POST /v1/deployments');
      expect(content).toContain('https://space.ai-builders.com/backend/v1/deployments');
    });

    test('deployment documentation includes env_vars parameter', async () => {
      const guidePath = join(REPO_ROOT, 'DEPLOYMENT_WITH_ENV_VARS_GUIDE.md');
      const content = await fs.readFile(guidePath, 'utf-8');

      expect(content).toContain('env_vars');
      expect(content).toContain('SYSTEM_INSTRUCTION');
    });
  });
});

describe('Deployment Script Validation', () => {
  test('deployment script has proper error handling', async () => {
    const scriptPath = join(REPO_ROOT, 'DEPLOY_WITH_ENV_VAR.sh');
    const content = await fs.readFile(scriptPath, 'utf-8');

    // Should check for API key
    expect(content).toMatch(/if.*\[\s*-z.*\]/);
    
    // Should check for system prompt file
    expect(content).toMatch(/if.*\[\s*!.*-f.*system_prompt\.txt/);
    
    // Should have error messages
    expect(content).toContain('Error');
  });

  test('deployment script reads system prompt correctly', async () => {
    const scriptPath = join(REPO_ROOT, 'DEPLOY_WITH_ENV_VAR.sh');
    const content = await fs.readFile(scriptPath, 'utf-8');

    // Should read the file
    expect(content).toContain('cat');
    expect(content).toContain('system_prompt.txt');
    
    // Should use jq for JSON escaping
    expect(content).toContain('jq -Rs');
  });

  test('deployment script targets correct endpoint', async () => {
    const scriptPath = join(REPO_ROOT, 'DEPLOY_WITH_ENV_VAR.sh');
    const content = await fs.readFile(scriptPath, 'utf-8');

    expect(content).toContain('https://space.ai-builders.com/backend/v1/deployments');
  });

  test('deployment script includes SYSTEM_INSTRUCTION in payload', async () => {
    const scriptPath = join(REPO_ROOT, 'DEPLOY_WITH_ENV_VAR.sh');
    const content = await fs.readFile(scriptPath, 'utf-8');

    expect(content).toContain('SYSTEM_INSTRUCTION');
    expect(content).toContain('env_vars');
  });
});
