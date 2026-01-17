# CPU Usage Prevention Guide

**Last Updated**: January 11, 2026

## Overview

This document outlines CPU usage prevention measures, benchmarks, and monitoring strategies to prevent high CPU usage that could freeze the system.

## Root Causes Identified

### 1. Recursive Test Execution
- **Issue**: Test files executing `npm test` causing infinite loops
- **Status**: ✅ **FIXED** - Removed `e2e-test-execution.test.js`
- **Prevention**: Test isolation guidelines enforced

### 2. Unbounded Loops
- **Issue**: Loops without proper bounds or timeout protection
- **Status**: ✅ **MONITORED** - All loops have bounds or timeouts
- **Prevention**: Timeout utilities enforce limits

### 3. Timer Accumulation
- **Issue**: `setTimeout`/`setInterval` not cleaned up properly
- **Status**: ✅ **MONITORED** - Cleanup in `afterEach` hooks
- **Prevention**: Timer tracking and cleanup

### 4. Promise Accumulation
- **Issue**: Many promises created without proper cleanup
- **Status**: ✅ **MONITORED** - Promise.all with timeout protection
- **Prevention**: Bulk operations with timeout limits

### 5. Event Listener Accumulation
- **Issue**: Event listeners not removed, causing memory leaks
- **Status**: ✅ **MONITORED** - Cleanup in test teardown
- **Prevention**: Event listener tracking

## CPU Usage Benchmarks

### Normal Operation
- **Target**: < 10% CPU usage
- **Measurement**: During normal test execution
- **Test**: `cpu-usage-monitoring.test.js` - Baseline CPU Usage

### Stress Test
- **Target**: < 50% CPU usage
- **Measurement**: During concurrent operations (1000+ promises)
- **Test**: `cpu-usage-monitoring.test.js` - Stress Test

### Peak Usage
- **Target**: < 80% CPU usage
- **Measurement**: During heavy computation
- **Test**: `cpu-usage-monitoring.test.js` - Peak Usage

### Idle State
- **Target**: < 5% CPU usage
- **Measurement**: After operations complete
- **Test**: `cpu-usage-monitoring.test.js` - Idle CPU Usage

## Prevention Measures

### 1. Test Isolation
- ✅ No recursive test execution
- ✅ Tests can run independently
- ✅ Proper cleanup in `afterAll`/`afterEach`
- ✅ No shared mutable state

### 2. Timer Management
- ✅ All timers tracked in test files
- ✅ Cleanup in `afterEach` hooks
- ✅ Timeout limits enforced
- ✅ Interval cleanup verified

### 3. Promise Management
- ✅ Bulk operations with timeout protection
- ✅ Promise.all with reasonable limits
- ✅ Error handling prevents accumulation
- ✅ Memory cleanup after operations

### 4. Loop Protection
- ✅ All loops have bounds or timeout protection
- ✅ Nested loops are bounded
- ✅ CPU usage monitored during loops
- ✅ Maximum iteration limits enforced

### 5. Resource Cleanup
- ✅ File handles closed
- ✅ Event listeners removed
- ✅ Timers cleared
- ✅ Memory released

## Monitoring Tests

### CPU Usage Monitoring Test
**File**: `tests/performance_tests/cpu-usage-monitoring.test.js`

**Tests**:
1. Baseline CPU Usage - Verifies idle CPU < 5%
2. Normal Operation - Verifies normal CPU < 10%
3. Timer Cleanup - Verifies timers don't leak CPU
4. Promise Cleanup - Verifies promises don't accumulate
5. Loop CPU Usage - Verifies loops are bounded
6. Memory and CPU Correlation - Verifies memory leaks don't cause CPU spikes
7. Event Listener Cleanup - Verifies listeners don't accumulate
8. Async Operation CPU Usage - Verifies async operations don't spike CPU
9. CPU Usage Benchmarks - Verifies benchmarks are met

### Resource Cleanup Test
**File**: `tests/performance_tests/resource-cleanup.test.js`

**Tests**:
1. File Handle Cleanup
2. Memory Leak Prevention
3. Timer Cleanup
4. Event Listener Cleanup
5. Cache Cleanup
6. Promise Cleanup
7. Stream Cleanup

## Code Review Checklist

Before committing code, verify:

- [ ] No recursive test execution (`npm test` in test files)
- [ ] All loops have bounds or timeout protection
- [ ] All timers are tracked and cleaned up
- [ ] All promises have timeout protection
- [ ] Event listeners are removed in cleanup
- [ ] File handles are closed
- [ ] Memory is released after operations
- [ ] CPU usage benchmarks are met
- [ ] Tests can run independently
- [ ] Tests clean up after themselves

## CPU Usage Monitoring

### During Development
```bash
# Monitor CPU usage while running tests
cd Maya/backend
npm test &
top -pid $(pgrep -f "jest")
```

### During Test Execution
```bash
# Run CPU monitoring test
cd Maya/backend
npm test -- tests/performance_tests/cpu-usage-monitoring.test.js
```

### Continuous Monitoring
- CPU usage is monitored in `start.sh` script
- Warnings shown if CPU > 95%
- Automatic process termination if stuck

## Refactoring Guidelines

### When Adding New Code

1. **Loops**: Always add bounds or timeout protection
   ```javascript
   // ✅ Good
   for (let i = 0; i < maxIterations && Date.now() - startTime < timeout; i++) {
     // operation
   }
   
   // ❌ Bad
   while (true) {
     // operation - no bounds!
   }
   ```

2. **Timers**: Always track and clean up
   ```javascript
   // ✅ Good
   const timer = setTimeout(() => {}, 1000);
   activeTimers.push(timer);
   // Cleanup in afterEach
   activeTimers.forEach(t => clearTimeout(t));
   
   // ❌ Bad
   setTimeout(() => {}, 1000); // Not tracked!
   ```

3. **Promises**: Always add timeout protection
   ```javascript
   // ✅ Good
   await withTimeout(promise, 5000, 'Operation');
   
   // ❌ Bad
   await promise; // No timeout!
   ```

4. **Event Listeners**: Always remove in cleanup
   ```javascript
   // ✅ Good
   emitter.on('event', handler);
   // Cleanup
   emitter.removeListener('event', handler);
   
   // ❌ Bad
   emitter.on('event', handler); // Never removed!
   ```

## Emergency Procedures

### If CPU Usage Spikes

1. **Identify the Process**
   ```bash
   ps aux | grep node | sort -k3 -rn
   ```

2. **Check for Stuck Tests**
   ```bash
   cd Maya/backend
   ./stop.sh
   ```

3. **Kill All Node Processes**
   ```bash
   pkill -9 node
   ```

4. **Review Recent Changes**
   - Check test files for recursive execution
   - Check for unbounded loops
   - Check for timer accumulation

5. **Run CPU Monitoring Test**
   ```bash
   cd Maya/backend
   npm test -- tests/performance_tests/cpu-usage-monitoring.test.js
   ```

## Summary

**Status**: ✅ **FULLY IMPLEMENTED**

- ✅ CPU usage benchmarks defined
- ✅ Monitoring tests in place
- ✅ Prevention measures enforced
- ✅ Code review checklist created
- ✅ Emergency procedures documented

**Key Metrics**:
- Normal: < 10% CPU
- Stress: < 50% CPU
- Peak: < 80% CPU
- Idle: < 5% CPU

**Prevention**:
- No recursive test execution
- Timer cleanup enforced
- Promise timeout protection
- Loop bounds enforced
- Resource cleanup verified
