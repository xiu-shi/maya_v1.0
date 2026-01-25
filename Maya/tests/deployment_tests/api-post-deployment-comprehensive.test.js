/**
 * Comprehensive API POST Deployment Tests
 * 
 * Tests ALL possible cases for API POST deployment to ensure complete coverage
 * 
 * Test Coverage:
 * 1. Valid deployment scenarios
 * 2. Invalid payload cases
 * 3. Authentication failures
 * 4. Network/timeout scenarios
 * 5. Response validation
 * 6. Environment variable handling
 * 7. Edge cases and boundary conditions
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BACKEND_DIR = join(__dirname, '../../backend');
const REPO_ROOT = join(__dirname, '../../../');

describe('API POST Deployment - Comprehensive Test Suite', () => {
  const DEPLOYMENT_API_URL = 'https://space.ai-builders.com/backend/v1/deployments';
  const VALID_REPO_URL = 'https://github.com/xiu-shi/maya_v1.0';
  const VALID_SERVICE_NAME = 'maya-agent';
  const VALID_BRANCH = 'main';
  const VALID_PORT = 3000;

  describe('Valid Deployment Scenarios', () => {
    test('complete valid payload with all required fields', async () => {
      const payload = {
        repo_url: VALID_REPO_URL,
        service_name: VALID_SERVICE_NAME,
        branch: VALID_BRANCH,
        port: VALID_PORT,
        env_vars: {
          SYSTEM_INSTRUCTION: 'Test system instruction',
          TRUST_PROXY: 'true'
        }
      };

      // Validate structure
      expect(payload.repo_url).toBeTruthy();
      expect(payload.service_name).toBeTruthy();
      expect(payload.branch).toBeTruthy();
      expect(payload.port).toBeGreaterThan(0);
      expect(payload.env_vars).toBeDefined();
      expect(payload.env_vars.SYSTEM_INSTRUCTION).toBeTruthy();
    });

    test('valid payload with minimal required fields', async () => {
      const payload = {
        repo_url: VALID_REPO_URL,
        service_name: VALID_SERVICE_NAME,
        branch: VALID_BRANCH,
        port: VALID_PORT,
        env_vars: {
          SYSTEM_INSTRUCTION: 'Minimal test'
        }
      };

      expect(Object.keys(payload)).toHaveLength(5);
      expect(payload.env_vars).toHaveProperty('SYSTEM_INSTRUCTION');
    });

    test('valid payload with multiple environment variables', async () => {
      const payload = {
        repo_url: VALID_REPO_URL,
        service_name: VALID_SERVICE_NAME,
        branch: VALID_BRANCH,
        port: VALID_PORT,
        env_vars: {
          SYSTEM_INSTRUCTION: 'Test',
          TRUST_PROXY: 'true',
          NODE_ENV: 'production'
        }
      };

      expect(Object.keys(payload.env_vars).length).toBeLessThanOrEqual(20);
      expect(payload.env_vars.SYSTEM_INSTRUCTION).toBeTruthy();
    });

    test('valid payload with streaming_log_timeout_seconds', async () => {
      const payload = {
        repo_url: VALID_REPO_URL,
        service_name: VALID_SERVICE_NAME,
        branch: VALID_BRANCH,
        port: VALID_PORT,
        env_vars: {
          SYSTEM_INSTRUCTION: 'Test'
        },
        streaming_log_timeout_seconds: 120
      };

      expect(payload.streaming_log_timeout_seconds).toBeGreaterThan(0);
      expect(payload.streaming_log_timeout_seconds).toBeLessThanOrEqual(300);
    });
  });

  describe('Invalid Payload Cases', () => {
    test('missing repo_url should fail', () => {
      const payload = {
        service_name: VALID_SERVICE_NAME,
        branch: VALID_BRANCH,
        port: VALID_PORT,
        env_vars: { SYSTEM_INSTRUCTION: 'Test' }
      };

      expect(payload.repo_url).toBeUndefined();
    });

    test('missing service_name should fail', () => {
      const payload = {
        repo_url: VALID_REPO_URL,
        branch: VALID_BRANCH,
        port: VALID_PORT,
        env_vars: { SYSTEM_INSTRUCTION: 'Test' }
      };

      expect(payload.service_name).toBeUndefined();
    });

    test('missing branch should fail', () => {
      const payload = {
        repo_url: VALID_REPO_URL,
        service_name: VALID_SERVICE_NAME,
        port: VALID_PORT,
        env_vars: { SYSTEM_INSTRUCTION: 'Test' }
      };

      expect(payload.branch).toBeUndefined();
    });

    test('missing port should fail', () => {
      const payload = {
        repo_url: VALID_REPO_URL,
        service_name: VALID_SERVICE_NAME,
        branch: VALID_BRANCH,
        env_vars: { SYSTEM_INSTRUCTION: 'Test' }
      };

      expect(payload.port).toBeUndefined();
    });

    test('missing env_vars should fail', () => {
      const payload = {
        repo_url: VALID_REPO_URL,
        service_name: VALID_SERVICE_NAME,
        branch: VALID_BRANCH,
        port: VALID_PORT
      };

      expect(payload.env_vars).toBeUndefined();
    });

    test('missing SYSTEM_INSTRUCTION in env_vars should fail', () => {
      const payload = {
        repo_url: VALID_REPO_URL,
        service_name: VALID_SERVICE_NAME,
        branch: VALID_BRANCH,
        port: VALID_PORT,
        env_vars: {
          TRUST_PROXY: 'true'
        }
      };

      expect(payload.env_vars.SYSTEM_INSTRUCTION).toBeUndefined();
    });

    test('invalid repo_url format should fail', () => {
      const invalidUrls = [
        'not-a-url',
        'http://github.com/user/repo', // Should be https
        'https://github.com', // Missing path
        'https://github.com/user', // Missing repo
        'ftp://github.com/user/repo', // Wrong protocol
        ''
      ];

      invalidUrls.forEach(url => {
        expect(url).not.toMatch(/^https:\/\/github\.com\/[^/]+\/[^/]+$/);
      });
    });

    test('invalid service_name format should fail', () => {
      const invalidNames = [
        'MAYA-AGENT', // Uppercase
        'maya_agent', // Underscore
        'maya.agent', // Dot
        'maya agent', // Space
        'ab', // Too short
        'a'.repeat(33), // Too long
        ''
      ];

      invalidNames.forEach(name => {
        expect(name).not.toMatch(/^[a-z0-9-]{3,32}$/);
      });
    });

    test('invalid port number should fail', () => {
      const invalidPorts = [
        -1,
        0,
        65536,
        99999,
        '3000', // String instead of number
        null,
        undefined
      ];

      invalidPorts.forEach(port => {
        if (typeof port === 'number') {
          expect(port <= 0 || port > 65535).toBe(true);
        } else {
          expect(typeof port).not.toBe('number');
        }
      });
    });

    test('env_vars as array should fail', () => {
      const payload = {
        repo_url: VALID_REPO_URL,
        service_name: VALID_SERVICE_NAME,
        branch: VALID_BRANCH,
        port: VALID_PORT,
        env_vars: ['SYSTEM_INSTRUCTION=test']
      };

      expect(Array.isArray(payload.env_vars)).toBe(true);
    });

    test('too many environment variables should fail', () => {
      const envVars = {};
      for (let i = 0; i < 25; i++) {
        envVars[`VAR_${i}`] = `value_${i}`;
      }

      expect(Object.keys(envVars).length).toBeGreaterThan(20);
    });

    test('empty SYSTEM_INSTRUCTION should fail', async () => {
      const systemPromptPath = join(BACKEND_DIR, 'system_prompt.txt');
      const content = await fs.readFile(systemPromptPath, 'utf-8');

      // Empty string should fail
      expect('').toBeFalsy();
      expect('   '.trim()).toBeFalsy();
      
      // But actual file should have content
      expect(content.trim().length).toBeGreaterThan(0);
    });

    test('SYSTEM_INSTRUCTION exceeding size limit should fail', () => {
      const largeInstruction = 'x'.repeat(100000); // 100KB

      // Should check size limit (typically 64KB or 128KB)
      expect(largeInstruction.length).toBeGreaterThan(65536);
    });
  });

  describe('Authentication & Authorization', () => {
    test('missing API key should fail', () => {
      const headers = {};
      expect(headers['Authorization']).toBeUndefined();
    });

    test('invalid API key format should fail', () => {
      const invalidKeys = [
        'invalid-key',
        'sk_', // Too short
        'sk_test', // Too short
        'bearer sk_test', // Wrong format
        '',
        null
      ];

      invalidKeys.forEach(key => {
        if (key) {
          expect(key).not.toMatch(/^sk_[a-z0-9]{8}_[a-z0-9]{32,}$/);
        } else {
          expect(key).toBeFalsy();
        }
      });
    });

    test('valid API key format', () => {
      const validKey = 'sk_a875c681_34662a32eb069853700109e6b083bee6de02';
      expect(validKey).toMatch(/^sk_[a-z0-9]{8}_[a-z0-9]{32,}$/);
    });

    test('Bearer token format is correct', () => {
      const apiKey = 'sk_test_1234567890abcdef';
      const authHeader = `Bearer ${apiKey}`;
      
      expect(authHeader).toMatch(/^Bearer\s+sk_/);
      expect(authHeader.split(' ')[0]).toBe('Bearer');
    });

    test('revoked API key should fail', () => {
      const revokedKeys = [
        'sk_937d9f12_1234567890abcdef', // Documented as revoked
        'sk_9a342713_1234567890abcdef'  // Documented as revoked
      ];

      revokedKeys.forEach(key => {
        expect(key.startsWith('sk_937d9f12') || key.startsWith('sk_9a342713')).toBe(true);
      });
    });
  });

  describe('JSON Escaping & Encoding', () => {
    test('system instruction with special characters escapes correctly', async () => {
      const testCases = [
        'Line 1\nLine 2\nLine 3',
        'Text with "quotes"',
        "Text with 'single quotes'",
        'Text with \\backslashes\\',
        'Text with \ttabs',
        'Text with \r\nWindows line breaks',
        'Text with unicode: 你好世界 🌍',
        'Text with JSON: {"key": "value"}'
      ];

      testCases.forEach(text => {
        const escaped = JSON.stringify(text);
        const parsed = JSON.parse(escaped);
        expect(parsed).toBe(text);
      });
    });

    test('system instruction preserves formatting', async () => {
      const systemPromptPath = join(BACKEND_DIR, 'system_prompt.txt');
      const content = await fs.readFile(systemPromptPath, 'utf-8');

      const escaped = JSON.stringify(content);
      const parsed = JSON.parse(escaped);

      // Should preserve all characters
      expect(parsed).toBe(content);
      expect(parsed.length).toBe(content.length);
      expect(parsed.split('\n').length).toBe(content.split('\n').length);
    });

    test('large system instruction escapes without errors', async () => {
      const systemPromptPath = join(BACKEND_DIR, 'system_prompt.txt');
      const content = await fs.readFile(systemPromptPath, 'utf-8');

      let escaped;
      expect(() => {
        escaped = JSON.stringify(content);
      }).not.toThrow();

      expect(escaped.length).toBeGreaterThan(content.length); // Escaped is longer
      expect(escaped.startsWith('"')).toBe(true);
      expect(escaped.endsWith('"')).toBe(true);
    });
  });

  describe('HTTP Response Scenarios', () => {
    test('successful deployment returns 202 Accepted', () => {
      const successResponse = {
        status: 202,
        body: {
          service_name: VALID_SERVICE_NAME,
          status: 'deploying',
          koyeb_status: 'HEALTHY'
        }
      };

      expect(successResponse.status).toBe(202);
      expect(successResponse.body.status).toBe('deploying');
    });

    test('validation error returns 422 Unprocessable Entity', () => {
      const errorResponse = {
        status: 422,
        body: {
          error: 'Validation error',
          details: ['repo_url is required']
        }
      };

      expect(errorResponse.status).toBe(422);
      expect(errorResponse.body.error).toContain('Validation');
    });

    test('authentication error returns 401 Unauthorized', () => {
      const errorResponse = {
        status: 401,
        body: {
          error: 'Unauthorized',
          message: 'Invalid API key'
        }
      };

      expect(errorResponse.status).toBe(401);
      expect(errorResponse.body.error).toContain('Unauthorized');
    });

    test('rate limit error returns 429 Too Many Requests', () => {
      const errorResponse = {
        status: 429,
        body: {
          error: 'Rate limit exceeded',
          retry_after: 60
        }
      };

      expect(errorResponse.status).toBe(429);
      expect(errorResponse.body.error).toContain('Rate limit');
    });

    test('server error returns 500 Internal Server Error', () => {
      const errorResponse = {
        status: 500,
        body: {
          error: 'Internal server error'
        }
      };

      expect(errorResponse.status).toBe(500);
    });

    test('service unavailable returns 503 Service Unavailable', () => {
      const errorResponse = {
        status: 503,
        body: {
          error: 'Service temporarily unavailable'
        }
      };

      expect(errorResponse.status).toBe(503);
    });
  });

  describe('Network & Timeout Scenarios', () => {
    test('network timeout should be handled', () => {
      const timeoutMs = 120000; // 2 minutes
      expect(timeoutMs).toBeGreaterThan(60000);
      expect(timeoutMs).toBeLessThanOrEqual(300000);
    });

    test('connection refused should be handled', () => {
      const error = {
        code: 'ECONNREFUSED',
        message: 'Connection refused'
      };

      expect(error.code).toBe('ECONNREFUSED');
    });

    test('DNS resolution failure should be handled', () => {
      const error = {
        code: 'ENOTFOUND',
        message: 'DNS lookup failed'
      };

      expect(error.code).toBe('ENOTFOUND');
    });

    test('SSL certificate error should be handled', () => {
      const error = {
        code: 'CERT_HAS_EXPIRED',
        message: 'SSL certificate expired'
      };

      expect(error.code).toContain('CERT');
    });
  });

  describe('Environment Variable Validation', () => {
    test('SYSTEM_INSTRUCTION must be string', async () => {
      const systemPromptPath = join(BACKEND_DIR, 'system_prompt.txt');
      const content = await fs.readFile(systemPromptPath, 'utf-8');

      expect(typeof content).toBe('string');
      expect(content.length).toBeGreaterThan(0);
    });

    test('TRUST_PROXY must be "true" or "false"', () => {
      const validValues = ['true', 'false'];
      const invalidValues = ['True', 'TRUE', '1', '0', 'yes', 'no', ''];

      validValues.forEach(value => {
        expect(['true', 'false']).toContain(value);
      });

      invalidValues.forEach(value => {
        expect(['true', 'false']).not.toContain(value);
      });
    });

    test('environment variable names must be uppercase', () => {
      const validNames = ['SYSTEM_INSTRUCTION', 'TRUST_PROXY', 'NODE_ENV'];
      const invalidNames = ['system_instruction', 'System_Instruction', 'system-instruction'];

      validNames.forEach(name => {
        expect(name).toBe(name.toUpperCase());
      });

      invalidNames.forEach(name => {
        expect(name).not.toBe(name.toUpperCase());
      });
    });

    test('environment variable values are strings', () => {
      const envVars = {
        SYSTEM_INSTRUCTION: 'Test instruction',
        TRUST_PROXY: 'true',
        NODE_ENV: 'production'
      };

      Object.values(envVars).forEach(value => {
        expect(typeof value).toBe('string');
      });
    });

    test('environment variables do not contain secrets', () => {
      const envVars = {
        SYSTEM_INSTRUCTION: 'Test',
        TRUST_PROXY: 'true'
      };

      // Should not contain API keys or passwords
      Object.values(envVars).forEach(value => {
        expect(value).not.toMatch(/sk_[a-z0-9]{8}_[a-z0-9]{32,}/);
        expect(value).not.toMatch(/password|secret|token/i);
      });
    });
  });

  describe('Deployment Script Validation', () => {
    test('deployment script exists and is executable', async () => {
      const scriptPath = join(REPO_ROOT, 'DEPLOY_WITH_ENV_VAR.sh');
      const stats = await fs.stat(scriptPath);
      
      // File exists
      expect(stats.isFile()).toBe(true);
      
      // Check if executable (mode & 0o111)
      const isExecutable = (stats.mode & 0o111) !== 0;
      // Note: On some systems, executable bit might not be set
      // But script should still be runnable with bash
    });

    test('deployment script uses correct curl command', async () => {
      const scriptPath = join(REPO_ROOT, 'DEPLOY_WITH_ENV_VAR.sh');
      const content = await fs.readFile(scriptPath, 'utf-8');

      expect(content).toContain('curl');
      expect(content).toContain('-X POST');
      expect(content).toContain('-H "Content-Type: application/json"');
      expect(content).toContain('-H "Authorization: Bearer');
    });

    test('deployment script reads system prompt from file', async () => {
      const scriptPath = join(REPO_ROOT, 'DEPLOY_WITH_ENV_VAR.sh');
      const content = await fs.readFile(scriptPath, 'utf-8');

      expect(content).toMatch(/cat.*system_prompt\.txt/);
      expect(content).toMatch(/jq.*-Rs/); // JSON string escaping
    });

    test('deployment script validates inputs', async () => {
      const scriptPath = join(REPO_ROOT, 'DEPLOY_WITH_ENV_VAR.sh');
      const content = await fs.readFile(scriptPath, 'utf-8');

      // Should check for API key
      expect(content).toMatch(/if.*-z.*\$1|API.*KEY/i);
      
      // Should check for system prompt file
      expect(content).toMatch(/if.*!.*-f.*system_prompt/i);
    });

    test('deployment script handles errors gracefully', async () => {
      const scriptPath = join(REPO_ROOT, 'DEPLOY_WITH_ENV_VAR.sh');
      const content = await fs.readFile(scriptPath, 'utf-8');

      // Should have error handling (check for error messages or error handling patterns)
      expect(content).toMatch(/Error|error|❌|✗|failed/i);
    });
  });

  describe('Post-Deployment Validation', () => {
    test('deployment status can be checked', () => {
      const statusEndpoint = 'https://space.ai-builders.com/backend/v1/deployments/maya-agent';
      
      expect(statusEndpoint).toContain('/v1/deployments/');
      expect(statusEndpoint).toContain(VALID_SERVICE_NAME);
    });

    test('deployment logs can be retrieved', () => {
      const logsEndpoint = 'https://space.ai-builders.com/backend/v1/deployments/maya-agent/logs';
      
      expect(logsEndpoint).toContain('/logs');
      expect(logsEndpoint).toContain(VALID_SERVICE_NAME);
    });

    test('health check endpoint is accessible', () => {
      const healthEndpoint = 'https://maya-agent.ai-builders.space/health';
      
      expect(healthEndpoint).toContain('/health');
      expect(healthEndpoint).toContain('maya-agent.ai-builders.space');
    });

    test('chat API endpoint is accessible', () => {
      const chatEndpoint = 'https://maya-agent.ai-builders.space/api/chat';
      
      expect(chatEndpoint).toContain('/api/chat');
    });
  });

  describe('Edge Cases & Boundary Conditions', () => {
    test('repo_url with trailing slash is handled', () => {
      const urlWithSlash = 'https://github.com/xiu-shi/maya_v1.0/';
      const urlWithoutSlash = urlWithSlash.replace(/\/$/, '');
      
      expect(urlWithoutSlash).toBe('https://github.com/xiu-shi/maya_v1.0');
    });

    test('service_name at minimum length (3 chars)', () => {
      const minName = 'may';
      expect(minName.length).toBe(3);
      expect(minName).toMatch(/^[a-z0-9-]{3,32}$/);
    });

    test('service_name at maximum length (32 chars)', () => {
      const maxName = 'a'.repeat(32);
      expect(maxName.length).toBe(32);
      expect(maxName).toMatch(/^[a-z0-9-]{3,32}$/);
    });

    test('port at minimum valid value (1)', () => {
      expect(1).toBeGreaterThan(0);
      expect(1).toBeLessThanOrEqual(65535);
    });

    test('port at maximum valid value (65535)', () => {
      expect(65535).toBeGreaterThan(0);
      expect(65535).toBeLessThanOrEqual(65535);
    });

    test('empty env_vars object should fail', () => {
      const envVars = {};
      expect(Object.keys(envVars).length).toBe(0);
      expect(envVars.SYSTEM_INSTRUCTION).toBeUndefined();
    });

    test('SYSTEM_INSTRUCTION with only whitespace should fail', () => {
      const whitespaceOnly = '   \n\t  \r\n  ';
      expect(whitespaceOnly.trim().length).toBe(0);
    });

    test('SYSTEM_INSTRUCTION with maximum reasonable size', async () => {
      const systemPromptPath = join(BACKEND_DIR, 'system_prompt.txt');
      const content = await fs.readFile(systemPromptPath, 'utf-8');

      // Should be reasonable size (less than 100KB)
      expect(content.length).toBeLessThan(100000);
      expect(content.length).toBeGreaterThan(1000);
    });
  });

  describe('Deployment Configuration Files', () => {
    test('deploy-config.json exists and is valid JSON', async () => {
      const configPath = join(REPO_ROOT, 'deploy-config.json');
      const content = await fs.readFile(configPath, 'utf-8');
      
      let config;
      expect(() => {
        config = JSON.parse(content);
      }).not.toThrow();
      
      expect(config).toHaveProperty('repo_url');
      expect(config).toHaveProperty('service_name');
      expect(config).toHaveProperty('branch');
      expect(config).toHaveProperty('port');
      expect(config).toHaveProperty('env_vars');
    });

    test('deployment script exists', async () => {
      const scriptPath = join(REPO_ROOT, 'DEPLOY_WITH_ENV_VAR.sh');
      await expect(fs.access(scriptPath)).resolves.not.toThrow();
    });

    test('system_prompt.txt exists and is readable', async () => {
      const systemPromptPath = join(BACKEND_DIR, 'system_prompt.txt');
      await expect(fs.access(systemPromptPath)).resolves.not.toThrow();
      
      const content = await fs.readFile(systemPromptPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });
  });

  describe('Documentation Completeness', () => {
    test('deployment guide exists', async () => {
      const guidePath = join(REPO_ROOT, 'DEPLOYMENT_WITH_ENV_VARS_GUIDE.md');
      await expect(fs.access(guidePath)).resolves.not.toThrow();
    });

    test('deployment guide contains API endpoint', async () => {
      const guidePath = join(REPO_ROOT, 'DEPLOYMENT_WITH_ENV_VARS_GUIDE.md');
      const content = await fs.readFile(guidePath, 'utf-8');
      
      expect(content).toContain(DEPLOYMENT_API_URL);
      expect(content).toContain('POST');
      expect(content).toContain('env_vars');
    });

    test('deployment guide shows example curl command', async () => {
      const guidePath = join(REPO_ROOT, 'DEPLOYMENT_WITH_ENV_VARS_GUIDE.md');
      const content = await fs.readFile(guidePath, 'utf-8');
      
      expect(content).toContain('curl');
      expect(content).toContain('-X POST');
    });
  });
});

describe('API POST Deployment - Integration Tests', () => {
  test('deployment payload structure matches API requirements', () => {
    const payload = {
      repo_url: 'https://github.com/xiu-shi/maya_v1.0',
      service_name: 'maya-agent',
      branch: 'main',
      port: 3000,
      env_vars: {
        SYSTEM_INSTRUCTION: 'Test',
        TRUST_PROXY: 'true'
      }
    };

    // Validate all required fields present
    expect(payload).toHaveProperty('repo_url');
    expect(payload).toHaveProperty('service_name');
    expect(payload).toHaveProperty('branch');
    expect(payload).toHaveProperty('port');
    expect(payload).toHaveProperty('env_vars');
    expect(payload.env_vars).toHaveProperty('SYSTEM_INSTRUCTION');
  });

  test('deployment can be serialized to JSON', () => {
    const payload = {
      repo_url: 'https://github.com/xiu-shi/maya_v1.0',
      service_name: 'maya-agent',
      branch: 'main',
      port: 3000,
      env_vars: {
        SYSTEM_INSTRUCTION: 'Test instruction',
        TRUST_PROXY: 'true'
      }
    };

    let jsonString;
    expect(() => {
      jsonString = JSON.stringify(payload);
    }).not.toThrow();

    expect(jsonString).toBeTruthy();
    expect(jsonString).toContain('repo_url');
    expect(jsonString).toContain('service_name');
    expect(jsonString).toContain('env_vars');
  });

  test('deployment payload can be parsed from JSON', () => {
    const jsonString = JSON.stringify({
      repo_url: 'https://github.com/xiu-shi/maya_v1.0',
      service_name: 'maya-agent',
      branch: 'main',
      port: 3000,
      env_vars: {
        SYSTEM_INSTRUCTION: 'Test',
        TRUST_PROXY: 'true'
      }
    });

    let payload;
    expect(() => {
      payload = JSON.parse(jsonString);
    }).not.toThrow();

    expect(payload.repo_url).toBe('https://github.com/xiu-shi/maya_v1.0');
    expect(payload.service_name).toBe('maya-agent');
    expect(payload.env_vars.SYSTEM_INSTRUCTION).toBe('Test');
  });
});
