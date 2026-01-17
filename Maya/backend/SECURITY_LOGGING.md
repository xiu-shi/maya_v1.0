# Security Logging Guidelines

## Overview

This document outlines security best practices for logging and error handling in the Maya backend. All error logs and user-facing messages must be sanitized to prevent information leakage.

## Core Principles

1. **Never expose internal implementation details** in user-facing error messages
2. **Always sanitize paths, tokens, and environment details** before logging
3. **Use relative paths** instead of absolute paths in logs
4. **Mask sensitive information** (usernames, tokens, secrets)
5. **Provide user-friendly error messages** that help debugging without exposing internals

## Implementation

### 1. Use Logger Utility (Required)

**✅ DO:**
```javascript
import { logError, logWarning, logInfo } from '../utils/logger.js';

logError('Operation failed', error, { context: 'user-action' });
logWarning('Potential issue detected', { details: sanitizedData });
```

**❌ DON'T:**
```javascript
console.error('Error:', error); // Exposes full error details
console.warn('Warning:', sensitiveData); // May expose sensitive info
```

### 2. Error Handler Middleware

All errors are automatically sanitized by the error handler middleware:

```javascript
// Error handler automatically:
// - Sanitizes error messages
// - Sanitizes stack traces
// - Returns user-friendly messages
// - Logs sanitized details server-side only
```

**User-facing errors:**
- ✅ "An internal error occurred. Please try again later."
- ✅ "Invalid input provided. Please check your request."
- ❌ "Error: Cannot read property 'token' of undefined at /Users/username/..."
- ❌ "Database connection failed: postgresql://user:pass@localhost:5432/..."

### 3. Test Output Sanitization

Test execution output is automatically sanitized:

```javascript
// Before sanitization:
// FAIL /Users/eupirate/Desktop/.../Maya/tests/kb.test.js
// AI_BUILDER_TOKEN does not start with "sk_"
// NODE_ENV: test

// After sanitization:
// FAIL tests/knowledge_tests/kb-cache.test.js
// AI_BUILDER_TOKEN: [REDACTED]
// NODE_ENV: [REDACTED]
```

### 4. Path Sanitization

**Absolute paths are converted to relative paths:**
- `/Users/username/project/file.js` → `file.js` or `project/file.js`
- `/home/username/app/config.js` → `config.js` or `app/config.js`

**Usernames are masked:**
- `/Users/username/...` → `/Users/[USER]/...`
- `/home/username/...` → `/home/[USER]/...`

### 5. Error Message Guidelines

**User-Friendly Messages:**
- ✅ "Request timed out. Please try again."
- ✅ "Invalid input provided. Please check your request."
- ✅ "Service temporarily unavailable. Please try again later."

**Never Expose:**
- ❌ Internal file paths
- ❌ Stack traces (except in development)
- ❌ Database connection strings
- ❌ API keys or tokens
- ❌ Internal function names
- ❌ System architecture details

## Files Updated

### Core Files
- ✅ `Maya/backend/utils/sanitize-output.js` - Sanitization utility
- ✅ `Maya/backend/utils/logger.js` - Enhanced with sanitization
- ✅ `Maya/backend/middleware/errorHandler.js` - Sanitizes all errors
- ✅ `Maya/backend/middleware/validation.js` - Uses logger utility
- ✅ `Maya/backend/server.js` - Test output sanitization (UPDATED: Removed assertion extraction, limited errors)

### Frontend Files
- ✅ `Maya/tests/e2e.html` - Error display sanitization (UPDATED: 100 char limit, console gating, file path removal)

### Documentation
- ✅ `Maya/tests/documentation/ERROR_LOG_SANITIZATION.md` - Detailed guide
- ✅ `Maya/tests/documentation/GRC_SECURITY_AUDIT_ERROR_LOGS.md` - GRC security audit (NEW)
- ✅ `Maya/tests/documentation/CRITICAL_SECURITY_FIXES_IMPLEMENTED.md` - Implementation summary (NEW)
- ✅ `Maya/backend/SECURITY_LOGGING.md` - This file

## Critical Security Fixes (January 11, 2026)

**Issue #15**: Critical Security Fixes - Error Log Information Leakage

### 1. Error Message Length Limitation
- **Limit**: Maximum 100 characters (reduced from 500)
- **Implementation**: `truncateErrorMessage()` function in `e2e.html`
- **Security Impact**: Prevents exposure of internal validation logic and test data structures

### 2. Console Statement Gating
- **Implementation**: All console statements gated behind development mode check
- **Coverage**: 53 console statements replaced with `safeLog()` function
- **Security Impact**: Prevents internal data structures from being exposed in browser DevTools

### 3. File Path Removal
- **Implementation**: Generic identifiers ("Test #1", "Test #2") instead of file paths
- **Security Impact**: Prevents system architecture mapping and test organization exposure

### 4. Assertion Pattern Extraction Removal
- **Implementation**: Removed regex patterns extracting Expected/Received values
- **Change**: Generic error categories only ("Test execution failed", "Test execution timeout")
- **Security Impact**: Prevents test implementation patterns and validation logic exposure

**Risk Reduction**: 🟠 HIGH RISK → 🟢 LOW RISK

**See**: [`tests/documentation/CRITICAL_SECURITY_FIXES_IMPLEMENTED.md`](../tests/documentation/CRITICAL_SECURITY_FIXES_IMPLEMENTED.md) for complete details

## Testing

Verify sanitization is working:

```bash
# Run tests and check output
cd Maya/backend
npm test

# Check that paths are relative and sensitive info is masked
curl -X POST http://localhost:3001/api/admin/run-tests
```

## Common Mistakes to Avoid

1. **Direct console calls** - Always use logger utility
2. **Exposing stack traces** - Only in development, and sanitized
3. **Raw error messages** - Always sanitize before logging
4. **Absolute paths** - Convert to relative paths
5. **Token warnings** - Mask token-related messages

## References

- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [CWE-532: Information Exposure Through Log Files](https://cwe.mitre.org/data/definitions/532.html)
- [CWE-209: Information Exposure Through an Error Message](https://cwe.mitre.org/data/definitions/209.html)
