#!/usr/bin/env node
/**
 * KB Cache Evaluation Runner
 * 
 * Runs cache evaluations and generates KPI matrix report
 * Run: node test-kb-cache-eval.js
 */

import { 
  getKBCache, 
  refreshKBCache,
  getKBCacheStats,
  validateKBCache,
  getKBCacheMemoryUsage,
  invalidateKBCache
} from './utils/memory_cache/kb-cache.js';
import { getKBStats, checkKBUpdates } from './utils/memory_cache/kb-monitor.js';

const COLOR_GREEN = '\x1b[32m';
const COLOR_RED = '\x1b[31m';
const COLOR_YELLOW = '\x1b[33m';
const COLOR_CYAN = '\x1b[36m';
const COLOR_BLUE = '\x1b[34m';
const COLOR_RESET = '\x1b[0m';

const PERFORMANCE_BASELINE = {
  cacheHitRate: 80,
  averageHitTime: 10,
  averageMissTime: 100,
  memoryEfficiency: 0.01,
  cacheAccuracy: 100,
  errorRate: 0,
  kbFreshness: 3600,
  cacheValidityRate: 95
};

async function runEvaluations() {
  console.log(`${COLOR_CYAN}╔══════════════════════════════════════════════════════════════╗${COLOR_RESET}`);
  console.log(`${COLOR_CYAN}║     KB Cache & Memory Management - KPI Evaluation          ║${COLOR_RESET}`);
  console.log(`${COLOR_CYAN}╚══════════════════════════════════════════════════════════════╝${COLOR_RESET}\n`);

  const kpiMatrix = [];

  try {
    // KPI 1: Cache Hit Rate
    console.log(`${COLOR_CYAN}Evaluating: Cache Hit Rate...${COLOR_RESET}`);
    invalidateKBCache();
    
    for (let i = 0; i < 10; i++) {
      await getKBCache();
    }
    
    const stats1 = getKBCacheStats();
    const hitRate = parseFloat(stats1.statistics.hitRate) || 0;
    const status1 = hitRate >= PERFORMANCE_BASELINE.cacheHitRate ? 
      `${COLOR_GREEN}✅ GOOD${COLOR_RESET}` : 
      `${COLOR_YELLOW}⚠️  NEEDS IMPROVEMENT${COLOR_RESET}`;
    
    kpiMatrix.push({
      kpi: 'Cache Hit Rate',
      current: hitRate.toFixed(1) + '%',
      baseline: PERFORMANCE_BASELINE.cacheHitRate + '%',
      unit: '%',
      status: status1,
      value: hitRate
    });
    console.log(`   Current: ${hitRate.toFixed(1)}% | Baseline: ${PERFORMANCE_BASELINE.cacheHitRate}% ${status1}\n`);

    // KPI 2: Average Hit Time
    console.log(`${COLOR_CYAN}Evaluating: Average Hit Time...${COLOR_RESET}`);
    const hitTimes = [];
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      await getKBCache();
      hitTimes.push(Date.now() - start);
    }
    const avgHitTime = hitTimes.reduce((a, b) => a + b, 0) / hitTimes.length;
    const status2 = avgHitTime <= PERFORMANCE_BASELINE.averageHitTime ? 
      `${COLOR_GREEN}✅ GOOD${COLOR_RESET}` : 
      `${COLOR_YELLOW}⚠️  NEEDS IMPROVEMENT${COLOR_RESET}`;
    
    kpiMatrix.push({
      kpi: 'Average Hit Time',
      current: avgHitTime.toFixed(1) + 'ms',
      baseline: PERFORMANCE_BASELINE.averageHitTime + 'ms',
      unit: 'ms',
      status: status2,
      value: avgHitTime
    });
    console.log(`   Current: ${avgHitTime.toFixed(1)}ms | Baseline: ${PERFORMANCE_BASELINE.averageHitTime}ms ${status2}\n`);

    // KPI 3: Average Miss Time
    console.log(`${COLOR_CYAN}Evaluating: Average Miss Time...${COLOR_RESET}`);
    invalidateKBCache();
    const missStart = Date.now();
    await getKBCache();
    const avgMissTime = Date.now() - missStart;
    const status3 = avgMissTime <= PERFORMANCE_BASELINE.averageMissTime ? 
      `${COLOR_GREEN}✅ GOOD${COLOR_RESET}` : 
      `${COLOR_YELLOW}⚠️  NEEDS IMPROVEMENT${COLOR_RESET}`;
    
    kpiMatrix.push({
      kpi: 'Average Miss Time',
      current: avgMissTime.toFixed(1) + 'ms',
      baseline: PERFORMANCE_BASELINE.averageMissTime + 'ms',
      unit: 'ms',
      status: status3,
      value: avgMissTime
    });
    console.log(`   Current: ${avgMissTime.toFixed(1)}ms | Baseline: ${PERFORMANCE_BASELINE.averageMissTime}ms ${status3}\n`);

    // KPI 4: Memory Efficiency
    console.log(`${COLOR_CYAN}Evaluating: Memory Efficiency...${COLOR_RESET}`);
    const memory = getKBCacheMemoryUsage();
    const memStats = getKBCacheStats();
    let memEfficiency = 0;
    if (memory.cached && memStats.config.maxSize) {
      memEfficiency = (memory.totalMemory / memStats.config.maxSize) * 100;
    }
    const status4 = memEfficiency <= (PERFORMANCE_BASELINE.memoryEfficiency * 100) ? 
      `${COLOR_GREEN}✅ GOOD${COLOR_RESET}` : 
      `${COLOR_YELLOW}⚠️  NEEDS IMPROVEMENT${COLOR_RESET}`;
    
    kpiMatrix.push({
      kpi: 'Memory Efficiency',
      current: memEfficiency.toFixed(2) + '%',
      baseline: (PERFORMANCE_BASELINE.memoryEfficiency * 100).toFixed(2) + '%',
      unit: '%',
      status: status4,
      value: memEfficiency
    });
    console.log(`   Current: ${memEfficiency.toFixed(2)}% | Baseline: ${(PERFORMANCE_BASELINE.memoryEfficiency * 100).toFixed(2)}% ${status4}\n`);

    // KPI 5: Cache Accuracy
    console.log(`${COLOR_CYAN}Evaluating: Cache Accuracy...${COLOR_RESET}`);
    const validation = validateKBCache();
    const accuracy = validation.valid ? 100 : 0;
    const status5 = accuracy >= PERFORMANCE_BASELINE.cacheAccuracy ? 
      `${COLOR_GREEN}✅ GOOD${COLOR_RESET}` : 
      `${COLOR_YELLOW}⚠️  NEEDS IMPROVEMENT${COLOR_RESET}`;
    
    kpiMatrix.push({
      kpi: 'Cache Accuracy',
      current: accuracy + '%',
      baseline: PERFORMANCE_BASELINE.cacheAccuracy + '%',
      unit: '%',
      status: status5,
      value: accuracy
    });
    console.log(`   Current: ${accuracy}% | Baseline: ${PERFORMANCE_BASELINE.cacheAccuracy}% ${status5}\n`);

    // KPI 6: Error Rate
    console.log(`${COLOR_CYAN}Evaluating: Error Rate...${COLOR_RESET}`);
    const stats2 = getKBCacheStats();
    const totalOps = stats2.statistics.hits + stats2.statistics.misses;
    const errorRate = totalOps > 0 ? (stats2.statistics.errors / totalOps) * 100 : 0;
    const status6 = errorRate <= PERFORMANCE_BASELINE.errorRate ? 
      `${COLOR_GREEN}✅ GOOD${COLOR_RESET}` : 
      `${COLOR_YELLOW}⚠️  NEEDS IMPROVEMENT${COLOR_RESET}`;
    
    kpiMatrix.push({
      kpi: 'Error Rate',
      current: errorRate.toFixed(2) + '%',
      baseline: PERFORMANCE_BASELINE.errorRate + '%',
      unit: '%',
      status: status6,
      value: errorRate
    });
    console.log(`   Current: ${errorRate.toFixed(2)}% | Baseline: ${PERFORMANCE_BASELINE.errorRate}% ${status6}\n`);

    // KPI 7: KB Freshness
    console.log(`${COLOR_CYAN}Evaluating: KB Freshness...${COLOR_RESET}`);
    const kbStats = getKBStats();
    const freshness = kbStats.timeSinceLastRefresh || kbStats.timeSinceLastLoad || 0;
    const freshnessMinutes = Math.round(freshness / 60);
    const status7 = freshness <= PERFORMANCE_BASELINE.kbFreshness ? 
      `${COLOR_GREEN}✅ GOOD${COLOR_RESET}` : 
      `${COLOR_YELLOW}⚠️  NEEDS IMPROVEMENT${COLOR_RESET}`;
    
    kpiMatrix.push({
      kpi: 'KB Freshness',
      current: freshnessMinutes + 'min',
      baseline: Math.round(PERFORMANCE_BASELINE.kbFreshness / 60) + 'min',
      unit: 'seconds',
      status: status7,
      value: freshness
    });
    console.log(`   Current: ${freshnessMinutes}min | Baseline: ${Math.round(PERFORMANCE_BASELINE.kbFreshness / 60)}min ${status7}\n`);

    // KPI 8: Cache Validity Rate
    console.log(`${COLOR_CYAN}Evaluating: Cache Validity Rate...${COLOR_RESET}`);
    let validCount = 0;
    for (let i = 0; i < 10; i++) {
      await getKBCache();
      const val = validateKBCache();
      if (val.valid) validCount++;
    }
    const validityRate = (validCount / 10) * 100;
    const status8 = validityRate >= PERFORMANCE_BASELINE.cacheValidityRate ? 
      `${COLOR_GREEN}✅ GOOD${COLOR_RESET}` : 
      `${COLOR_YELLOW}⚠️  NEEDS IMPROVEMENT${COLOR_RESET}`;
    
    kpiMatrix.push({
      kpi: 'Cache Validity Rate',
      current: validityRate.toFixed(1) + '%',
      baseline: PERFORMANCE_BASELINE.cacheValidityRate + '%',
      unit: '%',
      status: status8,
      value: validityRate
    });
    console.log(`   Current: ${validityRate.toFixed(1)}% | Baseline: ${PERFORMANCE_BASELINE.cacheValidityRate}% ${status8}\n`);

    // Generate KPI Matrix Report
    printKPIMatrix(kpiMatrix);

    // Overall Status
    const passed = kpiMatrix.filter(k => k.status.includes('✅')).length;
    const total = kpiMatrix.length;
    const overallStatus = (passed / total) >= 0.8 ? 
      `${COLOR_GREEN}✅ PASSING${COLOR_RESET}` : 
      `${COLOR_YELLOW}⚠️  NEEDS ATTENTION${COLOR_RESET}`;
    
    console.log(`${COLOR_CYAN}╔══════════════════════════════════════════════════════════════╗${COLOR_RESET}`);
    console.log(`${COLOR_CYAN}║                    Overall Status                             ║${COLOR_RESET}`);
    console.log(`${COLOR_CYAN}╚══════════════════════════════════════════════════════════════╝${COLOR_RESET}`);
    console.log(`Status: ${overallStatus}`);
    console.log(`Passed: ${passed}/${total} KPIs (${((passed/total)*100).toFixed(1)}%)\n`);

    // Recommendations
    const recommendations = generateRecommendations(kpiMatrix);
    if (recommendations.length > 0) {
      console.log(`${COLOR_YELLOW}Recommendations:${COLOR_RESET}`);
      recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec.kpi}: ${rec.action}`);
      });
    }

  } catch (error) {
    console.error(`${COLOR_RED}❌ Evaluation failed: ${error.message}${COLOR_RESET}`);
    console.error(error.stack);
    process.exit(1);
  }
}

function printKPIMatrix(kpiMatrix) {
  console.log(`${COLOR_CYAN}╔════════════════════════════════════════════════════════════════════════════════╗${COLOR_RESET}`);
  console.log(`${COLOR_CYAN}║                           KPI MATRIX                                        ║${COLOR_RESET}`);
  console.log(`${COLOR_CYAN}╠═══════════════════════════════════╦═══════════╦═══════════╦═══════════════════╣${COLOR_RESET}`);
  console.log(`${COLOR_CYAN}║ KPI                               ║ Current   ║ Baseline  ║ Status            ║${COLOR_RESET}`);
  console.log(`${COLOR_CYAN}╠═══════════════════════════════════╬═══════════╬═══════════╬═══════════════════╣${COLOR_RESET}`);
  
  kpiMatrix.forEach(kpi => {
    const kpiName = kpi.kpi.padEnd(35);
    const current = kpi.current.padEnd(11);
    const baseline = kpi.baseline.padEnd(11);
    console.log(`${COLOR_CYAN}║${COLOR_RESET} ${kpiName} ${COLOR_CYAN}║${COLOR_RESET} ${current} ${COLOR_CYAN}║${COLOR_RESET} ${baseline} ${COLOR_CYAN}║${COLOR_RESET} ${kpi.status.padEnd(19)} ${COLOR_CYAN}║${COLOR_RESET}`);
  });
  
  console.log(`${COLOR_CYAN}╚═══════════════════════════════════╩═══════════╩═══════════╩═══════════════════╝${COLOR_RESET}\n`);
}

function generateRecommendations(kpiMatrix) {
  const recommendations = [];
  
  kpiMatrix.forEach(kpi => {
    if (kpi.status.includes('⚠️')) {
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
      
      recommendations.push({
        kpi: kpi.kpi,
        action: actions[kpi.kpi] || 'Review system configuration and logs'
      });
    }
  });
  
  return recommendations;
}

runEvaluations();
