/**
 * KB Cache Evaluation Tests
 * 
 * Evaluates cache and memory performance over time to ensure improvements
 * Goal: Track KPIs and detect performance degradation
 * 
 * TRANSPARENCY & EXPLAINABILITY:
 * These evaluations ensure Maya can explain:
 * - How KB content is validated (checksum verification)
 * - How KB freshness is maintained (refresh tracking)
 * - How cache performance is monitored (8 KPIs)
 * - How system reliability is ensured (error tracking)
 * 
 * This provides trust and confidence when Maya represents Janet.
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { 
  getKBCache, 
  refreshKBCache,
  getKBCacheStats,
  validateKBCache,
  getKBCacheMemoryUsage,
  invalidateKBCache
} from '../../backend/utils/memory_cache/kb-cache.js';
import { getKBStats, checkKBUpdates } from '../../backend/utils/memory_cache/kb-monitor.js';
import { loadKBContext } from '../../backend/utils/kb-loader.js';

/**
 * Evaluation Metrics Storage
 * In production, this would be stored in a database or metrics service
 */
let evaluationMetrics = {
  timestamp: null,
  cacheHitRate: null,
  averageHitTime: null,
  averageMissTime: null,
  memoryEfficiency: null,
  cacheAccuracy: null,
  errorRate: null,
  kbFreshness: null,
  cacheValidityRate: null
};

/**
 * Performance Baseline
 * These are the minimum acceptable values
 */
const PERFORMANCE_BASELINE = {
  cacheHitRate: 80,           // Minimum 80% hit rate
  averageHitTime: 10,         // Maximum 10ms for cache hits
  averageMissTime: 100,       // Maximum 100ms for cache misses
  memoryEfficiency: 0.01,     // Maximum 1% of memory limit used
  cacheAccuracy: 100,         // 100% accuracy (checksum validation)
  errorRate: 0,               // 0% error rate
  kbFreshness: 3600,          // KB refreshed within 1 hour
  cacheValidityRate: 95       // Minimum 95% valid cache accesses
};

