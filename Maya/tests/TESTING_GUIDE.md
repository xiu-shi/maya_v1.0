# Maya Testing Guide

## Testing Philosophy

- **Test-First Development**: **ALWAYS run tests before implementing user requests** (Industry Best Practice)
- **Test-Driven Development**: Write tests as we build
- **Security First**: Every feature must pass security tests
- **Performance Matters**: Monitor and test performance
- **User Experience**: Test from user perspective
- **Prevent Regressions**: Tests catch issues before they become critical
- **Evaluation & Transparency**: **Continuous evaluation ensures trust and confidence** ⭐ NEW

### ⚠️ Critical Practice: Test-First Workflow

**Before implementing ANY user request:**
1. Run comprehensive test suite: `cd Maya/backend && node run-all-tests.js`
2. Establish baseline - all tests should pass
3. Make changes
4. Run tests again to verify no regressions
5. If tests fail, fix issues before proceeding

**Why This Matters:**
- Prevents 12-hour hangs (like the KB loading issue)
- Catches root causes faster
- Industry standard practice (TDD/BDD)
- Saves debugging time

## Test Structure

```
Maya/tests/
├── unit_tests/              # Unit tests
│   └── backend/             # Backend unit tests
├── integration_tests/        # Integration tests
├── security_tests/          # Security tests
├── performance_tests/       # Performance tests
├── knowledge_tests/         # Knowledge Base tests
├── model_test/              # Model optimization & security tests
└── documentation/           # Test-related documentation
```

**For detailed structure**: See "Test Directory Structure" and "Test Categories" sections below

## Running Tests

### Comprehensive Test Suite (Recommended)

```bash
# Run all tests with detailed report
cd Maya/backend
node run-all-tests.js
```

This runs:
- ✅ Jest test suite (307 tests across 23 test suites, 302 passing ✅)
- ✅ KB loading test (validates no blocking)
- ✅ KB cache evaluation tests (8 KPIs) ⭐ NEW
- ✅ Markdown reference integrity tests ⭐ NEW (prevents broken links)
- ✅ Model security tests (prompt injection, jailbreak, architecture leakage)
- ✅ Server health check
- ✅ API endpoint test
- ✅ Static file serving test
- ✅ Generates detailed reports (JSON + Markdown)

### Individual Test Commands

```bash
# Install test dependencies
npm install --save-dev jest @testing-library/jest-dom

# Run Jest tests
cd Maya/backend
npm test

# Run specific test suite
npm test -- security_tests
npm test -- performance_tests
npm test -- knowledge_tests
npm test -- model_test
npm test -- unit_tests
npm test -- integration_tests

# Run with coverage
npm test -- --coverage

# Test KB loading (should complete in < 1 second)
node test-kb-loading.js

# Test KB cache (validates cache integrity)
node test-kb-cache.js

# Run KB cache evaluations (8 KPIs) ⭐ NEW
node test-kb-cache-eval.js

# Test API endpoint
node test-api-endpoint.js
```

## Test Coverage Goals

- **Unit Tests**: > 80% coverage
- **Integration Tests**: Critical paths covered
- **Security Tests**: 100% of security features
- **Performance Tests**: All API endpoints
- **Evaluation Tests**: 8 KPIs monitored continuously ⭐ NEW

## Evaluation & Transparency ⭐ NEW

### KB Cache Evaluations

Maya's KB system is continuously evaluated to ensure:
- ✅ Cache performance is maintained (hit rate ≥ 80%)
- ✅ Memory efficiency is optimal (< 1% usage)
- ✅ KB accuracy is validated (100% checksum validation)
- ✅ KB freshness is monitored (refreshed within 1 hour)
- ✅ No hallucinations (KB content verified)

**Run Evaluations**:
```bash
# Quick evaluation with KPI matrix
cd Maya/backend
node test-kb-cache-eval.js

# Full evaluation test suite
npm test -- knowledge_tests/kb-cache-eval.test.js
```

**Documentation**:
- **[KB_TRANSPARENCY_AND_EXPLAINABILITY.md](knowledge_tests/KB_TRANSPARENCY_AND_EXPLAINABILITY.md)** - Complete transparency and explainability guide (includes evaluation system, KPIs, and testing)
- **[KB_MANAGEMENT_STRATEGY.md](knowledge_tests/KB_MANAGEMENT_STRATEGY.md)** - Comprehensive KB management guide (includes caching, monitoring, testing, evaluation, implementation decisions, documentation integrity, and best practices)
- **[MODEL_OPTIMIZATION_SUMMARY.md](model_test/MODEL_OPTIMIZATION_SUMMARY.md)** - Model optimization and security guide (includes prompt injection prevention, jailbreak prevention, architecture leakage prevention)

### Transparency Features

Maya provides transparency about KB usage:
- Explains KB sources: "Based on Janet's knowledge base..."
- Mentions KB evaluation: "My knowledge base is regularly evaluated..."
- Explains KB accuracy: "This information comes from Janet's verified knowledge base..."
- Provides trust indicators when asked about accuracy

## Writing Tests

### Example: Unit Test
```javascript
// tests/unit_tests/backend/sanitize.test.js
import { sanitizeInput, validateMessageLength } from '../../backend/utils/sanitize.js';

describe('Input Sanitization', () => {
  test('removes HTML tags', () => {
    const input = '<script>alert("xss")</script>Hello';
    expect(sanitizeInput(input)).toBe('Hello');
  });

  test('validates message length', () => {
    const longMessage = 'a'.repeat(3000);
    const result = validateMessageLength(longMessage, 2000);
    expect(result.truncated).toBe(true);
  });
});
```

### Example: Security Test
```javascript
// tests/security_tests/rateLimit.test.js
import request from 'supertest';
import app from '../../backend/server.js';

describe('Rate Limiting', () => {
  test('blocks requests after limit', async () => {
    const agent = request(app);
    
    // Make 20 requests (limit)
    for (let i = 0; i < 20; i++) {
      await agent.post('/api/chat').send({ message: 'test' });
    }
    
    // 21st request should be blocked
    const response = await agent.post('/api/chat').send({ message: 'test' });
    expect(response.status).toBe(429);
  });
});
```

## Continuous Testing

Tests run automatically on:
- Pre-commit (via git hooks)
- Pre-push (via git hooks)
- CI/CD pipeline (when set up)

## Test Checklist

Before deploying:
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Security tests pass
- [ ] Performance tests pass
- [ ] Knowledge tests pass
- [ ] Model tests pass
- [ ] No security vulnerabilities
- [ ] Code coverage > 80%

---

**Last Updated**: January 11, 2026, 19:54 GMT

