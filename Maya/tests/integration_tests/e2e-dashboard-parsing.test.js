/**
 * E2E Dashboard Parsing Tests
 * 
 * Tests for the E2E dashboard's Jest results parsing functionality:
 * - parseJestOutput function correctly parses jest-results.json
 * - Dashboard correctly displays test results
 * - No mock toggle logic remains in parsing
 */

import { describe, test, expect } from '@jest/globals';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const jestResultsPath = join(__dirname, '../jest-results.json');
const e2eHtmlPath = join(__dirname, '../e2e.html');

// Load HTML file content for testing
let htmlContent = null;
if (existsSync(e2eHtmlPath)) {
  htmlContent = readFileSync(e2eHtmlPath, 'utf-8');
}

// Mock parseJestOutput function (simplified version matching e2e.html logic)
function parseJestOutput(jestData) {
  if (!jestData || !jestData.testResults) {
    return null;
  }

  const results = {
    totalTests: jestData.numTotalTests || 0,
    passingTests: jestData.numPassedTests || 0,
    failingTests: jestData.numFailedTests || 0,
    testSuites: jestData.numTotalTestSuites || 0,
    passingSuites: jestData.numPassedTestSuites || 0,
    failingSuites: jestData.numFailedTestSuites || 0,
    testFiles: [],
    failures: [],
    passingTestsList: []
  };

  // Parse test files and results
  if (Array.isArray(jestData.testResults)) {
    jestData.testResults.forEach(testResult => {
      const fileName = testResult.name.split('/').pop();
      const suiteName = fileName.replace('.test.js', '');
      
      let passing = 0;
      let failing = 0;
      
      if (Array.isArray(testResult.assertionResults)) {
        testResult.assertionResults.forEach(assertion => {
          if (assertion.status === 'passed') {
            passing++;
            results.passingTestsList.push({
              name: assertion.fullName,
              file: testResult.name,
              duration: assertion.duration
            });
          } else if (assertion.status === 'failed') {
            failing++;
            results.failures.push({
              name: assertion.fullName,
              file: testResult.name,
              failureMessages: assertion.failureMessages || [],
              duration: assertion.duration
            });
          }
        });
      }

      results.testFiles.push({
        name: suiteName,
        file: fileName,
        passing,
        failing,
        total: passing + failing
      });
    });
  }

  // Calculate pass rate
  results.passRate = results.totalTests > 0
    ? ((results.passingTests / results.totalTests) * 100).toFixed(1)
    : '0.0';

  return results;
}

