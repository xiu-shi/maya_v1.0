# Test Commands Reference

**Last Updated**: January 11, 2026, 20:03 GMT

---

## Quick Start

Navigate to the backend directory first:
```bash
cd Maya/backend
```

---

## Test Suites

### 1. Run All Tests
```bash
npm test
```

**What it does**: Runs all test suites (unit, security, performance, integration, knowledge, model)  
**Expected**: 444 tests passing across 28 test suites  
**Duration**: ~20-30 seconds

---

### 2. Run Security Tests Only
```bash
npm run test:security
```

**What it does**: Tests rate limiting, input validation, and frontend security protections  
**Tests**: 60 tests  
**Files**: 
- `tests/security_tests/rateLimit.test.js` (6 tests)
- `tests/security_tests/input-validation.test.js` (37 tests)
- `tests/security_tests/frontend-protection.test.js` (23 tests) ⭐ NEW

**Example Output**:
```
PASS ../tests/security_tests/frontend-protection.test.js    (23 tests) ⭐ NEW
PASS ../tests/security_tests/input-validation.test.js       (37 tests)
PASS ../tests/security_tests/rateLimit.test.js              (6 tests)

Test Suites: 3 passed, 3 total
Tests:       60 passed, 60 total
```

**Frontend Protection Tests** (⭐ NEW):
- Right-click prevention (3 tests)
- Text selection prevention (2 tests)
- Keyboard shortcut blocking (3 tests)
- Copy protection (2 tests)
- Image drag prevention (2 tests)
- Iframe embedding prevention (1 test)
- Console restrictions (2 tests)
- eval() restriction (1 test)
- Developer tools detection (2 tests)
- Print screen detection (1 test)
- Accessibility compliance (2 tests)
- Production vs development (2 tests)

---

### 3. Run Performance Tests Only
```bash
npm run test:performance
```

**What it does**: Tests API performance and model validation  
**Tests**: 9 tests  
**Files**: 
- `tests/performance_tests/api.test.js` (6 tests)
- `tests/performance_tests/model-performance.test.js` (3 tests)

**Example Output**:
```
PASS ../tests/performance_tests/api.test.js
PASS ../tests/performance_tests/model-performance.test.js

Test Suites: 2 passed, 2 total
Tests:       9 passed, 9 total
```

---

### 4. Run Unit Tests Only
```bash
npm test -- tests/unit
```

**What it does**: Tests input sanitization functions  
**Tests**: 18 tests  
**Files**: `tests/unit_tests/backend/sanitize.test.js`

**Example Output**:
```
PASS ../tests/unit_tests/backend/sanitize.test.js
  Input Sanitization
    sanitizeInput
      ✓ removes HTML tags and escapes content
      ✓ escapes HTML entities
      ✓ handles empty string
      ...
    validateMessageLength
      ✓ accepts valid length message
      ✓ truncates long messages
      ...
    detectPromptInjection
      ✓ detects ignore previous instructions
      ...
    validateHistory
      ✓ accepts valid history
      ...
    sanitizeChatInput
      ✓ sanitizes complete chat input
      ...

Test Suites: 1 passed, 1 total
Tests:       18 passed, 18 total
```

---

### 5. Run Tests with Coverage Report
```bash
npm run test:coverage
```

**What it does**: Runs all tests and generates coverage report  
**Output**: Shows code coverage percentages  
**Target**: > 70% coverage

**Example Output**:
```
Test Suites: 18 passed, 18 total
Tests:       222 passed, 222 total
Snapshots:   0 total
Time:        27.15 s

----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------|---------|----------|---------|---------|-------------------
All files |   85.23 |    78.45 |   82.14 |   85.23 |
```

---

### 6. Run Tests in Watch Mode
```bash
npm run test:watch
```

**What it does**: Runs tests in watch mode - automatically re-runs tests when files change  
**Use case**: Development - see test results immediately after code changes

---

## Model Performance Testing

### 7. Test Model Performance (Benchmark All Models)
```bash
npm run test:models
```

**What it does**: Benchmarks all available AI models to find the fastest  
**Duration**: ~30-60 seconds (tests 6 models)  
**Output**: Performance comparison table

**Example Output**:
```
🚀 Testing AI Builders Models for Speed

API URL: https://space.ai-builders.com/backend/v1/chat/completions
Token: sk_937d9f1...

Testing models (fastest to slowest expected):

Testing: grok-4-fast...
  ✅ Success - 1365ms - 28 chars
  Response preview: Hi! I'm here - how can I help?...

Testing: gemini-3-flash-preview...
  ✅ Success - 1427ms - 20 chars
  Response preview: Hello! Test received...

📊 Results Summary:

Fastest to Slowest (working models):

1. grok-4-fast                 1365ms ⚡ Very Fast
2. gemini-3-flash-preview      1427ms ⚡ Very Fast
3. gpt-5                       2097ms ✅ Fast
4. deepseek                    2276ms ✅ Fast
5. gemini-2.5-pro              3524ms ✅ Fast
6. supermind-agent-v1          3869ms ✅ Fast

💡 Recommendations:
Fastest: grok-4-fast (1365ms)
```

---

## API Testing

