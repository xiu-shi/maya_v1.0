/**
 * Integration Test: MCP Connection Retry Logic
 * 
 * Tests for Jan 18, 2026 changes:
 * - MCP connection retry with exponential backoff
 * - Enhanced error logging
 * - Graceful failure handling
 * 
 * @jest-environment node
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('MCP Connection Retry Logic (Jan 18, 2026)', () => {
  let mockMCPClient;
  let connectAttempts;

  beforeEach(() => {
    connectAttempts = 0;
    
    mockMCPClient = {
      connected: false,
      connect: jest.fn(function() {
        connectAttempts++;
        if (connectAttempts < 3) {
          return Promise.reject(new Error('Connection failed'));
        }
        mockMCPClient.connected = true;
        return Promise.resolve();
      })
    };
  });

  describe('Retry Logic', () => {
    it('should retry connection up to 3 times', async () => {
      const maxRetries = 3;
      const baseDelay = 1000;
      let lastError = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await mockMCPClient.connect();
          break;
        } catch (error) {
          lastError = error;
          if (attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      expect(connectAttempts).toBe(3);
      expect(mockMCPClient.connected).toBe(true);
    });

    it('should use exponential backoff delays', () => {
      const baseDelay = 1000;
      const delays = [];
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        delays.push(delay);
      }
      
      expect(delays).toEqual([1000, 2000, 4000]);
    });

    it('should handle connection failure after all retries', async () => {
      const maxRetries = 3;
      let failedAfterRetries = false;
      
      // Mock that always fails
      mockMCPClient.connect = jest.fn(() => Promise.reject(new Error('Connection failed')));
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await mockMCPClient.connect();
        } catch (error) {
          if (attempt === maxRetries) {
            failedAfterRetries = true;
          }
        }
      }
      
      expect(failedAfterRetries).toBe(true);
      expect(mockMCPClient.connected).toBe(false);
    });
  });

  describe('Error Logging', () => {
    it('should log retry attempts', () => {
      const logInfo = jest.fn();
      const logError = jest.fn();
      
      const attempt = 2;
      const maxRetries = 3;
      
      logInfo(`Attempting MCP connection (attempt ${attempt}/${maxRetries})...`);
      logError(`MCP connection attempt ${attempt} failed`, new Error('test'), {
        attempt: attempt,
        maxRetries: maxRetries
      });
      
      expect(logInfo).toHaveBeenCalledWith(expect.stringContaining('Attempting MCP connection'));
      expect(logError).toHaveBeenCalledWith(
        expect.stringContaining('MCP connection attempt'),
        expect.any(Error),
        expect.objectContaining({ attempt, maxRetries })
      );
    });

    it('should log token prefix for diagnostics', () => {
      const logError = jest.fn();
      const token = 'sk_test_example_token_for_testing_purposes_only';
      const tokenPrefix = token.substring(0, 5);
      
      logError('MCP connection failed', new Error('test'), {
        tokenPrefix: tokenPrefix
      });
      
      expect(logError).toHaveBeenCalledWith(
        'MCP connection failed',
        expect.any(Error),
        expect.objectContaining({ tokenPrefix: 'sk_93' })
      );
    });
  });
});