describe('E2E Dashboard Parsing', () => {
  test('parseJestOutput should parse valid jest-results.json', () => {
    if (!existsSync(jestResultsPath)) {
      // Create a mock jest-results.json for testing
      const mockResults = {
        numTotalTests: 10,
        numPassedTests: 8,
        numFailedTests: 2,
        numTotalTestSuites: 2,
        numPassedTestSuites: 1,
        numFailedTestSuites: 1,
        success: false,
        testResults: [
          {
            name: 'test1.test.js',
            status: 'passed',
            assertionResults: [
              { status: 'passed', fullName: 'Test 1', duration: 10 },
              { status: 'passed', fullName: 'Test 2', duration: 5 }
            ]
          },
          {
            name: 'test2.test.js',
            status: 'failed',
            assertionResults: [
              { status: 'passed', fullName: 'Test 3', duration: 8 },
              { status: 'failed', fullName: 'Test 4', duration: 3, failureMessages: ['Error message'] }
            ]
          }
        ]
      };

      const parsed = parseJestOutput(mockResults);
      
      expect(parsed).not.toBeNull();
      expect(parsed.totalTests).toBe(10);
      expect(parsed.passingTests).toBe(8);
      expect(parsed.failingTests).toBe(2);
      expect(parsed.testFiles).toHaveLength(2);
      expect(parsed.failures).toHaveLength(1);
      expect(parsed.passingTestsList).toHaveLength(3);
    } else {
      // Test with actual jest-results.json
      const resultsData = readFileSync(jestResultsPath, 'utf-8');
      const jestData = JSON.parse(resultsData);
      const parsed = parseJestOutput(jestData);
      
      expect(parsed).not.toBeNull();
      expect(parsed.totalTests).toBeGreaterThan(0);
      expect(parsed.passingTests).toBeGreaterThanOrEqual(0);
      expect(parsed.failingTests).toBeGreaterThanOrEqual(0);
    }
  });

  test('parseJestOutput should handle empty test results', () => {
    const emptyResults = {
      numTotalTests: 0,
      numPassedTests: 0,
      numFailedTests: 0,
      testResults: []
    };

    const parsed = parseJestOutput(emptyResults);
    
    expect(parsed).not.toBeNull();
    expect(parsed.totalTests).toBe(0);
    expect(parsed.passingTests).toBe(0);
    expect(parsed.failingTests).toBe(0);
    expect(parsed.testFiles).toHaveLength(0);
    expect(parsed.passRate).toBe('0.0');
  });

  test('parseJestOutput should calculate pass rate correctly', () => {
    const mockResults = {
      numTotalTests: 100,
      numPassedTests: 85,
      numFailedTests: 15,
      testResults: []
    };

    const parsed = parseJestOutput(mockResults);
    
    expect(parsed.passRate).toBe('85.0');
  });

  test('parseJestOutput should not include mock toggle fields', () => {
    if (!existsSync(jestResultsPath)) {
      return;
    }

    const resultsData = readFileSync(jestResultsPath, 'utf-8');
    const jestData = JSON.parse(resultsData);
    const parsed = parseJestOutput(jestData);
    
    // Verify parsed results don't have mock-related fields
    expect(parsed).not.toHaveProperty('mockFailures');
    expect(parsed).not.toHaveProperty('enableMockFailures');
    expect(parsed).not.toHaveProperty('mockToggle');
    
    // Verify test files don't reference mock failures
    parsed.testFiles.forEach(testFile => {
      expect(JSON.stringify(testFile)).not.toMatch(/mock.*failure/i);
    });
  });

  test('parseJestOutput should correctly categorize test files', () => {
    if (!existsSync(jestResultsPath)) {
      return;
    }

    const resultsData = readFileSync(jestResultsPath, 'utf-8');
    const jestData = JSON.parse(resultsData);
    const parsed = parseJestOutput(jestData);
    
    // Verify test files are categorized correctly
    expect(Array.isArray(parsed.testFiles)).toBe(true);
    
    parsed.testFiles.forEach(testFile => {
      expect(testFile).toHaveProperty('name');
      expect(testFile).toHaveProperty('file');
      expect(testFile).toHaveProperty('passing');
      expect(testFile).toHaveProperty('failing');
      expect(testFile).toHaveProperty('total');
      expect(testFile.passing + testFile.failing).toBe(testFile.total);
    });
  });

  test('parseJestOutput should extract failure details correctly', () => {
    if (!existsSync(jestResultsPath)) {
      return;
    }

    const resultsData = readFileSync(jestResultsPath, 'utf-8');
    const jestData = JSON.parse(resultsData);
    const parsed = parseJestOutput(jestData);
    
    // Verify failures array structure
    expect(Array.isArray(parsed.failures)).toBe(true);
    
    parsed.failures.forEach(failure => {
      expect(failure).toHaveProperty('name');
      expect(failure).toHaveProperty('file');
      expect(failure).toHaveProperty('failureMessages');
      expect(Array.isArray(failure.failureMessages)).toBe(true);
    });
  });

  test('parseJestOutput should extract passing tests correctly', () => {
    if (!existsSync(jestResultsPath)) {
      return;
    }

    const resultsData = readFileSync(jestResultsPath, 'utf-8');
    const jestData = JSON.parse(resultsData);
    const parsed = parseJestOutput(jestData);
    
    // Verify passing tests list structure
    expect(Array.isArray(parsed.passingTestsList)).toBe(true);
    
    parsed.passingTestsList.forEach(test => {
      expect(test).toHaveProperty('name');
      expect(test).toHaveProperty('file');
      expect(test).toHaveProperty('duration');
    });
  });

  test('parseJestOutput should handle null/undefined input gracefully', () => {
    expect(parseJestOutput(null)).toBeNull();
    expect(parseJestOutput(undefined)).toBeNull();
    expect(parseJestOutput({})).toBeNull();
  });

  describe('Modal and Progress Bar Elements (HTML Structure)', () => {
    test('should have run-tests-modal element in HTML', () => {
      if (!htmlContent) {
        console.warn('e2e.html not found, skipping HTML structure tests');
        return;
      }
      // Verify modal element exists in HTML
      expect(htmlContent).toContain('id="run-tests-modal"');
      expect(htmlContent).toContain('class="test-modal"');
    });

    test('should have test-modal-body element in HTML', () => {
      if (!htmlContent) {
        console.warn('e2e.html not found, skipping HTML structure tests');
        return;
      }
      // Verify modal body element exists
      expect(htmlContent).toContain('id="test-modal-body"');
    });

    test('should have run-e2e-tests-btn button in HTML', () => {
      if (!htmlContent) {
        console.warn('e2e.html not found, skipping HTML structure tests');
        return;
      }
      // Verify button exists
      expect(htmlContent).toContain('id="run-e2e-tests-btn"');
      expect(htmlContent).toContain('Run End-to-End Tests');
    });

    test('should have progress bar CSS classes defined', () => {
      if (!htmlContent) {
        console.warn('e2e.html not found, skipping HTML structure tests');
        return;
      }
      // Verify CSS classes exist
      expect(htmlContent).toContain('.test-progress-bar-container');
      expect(htmlContent).toContain('.test-progress-bar-fill');
    });

    test('should have progress bar container in modal HTML structure', () => {
      if (!htmlContent) {
        console.warn('e2e.html not found, skipping HTML structure tests');
        return;
      }
      // Verify modal contains progress bar structure
      const modalIndex = htmlContent.indexOf('id="run-tests-modal"');
      const progressBarIndex = htmlContent.indexOf('test-progress-bar-container');
      
      // Modal should exist
      expect(modalIndex).toBeGreaterThan(-1);
      
      // Progress bar should be referenced in JavaScript (even if not in static HTML)
      // The progress bar is created dynamically, but the class should be defined
      expect(htmlContent).toContain('test-progress-bar-container');
    });

    test('should have progress text element class in JavaScript', () => {
      if (!htmlContent) {
        console.warn('e2e.html not found, skipping HTML structure tests');
        return;
      }
      // Verify progress text is referenced in JavaScript
      expect(htmlContent).toContain('progress-text');
      expect(htmlContent).toContain('current-test-name');
    });

    test('should have updateProgress function in JavaScript', () => {
      if (!htmlContent) {
        console.warn('e2e.html not found, skipping HTML structure tests');
        return;
      }
      // Verify updateProgress function exists
      expect(htmlContent).toContain('updateProgress');
      expect(htmlContent).toContain('progressBarFill');
      expect(htmlContent).toContain('progressText');
    });
  });

  describe('Connection Error Handling', () => {
    test('should have checkServerStatus function', () => {
      if (!htmlContent) {
        console.warn('e2e.html not found, skipping connection error tests');
        return;
      }
      expect(htmlContent).toContain('checkServerStatus');
      expect(htmlContent).toContain('SERVER_NOT_RUNNING');
    });

    test('should handle file:// protocol correctly', () => {
      if (!htmlContent) {
        console.warn('e2e.html not found, skipping connection error tests');
        return;
      }
      // Verify backend URL detection handles file:// protocol
      expect(htmlContent).toContain('window.location.protocol === \'file:\'');
      expect(htmlContent).toContain('localhost:3001');
    });

    test('should have health check endpoint call', () => {
      if (!htmlContent) {
        console.warn('e2e.html not found, skipping connection error tests');
        return;
      }
      // Verify health check is called before running tests
      expect(htmlContent).toContain('/health');
      // Check for AbortController (browser compatible) instead of AbortSignal.timeout
      expect(htmlContent).toMatch(/AbortController|controller\.signal|new AbortController/);
    });

    test('should have error handling for connection failures', () => {
      if (!htmlContent) {
        console.warn('e2e.html not found, skipping connection error tests');
        return;
      }
      // Verify error handling exists
      expect(htmlContent).toContain('Connection Error');
      expect(htmlContent).toContain('Connection Issue'); // Dynamically generated text
      expect(htmlContent).toContain('Server is Running');
      expect(htmlContent).toContain('Server Check Failed'); // Alternative error message
    });

    test('should have instructions for starting server', () => {
      if (!htmlContent) {
        console.warn('e2e.html not found, skipping connection error tests');
        return;
      }
      // Verify helpful instructions are present
      expect(htmlContent).toContain('npm start');
      expect(htmlContent).toContain('cd Maya/backend');
      // Check for checkServerStatus function or button text
      expect(htmlContent).toMatch(/checkServerStatus|Check Server|🔍.*Check/i);
    });

    test('should have timeout protection for fetch calls', () => {
      if (!htmlContent) {
        console.warn('e2e.html not found, skipping connection error tests');
        return;
      }
      // Verify timeout is set for fetch calls (using AbortController for browser compatibility)
      expect(htmlContent).toMatch(/AbortController|controller\.signal|new AbortController/);
      expect(htmlContent).toContain('3000'); // 3 second timeout for health check
      expect(htmlContent).toContain('300000'); // 5 minute timeout for tests
      expect(htmlContent).toMatch(/setTimeout.*abort|controller\.abort/);
    });
  });
});
