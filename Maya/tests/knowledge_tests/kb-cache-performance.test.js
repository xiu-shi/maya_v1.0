/**
 * KB Cache Performance Tests
 * 
 * Tests to ensure cache performance meets requirements
 * Goal: Fast responses while maintaining accuracy
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { getKBCache, refreshKBCache, getKBCacheStats, getKBCacheMemoryUsage } from '../../backend/utils/memory_cache/kb-cache.js';

describe('KB Cache Performance', () => {
  beforeEach(async () => {
    // Ensure clean cache state
    const { default: kbCacheManager } = await import('../../backend/utils/memory_cache/kb-cache.js');
    kbCacheManager.cleanup();
  });

  describe('Cache Hit Performance', () => {
    test('cache hit is fast (< 10ms)', async () => {
      // First load (miss)
      const start1 = Date.now();
      await getKBCache();
      const loadTime = Date.now() - start1;
      
      // Second load (hit) - should be much faster
      const start2 = Date.now();
      await getKBCache();
      const hitTime = Date.now() - start2;
      
      // Cache hit should be very fast
      expect(hitTime).toBeLessThan(10);
      
      // Hit should be faster than initial load
      expect(hitTime).toBeLessThan(loadTime);
    });

    test('cache hit rate improves with multiple accesses', async () => {
      // Multiple accesses
      await getKBCache(); // Miss
      await getKBCache(); // Hit
      await getKBCache(); // Hit
      await getKBCache(); // Hit
      
      const stats = getKBCacheStats();
      const hitRate = parseFloat(stats.statistics.hitRate);
      
      // Should have good hit rate after multiple accesses
      expect(hitRate).toBeGreaterThan(50);
    });
  });

  describe('Cache Refresh Performance', () => {
    test('cache refresh completes in reasonable time (< 100ms)', async () => {
      const start = Date.now();
      await refreshKBCache();
      const refreshTime = Date.now() - start;
      
      // Refresh should complete quickly
      expect(refreshTime).toBeLessThan(100);
    });
  });

  describe('Memory Efficiency', () => {
    test('cache uses reasonable memory (< 1MB)', async () => {
      await getKBCache();
      
      const memory = getKBCacheMemoryUsage();
      
      if (memory.cached) {
        expect(memory.totalMemory).toBeLessThan(1048576); // 1MB
      }
    });

    test('cache memory usage is tracked', async () => {
      await getKBCache();
      
      const memory = getKBCacheMemoryUsage();
      
      expect(memory).toHaveProperty('totalMemory');
      expect(memory).toHaveProperty('cacheSize');
      expect(memory).toHaveProperty('overhead');
    });
  });
});
