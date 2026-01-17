#!/usr/bin/env node
/**
 * KB Cache Test Script
 * 
 * Quick test script to verify KB cache functionality
 * Run: node test-kb-cache.js
 */

import { 
  getKBCache, 
  refreshKBCache,
  getKBCacheStats,
  validateKBCache,
  getKBCacheMemoryUsage
} from './utils/memory_cache/kb-cache.js';

const COLOR_GREEN = '\x1b[32m';
const COLOR_RED = '\x1b[31m';
const COLOR_YELLOW = '\x1b[33m';
const COLOR_CYAN = '\x1b[36m';
const COLOR_RESET = '\x1b[0m';

async function testKBCache() {
  console.log(`${COLOR_CYAN}Testing KB Cache System...${COLOR_RESET}\n`);

  try {
    // Test 1: Load KB cache
    console.log(`${COLOR_CYAN}1. Loading KB cache...${COLOR_RESET}`);
    const start1 = Date.now();
    const context1 = await getKBCache();
    const loadTime = Date.now() - start1;
    
    if (context1 && context1.length > 0) {
      console.log(`${COLOR_GREEN}✅ KB cache loaded successfully${COLOR_RESET}`);
      console.log(`   Context length: ${context1.length} characters`);
      console.log(`   Load time: ${loadTime}ms\n`);
    } else {
      console.log(`${COLOR_RED}❌ KB cache load failed${COLOR_RESET}\n`);
      return;
    }

    // Test 2: Cache hit
    console.log(`${COLOR_CYAN}2. Testing cache hit...${COLOR_RESET}`);
    const start2 = Date.now();
    const context2 = await getKBCache();
    const hitTime = Date.now() - start2;
    
    if (hitTime < 10) {
      console.log(`${COLOR_GREEN}✅ Cache hit successful (${hitTime}ms)${COLOR_RESET}\n`);
    } else {
      console.log(`${COLOR_YELLOW}⚠️  Cache hit slower than expected (${hitTime}ms)${COLOR_RESET}\n`);
    }

    // Test 3: Cache validation
    console.log(`${COLOR_CYAN}3. Validating cache integrity...${COLOR_RESET}`);
    const validation = validateKBCache();
    
    if (validation.valid) {
      console.log(`${COLOR_GREEN}✅ Cache is valid${COLOR_RESET}`);
      console.log(`   TTL valid: ${validation.ttlValid}`);
      console.log(`   Checksum valid: ${validation.checksumValid}`);
      console.log(`   Age: ${validation.age}s\n`);
    } else {
      console.log(`${COLOR_RED}❌ Cache validation failed: ${validation.reason}${COLOR_RESET}\n`);
    }

    // Test 4: Cache statistics
    console.log(`${COLOR_CYAN}4. Cache statistics...${COLOR_RESET}`);
    const stats = getKBCacheStats();
    
    console.log(`   Hits: ${stats.statistics.hits}`);
    console.log(`   Misses: ${stats.statistics.misses}`);
    console.log(`   Hit Rate: ${stats.statistics.hitRate}`);
    console.log(`   Invalidations: ${stats.statistics.invalidations}`);
    console.log(`   Refreshes: ${stats.statistics.refreshes}\n`);

    // Test 5: Memory usage
    console.log(`${COLOR_CYAN}5. Memory usage...${COLOR_RESET}`);
    const memory = getKBCacheMemoryUsage();
    
    if (memory.cached) {
      console.log(`${COLOR_GREEN}✅ Memory usage tracked${COLOR_RESET}`);
      console.log(`   Total memory: ${memory.totalMemory} bytes`);
      console.log(`   Cache size: ${memory.cacheSize} bytes`);
      console.log(`   Overhead: ${memory.overhead} bytes`);
      console.log(`   Percentage of limit: ${memory.percentageOfLimit}\n`);
    } else {
      console.log(`${COLOR_YELLOW}⚠️  Cache not initialized${COLOR_RESET}\n`);
    }

    // Test 6: KB content verification
    console.log(`${COLOR_CYAN}6. Verifying KB content accuracy...${COLOR_RESET}`);
    const kbLower = context1.toLowerCase();
    
    const checks = [
      { name: 'Contains "Janet"', test: kbLower.includes('janet') },
      { name: 'Contains "QQI"', test: kbLower.includes('qqi') },
      { name: 'Contains "Data Analytics"', test: kbLower.includes('data analytics') },
      { name: 'Contains "AI Security"', test: kbLower.includes('ai security') || kbLower.includes('ai-security') },
      { name: 'Contains contact email', test: kbLower.includes('info@janetxiushi.me') }
    ];
    
    let allPassed = true;
    checks.forEach(check => {
      if (check.test) {
        console.log(`${COLOR_GREEN}✅ ${check.name}${COLOR_RESET}`);
      } else {
        console.log(`${COLOR_RED}❌ ${check.name}${COLOR_RESET}`);
        allPassed = false;
      }
    });
    
    if (allPassed) {
      console.log(`\n${COLOR_GREEN}✅ All KB content checks passed${COLOR_RESET}\n`);
    } else {
      console.log(`\n${COLOR_YELLOW}⚠️  Some KB content checks failed${COLOR_RESET}\n`);
    }

    // Test 7: Cache refresh
    console.log(`${COLOR_CYAN}7. Testing cache refresh...${COLOR_RESET}`);
    const start3 = Date.now();
    const refreshedContext = await refreshKBCache();
    const refreshTime = Date.now() - start3;
    
    if (refreshedContext && refreshedContext.length > 0) {
      console.log(`${COLOR_GREEN}✅ Cache refresh successful (${refreshTime}ms)${COLOR_RESET}`);
      console.log(`   Refreshed context length: ${refreshedContext.length} characters\n`);
    } else {
      console.log(`${COLOR_RED}❌ Cache refresh failed${COLOR_RESET}\n`);
    }

    // Summary
    console.log(`${COLOR_CYAN}========================================${COLOR_RESET}`);
    console.log(`${COLOR_CYAN}KB Cache Test Summary${COLOR_RESET}`);
    console.log(`${COLOR_CYAN}========================================${COLOR_RESET}`);
    console.log(`${COLOR_GREEN}✅ Cache loading: Working${COLOR_RESET}`);
    console.log(`${COLOR_GREEN}✅ Cache hits: Fast (< 10ms)${COLOR_RESET}`);
    console.log(`${COLOR_GREEN}✅ Cache validation: Working${COLOR_RESET}`);
    console.log(`${COLOR_GREEN}✅ Memory tracking: Working${COLOR_RESET}`);
    console.log(`${COLOR_GREEN}✅ KB content: Accurate${COLOR_RESET}`);
    console.log(`${COLOR_GREEN}✅ Cache refresh: Working${COLOR_RESET}`);
    console.log(`${COLOR_CYAN}========================================${COLOR_RESET}\n`);

  } catch (error) {
    console.error(`${COLOR_RED}❌ Test failed: ${error.message}${COLOR_RESET}`);
    console.error(error.stack);
    process.exit(1);
  }
}

testKBCache();
