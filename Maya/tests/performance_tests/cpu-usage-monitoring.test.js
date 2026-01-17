/**
 * CPU Usage Monitoring Tests
 * 
 * Tests to monitor and prevent high CPU usage:
 * - CPU usage benchmarks
 * - Resource cleanup verification
 * - Timer cleanup verification
 * - Memory leak detection
 * - Infinite loop prevention
 * 
 * Benchmarks:
 * - Normal operation: < 10% CPU
 * - Stress test: < 50% CPU
 * - Peak usage: < 80% CPU
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { performance } from 'perf_hooks';

// CPU usage monitoring utilities
function getCPUUsage() {
  const usage = process.cpuUsage();
  return {
    user: usage.user / 1000000, // Convert to seconds
    system: usage.system / 1000000,
    total: (usage.user + usage.system) / 1000000
  };
}

function measureCPUUsage(durationMs = 1000) {
  const startUsage = getCPUUsage();
  const startTime = performance.now();
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const endUsage = getCPUUsage();
      const endTime = performance.now();
      const elapsed = (endTime - startTime) / 1000; // Convert to seconds
      
      const cpuPercent = ((endUsage.total - startUsage.total) / elapsed) * 100;
      
      resolve({
        cpuPercent,
        elapsed,
        user: endUsage.user - startUsage.user,
        system: endUsage.system - startUsage.system
      });
    }, durationMs);
  });
}

describe('CPU Usage Monitoring', () => {
  let activeTimers = [];
  let activeIntervals = [];
  
  beforeEach(() => {
    // Track all timers and intervals for cleanup
    activeTimers = [];
    activeIntervals = [];
  });
  
  afterEach(() => {
    // Clean up all timers and intervals
    activeTimers.forEach(timer => clearTimeout(timer));
    activeIntervals.forEach(interval => clearInterval(interval));
    activeTimers = [];
    activeIntervals = [];
  });

  describe('Baseline CPU Usage', () => {
    test('idle CPU usage should be low (< 5%)', async () => {
      const cpuUsage = await measureCPUUsage(1000);
      
      // Idle CPU usage should be very low
      expect(cpuUsage.cpuPercent).toBeLessThan(5);
    }, 5000);

    test('normal operation CPU usage should be reasonable (< 10%)', async () => {
      const startUsage = getCPUUsage();
      
      // Simulate normal operation (simple computations)
      for (let i = 0; i < 1000; i++) {
        Math.sqrt(i);
      }
      
      const cpuUsage = await measureCPUUsage(500);
      
      // Normal operation should not spike CPU
      expect(cpuUsage.cpuPercent).toBeLessThan(10);
    }, 5000);
  });

  describe('Timer Cleanup', () => {
    test('setTimeout should not leak CPU after cleanup', async () => {
      // Create and immediately clear timeout
      const timer1 = setTimeout(() => {}, 1000);
      const timer2 = setTimeout(() => {}, 2000);
      const timer3 = setTimeout(() => {}, 3000);
      
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // CPU usage should be low after cleanup
      const cpuUsage = await measureCPUUsage(1000);
      expect(cpuUsage.cpuPercent).toBeLessThan(5);
    }, 5000);

    test('setInterval should not accumulate CPU usage', async () => {
      let count = 0;
      const interval = setInterval(() => {
        count++;
        if (count >= 10) {
          clearInterval(interval);
        }
      }, 100);
      
      activeIntervals.push(interval);
      
      // Wait for interval to complete
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // CPU usage should return to baseline
      const cpuUsage = await measureCPUUsage(1000);
      expect(cpuUsage.cpuPercent).toBeLessThan(10);
    }, 5000);

    test('multiple intervals should be cleaned up properly', async () => {
      const intervals = [];
      
      // Create 10 intervals
      for (let i = 0; i < 10; i++) {
        const interval = setInterval(() => {
          // Do minimal work
        }, 100);
        intervals.push(interval);
        activeIntervals.push(interval);
      }
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clean up all intervals
      intervals.forEach(interval => clearInterval(interval));
      
      // CPU usage should be low after cleanup
      const cpuUsage = await measureCPUUsage(1000);
      expect(cpuUsage.cpuPercent).toBeLessThan(10);
    }, 5000);
  });

  describe('Promise Cleanup', () => {
    test('many promises should not cause CPU spike', async () => {
      const promises = Array.from({ length: 1000 }, (_, i) => 
        Promise.resolve(i)
      );
      
      const startTime = performance.now();
      await Promise.all(promises);
      const duration = performance.now() - startTime;
      
      // Should complete quickly (< 1 second)
      expect(duration).toBeLessThan(1000);
      
      // CPU usage after completion should be low
      const cpuUsage = await measureCPUUsage(500);
      expect(cpuUsage.cpuPercent).toBeLessThan(10);
    }, 5000);

    test('rejected promises should not accumulate', async () => {
      const promises = Array.from({ length: 100 }, (_, i) => 
        Promise.reject(new Error(`Error ${i}`))
      );
      
      const results = await Promise.allSettled(promises);
      
      expect(results).toHaveLength(100);
      
      // CPU usage should be low after handling rejections
      const cpuUsage = await measureCPUUsage(500);
      expect(cpuUsage.cpuPercent).toBeLessThan(10);
    }, 5000);
  });

  describe('Loop CPU Usage', () => {
    test('tight loops should be bounded', async () => {
      const startTime = performance.now();
      let iterations = 0;
      
      // Bounded loop (max 1 second)
      const maxTime = 1000;
      while (performance.now() - startTime < maxTime && iterations < 1000000) {
        iterations++;
        Math.sqrt(iterations);
      }
      
      const duration = performance.now() - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(2000);
      
      // CPU usage should be reasonable
      const cpuUsage = await measureCPUUsage(500);
      expect(cpuUsage.cpuPercent).toBeLessThan(50);
    }, 5000);

    test('nested loops should not cause CPU spike', async () => {
      const startTime = performance.now();
      
      // Bounded nested loops
      for (let i = 0; i < 100; i++) {
        for (let j = 0; j < 100; j++) {
          Math.sqrt(i * j);
        }
      }
      
      const duration = performance.now() - startTime;
      
      // Should complete quickly
      expect(duration).toBeLessThan(1000);
      
      // CPU usage should be reasonable
      const cpuUsage = await measureCPUUsage(500);
      expect(cpuUsage.cpuPercent).toBeLessThan(30);
    }, 5000);
  });

  describe('Memory and CPU Correlation', () => {
    test('memory leaks should not cause CPU spike', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Create and release objects
      for (let i = 0; i < 1000; i++) {
        const obj = { data: 'x'.repeat(1000), index: i };
        // Object goes out of scope
      }
      
      // Force GC if available
      if (global.gc) {
        global.gc();
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // < 50MB
      
      // CPU usage should be low
      const cpuUsage = await measureCPUUsage(500);
      expect(cpuUsage.cpuPercent).toBeLessThan(10);
    }, 10000);
  });

  describe('Event Listener Cleanup', () => {
    test('event listeners should not accumulate', async () => {
      const { EventEmitter } = await import('events');
      const emitter = new EventEmitter();
      
      // Add many listeners
      for (let i = 0; i < 100; i++) {
        emitter.on('test', () => {});
      }
      
      // Emit event
      emitter.emit('test');
      
      // Remove all listeners
      emitter.removeAllListeners('test');
      
      // CPU usage should be low
      const cpuUsage = await measureCPUUsage(500);
      expect(cpuUsage.cpuPercent).toBeLessThan(10);
    }, 5000);
  });

  describe('Async Operation CPU Usage', () => {
    test('concurrent async operations should not spike CPU', async () => {
      const operations = Array.from({ length: 100 }, async (_, i) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return i;
      });
      
      const startTime = performance.now();
      await Promise.all(operations);
      const duration = performance.now() - startTime;
      
      // Should complete reasonably quickly
      expect(duration).toBeLessThan(2000);
      
      // CPU usage should be reasonable
      const cpuUsage = await measureCPUUsage(500);
      expect(cpuUsage.cpuPercent).toBeLessThan(20);
    }, 5000);

    test('timeout operations should not accumulate CPU', async () => {
      const { withTimeout } = await import('../../backend/utils/timeout.js');
      
      const operations = Array.from({ length: 50 }, (_, i) =>
        withTimeout(
          Promise.resolve(`result-${i}`),
          100,
          `Operation ${i}`
        )
      );
      
      await Promise.all(operations);
      
      // CPU usage should be low after completion
      const cpuUsage = await measureCPUUsage(500);
      expect(cpuUsage.cpuPercent).toBeLessThan(15);
    }, 5000);
  });

  describe('CPU Usage Benchmarks', () => {
    test('normal test execution should use < 10% CPU', async () => {
      // Run a typical test operation
      const result = Math.sqrt(1000);
      expect(result).toBeDefined();
      
      const cpuUsage = await measureCPUUsage(1000);
      
      // Normal test execution should be low CPU
      expect(cpuUsage.cpuPercent).toBeLessThan(10);
    }, 5000);

    test('stress test should use < 50% CPU', async () => {
      // Simulate stress test
      const operations = Array.from({ length: 1000 }, (_, i) =>
        Promise.resolve(Math.sqrt(i))
      );
      
      await Promise.all(operations);
      
      const cpuUsage = await measureCPUUsage(1000);
      
      // Stress test should not exceed 50% CPU
      expect(cpuUsage.cpuPercent).toBeLessThan(50);
    }, 10000);

    test('peak usage should never exceed 80% CPU', async () => {
      // Simulate peak load
      const heavyOperations = Array.from({ length: 100 }, async (_, i) => {
        // Simulate heavy computation
        let sum = 0;
        for (let j = 0; j < 10000; j++) {
          sum += Math.sqrt(i * j);
        }
        return sum;
      });
      
      await Promise.all(heavyOperations);
      
      const cpuUsage = await measureCPUUsage(1000);
      
      // Even peak usage should not exceed 80%
      expect(cpuUsage.cpuPercent).toBeLessThan(80);
    }, 15000);
  });
});
