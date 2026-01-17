# Error Log Sanitization - Security Best Practices

## Overview

This document outlines security best practices for sanitizing error logs and test output to prevent exposure of sensitive information.

## Security Concerns

### What Information Should Be Sanitized?

1. **File Paths**
   - **Risk**: Reveals username, directory structure, system architecture
   - **Example**: `/Users/eupirate/Desktop/Cloud/my_site_3_bot_maya_repo/Maya/backend/server.js`
   - **Sanitized**: `Maya/backend/server.js` (relative path)

2. **Environment Configuration**
   - **Risk**: Reveals system configuration, ports, environment variables
   - **Example**: `NODE_ENV: test`, `PORT: 3000`
   - **Sanitized**: `NODE_ENV: [REDACTED]`, `PORT: [REDACTED]`

3. **Token-Related Information**
   - **Risk**: Even warnings about tokens can reveal system architecture
   - **Example**: `AI_BUILDER_TOKEN does not start with "sk_" - may be invalid`
   - **Sanitized**: `AI_BUILDER_TOKEN: [REDACTED]`

4. **User Information**
   - **Risk**: Reveals usernames, home directories
   - **Example**: `/Users/eupirate/...`
   - **Sanitized**: `/Users/[USER]/...`

5. **Stack Traces**
   - **Risk**: Reveals internal file structure, function names, line numbers
   - **Solution**: Only show in development mode, sanitize paths in production

## Implementation

### Sanitization Utility

Located at: `Maya/backend/utils/sanitize-output.js`

**Key Functions:**
- `sanitizePaths(text)` - Converts absolute paths to relative paths, masks usernames
- `sanitizeEnvironment(text)` - Removes/masks environment configuration details
- `sanitizeErrors(text)` - Sanitizes error messages and stack traces
- `sanitizeTestOutput(output)` - Comprehensive sanitization for all test output
- `sanitizeJestResults(results)` - Sanitizes Jest test results JSON

### Usage Throughout Application

**1. Test Execution Endpoint (`/api/admin/run-tests`)**
- Sanitizes `stdout` and `stderr` output
- Sanitizes Jest results JSON
- Sanitizes error messages and test failure details

**2. Error Handler Middleware (`errorHandler.js`)**
- Sanitizes all error messages before logging
- Sanitizes stack traces (development only)
- Returns user-friendly error messages (never exposes internals)
- Uses logger utility for consistent sanitization

**3. Logger Utility (`logger.js`)**
- Enhanced `logError()` - sanitizes error messages and stack traces
- Enhanced `logWarning()` - sanitizes metadata strings
- All log output is sanitized before being written

**4. Validation Middleware (`validation.js`)**
- Uses logger utility instead of direct console calls
- Error messages are sanitized before logging

**5. All Error Responses**
- User-facing error messages never expose internal details
- Stack traces only shown in development mode (and sanitized)
- Error IDs provided for tracking without exposing internals

### Example

**Before Sanitization:**
```
FAIL /Users/eupirate/Desktop/Cloud/my_site_3_bot_maya_repo/Maya/tests/knowledge_tests/markdown-reference-integrity.test.js
AI_BUILDER_TOKEN does not start with "sk_" - may be invalid
NODE_ENV: test
PORT: 3000
```

**After Sanitization:**
```
FAIL tests/knowledge_tests/markdown-reference-integrity.test.js
AI_BUILDER_TOKEN: [REDACTED]
NODE_ENV: [REDACTED]
PORT: [REDACTED]
```

## Best Practices

### 1. Always Sanitize Before Display

- **Never** send raw error output to clients
- **Always** sanitize paths, tokens, and environment details
- **Use** relative paths instead of absolute paths

### 2. Log Levels

- **Development**: Show detailed errors with stack traces (still sanitized)
- **Production**: Show minimal error information, no stack traces

### 3. Path Sanitization Rules

- Convert absolute paths to relative paths when within workspace
- Mask usernames in paths outside workspace (`/Users/[USER]/...`)
- Show only basename for system paths

### 4. Token Handling

- Never log actual token values
- Mask token-related warnings
- Remove token validation messages from output

### 5. Environment Details

- Mask environment variable values
- Remove configuration details from error output
- Keep only essential error information

## Testing

### Verify Sanitization

```bash
# Run tests and check output
cd Maya/backend
npm test -- --json --outputFile=../tests/jest-results.json

# Check that paths are relative and sensitive info is masked
curl -X POST http://localhost:3001/api/admin/run-tests
```

### Expected Behavior

- ✅ All paths are relative (no `/Users/...` or absolute paths)
- ✅ Token-related messages are masked
- ✅ Environment details are redacted
- ✅ Usernames are masked as `[USER]`
- ✅ Stack traces are sanitized (paths converted to relative)

## Security Checklist

When adding new error handling or logging:

- [ ] Are file paths sanitized? ✅ (automatic via sanitize-output.js)
- [ ] Are tokens and secrets masked? ✅ (automatic via logger.js)
- [ ] Are environment variables redacted? ✅ (automatic via sanitize-output.js)
- [ ] Are usernames masked? ✅ (automatic via sanitize-output.js)
- [ ] Are stack traces sanitized? ✅ (automatic via logger.js)
- [ ] Is sensitive information removed from client-facing errors? ✅ (errorHandler.js)
- [ ] Are error messages user-friendly (not exposing internals)? ✅ (errorHandler.js)
- [ ] Are you using `logError()`, `logWarning()`, `logInfo()` instead of `console.*`? ✅ (required)
- [ ] Are error responses sanitized before sending to clients? ✅ (errorHandler.js)
- [ ] Are error messages limited to 100 characters? ✅ (Issue #15 - CRITICAL)
- [ ] Are console statements gated behind development mode? ✅ (Issue #15 - CRITICAL)
- [ ] Are file paths removed from error display? ✅ (Issue #15 - CRITICAL)
- [ ] Are assertion patterns (Expected/Received) removed? ✅ (Issue #15 - CRITICAL)

## Critical Security Fixes (January 11, 2026)

**Issue #15**: Implemented 4 critical security fixes based on GRC security audit:

1. **Error Message Length**: Limited to 100 characters maximum (reduced from 500)
2. **Console Gating**: All console statements gated behind development mode (53 instances)
3. **File Path Removal**: Generic identifiers only, no file paths exposed
4. **Assertion Extraction Removal**: No Expected/Received values extracted

**Risk Reduction**: 🟠 HIGH RISK → 🟢 LOW RISK

**See**: 
- [`CRITICAL_SECURITY_FIXES_IMPLEMENTED.md`](./CRITICAL_SECURITY_FIXES_IMPLEMENTED.md) for implementation details
- [`GRC_SECURITY_AUDIT_ERROR_LOGS.md`](./GRC_SECURITY_AUDIT_ERROR_LOGS.md) for comprehensive audit

## Related Files

- `Maya/backend/utils/sanitize-output.js` - Sanitization utility
- `Maya/backend/utils/logger.js` - Logging utility with enhanced sanitization
- `Maya/backend/server.js` - Test execution endpoint (uses sanitization)
- `Maya/backend/middleware/errorHandler.js` - Error handling middleware (sanitizes all errors)
- `Maya/backend/middleware/validation.js` - Validation middleware (uses logger utility)
- `Maya/backend/middleware/audit.js` - Audit logging (uses logger utility)

## References

- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [CWE-532: Information Exposure Through Log Files](https://cwe.mitre.org/data/definitions/532.html)
- [CWE-209: Information Exposure Through an Error Message](https://cwe.mitre.org/data/definitions/209.html)
