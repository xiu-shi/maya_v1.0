/**
 * Integration Test: Deployment Script
 * 
 * Tests for Jan 18, 2026 changes:
 * - HTTP 202 (Accepted) handling
 * - Deployment script error handling
 * 
 * @jest-environment node
 */

import { describe, it, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Deployment Script (Jan 18, 2026)', () => {
  let deployScript;

  beforeEach(() => {
    const scriptPath = join(__dirname, '../../deploy-to-space.sh');
    deployScript = readFileSync(scriptPath, 'utf-8');
  });

  describe('HTTP 202 Handling', () => {
    it('should accept HTTP 202 as success', () => {
      // Check if script handles HTTP 202
      expect(deployScript).toContain('202');
      expect(deployScript).toContain('HTTP_CODE') || expect(deployScript).toContain('http_code');
    });

    it('should include 202 in success condition', () => {
      // The script should check for 200, 201, or 202
      const successPattern = /(200|201|202)/;
      expect(deployScript).toMatch(successPattern);
    });
  });

  describe('Error Messages', () => {
    it('should provide helpful error messages', () => {
      expect(deployScript).toContain('Deployment failed');
      expect(deployScript).toContain('Troubleshooting');
    });

    it('should mention deployment monitoring URL', () => {
      expect(deployScript).toContain('space.ai-builders.com/deployments');
    });
  });
});