describe('KB Cache Evaluation - Performance KPIs', () => {
  let performanceHistory = [];
  
  beforeEach(() => {
    performanceHistory = [];
  });

  afterEach(() => {
    // Store evaluation results
    if (performanceHistory.length > 0) {
      evaluationMetrics = {
        ...evaluationMetrics,
        timestamp: new Date().toISOString()
      };
    }
  });

  describe('KPI 1: Cache Hit Rate', () => {
    test('cache hit rate meets baseline (≥ 80%)', async () => {
      // Clear cache
      invalidateKBCache();
      
      // Perform sequential cache operations to ensure hits
      // First operation - miss
      await getKBCache();
      
      // Subsequent operations - should be hits
      for (let i = 0; i < 9; i++) {
        await getKBCache();
      }
      
      // Get statistics
      const stats = getKBCacheStats();
      const hitRate = parseFloat(stats.statistics.hitRate);
      
      performanceHistory.push({
        metric: 'cacheHitRate',
        value: hitRate,
        baseline: PERFORMANCE_BASELINE.cacheHitRate,
        status: hitRate >= PERFORMANCE_BASELINE.cacheHitRate ? 'PASS' : 'FAIL'
      });
      
      evaluationMetrics.cacheHitRate = hitRate;
      
      // After 1 miss and 9 hits, hit rate should be 90%
      expect(hitRate).toBeGreaterThanOrEqual(PERFORMANCE_BASELINE.cacheHitRate);
    });

    test('cache hit rate improves with usage', async () => {
      invalidateKBCache();
      
      // Initial operations (mostly misses)
      for (let i = 0; i < 5; i++) {
        await getKBCache();
      }
      
      const stats1 = getKBCacheStats();
      const hitRate1 = parseFloat(stats1.statistics.hitRate);
      
      // More operations (should have more hits)
      for (let i = 0; i < 10; i++) {
        await getKBCache();
      }
      
      const stats2 = getKBCacheStats();
      const hitRate2 = parseFloat(stats2.statistics.hitRate);
      
      // Hit rate should improve or stay the same
      expect(hitRate2).toBeGreaterThanOrEqual(hitRate1);
    });
  });

  describe('KPI 2: Cache Performance', () => {
    test('cache hit time meets baseline (≤ 10ms)', async () => {
      // Ensure cache is loaded
      await getKBCache();
      
      const hitTimes = [];
      for (let i = 0; i < 10; i++) {
        const start = Date.now();
        await getKBCache();
        const duration = Date.now() - start;
        hitTimes.push(duration);
      }
      
      const averageHitTime = hitTimes.reduce((a, b) => a + b, 0) / hitTimes.length;
      
      performanceHistory.push({
        metric: 'averageHitTime',
        value: averageHitTime,
        baseline: PERFORMANCE_BASELINE.averageHitTime,
        status: averageHitTime <= PERFORMANCE_BASELINE.averageHitTime ? 'PASS' : 'FAIL'
      });
      
      evaluationMetrics.averageHitTime = averageHitTime;
      
      expect(averageHitTime).toBeLessThanOrEqual(PERFORMANCE_BASELINE.averageHitTime);
    });

    test('cache miss time meets baseline (≤ 100ms)', async () => {
      invalidateKBCache();
      
      const missTimes = [];
      for (let i = 0; i < 3; i++) {
        invalidateKBCache();
        const start = Date.now();
        await getKBCache();
        const duration = Date.now() - start;
        missTimes.push(duration);
      }
      
      const averageMissTime = missTimes.reduce((a, b) => a + b, 0) / missTimes.length;
      
      performanceHistory.push({
        metric: 'averageMissTime',
        value: averageMissTime,
        baseline: PERFORMANCE_BASELINE.averageMissTime,
        status: averageMissTime <= PERFORMANCE_BASELINE.averageMissTime ? 'PASS' : 'FAIL'
      });
      
      evaluationMetrics.averageMissTime = averageMissTime;
      
      expect(averageMissTime).toBeLessThanOrEqual(PERFORMANCE_BASELINE.averageMissTime);
    });
  });

  describe('KPI 3: Memory Efficiency', () => {
    test('memory usage meets baseline (≤ 1% of limit)', async () => {
      await getKBCache();
      
      const memoryUsage = getKBCacheMemoryUsage();
      const stats = getKBCacheStats();
      
      if (memoryUsage.cached && stats.config.maxSize) {
        const percentage = (memoryUsage.totalMemory / stats.config.maxSize);
        const percentagePercent = percentage * 100;
        
        performanceHistory.push({
          metric: 'memoryEfficiency',
          value: percentagePercent,
          baseline: PERFORMANCE_BASELINE.memoryEfficiency * 100,
          status: percentagePercent <= (PERFORMANCE_BASELINE.memoryEfficiency * 100) ? 'PASS' : 'FAIL'
        });
        
        evaluationMetrics.memoryEfficiency = percentagePercent;
        
        expect(percentage).toBeLessThanOrEqual(PERFORMANCE_BASELINE.memoryEfficiency);
      }
    });

    test('memory usage does not increase unexpectedly', async () => {
      await getKBCache();
      
      const memory1 = getKBCacheMemoryUsage();
      
      // Perform multiple operations
      for (let i = 0; i < 20; i++) {
        await getKBCache();
      }
      
      const memory2 = getKBCacheMemoryUsage();
      
      // Memory should not increase (cache is reused)
      if (memory1.cached && memory2.cached) {
        expect(memory2.totalMemory).toBeLessThanOrEqual(memory1.totalMemory * 1.1); // Allow 10% variance
      }
    });
  });

  describe('KPI 4: Cache Accuracy', () => {
    test('cache accuracy meets baseline (100%)', async () => {
      await getKBCache();
      
      const validation = validateKBCache();
      const accuracy = validation.valid ? 100 : 0;
      
      performanceHistory.push({
        metric: 'cacheAccuracy',
        value: accuracy,
        baseline: PERFORMANCE_BASELINE.cacheAccuracy,
        status: accuracy >= PERFORMANCE_BASELINE.cacheAccuracy ? 'PASS' : 'FAIL'
      });
      
      evaluationMetrics.cacheAccuracy = accuracy;
      
      expect(validation.valid).toBe(true);
    });

    test('cache maintains accuracy over multiple accesses', async () => {
      await getKBCache();
      
      let validCount = 0;
      const totalChecks = 10;
      
      for (let i = 0; i < totalChecks; i++) {
        await getKBCache();
        const validation = validateKBCache();
        if (validation.valid) validCount++;
      }
      
      const validityRate = (validCount / totalChecks) * 100;
      
      performanceHistory.push({
        metric: 'cacheValidityRate',
        value: validityRate,
        baseline: PERFORMANCE_BASELINE.cacheValidityRate,
        status: validityRate >= PERFORMANCE_BASELINE.cacheValidityRate ? 'PASS' : 'FAIL'
      });
      
      evaluationMetrics.cacheValidityRate = validityRate;
      
      expect(validityRate).toBeGreaterThanOrEqual(PERFORMANCE_BASELINE.cacheValidityRate);
    });
  });

  describe('KPI 5: Error Rate', () => {
    test('error rate meets baseline (0%)', async () => {
      const stats = getKBCacheStats();
      const totalOperations = stats.statistics.hits + stats.statistics.misses;
      const errorRate = totalOperations > 0 
        ? (stats.statistics.errors / totalOperations) * 100 
        : 0;
      
      performanceHistory.push({
        metric: 'errorRate',
        value: errorRate,
        baseline: PERFORMANCE_BASELINE.errorRate,
        status: errorRate <= PERFORMANCE_BASELINE.errorRate ? 'PASS' : 'FAIL'
      });
      
      evaluationMetrics.errorRate = errorRate;
      
      expect(errorRate).toBeLessThanOrEqual(PERFORMANCE_BASELINE.errorRate);
    });
  });

  describe('KPI 6: KB Freshness', () => {
    test('KB freshness meets baseline (refreshed within 1 hour)', async () => {
      // Ensure KB is loaded
      await getKBCache();
      
      // Refresh to ensure we have a recent timestamp
      await refreshKBCache();
      
      const stats = getKBStats();
      const cacheStats = getKBCacheStats();
      
      // Calculate freshness from cache age
      const freshness = cacheStats.cache ? cacheStats.cache.age : 0;
      
      performanceHistory.push({
        metric: 'kbFreshness',
        value: freshness,
        baseline: PERFORMANCE_BASELINE.kbFreshness,
        status: freshness <= PERFORMANCE_BASELINE.kbFreshness ? 'PASS' : 'FAIL'
      });
      
      evaluationMetrics.kbFreshness = freshness;
      
      // Freshness should be very recent after refresh (within 1 hour = 3600 seconds)
      expect(freshness).toBeLessThanOrEqual(PERFORMANCE_BASELINE.kbFreshness);
    });
  });

  describe('KPI 7: Trend Analysis', () => {
    test('cache performance trends upward or stable', () => {
      // This test would compare current metrics with historical data
      // For now, we verify metrics are within acceptable ranges
      
      const allMetrics = [
        { name: 'cacheHitRate', value: evaluationMetrics.cacheHitRate },
        { name: 'averageHitTime', value: evaluationMetrics.averageHitTime },
        { name: 'memoryEfficiency', value: evaluationMetrics.memoryEfficiency },
        { name: 'cacheAccuracy', value: evaluationMetrics.cacheAccuracy },
        { name: 'errorRate', value: evaluationMetrics.errorRate }
      ];
      
      const passedMetrics = allMetrics.filter(m => {
        if (m.value === null) return false;
        const baseline = PERFORMANCE_BASELINE[m.name];
        if (m.name === 'averageHitTime' || m.name === 'averageMissTime' || m.name === 'errorRate') {
          return m.value <= baseline;
        }
        return m.value >= baseline;
      });
      
      const passRate = (passedMetrics.length / allMetrics.filter(m => m.value !== null).length) * 100;
      
      expect(passRate).toBeGreaterThanOrEqual(80); // At least 80% of metrics should pass
    });
  });

  describe('Evaluation Summary', () => {
    test('generates evaluation report', () => {
      const report = generateEvaluationReport();
      
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('kpiMatrix');
      expect(report).toHaveProperty('overallStatus');
      expect(report).toHaveProperty('recommendations');
    });
  });
});

