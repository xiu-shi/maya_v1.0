# API Key Testing & Validation Guide

**Date**: January 24, 2026  
**Purpose**: Comprehensive guide for API key testing and validation  
**Prevents**: Issues like Jan 18-24, 2026 service degradation

---

## 📋 Overview

This guide explains the comprehensive API key testing and validation system implemented to prevent service degradation due to invalid or revoked API keys.

---

## 🧪 Test Coverage

### 1. API Key Validation Tests
**File**: `Maya/tests/security_tests/api-key-validation.test.js`

**Coverage** (24 tests):
- ✅ API key format validation
- ✅ API key presence detection
- ✅ API key length validation
- ✅ Revoked key detection
- ✅ Environment variable configuration
- ✅ .env file security
- ✅ .gitignore protection
- ✅ Key rotation scenarios
- ✅ Security best practices
- ✅ Pre-deployment validation
- ✅ MCP connection validation

### 2. Pre-Deployment Test Suite
**File**: `Maya/backend/pre-deploy-tests.sh`

**Checks** (14 comprehensive checks):
1. ✅ .env file exists
2. ✅ API key is configured
3. ✅ API key is not placeholder
4. ✅ .env is in .gitignore
5. ✅ No API keys in committed code
6. ✅ Security tests pass
7. ✅ Unit tests pass
8. ✅ API key validation tests pass
9. ✅ Server configuration valid
10. ✅ No API key logging
11. ✅ API key format valid
12. ✅ No revoked keys
13. ✅ Integration tests pass
14. ✅ New test improvements pass

### 3. Enhanced Config Validation
**File**: `Maya/backend/config/env.js`

**Validations**:
- ✅ Format validation (must start with `sk_`)
- ✅ Length validation (minimum 20 characters)
- ✅ Revoked key detection
- ✅ Placeholder key detection
- ✅ Environment-specific handling
- ✅ Detailed error messages

---

## 🚀 Running Tests

### Run API Key Tests Only
```bash
cd Maya/backend
npm test -- tests/security_tests/api-key-validation.test.js
```

### Run Pre-Deployment Tests
```bash
cd Maya/backend
./pre-deploy-tests.sh
```

### Run All Security Tests
```bash
cd Maya/backend
npm test -- tests/security_tests
```

### Run All Tests
```bash
cd Maya/backend
npm test
```

---

## 🔄 Automated Test Execution

### 1. Git Hooks (Planned)
**Pre-commit Hook**: `Maya/backend/.husky/pre-commit`
- Runs security and unit tests before commit
- Blocks commit if tests fail

**Pre-push Hook**: `Maya/backend/.husky/pre-push`
- Runs all tests before push
- Blocks push if tests fail

**Setup** (if using Husky):
```bash
cd Maya/backend
npm install husky --save-dev
npx husky install
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
```

### 2. Deployment Script Integration
**File**: `Maya/deploy-to-space.sh`

**Integration**:
- Automatically runs `pre-deploy-tests.sh` before deployment
- Blocks deployment if any test fails
- Ensures only validated code is deployed

**Usage**:
```bash
cd Maya
./deploy-to-space.sh <your_api_key>
# Tests run automatically before deployment
```

---

## 🔒 API Key Validation Rules

### Valid Key Format
```
sk_[alphanumeric]_[hexadecimal]
Example: sk_9a342713_136e696672a6d8ae4701a0edcc8babbaefdc
```

### Validation Checks
1. **Prefix**: Must start with `sk_`
2. **Length**: Minimum 20 characters
3. **Not Revoked**: Not in revoked keys list
4. **Not Placeholder**: Not `sk_your_token_here` or similar
5. **Not Test Key**: (except in test environment)

### Revoked Keys Registry
**Documented Revoked Keys**:
- `sk_937d9f12_...` - Revoked January 24, 2026

**Why**: These keys will fail validation and prevent deployment.

---

## 📊 Test Execution Flow

### Before Every Commit (if git hooks enabled)
```
1. Developer runs: git commit
2. Pre-commit hook triggers
3. Runs security + unit tests
4. If pass: commit allowed
5. If fail: commit blocked
```

### Before Every Push (if git hooks enabled)
```
1. Developer runs: git push
2. Pre-push hook triggers
3. Runs ALL tests
4. If pass: push allowed
5. If fail: push blocked
```

