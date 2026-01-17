/**
 * Bulk File Operations Tests
 * 
 * Tests for handling multiple file operations to prevent hangs (Issue #11)
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { promises as fs } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { bulkOperationWithTimeout, TIMEOUTS } from '../../backend/utils/timeout.js';
import { loadKBContext } from '../../backend/utils/kb-loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEST_DIR = join(__dirname, '../../backend');

describe('Bulk File Operations', () => {
  const testFiles = [];
  
  beforeAll(async () => {
    // Create test files
    for (let i = 0; i < 10; i++) {
      const testFile = join(TEST_DIR, `test-bulk-${i}.tmp`);
      await fs.writeFile(testFile, `Test content ${i}`, 'utf-8');
      testFiles.push(testFile);
    }
  });

  afterAll(async () => {
    // Cleanup test files
    for (const file of testFiles) {
      try {
        await fs.unlink(file);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  test('should read multiple files in parallel without hanging', async () => {
    const readPromises = testFiles.map(file => 
      fs.readFile(file, 'utf-8')
    );
    
    const startTime = Date.now();
    const results = await bulkOperationWithTimeout(
      readPromises,
      TIMEOUTS.FILE_READ,
      'Bulk file read test'
    );
    const duration = Date.now() - startTime;
    
    expect(results).toHaveLength(testFiles.length);
    expect(results[0]).toContain('Test content');
    expect(duration).toBeLessThan(TIMEOUTS.BULK_OPERATIONS);
  });

  test('should handle file read errors gracefully', async () => {
    const readPromises = [
      fs.readFile(testFiles[0], 'utf-8'),
      fs.readFile('non-existent-file.tmp', 'utf-8'), // This will fail
      fs.readFile(testFiles[2], 'utf-8')
    ];
    
    await expect(
      bulkOperationWithTimeout(readPromises, TIMEOUTS.FILE_READ, 'Error handling test')
    ).rejects.toThrow();
  });

  test('should timeout if operations take too long', async () => {
    const slowPromises = testFiles.map(() => 
      new Promise(resolve => setTimeout(() => resolve('slow'), 2000))
    );
    
    await expect(
      bulkOperationWithTimeout(slowPromises, 100, 'Timeout test')
    ).rejects.toThrow('timed out');
  });

  test('should load KB context without hanging (real-world test)', async () => {
    const startTime = Date.now();
    
    // This should complete within timeout
    const context = await loadKBContext();
    
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(TIMEOUTS.KB_LOAD);
    expect(typeof context).toBe('string');
  }, TIMEOUTS.KB_LOAD + 5000); // Increase Jest timeout for this test

  test('should handle concurrent KB loads without blocking', async () => {
    const loadPromises = [
      loadKBContext(),
      loadKBContext(),
      loadKBContext()
    ];
    
    const startTime = Date.now();
    const results = await Promise.all(loadPromises);
    const duration = Date.now() - startTime;
    
    expect(results).toHaveLength(3);
    expect(results[0]).toBe(results[1]); // Should be same (cached)
    expect(duration).toBeLessThan(TIMEOUTS.KB_LOAD * 2); // Should be faster than sequential
  }, TIMEOUTS.KB_LOAD * 3);
});