/**
 * Generate comprehensive evaluation report
 */
function generateEvaluationReport() {
  const kpiMatrix = [
    {
      kpi: 'Cache Hit Rate',
      current: evaluationMetrics.cacheHitRate,
      baseline: PERFORMANCE_BASELINE.cacheHitRate,
      unit: '%',
      trend: evaluationMetrics.cacheHitRate >= PERFORMANCE_BASELINE.cacheHitRate ? '✅ GOOD' : '⚠️ NEEDS IMPROVEMENT',
      interpretation: evaluationMetrics.cacheHitRate >= PERFORMANCE_BASELINE.cacheHitRate 
        ? 'Cache is being effectively utilized'
        : 'Cache hit rate is below baseline - consider increasing TTL or optimizing cache strategy'
    },
    {
      kpi: 'Average Hit Time',
      current: evaluationMetrics.averageHitTime,
      baseline: PERFORMANCE_BASELINE.averageHitTime,
      unit: 'ms',
      trend: evaluationMetrics.averageHitTime <= PERFORMANCE_BASELINE.averageHitTime ? '✅ GOOD' : '⚠️ NEEDS IMPROVEMENT',
      interpretation: evaluationMetrics.averageHitTime <= PERFORMANCE_BASELINE.averageHitTime
        ? 'Cache hits are fast and efficient'
        : 'Cache hits are slower than expected - investigate performance bottlenecks'
    },
    {
      kpi: 'Average Miss Time',
      current: evaluationMetrics.averageMissTime,
      baseline: PERFORMANCE_BASELINE.averageMissTime,
      unit: 'ms',
      trend: evaluationMetrics.averageMissTime <= PERFORMANCE_BASELINE.averageMissTime ? '✅ GOOD' : '⚠️ NEEDS IMPROVEMENT',
      interpretation: evaluationMetrics.averageMissTime <= PERFORMANCE_BASELINE.averageMissTime
        ? 'KB loading is efficient'
        : 'KB loading is slower than expected - check disk I/O or KB file sizes'
    },
    {
      kpi: 'Memory Efficiency',
      current: evaluationMetrics.memoryEfficiency,
      baseline: PERFORMANCE_BASELINE.memoryEfficiency * 100,
      unit: '%',
      trend: evaluationMetrics.memoryEfficiency <= (PERFORMANCE_BASELINE.memoryEfficiency * 100) ? '✅ GOOD' : '⚠️ NEEDS IMPROVEMENT',
      interpretation: evaluationMetrics.memoryEfficiency <= (PERFORMANCE_BASELINE.memoryEfficiency * 100)
        ? 'Memory usage is efficient'
        : 'Memory usage is high - consider reducing KB document sizes or increasing cache limit'
    },
    {
      kpi: 'Cache Accuracy',
      current: evaluationMetrics.cacheAccuracy,
      baseline: PERFORMANCE_BASELINE.cacheAccuracy,
      unit: '%',
      trend: evaluationMetrics.cacheAccuracy >= PERFORMANCE_BASELINE.cacheAccuracy ? '✅ GOOD' : '⚠️ NEEDS IMPROVEMENT',
      interpretation: evaluationMetrics.cacheAccuracy >= PERFORMANCE_BASELINE.cacheAccuracy
        ? 'Cache integrity is maintained'
        : 'Cache corruption detected - investigate checksum validation failures'
    },
    {
      kpi: 'Error Rate',
      current: evaluationMetrics.errorRate,
      baseline: PERFORMANCE_BASELINE.errorRate,
      unit: '%',
      trend: evaluationMetrics.errorRate <= PERFORMANCE_BASELINE.errorRate ? '✅ GOOD' : '⚠️ NEEDS IMPROVEMENT',
      interpretation: evaluationMetrics.errorRate <= PERFORMANCE_BASELINE.errorRate
        ? 'No cache errors detected'
        : 'Cache errors detected - investigate error logs and fix issues'
    },
    {
      kpi: 'KB Freshness',
      current: evaluationMetrics.kbFreshness,
      baseline: PERFORMANCE_BASELINE.kbFreshness,
      unit: 'seconds',
      trend: evaluationMetrics.kbFreshness <= PERFORMANCE_BASELINE.kbFreshness ? '✅ GOOD' : '⚠️ NEEDS IMPROVEMENT',
      interpretation: evaluationMetrics.kbFreshness <= PERFORMANCE_BASELINE.kbFreshness
        ? 'KB is up-to-date'
        : 'KB is stale - refresh cache to get latest content'
    },
    {
      kpi: 'Cache Validity Rate',
      current: evaluationMetrics.cacheValidityRate,
      baseline: PERFORMANCE_BASELINE.cacheValidityRate,
      unit: '%',
      trend: evaluationMetrics.cacheValidityRate >= PERFORMANCE_BASELINE.cacheValidityRate ? '✅ GOOD' : '⚠️ NEEDS IMPROVEMENT',
      interpretation: evaluationMetrics.cacheValidityRate >= PERFORMANCE_BASELINE.cacheValidityRate
        ? 'Cache maintains validity over time'
        : 'Cache validity is declining - check TTL settings and cache refresh strategy'
    }
  ];

  const passedKPIs = kpiMatrix.filter(kpi => kpi.trend.includes('✅')).length;
  const totalKPIs = kpiMatrix.length;
  const overallStatus = (passedKPIs / totalKPIs) >= 0.8 ? '✅ PASSING' : '⚠️ NEEDS ATTENTION';

  const recommendations = generateRecommendations(kpiMatrix);

  return {
    timestamp: new Date().toISOString(),
    metrics: evaluationMetrics,
    kpiMatrix,
    overallStatus,
    summary: {
      passed: passedKPIs,
      total: totalKPIs,
      passRate: ((passedKPIs / totalKPIs) * 100).toFixed(1) + '%'
    },
    recommendations
  };
}

/**
 * Generate recommendations based on KPI analysis
 */
function generateRecommendations(kpiMatrix) {
  const recommendations = [];

  kpiMatrix.forEach(kpi => {
    if (kpi.trend.includes('⚠️')) {
      recommendations.push({
        kpi: kpi.kpi,
        issue: kpi.interpretation,
        action: getRecommendationAction(kpi.kpi)
      });
    }
  });

  return recommendations;
}

/**
 * Get specific action for KPI issue
 */
function getRecommendationAction(kpiName) {
  const actions = {
    'Cache Hit Rate': 'Increase KB_CACHE_TTL or optimize cache strategy',
    'Average Hit Time': 'Investigate cache access patterns and optimize',
    'Average Miss Time': 'Check KB file sizes and disk I/O performance',
    'Memory Efficiency': 'Reduce KB document sizes or increase KB_MAX_CACHE_SIZE',
    'Cache Accuracy': 'Check for cache corruption and verify checksum validation',
    'Error Rate': 'Review error logs and fix underlying issues',
    'KB Freshness': 'Refresh KB cache: POST /api/admin/kb-refresh',
    'Cache Validity Rate': 'Review TTL settings and cache refresh strategy'
  };

  return actions[kpiName] || 'Review system configuration and logs';
}