### Before Every Deployment
```
1. Developer runs: ./deploy-to-space.sh <key>
2. Pre-deployment tests run automatically
3. Validates 14 critical checks
4. If pass: deployment proceeds
5. If fail: deployment blocked
```

---

## ✅ What Gets Tested

### Configuration Tests
- ✅ .env file exists
- ✅ API key is present
- ✅ API key has correct format
- ✅ API key is not placeholder
- ✅ .env is gitignored
- ✅ No keys in committed code

### Functional Tests
- ✅ Server can start
- ✅ MCP connection works
- ✅ Chat API responds
- ✅ Security protections work
- ✅ Rate limiting works
- ✅ Input validation works

### Security Tests
- ✅ API keys are masked in logs
- ✅ API keys not in error messages
- ✅ No hardcoded keys
- ✅ Old revoked keys rejected
- ✅ Invalid formats rejected

---

## 🎯 Preventing Future Issues

### Issue: Service Degradation (Jan 18-24, 2026)
**Root Cause**: API key revoked without redeployment

**Prevention Now**:
1. ✅ Pre-deployment tests validate key is valid
2. ✅ Config validation rejects revoked keys
3. ✅ Tests fail if old key detected
4. ✅ Deployment blocked if tests fail

### Key Rotation Process
```
1. Get new API key from platform
2. Update .env locally
3. Run: ./pre-deploy-tests.sh
4. If tests pass: deploy with new key
5. Verify deployment successful
6. Then revoke old key on platform
```

**Critical**: Always deploy with new key BEFORE revoking old key.

---

## 📝 Test Results Interpretation

### All Tests Pass
```
╔═══════════════════════════════════════════════════════════════════╗
║                      ✅ ALL TESTS PASSED                          ║
║              System is ready for deployment                       ║
╚═══════════════════════════════════════════════════════════════════╝
```
**Action**: Safe to deploy

### Tests Fail
```
╔═══════════════════════════════════════════════════════════════════╗
║                    ❌ TESTS FAILED (X)                            ║
║                DO NOT DEPLOY                                      ║
╚═══════════════════════════════════════════════════════════════════╝
```
**Action**: Fix failing tests before deploying

---

## 🔧 Troubleshooting

### Test: "Check API key is configured" fails
**Cause**: AI_BUILDER_TOKEN not in .env  
**Fix**: Add `AI_BUILDER_TOKEN=sk_your_actual_key` to .env

### Test: "Check API key is not placeholder" fails
**Cause**: Using example/test key  
**Fix**: Replace with actual API key from platform

### Test: "Check for old revoked keys" fails
**Cause**: Old key still in .env  
**Fix**: Replace with new API key

### Test: "API key validation tests" fail
**Cause**: API key format invalid  
**Fix**: Verify key starts with `sk_` and is at least 20 characters

---

## 📈 Metrics

### Test Coverage
- **Total API Key Tests**: 24
- **Pre-Deployment Checks**: 14
- **Config Validations**: 6
- **Security Checks**: 8

### Prevented Issues
- ✅ Deployment with invalid key
- ✅ Deployment with revoked key
- ✅ Deployment with placeholder key
- ✅ Service degradation from key issues
- ✅ Accidental key commits

---

## 🎓 Best Practices

### DO ✅
1. Run `./pre-deploy-tests.sh` before deployment
2. Keep API key in `.env` file only
3. Update tests when adding new validations
4. Document revoked keys in env.js
5. Use new key before revoking old key

### DON'T ❌
1. Skip pre-deployment tests
2. Commit API keys to git
3. Use placeholder keys in production
4. Revoke key before redeploying
5. Ignore test failures

---

## 📚 Related Documentation

- `ROOT_CAUSE_ANALYSIS.md` - Jan 18-24 incident analysis
- `API_KEY_MANAGEMENT.md` - Key storage and rotation
- `TESTING_GUIDE.md` - General testing documentation
- `SECURITY.md` - Security best practices

---

## ✅ Summary

**Test Coverage**: Comprehensive (24 API key tests + 14 pre-deployment checks)  
**Automation**: Pre-deployment tests run automatically  
**Prevention**: Blocks deployment with invalid/revoked keys  
**Result**: Prevents service degradation from API key issues

**Status**: ✅ Production-ready with comprehensive validation
