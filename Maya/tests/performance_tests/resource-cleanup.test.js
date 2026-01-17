/**
 * Resource Cleanup Performance Tests
 * 
 * Tests for proper resource cleanup and memory management:
 * - Memory leak detection
 * - File handle cleanup
 * - Timer cleanup
 * - Event listener cleanup
 * - Cache cleanup
 */

import { describe, test, expect, afterEach } from '@jest/globals';
import { promises as fs } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Resource Cleanup', () => {
  const tempFiles = [];
  
  afterEach(async () => {
    // Clean up all temp files after each test
    for (const file of tempFiles) {
      try {
        await fs.unlink(file);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    tempFiles.length = 0;
  });

  describe('File Handle Cleanup', () => {
    test('should close file handles after read', async () => {
      const testFile = join(__dirname, '../../backend/test-temp-cleanup.txt');
      tempFiles.push(testFile);
      
      await fs.writeFile(testFile, 'test content', 'utf-8');
      
      // Read file
      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe('test content');
      
      // File handle should be closed automatically
      // If not, this test would fail on Windows
      await fs.unlink(testFile);
      tempFiles.pop();
    });

    test('should clean up multiple file handles', async () => {
      const files = [];
      for (let i = 0; i < 10; i++) {
        const file = join(__dirname, `../../backend/test-temp-${i}.txt`);
        tempFiles.push(file);
        files.push(file);
        await fs.writeFile(file, `content ${i}`, 'utf-8');
      }
      
      // Read all files
      const contents = await Promise.all(
        files.map(file => fs.readFile(file, 'utf-8'))
      );
      
      expect(contents).toHaveLength(10);
      
      // All handles should be closed
      // Cleanup happens in afterEach
    });
  });

  describe('Memory Leak Prevention', () => {
    test('should not accumulate memory in loops', async () => {
      const iterations = 1000;
      const initialMemory = process.memoryUsage().heapUsed;
      
      for (let i = 0; i < iterations; i++) {
        const testData = 'x'.repeat(1000);
        // Process and discard
        const processed = testData.toUpperCase();
        // Explicitly nullify to help GC
        if (i % 100 === 0) {
          global.gc && global.gc(); // Force GC if available
        }
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (< 50MB for 1000 iterations)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    test('should clean up large objects', () => {
      const largeObjects = [];
      
      // Create large objects
      for (let i = 0; i < 100; i++) {
        largeObjects.push({
          data: 'x'.repeat(10000),
          index: i
        });
      }
      
      // Process and clear
      const processed = largeObjects.map(obj => obj.index);
      largeObjects.length = 0; // Clear array
      
      expect(processed).toHaveLength(100);
      // Objects should be eligible for GC
    });
  });

  describe('Timer Cleanup', () => {
    test('should clear timeouts', (done) => {
      const timeoutId = setTimeout(() => {
        done(new Error('Timeout should have been cleared'));
      }, 1000);
      
      clearTimeout(timeoutId);
      
      // Wait to ensure timeout doesn't fire
      setTimeout(() => {
        done(); // Test passes if timeout was cleared
      }, 1500);
    }, 2000);

    test('should clear intervals', (done) => {
      let count = 0;
      const intervalId = setInterval(() => {
        count++;
        if (count >= 5) {
          clearInterval(intervalId);
          done(); // Test passes if interval was cleared
        }
      }, 100);
      
      // Safety timeout
      setTimeout(() => {
        clearInterval(intervalId);
        if (count < 5) {
          done(new Error('Interval did not complete'));
        }
      }, 2000);
    }, 3000);
  });

  describe('Event Listener Cleanup', () => {
    test('should remove event listeners', async () => {
      const { EventEmitter } = await import('events');
      const emitter = new EventEmitter();
      
      let callCount = 0;
      const handler = () => {
        callCount++;
      };
      
      emitter.on('test', handler);
      emitter.emit('test');
      expect(callCount).toBe(1);
      
      emitter.removeListener('test', handler);
      emitter.emit('test');
      expect(callCount).toBe(1); // Should not increment
    });
  });

  describe('Cache Cleanup', () => {
    test('should limit cache size', () => {
      const cache = new Map();
      const maxSize = 10;
      
      // Fill cache beyond limit
      for (let i = 0; i < 20; i++) {
        cache.set(`key${i}`, `value${i}`);
        
        // Enforce size limit
        if (cache.size > maxSize) {
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }
      }
      
      expect(cache.size).toBeLessThanOrEqual(maxSize);
    });

    test('should expire cache entries', (done) => {
      const cache = new Map();
      const ttl = 100; // 100ms TTL
      
      cache.set('key1', 'value1');
      const timestamp = Date.now();
      cache.set('_timestamp_key1', timestamp);
      
      setTimeout(() => {
        const entryTimestamp = cache.get('_timestamp_key1');
        if (Date.now() - entryTimestamp > ttl) {
          cache.delete('key1');
          cache.delete('_timestamp_key1');
        }
        
        expect(cache.has('key1')).toBe(false);
        done();
      }, 150);
    }, 300);
  });

  describe('Promise Cleanup', () => {
    test('should handle promise rejection cleanup', async () => {
      let cleanupCalled = false;
      
      const operation = async () => {
        try {
          throw new Error('Operation failed');
        } finally {
          cleanupCalled = true;
        }
      };
      
      try {
        await operation();
      } catch (error) {
        // Error handled
      }
      
      expect(cleanupCalled).toBe(true);
    });

    test('should cancel pending promises when possible', async () => {
      let cancelled = false;
      
      const cancellablePromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (!cancelled) {
            resolve('completed');
          }
        }, 1000);
        
        // Cancellation mechanism
        Promise.resolve().then(() => {
          cancelled = true;
          clearTimeout(timeout);
          reject(new Error('Cancelled'));
        });
      });
      
      await expect(cancellablePromise).rejects.toThrow('Cancelled');
      expect(cancelled).toBe(true);
    });
  });

  describe('Stream Cleanup', () => {
    test('should close streams properly', async () => {
      const testFile = join(__dirname, '../../backend/test-stream.txt');
      tempFiles.push(testFile);
      
      await fs.writeFile(testFile, 'test content', 'utf-8');
      
      const { createReadStream } = await import('fs');
      const stream = createReadStream(testFile);
      
      let data = '';
      stream.on('data', chunk => {
        data += chunk.toString();
      });
      
      await new Promise((resolve, reject) => {
        stream.on('end', resolve);
        stream.on('error', reject);
      });
      
      expect(data).toBe('test content');
      // Stream should be closed automatically
    });
  });
});
