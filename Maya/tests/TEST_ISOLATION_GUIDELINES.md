# Test Isolation Guidelines

**Last Updated**: January 11, 2026

## Core Principles

### ✅ DO: Test Isolation
- Each test should be **completely independent** and runnable in isolation
- Tests should not depend on execution order
- Tests should clean up after themselves (use `afterAll`/`afterEach`)
- Tests should set up their own test data (use `beforeAll`/`beforeEach`)

### ❌ DON'T: Recursive Test Execution
- **NEVER** execute `npm test` or `jest` from within a test file
- **NEVER** use `child_process.exec`/`execSync` to run the test suite
- **NEVER** create test files that trigger the test runner recursively
- This causes infinite loops and CPU freeze

### ✅ DO: Test Code Logic
- Test individual functions and modules
- Test error handling and edge cases
- Test security measures
- Test performance characteristics

### ❌ DON'T: Test Test Execution
- If you need to test test execution mechanisms, use a **separate script** (`.js` file, not `.test.js`)
- Example: `run-all-tests.js` is a script, not a test file

## Test File Structure

### ✅ Good Test File Example
```javascript
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { someFunction } from '../../backend/utils/some-module.js';

describe('Some Module', () => {
  let testData;
  
  beforeAll(() => {
    // Set up test data
    testData = createTestData();
  });
  
  afterAll(() => {
    // Clean up test data
    cleanupTestData(testData);
  });
  
  test('should handle normal case', () => {
    const result = someFunction(testData);
    expect(result).toBeDefined();
  });
  
  test('should handle error case', () => {
    expect(() => someFunction(null)).toThrow();
  });
});
```

### ❌ Bad Test File Example (RECURSIVE - CAUSES CPU FREEZE)
```javascript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

test('should run tests', async () => {
  // ❌ NEVER DO THIS - Creates infinite loop!
  await execAsync('npm test');
});
```

## Test Categories

### 1. Unit Tests (`unit_tests/`)
- Test individual functions/modules in isolation
- No external dependencies (database, network, file system)
- Fast execution (< 100ms per test)
- **Example**: `sanitize.test.js`, `timeout.test.js`

### 2. Integration Tests (`integration_tests/`)
- Test multiple components working together
- May use file system, but should clean up
- May test real KB loading, but should be isolated
- **Example**: `bulk-file-operations.test.js`

### 3. Security Tests (`security_tests/`)
- Test security measures (rate limiting, input validation)
- Test injection prevention
- Test authentication/authorization (if implemented)
- **Example**: `rateLimit.test.js`

### 4. Performance Tests (`performance_tests/`)
- Test response times
- Test resource usage
- Test concurrent operations
- **Example**: `api.test.js`, `timeout-stress.test.js`

### 5. Knowledge Base Tests (`knowledge_tests/`)
- Test KB loading and caching
- Test KB accuracy
- Test KB integrity
- **Example**: `kb-loader.test.js`, `kb-accuracy.test.js`

### 6. Model Tests (`model_test/`)
- Test AI model security (prompt injection, jailbreak)
- Test model responses
- **Example**: `prompt-injection.test.js`, `jailbreak.test.js`

## Running Tests

### Run All Tests
```bash
cd Maya/backend
npm test
```

### Run Individual Test File
```bash
cd Maya/backend
npm test -- tests/unit_tests/backend/sanitize.test.js
```

### Run Test Category
```bash
cd Maya/backend
npm test -- tests/security_tests
```

### Run with Coverage
```bash
cd Maya/backend
npm run test:coverage
```

## Test Isolation Checklist

Before creating a new test file, verify:

- [ ] Test file does NOT execute `npm test` or `jest`
- [ ] Test file does NOT use `child_process.exec`/`execSync` to run tests
- [ ] Test file can run independently (`npm test -- path/to/test.js`)
- [ ] Test file cleans up after itself (`afterAll`/`afterEach`)
- [ ] Test file sets up its own data (`beforeAll`/`beforeEach`)
- [ ] Test file does not depend on other tests' execution order
- [ ] Test file does not share mutable state with other tests
- [ ] Test file uses unique test data (no conflicts with other tests)

## Prevention Measures

### Automated Checks
- Jest configuration excludes recursive test execution
- Test files matching `**/tests/**/*.test.js` are automatically included
- Scripts (non-test files) should NOT match this pattern

### Code Review Checklist
When reviewing test files, check:
1. ✅ No `exec`/`execSync` calls to `npm test` or `jest`
2. ✅ No recursive test execution
3. ✅ Proper cleanup in `afterAll`/`afterEach`
4. ✅ Tests are isolated and independent
5. ✅ Tests can run individually and globally

## Examples of Safe Test Patterns

### ✅ Testing File Operations
```javascript
import { promises as fs } from 'fs';
import { join } from 'path';

describe('File Operations', () => {
  const testFile = join(__dirname, 'test-temp-file.txt');
  
  afterAll(async () => {
    // Clean up
    try {
      await fs.unlink(testFile);
    } catch (e) {
      // Ignore if already deleted
    }
  });
  
  test('should write file', async () => {
    await fs.writeFile(testFile, 'test', 'utf-8');
    const content = await fs.readFile(testFile, 'utf-8');
    expect(content).toBe('test');
  });
});
```

### ✅ Testing API Endpoints
```javascript
import request from 'supertest';
import express from 'express';

describe('API Endpoint', () => {
  const app = express();
  app.use(express.json());
  app.post('/api/test', (req, res) => {
    res.json({ success: true });
  });
  
  test('should respond correctly', async () => {
    const response = await request(app)
      .post('/api/test')
      .send({ data: 'test' });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### ✅ Testing Error Handling
```javascript
import { someFunction } from '../../backend/utils/module.js';

describe('Error Handling', () => {
  test('should throw on invalid input', () => {
    expect(() => someFunction(null)).toThrow();
  });
  
  test('should handle empty input', () => {
    const result = someFunction('');
    expect(result).toBeDefined();
  });
});
```

## Summary

**Key Rule**: Test files test **code logic**, not **test execution**. If you need to test test execution, use a separate script file (`.js`), not a test file (`.test.js`).

**Isolation**: Each test should be completely independent and runnable in isolation.

**Cleanup**: Always clean up test data and resources in `afterAll`/`afterEach`.

**No Recursion**: Never execute the test runner from within a test file.
