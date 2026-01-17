/**
 * E2E Button Confirmation Dialog Tests
 * 
 * Tests to ensure the "Run End-to-End Tests" button:
 * - Shows confirmation dialog when clicked
 * - Displays dynamic test counts
 * - Allows user to confirm or cancel
 * - Triggers test execution when confirmed
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const e2eHtmlPath = join(__dirname, '../e2e.html');
const jestResultsPath = join(__dirname, '../jest-results.json');

describe('E2E Button Confirmation Dialog', () => {
  let htmlContent;
  let jestResults;

  beforeEach(() => {
    htmlContent = readFileSync(e2eHtmlPath, 'utf-8');
    if (existsSync(jestResultsPath)) {
      try {
        const fileContent = readFileSync(jestResultsPath, 'utf-8');
        if (fileContent && fileContent.trim()) {
          jestResults = JSON.parse(fileContent);
        }
      } catch (error) {
        // File might be empty or malformed, use empty object
        jestResults = null;
      }
    }
  });

  describe('Button Setup', () => {
    test('should have run-e2e-tests-btn button with event listener', () => {
      expect(htmlContent).toMatch(/id=['"]run-e2e-tests-btn['"]/);
      // Button should have event listener setup (either onclick or addEventListener)
      expect(htmlContent).toMatch(/addEventListener.*click.*showRunTestsModal|setupRunTestsButton|run-e2e-tests-btn.*addEventListener/);
    });

    test('should have showRunTestsModal function defined', () => {
      // Check for function definition (may be assigned to window or defined directly)
      expect(htmlContent).toMatch(/window\.showRunTestsModal\s*=|async function showRunTestsModal|function showRunTestsModal/);
    });

    test('button should have correct text', () => {
      expect(htmlContent).toMatch(/Run End-to-End Tests/);
    });
  });

  describe('Confirmation Dialog Functionality', () => {
    test('showRunTestsModal should check server status first', () => {
      expect(htmlContent).toMatch(/fetch.*health|checkServerStatus/);
    });

    test('showRunTestsModal should call getTestCounts', () => {
      // Check that getTestCounts is called in showRunTestsModal
      expect(htmlContent).toMatch(/counts\s*=\s*await getTestCounts\(\)/);
    });

    test('showRunTestsModal should show confirm dialog', () => {
      expect(htmlContent).toMatch(/const confirmed\s*=\s*confirm\(/);
    });

    test('confirmation dialog should include dynamic test counts', () => {
      expect(htmlContent).toMatch(/Run \$\{testCountText\}/);
      expect(htmlContent).toMatch(/testCountText.*counts\.totalTests/);
    });

    test('confirmation dialog should include execution time estimate', () => {
      expect(htmlContent).toMatch(/20-30 seconds|approximately.*seconds/);
    });

    test('confirmation dialog should include dashboard update message', () => {
      expect(htmlContent).toMatch(/Update dashboard|dashboard with results/);
    });

    test('confirmation dialog should have OK/Cancel instructions', () => {
      expect(htmlContent).toMatch(/Click OK.*Cancel|OK to proceed.*Cancel to abort/);
    });
  });

  describe('User Interaction Flow', () => {
    test('should return early if user cancels', () => {
      expect(htmlContent).toMatch(/if\s*\(!confirmed\)[\s\S]*?return/);
    });

    test('should call runE2ETests when user confirms', () => {
      expect(htmlContent).toMatch(/runE2ETests\(\)/);
      // Should be called after confirmation check
      const confirmationMatch = htmlContent.match(/if\s*\(!confirmed\)[\s\S]*?runE2ETests/);
      expect(confirmationMatch).toBeTruthy();
    });

    test('should handle errors gracefully', () => {
      // Check that showRunTestsModal has try-catch
      expect(htmlContent).toMatch(/async function showRunTestsModal[\s\S]*?try/);
      expect(htmlContent).toMatch(/catch.*error.*showRunTestsModal|showRunTestsModal[\s\S]*?catch/);
    });
  });

  describe('Dynamic Test Counts in Dialog', () => {
    test('should use counts.totalTests in dialog text', () => {
      expect(htmlContent).toMatch(/counts\.totalTests/);
    });

    test('should use counts.totalSuites in dialog text', () => {
      expect(htmlContent).toMatch(/counts\.totalSuites/);
    });

    test('should handle zero counts gracefully', () => {
      expect(htmlContent).toMatch(/counts\.totalTests\s*>\s*0|totalTests\s*>\s*0/);
      expect(htmlContent).toMatch(/all test suites|test suites/);
    });

    test('should format plural/singular correctly', () => {
      expect(htmlContent).toMatch(/suite\$\{counts\.totalSuites !== 1 \? 's' : ''\}/);
      expect(htmlContent).toMatch(/test\$\{counts\.totalTests !== 1 \? 's' : ''\}/);
    });
  });

  describe('Error Handling', () => {
    test('should handle getTestCounts errors gracefully', () => {
      expect(htmlContent).toMatch(/try[\s\S]*?getTestCounts[\s\S]*?catch/);
    });

    test('should use default counts if getTestCounts fails', () => {
      expect(htmlContent).toMatch(/totalTests:\s*0.*totalSuites:\s*0/);
    });

    test('should log errors for debugging', () => {
      expect(htmlContent).toMatch(/safeLog.*error|console\.error/);
    });

    test('should show user-friendly error message', () => {
      expect(htmlContent).toMatch(/alert.*Error|Unable to start test execution/);
    });
  });

  describe('Server Status Check', () => {
    test('should check server health before showing dialog', () => {
      // Check that health check happens in showRunTestsModal
      expect(htmlContent).toMatch(/fetch.*health/);
      expect(htmlContent).toMatch(/showRunTestsModal/);
    });

    test('should show connection error if server unavailable', () => {
      expect(htmlContent).toMatch(/if\s*\(!serverAvailable\)[\s\S]*?checkServerStatus/);
    });

    test('should use AbortController for timeout (browser compatible)', () => {
      // Should use AbortController instead of AbortSignal.timeout for compatibility
      expect(htmlContent).toMatch(/AbortController|controller\.signal|new AbortController/);
    });
  });

  describe('Logging and Debugging', () => {
    test('should log button click', () => {
      expect(htmlContent).toMatch(/safeLog.*Run tests button clicked|button clicked/);
    });

    test('should log test counts retrieval', () => {
      expect(htmlContent).toMatch(/safeLog.*Test counts|test counts retrieved/);
    });

    test('should log confirmation dialog display', () => {
      expect(htmlContent).toMatch(/safeLog.*confirmation dialog|Showing confirmation/);
    });

    test('should log user cancellation', () => {
      expect(htmlContent).toMatch(/safeLog.*cancelled|User cancelled/);
    });

    test('should log test execution start', () => {
      expect(htmlContent).toMatch(/safeLog.*starting test|User confirmed/);
    });
  });
});
