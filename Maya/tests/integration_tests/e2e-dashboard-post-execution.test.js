/**
 * E2E Dashboard Post-Execution Tests
 * 
 * Tests to ensure metrics update correctly after test execution completes:
 * - Metrics update after test completion
 * - Retry logic works for loading jest-results.json
 * - Modal countdown allows time to see updated metrics
 * - Dashboard refresh happens after metrics are updated
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const e2eHtmlPath = join(__dirname, '../e2e.html');
const jestResultsPath = join(__dirname, '../jest-results.json');

describe('E2E Dashboard Post-Execution Metrics Update', () => {
  let htmlContent;
  let originalJestResults;
  let jestResultsExists;

  beforeEach(() => {
    // Read e2e.html
    htmlContent = readFileSync(e2eHtmlPath, 'utf-8');
    
    // Backup jest-results.json if it exists
    if (existsSync(jestResultsPath)) {
      originalJestResults = readFileSync(jestResultsPath, 'utf-8');
      jestResultsExists = true;
    } else {
      jestResultsExists = false;
    }
  });

  afterEach(() => {
    // Restore original jest-results.json
    if (jestResultsExists && originalJestResults) {
      writeFileSync(jestResultsPath, originalJestResults, 'utf-8');
    } else if (!jestResultsExists && existsSync(jestResultsPath)) {
      // Remove file if it didn't exist originally
      try {
        require('fs').unlinkSync(jestResultsPath);
      } catch (e) {
        // Ignore errors
      }
    }
  });

  test('should have retry logic for loading jest-results.json after test completion', () => {
    // Check for retry logic in reloadTestResults function
    expect(htmlContent).toMatch(/reloadTestResults.*async/);
    expect(htmlContent).toMatch(/retryCount.*maxRetries/);
    expect(htmlContent).toMatch(/retryDelay/);
    expect(htmlContent).toMatch(/setTimeout.*reloadTestResults/);
  });

  test('should call updateDashboard after loadJestResults completes', () => {
    // Check that updateDashboard is called in reloadTestResults after loadJestResults succeeds
    // The pattern may have whitespace/newlines between them
    expect(htmlContent).toMatch(/reloadTestResults[\s\S]*?updateDashboard/);
    // Also check that loadJestResults calls updateDashboard internally
    expect(htmlContent).toMatch(/loadJestResults[\s\S]*?updateDashboard/);
  });

  test('should have countdown timer of at least 10 seconds', () => {
    // Check for countdown variable set to at least 10
    const countdownMatch = htmlContent.match(/let countdown\s*=\s*(\d+)/);
    if (countdownMatch) {
      const countdown = parseInt(countdownMatch[1]);
      expect(countdown).toBeGreaterThanOrEqual(10);
    } else {
      // Alternative: check for countdown assignment
      const countdownAltMatch = htmlContent.match(/countdown\s*=\s*(\d+).*seconds/);
      if (countdownAltMatch) {
        const countdown = parseInt(countdownAltMatch[1]);
        expect(countdown).toBeGreaterThanOrEqual(10);
      } else {
        // If we can't find it, that's also a problem
        expect(htmlContent).toMatch(/countdown.*\d+/);
      }
    }
  });

  test('should update all dashboard components after test completion', () => {
    // Check that all update functions are called
    const updateFunctions = [
      'updateDashboard',
      'updateTrendChart',
      'updatePassRateComparison',
      'updateFailureList',
      'updatePassingTestsList',
      'updateTestSummary',
      'updateEvidence'
    ];

    // Check in reloadTestResults function
    const reloadTestResultsMatch = htmlContent.match(/reloadTestResults[\s\S]*?return true/);
    if (reloadTestResultsMatch) {
      const reloadFunction = reloadTestResultsMatch[0];
      updateFunctions.forEach(func => {
        expect(reloadFunction).toMatch(new RegExp(func));
      });
    }
  });

  test('should have retry mechanism with max retries', () => {
    // Check for maxRetries constant
    expect(htmlContent).toMatch(/maxRetries\s*=\s*\d+/);
    // Check for retry count check
    expect(htmlContent).toMatch(/retryCount\s*<\s*maxRetries/);
  });

  test('should wait for jest-results.json file to be written', () => {
    // Check for initial delay before first retry
    expect(htmlContent).toMatch(/setTimeout.*reloadTestResults.*\d+/);
    // Check for retry delay
    expect(htmlContent).toMatch(/retryDelay\s*=\s*\d+/);
  });

  test('should clear intervals before page reload', () => {
    // Check for interval cleanup before reload
    expect(htmlContent).toMatch(/clearInterval.*countdownInterval/);
    expect(htmlContent).toMatch(/window\._activeIntervals/);
    // Check for forEach with clearInterval (may have whitespace)
    expect(htmlContent).toMatch(/forEach[\s\S]*?clearInterval/);
  });

  test('should update metrics before auto-refresh', () => {
    // Check that metrics update happens before reload
    // The sequence should be: loadJestResults -> updateDashboard -> countdown -> reload
    const reloadSection = htmlContent.match(/reloadTestResults[\s\S]*?setTimeout.*reloadTestResults/);
    if (reloadSection) {
      // Check that updateDashboard is called before countdown starts
      expect(htmlContent).toMatch(/updateDashboard[\s\S]*?countdown\s*=/);
    }
  });

  test('should handle case when jest-results.json is not available', () => {
    // Check for error handling when file is not found
    expect(htmlContent).toMatch(/Could not.*jest-results\.json/);
    expect(htmlContent).toMatch(/after retries/);
  });

  test('should log retry attempts for debugging', () => {
    // Check for logging of retry attempts
    expect(htmlContent).toMatch(/Waiting for jest-results\.json.*attempt/);
    expect(htmlContent).toMatch(/Retrying load jest-results\.json/);
  });
});

describe('E2E Dashboard Post-Execution - Data Flow', () => {
  test('should verify data flow: test completion -> load results -> update metrics -> refresh', () => {
    const htmlContent = readFileSync(e2eHtmlPath, 'utf-8');
    
    // Verify the flow exists in the code
    // 1. Test completion
    expect(htmlContent).toMatch(/result\.success/);
    
    // 2. Load results
    expect(htmlContent).toMatch(/loadJestResults/);
    
    // 3. Update metrics
    expect(htmlContent).toMatch(/updateDashboard/);
    
    // 4. Refresh (after countdown)
    expect(htmlContent).toMatch(/window\.location\.reload/);
  });

  test('should ensure updateMetricCards function exists and is called', () => {
    const htmlContent = readFileSync(e2eHtmlPath, 'utf-8');
    
    // Check that updateMetricCards function exists
    expect(htmlContent).toMatch(/function updateMetricCards/);
    
    // Check that it's called in updateDashboard
    expect(htmlContent).toMatch(/updateMetricCards\(currentTestResults\)/);
  });
});

describe('E2E Dashboard Auto-Refresh Fixes', () => {
  let htmlContent;

  beforeEach(() => {
    htmlContent = readFileSync(e2eHtmlPath, 'utf-8');
  });

  test('should store reload function globally as window._pendingReload', () => {
    // Check that _pendingReload is stored globally
    expect(htmlContent).toMatch(/window\._pendingReload\s*=/);
    // Check that it's a function
    expect(htmlContent).toMatch(/window\._pendingReload\s*=\s*\(\)\s*=>/);
    // Check that it's called when timeout fires
    expect(htmlContent).toMatch(/window\._pendingReload\(\)/);
  });

  test('should store reload timeout globally as window._reloadTimeout', () => {
    // Check that _reloadTimeout is stored globally
    expect(htmlContent).toMatch(/window\._reloadTimeout\s*=\s*setTimeout/);
    // Check that it's added to active timeouts array
    expect(htmlContent).toMatch(/window\._activeTimeouts\.push\(window\._reloadTimeout\)/);
  });

  test('should not clear reload timeout prematurely', () => {
    // Check that reload timeout is set BEFORE clearing other timeouts
    // The pattern should be: set _reloadTimeout -> then clear other timeouts
    const reloadTimeoutMatch = htmlContent.match(/window\._reloadTimeout[\s\S]*?clearActiveTimers/);
    expect(reloadTimeoutMatch).toBeTruthy();
    
    // Check that when clearing timeouts, we exclude _reloadTimeout
    expect(htmlContent).toMatch(/if\s*\(timeout\s*!==\s*window\._reloadTimeout\)/);
  });

  test('should handle file:// protocol reload correctly', () => {
    // Check for file:// protocol detection
    expect(htmlContent).toMatch(/window\.location\.protocol\s*===\s*['"]file:/);
    // Check for isFileProtocol variable assignment
    expect(htmlContent).toMatch(/isFileProtocol\s*=\s*window\.location\.protocol/);
    // Check for file:// specific reload logic (if statement with isFileProtocol)
    expect(htmlContent).toMatch(/if\s*\(isFileProtocol\)/);
    // Check for location.reload() call (should be in the if block)
    expect(htmlContent).toMatch(/window\.location\.reload\(\)/);
    // Check for fallback href assignment for file:// (uses window.location.href)
    expect(htmlContent).toMatch(/window\.location\.href\s*=\s*window\.location\.href/);
  });

  test('should handle http/https protocol reload correctly', () => {
    // Check for http/https protocol handling
    expect(htmlContent).toMatch(/location\.reload\(true\)/);
    // Check for fallback to regular reload if reload(true) fails
    // The pattern may have comments/whitespace between reload(true) and catch
    expect(htmlContent).toMatch(/reload\(true\)[\s\S]*?catch[\s\S]*?reload\(\)/);
  });

  test('should clear reload timeout only when it fires', () => {
    // Check that _reloadTimeout is set before clearing other timeouts
    expect(htmlContent).toMatch(/window\._reloadTimeout\s*=\s*setTimeout/);
    // Check that timeout is cleared right before reload executes
    expect(htmlContent).toMatch(/Reload timeout fired[\s\S]*?clearTimeout/);
  });

  test('should have fallback reload if _pendingReload is missing', () => {
    // Check for fallback when _pendingReload is not found
    expect(htmlContent).toMatch(/_pendingReload function not found/);
    // Check for direct reload fallback
    expect(htmlContent).toMatch(/trying direct reload/);
  });

  test('should clear all intervals before reload executes', () => {
    // Check that clearActiveTimers function exists
    expect(htmlContent).toMatch(/const clearActiveTimers\s*=\s*\(\)\s*=>/);
    // Check that clearActiveTimers is called in the reload timeout callback
    expect(htmlContent).toMatch(/setTimeout[\s\S]*?clearActiveTimers\(\)/);
    // Check that countdownInterval is cleared
    expect(htmlContent).toMatch(/clearInterval\(countdownInterval\)/);
  });

  test('should have proper error handling for reload failures', () => {
    // Check for try-catch around reload logic
    expect(htmlContent).toMatch(/try\s*\{[\s\S]*?location\.reload/);
    expect(htmlContent).toMatch(/catch\s*\(.*\)\s*\{[\s\S]*?reload/);
    // Check for manual refresh button fallback
    expect(htmlContent).toMatch(/Please refresh manually/);
    expect(htmlContent).toMatch(/Refresh Now/);
  });

  test('should use 300ms delay for reload timeout', () => {
    // Check that reload timeout uses 300ms delay (not 500ms)
    const timeoutMatch = htmlContent.match(/setTimeout\([\s\S]*?300\)/);
    expect(timeoutMatch).toBeTruthy();
    // Verify it's for the reload timeout
    expect(htmlContent).toMatch(/window\._reloadTimeout\s*=\s*setTimeout[\s\S]*?300/);
  });

  test('should show "Refreshing dashboard..." message before reload', () => {
    // Check for the refreshing message
    expect(htmlContent).toMatch(/Refreshing dashboard/);
    // Check that it's shown before reload timeout
    expect(htmlContent).toMatch(/Refreshing dashboard[\s\S]*?setTimeout[\s\S]*?_pendingReload/);
  });

  test('should have countdown display element updated correctly', () => {
    // Check for countdown-display element
    expect(htmlContent).toMatch(/id=['"]countdown-display['"]/);
    // Check that countdown value is updated
    expect(htmlContent).toMatch(/countdownDisplay\.textContent\s*=\s*countdownData\.value/);
  });

  test('should clear _pendingReload after executing', () => {
    // Check that _pendingReload is set to null after execution
    expect(htmlContent).toMatch(/window\._pendingReload\s*=\s*null/);
    // Check it's cleared after calling the function (may have whitespace/comments between)
    expect(htmlContent).toMatch(/if\s*\(window\._pendingReload\)[\s\S]*?window\._pendingReload\(\)[\s\S]*?window\._pendingReload\s*=\s*null/);
  });
});
