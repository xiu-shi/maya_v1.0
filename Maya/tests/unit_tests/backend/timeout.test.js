/**
 * Timeout Utility Tests
 * 
 * Tests for async operation timeout handling to prevent hangs (Issue #10, #11)
 */

import { describe, test, expect, jest } from '@jest/globals';
import { 
  withTimeout, 
  readFileWithTimeout, 
  writeFileWithTimeout,
  importWithTimeout,
  bulkOperationWithTimeout,
  retryWithTimeout,
  TIMEOUTS
} from '../../../backend/utils/timeout.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEST_DIR = join(__dirname, '../../../backend');

describe('Timeout Utility', () => {
  describe('withTimeout', () => {
    test('should resolve if operation completes before timeout', async () => {
      const fastOperation = Promise.resolve('success');
      const result = await withTimeout(fastOperation, 1000, 'Fast operation');
      expect(result).toBe('success');
    });

    test('should reject if operation times out', async () => {
      const slowOperation = new Promise(resolve => {
        setTimeout(() => resolve('too late'), 2000);
      });
      
      await expect(
        withTimeout(slowOperation, 100, 'Slow operation')
      ).rejects.toThrow('timed out');
    });

    test('should propagate operation errors', async () => {
      const failingOperation = Promise.reject(new Error('Operation failed'));
      
      await expect(
        withTimeout(failingOperation, 1000, 'Failing operation')
      ).rejects.toThrow('Operation failed');
    });
  });

  describe('readFileWithTimeout', () => {
    test('should read file successfully within timeout', async () => {
      const testFile = join(TEST_DIR, 'package.json');
      const result = await readFileWithTimeout(
        fs.readFile(testFile, 'utf-8'),
        testFile
      );
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    test('should timeout on very slow file read', async () => {
      // Create a promise that will never resolve
      const slowRead = new Promise(() => {});
      
      await expect(
        readFileWithTimeout(slowRead, 'slow-file.txt')
      ).rejects.toThrow('timed out');
    });
  });

  describe('writeFileWithTimeout', () => {
    test('should write file successfully within timeout', async () => {
      const testFile = join(TEST_DIR, 'test-write-timeout.tmp');
      const testContent = 'test content';
      
      try {
        await writeFileWithTimeout(
          fs.writeFile(testFile, testContent, 'utf-8'),
          testFile
        );
        
        const readBack = await fs.readFile(testFile, 'utf-8');
        expect(readBack).toBe(testContent);
      } finally {
        // Cleanup
        try {
          await fs.unlink(testFile);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    });

    test('should timeout on very slow file write', async () => {
      const slowWrite = new Promise(() => {});
      
      await expect(
        writeFileWithTimeout(slowWrite, 'slow-write.txt')
      ).rejects.toThrow('timed out');
    });
  });

  describe('importWithTimeout', () => {
    test('should import module successfully within timeout', async () => {
      const result = await importWithTimeout(
        import('../../../backend/utils/logger.js'),
        'logger.js'
      );
      expect(result).toBeTruthy();
      expect(result.logInfo).toBeDefined();
    });

    test('should timeout on slow module import', async () => {
      const slowImport = new Promise(() => {});
      
      await expect(
        importWithTimeout(slowImport, 'slow-module.js')
      ).rejects.toThrow('timed out');
    }, 15000); // Increase timeout for this test
  });

  describe('bulkOperationWithTimeout', () => {
    test('should execute multiple operations in parallel with timeout', async () => {
      const operations = [
        Promise.resolve('result1'),
        Promise.resolve('result2'),
        Promise.resolve('result3')
      ];
      
      const results = await bulkOperationWithTimeout(
        operations,
        1000,
        'Bulk test'
      );
      
      expect(results).toEqual(['result1', 'result2', 'result3']);
    });

    test('should fail if any operation times out', async () => {
      const operations = [
        Promise.resolve('result1'),
        new Promise(() => {}), // Never resolves
        Promise.resolve('result3')
      ];
      
      await expect(
        bulkOperationWithTimeout(operations, 100, 'Bulk timeout test')
      ).rejects.toThrow('timed out');
    });

    test('should handle mixed success and failure', async () => {
      const operations = [
        Promise.resolve('success'),
        Promise.reject(new Error('Failed')),
        Promise.resolve('success2')
      ];
      
      await expect(
        bulkOperationWithTimeout(operations, 1000, 'Mixed test')
      ).rejects.toThrow('Failed');
    });
  });

  describe('retryWithTimeout', () => {
    test('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await retryWithTimeout(operation, 3, 1000);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    test('should retry on failure and eventually succeed', async () => {
      let attempt = 0;
      const operation = jest.fn().mockImplementation(() => {
        attempt++;
        if (attempt < 3) {
          return Promise.reject(new Error('Failed'));
        }
        return Promise.resolve('success');
      });
      
      const result = await retryWithTimeout(operation, 3, 1000);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    test('should fail after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Always fails'));
      
      await expect(
        retryWithTimeout(operation, 3, 100)
      ).rejects.toThrow('Always fails');
      
      expect(operation).toHaveBeenCalledTimes(3);
    });
  });

  describe('TIMEOUTS constants', () => {
    test('should have all required timeout values', () => {
      expect(TIMEOUTS.KB_LOAD).toBeGreaterThan(0);
      expect(TIMEOUTS.KB_REFRESH).toBeGreaterThan(0);
      expect(TIMEOUTS.MCP_CONNECT).toBeGreaterThan(0);
      expect(TIMEOUTS.FILE_READ).toBeGreaterThan(0);
      expect(TIMEOUTS.FILE_WRITE).toBeGreaterThan(0);
      expect(TIMEOUTS.MODULE_IMPORT).toBeGreaterThan(0);
      expect(TIMEOUTS.BULK_OPERATIONS).toBeGreaterThan(0);
    });

    test('should have reasonable timeout values', () => {
      expect(TIMEOUTS.FILE_READ).toBeLessThan(TIMEOUTS.KB_LOAD);
      expect(TIMEOUTS.MCP_CONNECT).toBeLessThan(TIMEOUTS.KB_LOAD);
      expect(TIMEOUTS.BULK_OPERATIONS).toBeGreaterThan(TIMEOUTS.FILE_READ);
    });
  });
});
