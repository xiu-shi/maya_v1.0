/**
 * KB Loader Tests
 * 
 * Tests to prevent regex catastrophic backtracking and blocking issues
 * Updated with timeout handling to prevent hangs (Issue #10, #11)
 * 
 * Critical: These tests ensure KB loading completes quickly and doesn't hang
 */

import { describe, test, expect } from '@jest/globals';
import { loadKBContext, loadDocument } from '../../backend/utils/kb-loader.js';
import { TIMEOUTS } from '../../backend/utils/timeout.js';

describe('KB Loader - Performance & Reliability', () => {
  test('KB loading completes within timeout (< 30 seconds)', async () => {
    const startTime = Date.now();
    const context = await loadKBContext();
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(TIMEOUTS.KB_LOAD);
    expect(typeof context).toBe('string');
  }, TIMEOUTS.KB_LOAD + 5000); // Jest timeout slightly longer than operation timeout

  test('KB loading handles complex documents without hanging', async () => {
    // This test ensures KB loading completes quickly even with complex documents
    // Previously, regex backtracking caused indefinite hangs
    const startTime = Date.now();
    const context = await loadKBContext();
    const duration = Date.now() - startTime;
    
    // Should complete in < 5 seconds (was hanging indefinitely before)
    expect(duration).toBeLessThan(5000);
    expect(typeof context).toBe('string');
  }, TIMEOUTS.KB_LOAD + 2000);

  test('KB loading uses async operations (not blocking)', async () => {
    // Verify that KB loading doesn't block the event loop
    const startTime = Date.now();
    
    // Start KB load
    const kbPromise = loadKBContext();
    
    // Do other async work while KB loads
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // KB should still be loading (not blocking)
    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(200); // Other work should complete quickly
    
    // Now wait for KB to complete
    const context = await kbPromise;
    expect(typeof context).toBe('string');
  }, TIMEOUTS.KB_LOAD + 2000);

  test('Multiple KB loads can run concurrently', async () => {
    const startTime = Date.now();
    
    // Load KB multiple times concurrently
    const [context1, context2, context3] = await Promise.all([
      loadKBContext(),
      loadKBContext(),
      loadKBContext()
    ]);
    
    const duration = Date.now() - startTime;
    
    // Concurrent loads should be faster than sequential
    expect(duration).toBeLessThan(TIMEOUTS.KB_LOAD * 2);
    expect(context1).toBe(context2); // Should be cached
    expect(context2).toBe(context3);
  }, TIMEOUTS.KB_LOAD * 3);

  test('loadDocument handles missing files gracefully', async () => {
    const result = await loadDocument('non-existent-file.md');
    expect(result).toBeNull();
  }, TIMEOUTS.FILE_READ + 1000);
});
