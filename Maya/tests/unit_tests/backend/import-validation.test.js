/**
 * Import Validation Tests
 * 
 * Validates that all imports use correct function names and paths
 * Prevents issues like logWarn vs logWarning mismatches
 * 
 * Created: January 9, 2026, 17:00
 * Purpose: Prevent import errors that cause runtime failures
 */

import { describe, test, expect } from '@jest/globals';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BACKEND_DIR = join(__dirname, '../../../backend');

describe('Import Validation - Prevent Runtime Errors', () => {
  describe('Logger Function Names', () => {
    test('timeout.js imports logWarning (not logWarn)', async () => {
      const timeoutFile = join(BACKEND_DIR, 'utils/timeout.js');
      const content = await readFile(timeoutFile, 'utf-8');
      
      // Should import logWarning
      expect(content).toMatch(/import.*logWarning.*from.*logger/);
      
      // Should NOT import logWarn
      expect(content).not.toMatch(/import.*logWarn[^i].*from.*logger/);
      
      // Should use logWarning in code
      expect(content).toMatch(/logWarning\(/);
      
      // Should NOT use logWarn in code
      expect(content).not.toMatch(/logWarn\(/);
    });

    test('all files use correct logger function names', async () => {
      const loggerFile = join(BACKEND_DIR, 'utils/logger.js');
      const loggerContent = await readFile(loggerFile, 'utf-8');
      
      // Verify logger exports logWarning
      expect(loggerContent).toMatch(/export function logWarning/);
      
      // Should NOT export logWarn
      expect(loggerContent).not.toMatch(/export function logWarn[^i]/);
    });

    test('middleware files use correct logger imports', async () => {
      const auditFile = join(BACKEND_DIR, 'middleware/audit.js');
      const content = await readFile(auditFile, 'utf-8');
      
      // Should import logWarning
      expect(content).toMatch(/import.*logWarning.*from.*logger/);
      
      // Should use logWarning
      expect(content).toMatch(/logWarning\(/);
    });
  });

  describe('Module Path Resolution', () => {
    test('test files use correct relative paths for memory_cache', async () => {
      const testFiles = [
        join(__dirname, '../../memory_cache/kb-cache.test.js'),
        join(__dirname, '../../memory_cache/kb-cache-eval.test.js'),
        join(__dirname, '../../memory_cache/kb-cache-performance.test.js'),
      ];

      for (const testFile of testFiles) {
        try {
          const content = await readFile(testFile, 'utf-8');
          
          // Should use ../../backend (not ../../../backend)
          expect(content).toMatch(/from ['"]\.\.\/\.\.\/backend/);
          expect(content).not.toMatch(/from ['"]\.\.\/\.\.\/\.\.\/backend/);
        } catch (error) {
          // File might not exist, skip
          if (error.code !== 'ENOENT') throw error;
        }
      }
    });

    test('integration tests use correct relative paths', async () => {
      const testFiles = [
        join(__dirname, '../../integration/kb-accuracy.test.js'),
        join(__dirname, '../../integration/kb-response-accuracy.test.js'),
      ];

      for (const testFile of testFiles) {
        try {
          const content = await readFile(testFile, 'utf-8');
          
          // Should use ../../backend (not ../../../backend)
          expect(content).toMatch(/from ['"]\.\.\/\.\.\/backend/);
          expect(content).not.toMatch(/from ['"]\.\.\/\.\.\/\.\.\/backend/);
        } catch (error) {
          // File might not exist, skip
          if (error.code !== 'ENOENT') throw error;
        }
      }
    });
  });

  describe('Export Validation', () => {
    test('timeout.js exports all required functions', async () => {
      const timeoutFile = join(BACKEND_DIR, 'utils/timeout.js');
      const content = await readFile(timeoutFile, 'utf-8');
      
      // Required exports
      expect(content).toMatch(/export.*withTimeout/);
      expect(content).toMatch(/export.*readFileWithTimeout/);
      expect(content).toMatch(/export.*writeFileWithTimeout/);
      expect(content).toMatch(/export.*importWithTimeout/);
      expect(content).toMatch(/export.*bulkOperationWithTimeout/);
      expect(content).toMatch(/export.*retryWithTimeout/);
      expect(content).toMatch(/export.*TIMEOUTS/);
    });

    test('logger.js exports all required functions', async () => {
      const loggerFile = join(BACKEND_DIR, 'utils/logger.js');
      const content = await readFile(loggerFile, 'utf-8');
      
      // Required exports
      expect(content).toMatch(/export function logError/);
      expect(content).toMatch(/export function logWarning/);
      expect(content).toMatch(/export function logInfo/);
      expect(content).toMatch(/export function logDebug/);
    });
  });
});
