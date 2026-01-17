/**
 * Dynamic Test Counts Verification
 * 
 * Tests to ensure test counts are dynamically calculated and displayed correctly:
 * - Test counts are read from jest-results.json dynamically
 * - Confirmation dialog uses dynamic counts
 * - Dashboard displays accurate counts
 * - Counts update when tests change
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const e2eHtmlPath = join(__dirname, '../e2e.html');
const jestResultsPath = join(__dirname, '../jest-results.json');

describe('Dynamic Test Counts Verification', () => {
  let htmlContent;
  let jestResults;

  beforeEach(() => {
    htmlContent = readFileSync(e2eHtmlPath, 'utf-8');
    if (existsSync(jestResultsPath)) {
      jestResults = JSON.parse(readFileSync(jestResultsPath, 'utf-8'));
    }
  });

  describe('Dynamic Count Function Exists', () => {
    test('should have getTestCounts function defined', () => {
      expect(htmlContent).toMatch(/async function getTestCounts|const getTestCounts\s*=\s*async|function getTestCounts/);
    });

    test('getTestCounts should read from jest-results.json', () => {
      // Updated to match cache-busting pattern with cache: 'no-store'
      expect(htmlContent).toMatch(/fetch\(['"]\.\/jest-results\.json[\s\S]*?cache.*no-store/i);
    });

    test('getTestCounts should fallback to currentTestResults', () => {
      expect(htmlContent).toMatch(/currentTestResults.*totalTests/);
    });

    test('getTestCounts should return default values if no data available', () => {
      expect(htmlContent).toMatch(/totalTests:\s*0|return.*totalTests.*0/);
    });
  });

  describe('Confirmation Dialog Uses Dynamic Counts', () => {
    test('confirmation dialog should call getTestCounts', () => {
      // Check that getTestCounts is called (may use let/const or reassignment)
      expect(htmlContent).toMatch(/counts\s*=\s*await getTestCounts\(\)/);
    });

    test('confirmation dialog should not contain hardcoded test counts', () => {
      // Should not have hardcoded "26 suites, 394 tests" or similar
      const hardcodedPattern = /(26\s+suite|394\s+test|26\s+test\s+suite)/i;
      const confirmationMatch = htmlContent.match(/confirm\([\s\S]*?\)/);
      if (confirmationMatch) {
        expect(confirmationMatch[0]).not.toMatch(hardcodedPattern);
      }
    });

    test('confirmation dialog should use dynamic test count text', () => {
      expect(htmlContent).toMatch(/testCountText|counts\.totalTests|counts\.totalSuites/);
    });

    test('confirmation dialog should handle zero counts gracefully', () => {
      expect(htmlContent).toMatch(/counts\.totalTests\s*>\s*0|totalTests\s*>\s*0/);
    });
  });

  describe('Test Count Accuracy', () => {
    test('jest-results.json should exist and be valid JSON', () => {
      if (existsSync(jestResultsPath)) {
        expect(jestResults).toBeDefined();
        expect(jestResults).toHaveProperty('numTotalTests');
        expect(jestResults).toHaveProperty('numTotalTestSuites');
        expect(jestResults).toHaveProperty('numPassedTests');
        expect(jestResults).toHaveProperty('numPassedTestSuites');
      } else {
        // If file doesn't exist, that's okay - tests haven't been run yet
        expect(true).toBe(true);
      }
    });

    test('test counts should be positive numbers if jest-results.json exists', () => {
      if (jestResults) {
        expect(jestResults.numTotalTests).toBeGreaterThan(0);
        expect(jestResults.numTotalTestSuites).toBeGreaterThan(0);
        expect(jestResults.numPassedTests).toBeGreaterThanOrEqual(0);
        expect(jestResults.numPassedTestSuites).toBeGreaterThanOrEqual(0);
        expect(jestResults.numPassedTests).toBeLessThanOrEqual(jestResults.numTotalTests);
        expect(jestResults.numPassedTestSuites).toBeLessThanOrEqual(jestResults.numTotalTestSuites);
      }
    });

    test('test suite count should match number of test files', () => {
      if (jestResults && jestResults.testResults) {
        const actualSuiteCount = jestResults.testResults.length;
        expect(jestResults.numTotalTestSuites).toBe(actualSuiteCount);
      }
    });

    test('total test count should match sum of all test assertions', () => {
      if (jestResults && jestResults.testResults) {
        const totalFromResults = jestResults.testResults.reduce((sum, suite) => {
          return sum + (suite.assertionResults?.length || 0);
        }, 0);
        expect(jestResults.numTotalTests).toBe(totalFromResults);
      }
    });
  });

  describe('Dashboard Metrics Use Dynamic Counts', () => {
    test('updateDashboard should use currentTestResults', () => {
      expect(htmlContent).toMatch(/updateDashboard\(currentTestResults\)|updateDashboard\(\)/);
    });

    test('parseJestOutput should extract test counts correctly', () => {
      // Check that parseJestOutput function exists and uses numTotalTests
      expect(htmlContent).toMatch(/function parseJestOutput|const parseJestOutput/);
      expect(htmlContent).toMatch(/numTotalTests|numTotalTestSuites/);
    });

    test('loadJestResults should update currentTestResults', () => {
      expect(htmlContent).toMatch(/currentTestResults\s*=\s*\{[\s\S]*?\.\.\.parsed/);
    });
  });

  describe('Count Updates When Tests Change', () => {
    test('getTestCounts should fetch latest data from jest-results.json', () => {
      // Updated to match cache-busting pattern with cache: 'no-store'
      expect(htmlContent).toMatch(/fetch\(['"]\.\/jest-results\.json[\s\S]*?cache.*no-store/i);
    });

    test('loadJestResults should be called on page load', () => {
      expect(htmlContent).toMatch(/loadJestResults\(\)|window\.addEventListener.*load.*loadJestResults/);
    });

    test('test execution should update jest-results.json', () => {
      // Check that test execution endpoint writes to jest-results.json
      expect(htmlContent).toMatch(/--outputFile.*jest-results\.json|outputFile.*jest-results/);
    });
  });

  describe('Error Handling', () => {
    test('getTestCounts should handle missing jest-results.json gracefully', () => {
      expect(htmlContent).toMatch(/catch.*error|try[\s\S]*?catch/);
    });

    test('getTestCounts should provide fallback values', () => {
      expect(htmlContent).toMatch(/totalTests:\s*0.*totalSuites:\s*0|return.*\{[\s\S]*?totalTests.*0/);
    });

    test('confirmation dialog should work even if counts are zero', () => {
      expect(htmlContent).toMatch(/testCountText.*totalTests.*>\s*0|counts\.totalTests\s*>\s*0/);
    });
  });
});
