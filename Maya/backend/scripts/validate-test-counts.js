#!/usr/bin/env node
/**
 * Validate Test Counts Script
 * 
 * Validates that documentation and UI display accurate test counts
 * by comparing against actual jest-results.json
 * 
 * Usage: node scripts/validate-test-counts.js
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const backendDir = join(__dirname, '..');
const testsDir = join(backendDir, '../tests');
const jestResultsPath = join(testsDir, 'jest-results.json');
const e2eHtmlPath = join(testsDir, 'e2e.html');

// Files to check for hardcoded counts
const filesToCheck = [
  { path: join(backendDir, 'TEST_COMMANDS.md'), name: 'TEST_COMMANDS.md' },
  { path: join(backendDir, '../Implementation.md'), name: 'Implementation.md' },
  { path: e2eHtmlPath, name: 'e2e.html' }
];

function getActualCounts() {
  if (!existsSync(jestResultsPath)) {
    console.log('⚠️  jest-results.json not found. Run tests first: npm test');
    return null;
  }

  try {
    const jestResults = JSON.parse(readFileSync(jestResultsPath, 'utf-8'));
    return {
      totalTests: jestResults.numTotalTests || 0,
      totalSuites: jestResults.numTotalTestSuites || 0,
      passedTests: jestResults.numPassedTests || 0,
      passedSuites: jestResults.numPassedTestSuites || 0,
      failedTests: jestResults.numFailedTests || 0,
      failedSuites: jestResults.numFailedTestSuites || 0
    };
  } catch (error) {
    console.error('❌ Error reading jest-results.json:', error.message);
    return null;
  }
}

function checkFileForHardcodedCounts(filePath, fileName, actualCounts) {
  if (!existsSync(filePath)) {
    console.log(`⚠️  File not found: ${fileName}`);
    return { hasHardcoded: false, issues: [] };
  }

  const content = readFileSync(filePath, 'utf-8');
  const issues = [];

  // Check for hardcoded patterns
  const patterns = [
    { regex: /(\d+)\s+suite/i, name: 'hardcoded suite count' },
    { regex: /(\d+)\s+test/i, name: 'hardcoded test count' },
    { regex: /394\s+test/i, name: 'hardcoded 394 tests' },
    { regex: /26\s+suite/i, name: 'hardcoded 26 suites' }
  ];

  // Check for dynamic patterns (should be present)
  const dynamicPatterns = [
    { regex: /getTestCounts|counts\.totalTests|currentTestResults\.totalTests/i, name: 'dynamic count function' },
    { regex: /jest-results\.json|numTotalTests/i, name: 'jest-results.json reference' }
  ];

  // Check for hardcoded counts in confirmation dialog
  if (fileName === 'e2e.html') {
    const confirmationMatch = content.match(/confirm\([\s\S]*?\)/);
    if (confirmationMatch) {
      const confirmationText = confirmationMatch[0];
      // Should not have hardcoded numbers like "26 suites, 394 tests"
      if (/\d+\s+suite.*\d+\s+test/i.test(confirmationText) && 
          !confirmationText.includes('getTestCounts') && 
          !confirmationText.includes('counts.totalTests')) {
        issues.push({
          type: 'hardcoded',
          message: 'Confirmation dialog contains hardcoded test counts',
          line: confirmationText.substring(0, 100)
        });
      }
    }
  }

  // Check if file uses dynamic counts
  const hasDynamic = dynamicPatterns.some(p => p.regex.test(content));
  if (!hasDynamic && fileName === 'e2e.html') {
    issues.push({
      type: 'missing_dynamic',
      message: 'File does not use dynamic test counts',
      suggestion: 'Add getTestCounts() function and use it in confirmation dialog'
    });
  }

  return {
    hasHardcoded: issues.length > 0,
    issues,
    hasDynamic
  };
}

function main() {
  console.log('🔍 Validating Test Counts...\n');

  const actualCounts = getActualCounts();
  if (!actualCounts) {
    console.log('💡 Run tests first to generate jest-results.json:');
    console.log('   cd Maya/backend && npm test -- --json --outputFile=../tests/jest-results.json\n');
    process.exit(1);
  }

  console.log('📊 Actual Test Counts (from jest-results.json):');
  console.log(`   Total Tests: ${actualCounts.totalTests}`);
  console.log(`   Total Suites: ${actualCounts.totalSuites}`);
  console.log(`   Passed Tests: ${actualCounts.passedTests}`);
  console.log(`   Passed Suites: ${actualCounts.passedSuites}`);
  console.log(`   Failed Tests: ${actualCounts.failedTests}`);
  console.log(`   Failed Suites: ${actualCounts.failedSuites}\n`);

  let hasIssues = false;
  const results = [];

  for (const file of filesToCheck) {
    const result = checkFileForHardcodedCounts(file.path, file.name, actualCounts);
    results.push({ file: file.name, ...result });
    if (result.hasHardcoded || (!result.hasDynamic && file.name === 'e2e.html')) {
      hasIssues = true;
    }
  }

  console.log('📋 Validation Results:\n');
  for (const result of results) {
    if (result.hasHardcoded || result.issues.length > 0) {
      console.log(`❌ ${result.file}:`);
      result.issues.forEach(issue => {
        console.log(`   - ${issue.message}`);
        if (issue.suggestion) {
          console.log(`     💡 ${issue.suggestion}`);
        }
      });
      console.log('');
    } else if (result.hasDynamic || result.file !== 'e2e.html') {
      console.log(`✅ ${result.file}: Using dynamic counts or appropriate format\n`);
    } else {
      console.log(`⚠️  ${result.file}: Could not verify dynamic counts\n`);
    }
  }

  if (hasIssues) {
    console.log('❌ Validation failed: Some files contain hardcoded counts or missing dynamic implementation');
    process.exit(1);
  } else {
    console.log('✅ Validation passed: All files use dynamic counts or appropriate format');
    process.exit(0);
  }
}

main();
