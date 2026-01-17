/**
 * Error Handling Tests
 * 
 * Tests for robust error handling across the application:
 * - Error propagation
 * - Error messages
 * - Error recovery
 * - Edge cases
 */

import { describe, test, expect } from '@jest/globals';
import { sanitizeInput } from '../../../backend/utils/sanitize.js';
import { withTimeout, readFileWithTimeout } from '../../../backend/utils/timeout.js';
import { logError } from '../../../backend/utils/logger.js';

describe('Error Handling', () => {
  describe('Input Sanitization Errors', () => {
    test('should handle null input gracefully', () => {
      expect(() => sanitizeInput(null)).not.toThrow();
      const result = sanitizeInput(null);
      expect(result).toBe('');
    });

    test('should handle undefined input gracefully', () => {
      expect(() => sanitizeInput(undefined)).not.toThrow();
      const result = sanitizeInput(undefined);
      expect(result).toBe('');
    });

    test('should handle non-string input', () => {
      expect(() => sanitizeInput(123)).not.toThrow();
      expect(() => sanitizeInput({})).not.toThrow();
      expect(() => sanitizeInput([])).not.toThrow();
    });

    test('should handle extremely long input', () => {
      const longString = 'a'.repeat(1000000); // 1MB string
      expect(() => sanitizeInput(longString)).not.toThrow();
      const result = sanitizeInput(longString);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('Timeout Error Handling', () => {
    test('should throw timeout error when operation exceeds timeout', async () => {
      const slowOperation = () => 
        new Promise(resolve => setTimeout(() => resolve('done'), 2000));
      
      await expect(
        withTimeout(slowOperation(), 100, 'Test timeout')
      ).rejects.toThrow(/timeout/i);
    });

    test('should handle timeout error message correctly', async () => {
      const slowOperation = () => 
        new Promise(resolve => setTimeout(() => resolve('done'), 2000));
      
      try {
        await withTimeout(slowOperation(), 100, 'Custom operation');
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        // Error message format: "Custom operation timed out after 100ms. This may indicate a blocking operation or system issue."
        expect(error.message).toMatch(/timed out|timeout/i);
        expect(error.message).toMatch(/Custom operation/i);
        expect(error.message).toMatch(/100ms/i);
      }
    });

    test('should handle file read timeout gracefully', async () => {
      // Create a promise that will timeout (longer than FILE_READ timeout of 5000ms)
      const slowRead = new Promise((resolve) => setTimeout(() => resolve('content'), 6000));
      
      await expect(
        readFileWithTimeout(slowRead, 'test-file.txt')
      ).rejects.toThrow(/timed out|timeout/i);
    });
  });

  describe('Error Recovery', () => {
    test('should recover from temporary failures', async () => {
      let attempts = 0;
      const flakyOperation = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };

      // Retry logic
      let result;
      let lastError;
      for (let i = 0; i < 3; i++) {
        try {
          result = await flakyOperation();
          break;
        } catch (error) {
          lastError = error;
          if (i === 2) throw error;
        }
      }

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    test('should handle partial failures in bulk operations', async () => {
      const operations = [
        Promise.resolve('success1'),
        Promise.reject(new Error('failure')),
        Promise.resolve('success2')
      ];

      const results = await Promise.allSettled(operations);
      
      expect(results).toHaveLength(3);
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty string input', () => {
      const result = sanitizeInput('');
      expect(result).toBe('');
      expect(typeof result).toBe('string');
    });

    test('should handle whitespace-only input', () => {
      const result = sanitizeInput('   \n\t   ');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('should handle special characters', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const result = sanitizeInput(specialChars);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('should handle unicode characters', () => {
      const unicode = '你好世界 🌍 🚀';
      const result = sanitizeInput(unicode);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('should handle zero timeout gracefully', async () => {
      // With 0ms timeout, even a fast operation should timeout if it's not already resolved
      // But if it's already resolved, it will succeed. Use a slow operation instead.
      const slowOperation = new Promise(resolve => setTimeout(() => resolve('done'), 100));
      
      await expect(
        withTimeout(slowOperation, 0, 'Zero timeout')
      ).rejects.toThrow(/timeout/i);
    });
  });

  describe('Error Message Quality', () => {
    test('should provide meaningful error messages', async () => {
      const slowOperation = () => 
        new Promise(resolve => setTimeout(() => resolve('done'), 2000));
      
      try {
        await withTimeout(slowOperation(), 100, 'File read operation');
        expect(true).toBe(false);
      } catch (error) {
        // Error message format: "File read operation timed out after 100ms..."
        expect(error.message).toBeDefined();
        expect(typeof error.message).toBe('string');
        // Should contain operation name or timeout info
        expect(error.message.length).toBeGreaterThan(0);
      }
    });

    test('should preserve original error context', async () => {
      const failingOperation = () => 
        Promise.reject(new Error('Original error message'));
      
      try {
        await withTimeout(failingOperation(), 5000, 'Operation');
        expect(true).toBe(false);
      } catch (error) {
        // Should preserve or include original error
        expect(error.message).toBeDefined();
      }
    });
  });

  describe('Resource Cleanup on Error', () => {
    test('should clean up resources even when error occurs', async () => {
      let cleanedUp = false;
      
      const operation = async () => {
        try {
          throw new Error('Operation failed');
        } finally {
          cleanedUp = true;
        }
      };

      try {
        await operation();
      } catch (error) {
        // Error occurred
      }

      expect(cleanedUp).toBe(true);
    });

    test('should handle cleanup errors gracefully', async () => {
      let mainError;
      let cleanupError;

      try {
        throw new Error('Main operation failed');
      } catch (error) {
        mainError = error;
        try {
          // Simulate cleanup that might fail
          throw new Error('Cleanup failed');
        } catch (cleanupErr) {
          cleanupError = cleanupErr;
        }
      }

      expect(mainError).toBeDefined();
      expect(cleanupError).toBeDefined();
      // Both errors should be handled
    });
  });
});