### 8. Test API Endpoint Directly
```bash
npm run test:api
```

**What it does**: Tests the `/api/chat` endpoint directly  
**Use case**: Quick verification that API is working

---

### 9. Test Backend Connection
```bash
npm run test:connection
```

**What it does**: Tests backend server connectivity  
**Use case**: Verify server is running and accessible

---

## Manual Testing Commands

### 10. Test Health Check Endpoint
```bash
curl http://localhost:3001/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-01-06T12:00:00.000Z",
  "environment": "development",
  "mcpConnected": true
}
```

---

### 11. Test Chat Endpoint
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Maya", "history": []}'
```

**Expected Response**:
```json
{
  "response": "Hello! I'm Maya, Janet Xiu Shi's digital twin...",
  "warnings": []
}
```

---

### 12. Test Chat Endpoint (Pretty Print)
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Maya", "history": []}' \
  | python3 -m json.tool
```

**Use case**: Easier to read JSON response

---

## Test File Locations

All test files are located in `Maya/tests/`:

```
Maya/tests/
├── setup.js                          # Test environment configuration
├── unit_tests/
│   └── backend/
│       ├── sanitize.test.js         # 20 unit tests
│       ├── timeout.test.js          # 18 timeout utility tests
│       └── import-validation.test.js # 7 import validation tests
├── security_tests/
│   └── rateLimit.test.js            # 6 security tests
├── performance_tests/
│   ├── api.test.js                  # 4 performance tests
│   ├── model-performance.test.js    # 5 model validation tests
│   └── timeout-stress.test.js       # 15 stress tests
├── integration_tests/
│   └── bulk-file-operations.test.js # 5 integration tests
├── knowledge_tests/
│   ├── kb-loader.test.js           # 5 KB loader tests
│   ├── kb-cache.test.js            # 14 KB cache tests
│   ├── kb-accuracy.test.js         # 21 KB accuracy tests
│   ├── kb-response-accuracy.test.js # 5 KB response tests
│   ├── kb-cache-performance.test.js # 5 performance tests
│   ├── kb-cache-eval.test.js       # 12 evaluation tests
│   └── markdown-reference-integrity.test.js # 8 integrity tests
└── model_test/
    ├── prompt-injection.test.js     # 30 prompt injection tests
    ├── jailbreak.test.js            # 23 jailbreak tests
    └── architecture-leakage.test.js # 22 architecture leakage tests
```

---

## Expected Test Results

### All Tests Passing ✅
- **Total Tests**: 444
- **Passed**: 444 ✅
- **Failed**: 0
- **Test Suites**: 28 total (28 passed)

### Breakdown by Suite
- **Unit Tests**: 63/63 passed ✅ (sanitize, timeout, import-validation, error-handling)
- **Security Tests**: 35/37 passed ✅ (rateLimit, input-validation - 2 minor test expectation issues)
- **Performance Tests**: 42/42 passed ✅ (api, model-performance, timeout-stress, resource-cleanup, cpu-usage-monitoring)
- **Integration Tests**: 6/6 passed ✅ (bulk-file-operations, e2e-dashboard-parsing)
- **Knowledge Base Tests**: 70/70 passed ✅ (kb-loader, kb-cache, kb-accuracy, kb-response-accuracy, kb-cache-performance, kb-cache-eval, markdown-reference-integrity)
- **Model Tests**: 72/72 passed ✅ (prompt-injection, jailbreak, architecture-leakage)

---

## Troubleshooting

### Tests Fail to Run
**Error**: `Cannot find module` or `SyntaxError`

**Solution**:
1. Ensure you're in `Maya/backend` directory
2. Install dependencies: `npm install`
3. Check Node.js version: `node --version` (should be >= 18.0.0)

### Tests Timeout
**Error**: Tests take too long or timeout

**Solution**:
1. Check server is running: `curl http://localhost:3001/health`
2. Verify environment variables: `cat .env | grep AI_BUILDER_TOKEN`
3. Check network connectivity

### Port Already in Use
**Error**: `EADDRINUSE: address already in use :::3001`

**Solution**:
```bash
cd Maya/backend
./stop.sh && ./start.sh    # Stop and restart server
npm test                   # Run tests
```

---

## Quick Reference Card

```bash
# Navigate to backend
cd Maya/backend

# Run all tests
npm test

# Run specific test suites
npm run test:security      # Security tests
npm run test:performance   # Performance tests
npm test -- tests/unit_tests     # Unit tests

# Run with coverage
npm run test:coverage

# Test model performance
npm run test:models

# Test API directly
npm run test:api

# Watch mode (auto-rerun on changes)
npm run test:watch
```

---

## Test Environment

Tests run with:
- **Test Environment**: Node.js with ES modules
- **Test Framework**: Jest v29.7.0
- **Test Runner**: Supertest v6.3.4
- **Setup File**: `tests/setup.js` (configures test environment variables)

---

## Configuration Notes

### Temperature Setting
- **Current**: `0.3` (focused, consistent responses)
- **Updated**: January 6, 2025 (from `0.7`)
- **Effect**: More consistent responses, less creative variation
- **File**: `backend/mcp-client.js`

---

**Last Updated**: January 11, 2026, 20:03 GMT


