/**
 * Deployment API Tests
 * 
 * Tests the deployment API endpoint and functionality
 * 
 * Test Coverage:
 * 1. API endpoint structure
 * 2. Request payload validation
 * 3. Response handling
 * 4. Error cases
 */

import { describe, test, expect } from '@jest/globals';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BACKEND_DIR = join(__dirname, '../../backend');
const REPO_ROOT = join(__dirname, '../../../');

describe('Deployment API Validation', () => {
  const DEPLOYMENT_API_URL = 'https://space.ai-builders.com/backend/v1/deployments';

  describe('API Endpoint Structure', () => {
    test('deployment API URL is correctly configured', () => {
      expect(DEPLOYMENT_API_URL).toContain('space.ai-builders.com');
      expect(DEPLOYMENT_API_URL).toContain('/v1/deployments');
      expect(DEPLOYMENT_API_URL).toMatch(/^https:\/\//);
    });

    test('deployment endpoint uses POST method', async () => {
      const scriptPath = join(REPO_ROOT, 'DEPLOY_WITH_ENV_VAR.sh');
      const content = await fs.readFile(scriptPath, 'utf-8');

      expect(content).toMatch(/-X POST|method.*POST/i);
    });

    test('deployment requires Bearer authentication', async () => {
      const scriptPath = join(REPO_ROOT, 'DEPLOY_WITH_ENV_VAR.sh');
      const content = await fs.readFile(scriptPath, 'utf-8');

      expect(content).toMatch(/Authorization.*Bearer/i);
    });
  });

  describe('Request Payload Structure', () => {
    test('payload includes all required fields', async () => {
      const scriptPath = join(REPO_ROOT, 'DEPLOY_WITH_ENV_VAR.sh');
      const content = await fs.readFile(scriptPath, 'utf-8');

      // Required fields
      expect(content).toContain('repo_url');
      expect(content).toContain('service_name');
      expect(content).toContain('branch');
      
      // Environment variables
      expect(content).toContain('env_vars');
      expect(content).toContain('SYSTEM_INSTRUCTION');
    });

    test('repo_url is valid GitHub URL', async () => {
      const configPath = join(REPO_ROOT, 'deploy-config.json');
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      expect(config.repo_url).toMatch(/^https:\/\/github\.com\/[^/]+\/[^/]+$/);
    });

    test('service_name follows naming conventions', async () => {
      const configPath = join(REPO_ROOT, 'deploy-config.json');
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      // Must be lowercase with hyphens, 3-32 chars
      expect(config.service_name).toMatch(/^[a-z0-9-]{3,32}$/);
      expect(config.service_name).toBe('maya-agent');
    });

    test('branch is specified', async () => {
      const configPath = join(REPO_ROOT, 'deploy-config.json');
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      expect(config.branch).toBeTruthy();
      expect(config.branch).toBe('main');
    });

    test('port is valid number', async () => {
      const configPath = join(REPO_ROOT, 'deploy-config.json');
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      expect(typeof config.port).toBe('number');
      expect(config.port).toBeGreaterThan(0);
      expect(config.port).toBeLessThanOrEqual(65535);
      expect(config.port).toBe(3000);
    });

    test('env_vars is an object', async () => {
      const configPath = join(REPO_ROOT, 'deploy-config.json');
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      expect(typeof config.env_vars).toBe('object');
      expect(Array.isArray(config.env_vars)).toBe(false);
    });

    test('SYSTEM_INSTRUCTION is in env_vars', async () => {
      const configPath = join(REPO_ROOT, 'deploy-config.json');
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      expect(config.env_vars).toHaveProperty('SYSTEM_INSTRUCTION');
    });

    test('env_vars does not exceed 20 variables limit', async () => {
      const configPath = join(REPO_ROOT, 'deploy-config.json');
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      const envVarCount = Object.keys(config.env_vars).length;
      expect(envVarCount).toBeLessThanOrEqual(20);
    });
  });

  describe('SYSTEM_INSTRUCTION Payload', () => {
    test('system instruction can be JSON-escaped', async () => {
      const systemPromptPath = join(BACKEND_DIR, 'system_prompt.txt');
      const content = await fs.readFile(systemPromptPath, 'utf-8');

      let escaped;
      expect(() => {
        escaped = JSON.stringify(content);
      }).not.toThrow();

      // Should be able to parse back
      const parsed = JSON.parse(escaped);
      expect(parsed).toBe(content);
    });

    test('escaped system instruction preserves newlines', async () => {
      const systemPromptPath = join(BACKEND_DIR, 'system_prompt.txt');
      const content = await fs.readFile(systemPromptPath, 'utf-8');

      const escaped = JSON.stringify(content);
      const parsed = JSON.parse(escaped);

      // Should preserve line breaks
      expect(parsed.includes('\n')).toBe(content.includes('\n'));
      expect(parsed.split('\n').length).toBe(content.split('\n').length);
    });

    test('system instruction is not empty in payload', async () => {
      const systemPromptPath = join(BACKEND_DIR, 'system_prompt.txt');
      const content = await fs.readFile(systemPromptPath, 'utf-8');

      expect(content.trim().length).toBeGreaterThan(0);
      expect(content.length).toBeGreaterThan(1000);
    });
  });

  describe('Response Handling', () => {
    test('deployment script checks for HTTP status code', async () => {
      const scriptPath = join(REPO_ROOT, 'DEPLOY_WITH_ENV_VAR.sh');
      const content = await fs.readFile(scriptPath, 'utf-8');

      // Should check status codes
      expect(content).toMatch(/202|HTTP.*code|status/i);
    });

    test('deployment script handles success (202 Accepted)', async () => {
      const scriptPath = join(REPO_ROOT, 'DEPLOY_WITH_ENV_VAR.sh');
      const content = await fs.readFile(scriptPath, 'utf-8');

      expect(content).toMatch(/202/);
      expect(content).toMatch(/success|✓|✅/i);
    });

    test('deployment script handles validation errors (422)', async () => {
      const scriptPath = join(REPO_ROOT, 'DEPLOY_WITH_ENV_VAR.sh');
      const content = await fs.readFile(scriptPath, 'utf-8');

      expect(content).toMatch(/422/);
      expect(content).toMatch(/validation|error/i);
    });

    test('deployment script handles authentication errors (401)', async () => {
      const scriptPath = join(REPO_ROOT, 'DEPLOY_WITH_ENV_VAR.sh');
      const content = await fs.readFile(scriptPath, 'utf-8');

      expect(content).toMatch(/401/);
      expect(content).toMatch(/auth|unauthorized/i);
    });

    test('deployment script provides next steps on success', async () => {
      const scriptPath = join(REPO_ROOT, 'DEPLOY_WITH_ENV_VAR.sh');
      const content = await fs.readFile(scriptPath, 'utf-8');

      expect(content).toMatch(/next.*step|what.*next/i);
      expect(content).toMatch(/wait.*minute|5.*10.*minute/i);
    });
  });

  describe('Error Handling', () => {
    test('script validates API key is provided', async () => {
      const scriptPath = join(REPO_ROOT, 'DEPLOY_WITH_ENV_VAR.sh');
      const content = await fs.readFile(scriptPath, 'utf-8');

      expect(content).toMatch(/if.*-z.*\$1|API.*key.*required/i);
    });

    test('script validates system prompt file exists', async () => {
      const scriptPath = join(REPO_ROOT, 'DEPLOY_WITH_ENV_VAR.sh');
      const content = await fs.readFile(scriptPath, 'utf-8');

      expect(content).toMatch(/if.*!.*-f.*system_prompt/i);
    });

    test('script provides clear error messages', async () => {
      const scriptPath = join(REPO_ROOT, 'DEPLOY_WITH_ENV_VAR.sh');
      const content = await fs.readFile(scriptPath, 'utf-8');

      // Should have error messages
      expect(content).toMatch(/Error:|❌/);
      expect(content).toMatch(/Usage:/);
    });
  });

  describe('Documentation Accuracy', () => {
    test('deployment guide documents correct endpoint', async () => {
      const guidePath = join(REPO_ROOT, 'DEPLOYMENT_WITH_ENV_VARS_GUIDE.md');
      const content = await fs.readFile(guidePath, 'utf-8');

      expect(content).toContain(DEPLOYMENT_API_URL);
    });

    test('deployment guide shows correct request structure', async () => {
      const guidePath = join(REPO_ROOT, 'DEPLOYMENT_WITH_ENV_VARS_GUIDE.md');
      const content = await fs.readFile(guidePath, 'utf-8');

      expect(content).toContain('repo_url');
      expect(content).toContain('service_name');
      expect(content).toContain('branch');
      expect(content).toContain('env_vars');
      expect(content).toContain('SYSTEM_INSTRUCTION');
    });

    test('deployment record documents actual deployment', async () => {
      const recordPath = join(REPO_ROOT, 'DEPLOYMENT_RECORD_JAN_25_2026.md');
      const content = await fs.readFile(recordPath, 'utf-8');

      expect(content).toContain('POST /v1/deployments');
      expect(content).toContain('HTTP 202');
      expect(content).toContain('HEALTHY');
    });
  });
});

describe('Deployment Security', () => {
  test('API key is not hardcoded in scripts', async () => {
    const scriptPath = join(REPO_ROOT, 'DEPLOY_WITH_ENV_VAR.sh');
    const content = await fs.readFile(scriptPath, 'utf-8');

    // Should use variable, not hardcoded key
    expect(content).not.toMatch(/sk_[a-z0-9]{8}_[a-z0-9]{32}/i);
    expect(content).toMatch(/\$API_KEY|\$1/);
  });

  test('system prompt is not hardcoded in deployment payload', async () => {
    const scriptPath = join(REPO_ROOT, 'DEPLOY_WITH_ENV_VAR.sh');
    const content = await fs.readFile(scriptPath, 'utf-8');

    // Should read from file, not hardcode
    expect(content).toContain('cat');
    expect(content).toContain('system_prompt.txt');
    expect(content).toMatch(/\$SYSTEM_INSTRUCTION/);
  });

  test('deployment uses HTTPS', async () => {
    const DEPLOYMENT_API_URL = 'https://space.ai-builders.com/backend/v1/deployments';
    expect(DEPLOYMENT_API_URL).toMatch(/^https:\/\//);
  });
});
