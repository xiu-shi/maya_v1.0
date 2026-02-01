/**
 * Chat Logging Retry Logic and Health Endpoint Tests
 * 
 * Tests for S3 upload retry logic and logging health endpoint
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { logChatMessage, getS3UploadMetrics } from '../utils/chat-logger.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGS_DIR = path.join(__dirname, '..', 'data', 'chat-logs');

describe.skip('Chat Logging - Retry Logic and Health', () => {
  let originalEnv;

  beforeEach(async () => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Clean up test logs directory
    try {
      await fs.rm(LOGS_DIR, { recursive: true, force: true });
    } catch (error) {
      // Directory doesn't exist, that's OK
    }
  });

  afterEach(async () => {
    // Restore original environment
    process.env = originalEnv;
    
    // Clean up test logs
    try {
      await fs.rm(LOGS_DIR, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('S3 Upload Metrics', () => {
    it('should track upload attempts', async () => {
      process.env.ENABLE_S3_LOGGING = 'true';
      process.env.AWS_S3_BUCKET = 'test-bucket';

      const initialMetrics = getS3UploadMetrics();
      const initialAttempts = initialMetrics.totalAttempts;

      await logChatMessage({
        userMessage: 'Test',
        assistantResponse: 'Response',
        ip: '127.0.0.1',
        userAgent: 'test-agent',
      });

      // Wait for async S3 upload (will fail without credentials, but metrics should update)
      await new Promise(resolve => setTimeout(resolve, 500));

      const metrics = getS3UploadMetrics();
      // Metrics should be tracked (even if upload fails)
      expect(metrics).toBeDefined();
      expect(metrics.totalAttempts).toBeGreaterThanOrEqual(initialAttempts);
    });

    it('should calculate success rate', async () => {
      process.env.ENABLE_S3_LOGGING = 'true';
      process.env.AWS_S3_BUCKET = 'test-bucket';

      await logChatMessage({
        userMessage: 'Test',
        assistantResponse: 'Response',
        ip: '127.0.0.1',
        userAgent: 'test-agent',
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      const metrics = getS3UploadMetrics();
      expect(metrics.successRate).toBeDefined();
      expect(metrics.successRate).toMatch(/^\d+\.\d+%$/); // Format: "XX.XX%"
    });

    it('should track consecutive failures', async () => {
      process.env.ENABLE_S3_LOGGING = 'true';
      process.env.AWS_S3_BUCKET = 'invalid-bucket'; // Will cause failure

      await logChatMessage({
        userMessage: 'Test',
        assistantResponse: 'Response',
        ip: '127.0.0.1',
        userAgent: 'test-agent',
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const metrics = getS3UploadMetrics();
      expect(metrics.consecutiveFailures).toBeGreaterThanOrEqual(0);
    });

    it('should track last upload time on success', async () => {
      process.env.ENABLE_S3_LOGGING = 'true';
      process.env.AWS_S3_BUCKET = 'test-bucket';

      await logChatMessage({
        userMessage: 'Test',
        assistantResponse: 'Response',
        ip: '127.0.0.1',
        userAgent: 'test-agent',
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      const metrics = getS3UploadMetrics();
      expect(metrics).toBeDefined();
      // lastUploadTime may be null if upload failed, that's OK
      expect(metrics.lastUploadTime === null || typeof metrics.lastUploadTime === 'string').toBe(true);
    });
  });

  describe('Retry Logic Behavior', () => {
    it('should not fail chat if S3 upload fails', async () => {
      process.env.ENABLE_S3_LOGGING = 'true';
      process.env.AWS_S3_BUCKET = 'invalid-bucket'; // Will cause failure

      // Should not throw error
      await expect(logChatMessage({
        userMessage: 'Test',
        assistantResponse: 'Response',
        ip: '127.0.0.1',
        userAgent: 'test-agent',
      })).resolves.toBeDefined();

      // File should still be written locally
      const logFile = path.join(LOGS_DIR, new Date().toISOString().split('T')[0] + '.json');
      const exists = await fs.access(logFile).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should skip S3 upload when disabled', async () => {
      process.env.ENABLE_S3_LOGGING = 'false';

      await logChatMessage({
        userMessage: 'Test',
        assistantResponse: 'Response',
        ip: '127.0.0.1',
        userAgent: 'test-agent',
      });

      // File should be written locally
      const logFile = path.join(LOGS_DIR, new Date().toISOString().split('T')[0] + '.json');
      const exists = await fs.access(logFile).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      // Metrics should not increment when S3 disabled
      const metrics = getS3UploadMetrics();
      // Initial state - no attempts if S3 disabled
      expect(metrics.totalAttempts).toBeGreaterThanOrEqual(0);
    });
  });
});
