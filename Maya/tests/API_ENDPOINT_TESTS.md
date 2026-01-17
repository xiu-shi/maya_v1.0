# API Endpoint Test Suite

**Created**: January 17, 2026  
**Purpose**: Comprehensive test coverage to prevent regressions and ensure API endpoints work correctly

## Test Files Created

### 1. `api-chat-endpoint-comprehensive.test.js`
**Purpose**: Comprehensive tests for the `/api/chat` endpoint

**Coverage**:
- ✅ Endpoint existence and routing
- ✅ Request validation (message, history, Content-Type)
- ✅ Error handling (503, 400, 422)
- ✅ Response format (JSON, response field, warnings)
- ✅ Rate limiting
- ✅ Endpoint URL verification

**Key Tests**:
- Endpoint exists and accepts POST
- Validates required fields (message, history)
- Returns proper error codes
- Returns JSON responses
- Enforces rate limits

### 2. `frontend-backend-integration.test.js`
**Purpose**: Tests frontend-backend integration and URL construction

**Coverage**:
- ✅ API URL construction logic
- ✅ Production environment detection
- ✅ Endpoint call verification (POST, JSON)
- ✅ Error handling in frontend
- ✅ URL construction scenarios

**Key Tests**:
- No hardcoded `api.janetxiushi.me` URL
- Production returns empty string (same origin)
- Endpoint construction: `/api/chat`
- Uses POST method with JSON
- Handles errors gracefully

### 3. `api-endpoint-regression.test.js`
**Purpose**: Prevents regressions of known issues

**Coverage**:
- ✅ No hardcoded external URLs
- ✅ Endpoint path matches frontend/backend
- ✅ HTTP method matches (POST)
- ✅ Request body fields match
- ✅ Content-Type header validation
- ✅ Error response format

**Key Tests**:
- **CRITICAL**: No `api.janetxiushi.me` hardcoded URL
- Frontend calls `/api/chat`, backend handles `/api/chat`
- Frontend uses POST, backend handles POST
- Request/response formats match

## Running Tests

### Run All API Endpoint Tests
```bash
cd Maya/backend
npm test -- ../tests/integration_tests/api-chat-endpoint-comprehensive.test.js
npm test -- ../tests/integration_tests/frontend-backend-integration.test.js
npm test -- ../tests/integration_tests/api-endpoint-regression.test.js
```

### Run Specific Test Suite
```bash
# Comprehensive endpoint tests
npm test -- ../tests/integration_tests/api-chat-endpoint-comprehensive.test.js

# Frontend-backend integration
npm test -- ../tests/integration_tests/frontend-backend-integration.test.js

# Regression tests (most important!)
npm test -- ../tests/integration_tests/api-endpoint-regression.test.js
```

### Run All Integration Tests
```bash
cd Maya/backend
npm test -- ../tests/integration_tests/
```

## Test Coverage Summary

| Test Suite | Tests | Purpose |
|------------|-------|---------|
| `api-chat-endpoint-comprehensive` | 20+ | Endpoint functionality |
| `frontend-backend-integration` | 15+ | Frontend-backend integration |
| `api-endpoint-regression` | 20+ | Prevent regressions |

**Total**: 55+ tests covering API endpoints

## Critical Regression Tests

These tests **MUST PASS** to prevent the issues we've been fixing:

1. **No Hardcoded URLs** (`api-endpoint-regression.test.js`)
   - ✅ No `api.janetxiushi.me` in frontend
   - ✅ No `api.janetxiushi.me` in backend
   - ✅ Production returns empty string

2. **Endpoint Matching** (`api-endpoint-regression.test.js`)
   - ✅ Frontend calls `/api/chat`
   - ✅ Backend handles `/api/chat`
   - ✅ HTTP methods match (POST)

3. **URL Construction** (`frontend-backend-integration.test.js`)
   - ✅ Production: `/api/chat` (relative URL)
   - ✅ Resolves to: `https://maya-agent.ai-builders.space/api/chat`
   - ✅ NOT: `https://api.janetxiushi.me/api/chat`

## What These Tests Prevent

1. **Hardcoded External URLs** - Prevents `api.janetxiushi.me` regression
2. **Endpoint Mismatch** - Ensures frontend/backend endpoints match
3. **HTTP Method Mismatch** - Ensures POST is used correctly
4. **Missing Validation** - Ensures request validation works
5. **Error Handling** - Ensures proper error responses
6. **Response Format** - Ensures consistent JSON responses

## Integration with CI/CD

These tests should run:
- ✅ Before every commit (pre-commit hook)
- ✅ Before every push (pre-push hook)
- ✅ In CI/CD pipeline before deployment
- ✅ After deployment (smoke tests)

## Test Maintenance

**When adding new endpoints**:
1. Add tests to `api-chat-endpoint-comprehensive.test.js`
2. Add regression tests to `api-endpoint-regression.test.js`
3. Update this document

**When fixing bugs**:
1. Add regression test to prevent recurrence
2. Update relevant test suite
3. Document the fix in test comments

---

**Status**: ✅ Comprehensive test suite created  
**Coverage**: 55+ tests covering all critical API endpoint scenarios  
**Purpose**: Prevent regressions and ensure endpoints work correctly
