#!/usr/bin/env node
/**
 * Comprehensive Test Suite Runner
 * 
 * Runs all tests and generates an end-to-end report
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const report = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
  },
  serverStatus: null,
  apiTests: [],
  kbTests: [],
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runTest(name, command, options = {}) {
  const testResult = {
    name,
    command,
    status: 'pending',
    output: '',
    error: null,
    duration: 0,
  };

  try {
    log(`\n${'='.repeat(80)}`, 'cyan');
    log(`Running: ${name}`, 'blue');
    log(`${'='.repeat(80)}`, 'cyan');
    
    const startTime = Date.now();
    const output = execSync(command, {
      cwd: __dirname,
      encoding: 'utf-8',
      stdio: 'pipe',
      timeout: options.timeout || 30000,
    });
    const duration = Date.now() - startTime;
    
    testResult.status = 'passed';
    testResult.output = output;
    testResult.duration = duration;
    
    log(`✅ PASSED (${duration}ms)`, 'green');
    report.summary.passed++;
  } catch (error) {
    const duration = Date.now() - (Date.now() - (error.duration || 0));
    testResult.status = 'failed';
    testResult.error = error.message;
    testResult.output = error.stdout || error.stderr || '';
    testResult.duration = duration;
    
    log(`❌ FAILED: ${error.message}`, 'red');
    if (error.stdout) log(error.stdout, 'yellow');
    if (error.stderr) log(error.stderr, 'yellow');
    report.summary.failed++;
  }
  
  report.tests.push(testResult);
  report.summary.total++;
  return testResult;
}

function checkServerHealth() {
  log(`\n${'='.repeat(80)}`, 'cyan');
  log('Checking Server Health', 'blue');
  log(`${'='.repeat(80)}`, 'cyan');
  
  try {
    const response = execSync('curl -s http://localhost:3001/health', {
      encoding: 'utf-8',
      timeout: 5000,
    });
    const health = JSON.parse(response);
    report.serverStatus = {
      status: 'running',
      health: health,
      timestamp: new Date().toISOString(),
    };
    log('✅ Server is running and healthy', 'green');
    log(`   Status: ${health.status}`, 'cyan');
    log(`   Environment: ${health.environment}`, 'cyan');
    log(`   MCP Connected: ${health.mcpConnected}`, 'cyan');
    return true;
  } catch (error) {
    report.serverStatus = {
      status: 'not_running',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
    log('⚠️  Server is not running or not accessible', 'yellow');
    return false;
  }
}

function testAPIEndpoint() {
  log(`\n${'='.repeat(80)}`, 'cyan');
  log('Testing API Endpoint', 'blue');
  log(`${'='.repeat(80)}`, 'cyan');
  
  const apiTest = {
    name: 'Chat API Test',
    status: 'pending',
    response: null,
    error: null,
  };
  
  try {
    const response = execSync(
      `curl -s -X POST http://localhost:3001/api/chat ` +
      `-H "Content-Type: application/json" ` +
      `-H "Origin: http://localhost:3001" ` +
      `-d '{"message":"test","history":[]}'`,
      {
        encoding: 'utf-8',
        timeout: 30000,
      }
    );
    
    const data = JSON.parse(response);
    apiTest.status = 'passed';
    apiTest.response = {
      hasResponse: !!data.response,
      responseLength: data.response?.length || 0,
      warnings: data.warnings || [],
    };
    
    log('✅ API Test PASSED', 'green');
    log(`   Response length: ${apiTest.response.responseLength} characters`, 'cyan');
    log(`   Warnings: ${apiTest.response.warnings.length}`, 'cyan');
    
    report.apiTests.push(apiTest);
    return true;
  } catch (error) {
    apiTest.status = 'failed';
    apiTest.error = error.message;
    log(`❌ API Test FAILED: ${error.message}`, 'red');
    report.apiTests.push(apiTest);
    return false;
  }
}

async function main() {
  log('\n' + '='.repeat(80), 'cyan');
  log('MAYA BACKEND - COMPREHENSIVE TEST SUITE', 'blue');
  log('='.repeat(80), 'cyan');
  log(`Started: ${report.timestamp}\n`, 'cyan');
  
  // 1. Run Jest tests with coverage and JSON output
  // Run tests with coverage
  const testCommand = 'npm test -- --json --outputFile=../tests/jest-results.json --coverage --coverageReporters=json --coverageReporters=text';
  
  runTest(
    'Jest Test Suite',
    testCommand,
    { timeout: 120000 } // Increased timeout for coverage
  );
  
  // 2. Test KB Loading
  runTest(
    'KB Loading Test',
    'node test-kb-loading.js',
    { timeout: 30000 }
  );
  
  // 3. Check Server Health
  const serverRunning = checkServerHealth();
  
  // 4. Test API Endpoint (if server is running)
  if (serverRunning) {
    testAPIEndpoint();
  } else {
    log('\n⚠️  Skipping API tests - server not running', 'yellow');
    report.summary.warnings++;
  }
  
  // 5. Test Static File Serving (if server is running)
  if (serverRunning) {
    runTest(
      'Static File Serving Test',
      'curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/maya.html',
      { timeout: 5000 }
    );
  }
  
  // Generate Report
  log(`\n${'='.repeat(80)}`, 'cyan');
  log('TEST SUMMARY', 'blue');
  log(`${'='.repeat(80)}`, 'cyan');
  log(`Total Tests: ${report.summary.total}`, 'cyan');
  log(`✅ Passed: ${report.summary.passed}`, 'green');
  log(`❌ Failed: ${report.summary.failed}`, report.summary.failed > 0 ? 'red' : 'reset');
  log(`⚠️  Warnings: ${report.summary.warnings}`, report.summary.warnings > 0 ? 'yellow' : 'reset');
  
  // Save report to file
  const reportPath = join(__dirname, 'test-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\n📄 Detailed report saved to: ${reportPath}`, 'cyan');
  
  // Generate markdown report
  const markdownReport = generateMarkdownReport(report);
  const markdownPath = join(__dirname, 'TEST_REPORT.md');
  writeFileSync(markdownPath, markdownReport);
  log(`📄 Markdown report saved to: ${markdownPath}`, 'cyan');
  
  // Save Jest JSON output and coverage for dashboard (if Jest was run)
  try {
    const jestOutputPath = join(__dirname, '../tests/jest-results.json');
    const coverageSummaryPath = join(__dirname, '../tests/coverage/coverage-summary.json');
    const fs = await import('fs');
    
    // Check if Jest JSON output exists from test run
    const jestJsonPath = '/tmp/jest-output.json';
    if (fs.existsSync(jestJsonPath)) {
      const jestData = fs.readFileSync(jestJsonPath, 'utf8');
      fs.writeFileSync(jestOutputPath, jestData);
      log(`📊 Jest results saved for dashboard: ${jestOutputPath}`, 'cyan');
    }
    
    // Check if coverage summary exists
    if (fs.existsSync(coverageSummaryPath)) {
      log(`📈 Coverage data available: ${coverageSummaryPath}`, 'cyan');
      log(`💡 To view dashboard: Open Maya/tests/e2e.html in browser`, 'cyan');
    } else {
      log(`💡 To view dashboard: Open Maya/tests/e2e.html in browser`, 'cyan');
      log(`⚠️  Coverage data not found. Run with --coverage to generate coverage report.`, 'yellow');
    }
  } catch (error) {
    // Ignore if Jest output not available
  }
  
  log(`\n${'='.repeat(80)}`, 'cyan');
  log(`Completed: ${new Date().toISOString()}`, 'cyan');
  log(`${'='.repeat(80)}\n`, 'cyan');
  
  // Exit with appropriate code
  process.exit(report.summary.failed > 0 ? 1 : 0);
}

function generateMarkdownReport(report) {
  const statusIcon = (status) => {
    if (status === 'passed') return '✅';
    if (status === 'failed') return '❌';
    return '⚠️';
  };
  
  let md = `# Maya Backend - Test Report\n\n`;
  md += `**Generated:** ${report.timestamp}\n\n`;
  md += `## Summary\n\n`;
  md += `- **Total Tests:** ${report.summary.total}\n`;
  md += `- **Passed:** ${report.summary.passed} ✅\n`;
  md += `- **Failed:** ${report.summary.failed} ${report.summary.failed > 0 ? '❌' : '✅'}\n`;
  md += `- **Warnings:** ${report.summary.warnings} ${report.summary.warnings > 0 ? '⚠️' : ''}\n\n`;
  
  md += `## Server Status\n\n`;
  if (report.serverStatus) {
    md += `- **Status:** ${report.serverStatus.status === 'running' ? '✅ Running' : '❌ Not Running'}\n`;
    if (report.serverStatus.health) {
      md += `- **Health Check:** ${report.serverStatus.health.status}\n`;
      md += `- **Environment:** ${report.serverStatus.health.environment}\n`;
      md += `- **MCP Connected:** ${report.serverStatus.health.mcpConnected ? '✅' : '❌'}\n`;
    }
  }
  md += `\n`;
  
  md += `## Test Results\n\n`;
  report.tests.forEach((test, index) => {
    md += `### ${index + 1}. ${test.name}\n\n`;
    md += `- **Status:** ${statusIcon(test.status)} ${test.status.toUpperCase()}\n`;
    md += `- **Duration:** ${test.duration}ms\n`;
    if (test.error) {
      md += `- **Error:** ${test.error}\n`;
    }
    md += `\n`;
  });
  
  md += `## API Tests\n\n`;
  if (report.apiTests.length > 0) {
    report.apiTests.forEach((test, index) => {
      md += `### ${index + 1}. ${test.name}\n\n`;
      md += `- **Status:** ${statusIcon(test.status)} ${test.status.toUpperCase()}\n`;
      if (test.response) {
        md += `- **Response Length:** ${test.response.responseLength} characters\n`;
        md += `- **Warnings:** ${test.response.warnings.length}\n`;
      }
      if (test.error) {
        md += `- **Error:** ${test.error}\n`;
      }
      md += `\n`;
    });
  } else {
    md += `No API tests run (server not running)\n\n`;
  }
  
  md += `## Recommendations\n\n`;
  if (report.summary.failed > 0) {
    md += `⚠️ **Action Required:** Some tests failed. Please review the errors above.\n\n`;
  }
  if (report.serverStatus?.status !== 'running') {
    md += `⚠️ **Action Required:** Server is not running. Start it with: \`cd Maya/backend && ./start.sh\`\n\n`;
  }
  if (report.summary.failed === 0 && report.serverStatus?.status === 'running') {
    md += `✅ **All systems operational!** The backend is ready for use.\n\n`;
  }
  
  return md;
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
