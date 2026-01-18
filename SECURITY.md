# Security Policy & Best Practices
**Last Updated**: January 18, 2026

---

## 🔒 CRITICAL: Secret Protection

### Never Commit:
- ❌ API keys or tokens (e.g., AI_BUILDER_TOKEN)
- ❌ Passwords or secrets
- ❌ `.env` files (any variant)
- ❌ `mcp_config.json` (contains tokens)
- ❌ Any file with credentials

### Always Use:
- ✅ `.env` files (must be in `.gitignore`)
- ✅ `.example` files for templates
- ✅ Environment variables
- ✅ GitHub Secrets (for CI/CD)

### Pre-Commit Checklist:
- [ ] No `.env` files in commit
- [ ] No `mcp_config.json` in commit
- [ ] No tokens/keys in code
- [ ] `.gitignore` includes sensitive files
- [ ] No secrets visible in `git diff`

---

## 🚨 If Secret Exposed

1. **IMMEDIATELY** revoke/regenerate the exposed secret
2. Remove file from git: `git rm --cached filename`
3. Add to `.gitignore`
4. Commit removal
5. Document incident

---

## Security Implementation Guide

### Overview

This document outlines all security measures implemented for the Maya Digital Twin chat interface using the AI Builders MCP server. Each security measure is explained with its rationale and implementation details.

---

## Table of Contents

1. [API Key Protection](#api-key-protection)
2. [Environment Variable Security](#environment-variable-security)
3. [Input Validation & Sanitization](#input-validation--sanitization)
4. [Rate Limiting](#rate-limiting)
5. [CORS Configuration](#cors-configuration)
6. [Request Size Limits](#request-size-limits)
7. [Error Handling Security](#error-handling-security)
8. [HTTPS Enforcement](#https-enforcement)
9. [Content Security Policy](#content-security-policy)
10. [Security Headers](#security-headers)
11. [Audit & Monitoring](#audit--monitoring)

---

## API Key Protection

### Why It's Critical
The `AI_BUILDER_TOKEN` is a sensitive credential that provides access to AI services. If exposed, it could lead to:
- Unauthorized API usage
- Financial costs from abuse
- Service disruption
- Data privacy violations

### Implementation

**1. Environment Variable Storage**
- ✅ Token stored in `.env` file (never committed to git)
- ✅ `.env` added to `.gitignore`
- ✅ `.env.example` provided as template (without real values)

**2. Runtime Protection**
- ✅ Token only loaded from environment variables
- ✅ Token never logged or exposed in error messages
- ✅ Token masked in discovery scripts (default behavior)

**3. Access Control**
- ✅ Token only accessible to backend server
- ✅ Frontend never receives token
- ✅ Token passed securely to MCP server via stdio (not HTTP)

**Files:**
- `Maya/backend/.env` - Contains actual token (gitignored)
- `Maya/backend/.env.example` - Template file (safe to commit)
- `Maya/backend/config/env.js` - Environment configuration and validation

---

## Environment Variable Security

### Why It Matters
Environment variables are the standard way to manage secrets in production. Proper handling prevents:
- Accidental exposure in code
- Version control leaks
- Configuration drift between environments

### Implementation

**1. .env File Management**
```bash
# .env file structure
AI_BUILDER_TOKEN=sk_xxx...
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS=https://agents.janetxiushi.me,https://janetxiushi.me
```

**2. Validation**
- ✅ Required variables checked at startup
- ✅ Invalid format detection
- ✅ Missing variable warnings

**3. Environment Separation**
- ✅ Development: `.env.development`
- ✅ Production: `.env.production`
- ✅ Never commit actual `.env` files

**Files:**
- `Maya/backend/.env.example` - Template
- `Maya/backend/config/env.js` - Environment validation

---

## Input Validation & Sanitization

### Why It's Essential
User input is the primary attack vector. Without validation:
- **Prompt Injection**: Malicious prompts could manipulate AI behavior
- **XSS Attacks**: Script injection in chat messages
- **DoS Attacks**: Extremely long inputs crash the system
- **Data Corruption**: Invalid data breaks application logic

### Implementation

**1. Message Length Limits**
- ✅ Maximum message length: 2000 characters
- ✅ Minimum message length: 1 character
- ✅ Truncation with warning for oversized messages

**2. Content Sanitization**
- ✅ HTML tag stripping (prevent XSS)
- ✅ Special character encoding
- ✅ Unicode normalization
- ✅ SQL injection prevention (if using database)

**3. Input Type Validation**
- ✅ String type checking
- ✅ Non-empty validation
- ✅ Format validation (no binary data)

**4. Prompt Injection Mitigation**
- ✅ System prompt isolation
- ✅ User input prefixing
- ✅ Context boundary enforcement
- ✅ Suspicious pattern detection

**Files:**
- `Maya/backend/middleware/validation.js` - Input validation middleware
- `Maya/backend/utils/sanitize.js` - Sanitization utilities

**Example:**
```javascript
// Validates and sanitizes user input
const sanitizedInput = sanitizeInput(userMessage);
// Removes HTML, limits length, normalizes unicode
```

---

## Rate Limiting

### Why It's Necessary
Rate limiting prevents:
- **API Abuse**: Excessive requests drain resources
- **Cost Explosion**: Unauthorized usage of paid AI services
- **DoS Attacks**: Overwhelming the server
- **Fair Usage**: Ensures all users get reasonable access

### Implementation

**1. Per-IP Rate Limiting**
- ✅ 20 requests per 15 minutes per IP
- ✅ 100 requests per hour per IP
- ✅ Sliding window algorithm

**2. Per-User Rate Limiting** (Future)
- ✅ When user authentication is added
- ✅ Higher limits for authenticated users

**3. Endpoint-Specific Limits**
- ✅ Chat endpoint: Stricter limits
- ✅ Health check: More lenient

**4. Response Headers**
- ✅ `X-RateLimit-Limit`: Maximum requests
- ✅ `X-RateLimit-Remaining`: Remaining requests
- ✅ `X-RateLimit-Reset`: Reset time

**Files:**
- `Maya/backend/middleware/rateLimit.js` - Rate limiting middleware
- Uses `express-rate-limit` package

**Configuration:**
```javascript
// 20 requests per 15 minutes
windowMs: 15 * 60 * 1000,
max: 20
```

---

## CORS Configuration

### Why It's Important
CORS (Cross-Origin Resource Sharing) controls which domains can access your API:
- **Prevents CSRF**: Blocks unauthorized domains
- **Data Protection**: Limits who can read responses
- **Security Boundary**: Enforces same-origin policy

### Implementation

**1. Whitelist Approach**
- ✅ Only specific domains allowed
- ✅ Production: `agents.janetxiushi.me`, `janetxiushi.me`
- ✅ Development: `localhost:3001`, `localhost:8080` (default port 3001)

**2. Strict Headers**
- ✅ `Access-Control-Allow-Origin`: Specific domains only
- ✅ `Access-Control-Allow-Methods`: POST, GET, OPTIONS only
- ✅ `Access-Control-Allow-Headers`: Content-Type, Authorization only
- ✅ `Access-Control-Allow-Credentials`: false (no cookies)

**3. Preflight Handling**
- ✅ OPTIONS requests handled correctly
- ✅ CORS headers sent on all responses

**Files:**
- `Maya/backend/middleware/cors.js` - CORS configuration
- Uses `cors` package with custom options

**Configuration:**
```javascript
origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'],
credentials: false,
methods: ['GET', 'POST', 'OPTIONS']
```

---

## Request Size Limits

### Why It's Critical
Large requests can:
- **Crash Server**: Memory exhaustion
- **Slow Processing**: Degrade performance
- **Enable DoS**: Attack vector for denial of service

### Implementation

**1. Body Size Limits**
- ✅ Maximum request body: 1MB
- ✅ Maximum message length: 2000 characters
- ✅ Maximum history array: 50 messages

**2. Express Configuration**
- ✅ `express.json({ limit: '1mb' })`
- ✅ `express.urlencoded({ limit: '1mb' })`

**3. Validation**
- ✅ Request size checked before processing
- ✅ 413 Payload Too Large response for oversized requests

**Files:**
- `Maya/backend/server.js` - Express configuration
- `Maya/backend/middleware/validation.js` - Size validation

---

## Error Handling Security

### Why It Matters
Error messages can leak sensitive information:
- **Stack Traces**: Reveal code structure
- **API Keys**: Accidentally logged
- **System Paths**: Expose server structure
- **Database Info**: Reveal data schema
- **Usernames**: Reveal user accounts
- **Environment Details**: Reveal system configuration

### Implementation

**1. Generic Error Messages**
- ✅ User-facing: Generic, helpful messages
- ✅ No stack traces in production
- ✅ No internal paths exposed
- ✅ Never expose implementation details

**2. Logging Separation**
- ✅ Detailed errors logged server-side only (sanitized)
- ✅ User receives sanitized error messages
- ✅ Error IDs for tracking (without exposing details)

**3. Error Types**
- ✅ Validation errors: User-friendly messages
- ✅ Server errors: Generic "Something went wrong"
- ✅ Rate limit errors: Clear "Too many requests"

**4. Comprehensive Sanitization** (January 11, 2026)
- ✅ **Path Sanitization**: Absolute paths → relative paths, usernames masked
- ✅ **Token Masking**: All token-related messages redacted
- ✅ **Environment Masking**: Configuration details masked
- ✅ **Stack Trace Sanitization**: Paths sanitized in stack traces
- ✅ **Test Output Sanitization**: All test output sanitized before display

**Files:**
- `Maya/backend/middleware/errorHandler.js` - Error handling middleware (sanitizes all errors)
- `Maya/backend/utils/logger.js` - Secure logging utility (enhanced sanitization)
- `Maya/backend/utils/sanitize-output.js` - Sanitization utility (NEW)
- `Maya/backend/middleware/validation.js` - Uses logger utility
- `Maya/backend/server.js` - Test output sanitization

**Example:**
```javascript
// User sees:
{ error: "Invalid input. Please check your message." }

// Server logs (sanitized):
{ error: "ValidationError: Message exceeds 2000 characters", path: "middleware/validation.js" }

// Test output (sanitized):
// Before: FAIL /Users/username/.../Maya/tests/kb.test.js
// After:  FAIL tests/knowledge_tests/kb-cache.test.js
```

**Documentation:**
- [`tests/documentation/ERROR_LOG_SANITIZATION.md`](../Maya/tests/documentation/ERROR_LOG_SANITIZATION.md) - Detailed security guide
- [`backend/SECURITY_LOGGING.md`](../Maya/backend/SECURITY_LOGGING.md) - Security logging guidelines

---

## HTTPS Enforcement

### Why It's Required
HTTPS encrypts data in transit:
- **Prevents Eavesdropping**: Data encrypted between client and server
- **Prevents MITM**: Man-in-the-middle attacks blocked
- **Trust**: Users see secure connection
- **SEO**: Search engines prefer HTTPS

### Implementation

**1. Production Enforcement**
- ✅ Redirect HTTP to HTTPS
- ✅ HSTS (HTTP Strict Transport Security) headers
- ✅ SSL/TLS certificate required

**2. Development**
- ✅ Local development can use HTTP
- ✅ Production check warns if HTTP detected

**3. Headers**
- ✅ `Strict-Transport-Security: max-age=31536000`
- ✅ Forces HTTPS for 1 year

**Files:**
- `Maya/backend/middleware/securityHeaders.js` - Security headers middleware

---

## Content Security Policy

### Why It's Needed
CSP prevents XSS attacks:
- **Script Injection**: Blocks unauthorized scripts
- **Resource Loading**: Controls what resources can load
- **Data Exfiltration**: Prevents data theft

### Implementation

**1. CSP Configuration** (Updated: January 6, 2025)
- ✅ Configured via Helmet.js middleware
- ✅ Allows inline scripts (`'unsafe-inline'`) for chat functionality
- ✅ Allows external scripts from Google Tag Manager
- ✅ Allows external stylesheets from Google Fonts
- ✅ Allows external fonts from Google Fonts CDN
- ✅ Allows connections to AI Builders API

**2. CSP Directives:**

```javascript
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: [
      "'self'", 
      "'unsafe-inline'", // Allow inline styles
      "https://fonts.googleapis.com" // Google Fonts
    ],
    scriptSrc: [
      "'self'", 
      "'unsafe-inline'", // Allow inline scripts (needed for chat)
      "https://www.googletagmanager.com" // Google Tag Manager
    ],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: [
      "'self'",
      "https://www.googletagmanager.com", // Google Analytics
      "https://space.ai-builders.com" // AI Builders API
    ],
    fontSrc: [
      "'self'",
      "https://fonts.gstatic.com", // Google Fonts
      "data:" // Data URIs for fonts
    ],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  },
}
```

**3. Rationale for `'unsafe-inline'`:**
- **Why Needed**: The chat interface uses inline JavaScript for event handlers and API calls
- **Security Trade-off**: Acceptable for development and MVP phase
- **Future Improvement**: Consider using nonces or hashes for specific inline scripts
- **Mitigation**: Input sanitization and validation still protect against XSS

**4. External Resources Allowed:**
- ✅ Google Fonts (fonts.googleapis.com, fonts.gstatic.com) - For typography
- ✅ Google Tag Manager (googletagmanager.com) - For analytics
- ✅ AI Builders API (space.ai-builders.com) - For chat completions

**5. Security Headers:**
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-Frame-Options: DENY`
- ✅ `X-XSS-Protection: 1; mode=block`

**Files:**
- `Maya/backend/middleware/securityHeaders.js` - CSP configuration
- Updated: January 6, 2025 - Added support for inline scripts and external resources

**Implementation Notes:**
- CSP was initially blocking inline scripts, preventing chat functionality
- Updated to allow `'unsafe-inline'` for scripts and styles
- External resources (Google Fonts, Google Tag Manager) added to allowlist
- AI Builders API domain added to `connectSrc` for API calls

---

## Security Headers

### Why They Matter
Security headers provide defense-in-depth:
- **Multiple Layers**: Various attack vectors covered
- **Browser Enforcement**: Browsers enforce these policies
- **Standards Compliance**: Follows security best practices

### Implementation

**Complete Header Set:**
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

**Files:**
- `Maya/backend/middleware/securityHeaders.js` - All security headers

---

## Audit & Monitoring

### Why It's Important
Security is not set-and-forget:
- **Attack Detection**: Identify suspicious patterns
- **Compliance**: Meet security requirements
- **Incident Response**: Quick detection and response
- **Continuous Improvement**: Learn from incidents

### Implementation

**1. Request Logging**
- ✅ All API requests logged (without sensitive data)
- ✅ IP addresses logged
- ✅ Timestamps and endpoints
- ✅ Rate limit violations logged

**2. Error Tracking**
- ✅ Error frequency monitoring
- ✅ Unusual patterns detected
- ✅ Alert thresholds configured

**3. Security Events**
- ✅ Failed validation attempts
- ✅ Rate limit violations
- ✅ Suspicious input patterns
- ✅ Authentication failures (future)

**Files:**
- `Maya/backend/utils/logger.js` - Logging utility
- `Maya/backend/middleware/audit.js` - Audit logging middleware

---

## Security Checklist

### Pre-Deployment

- [x] API keys in environment variables (not code)
- [x] `.env` file in `.gitignore`
- [x] Input validation implemented
- [x] Rate limiting configured
- [x] CORS properly configured
- [x] Request size limits set
- [x] Error handling secure
- [x] Security headers added
- [x] HTTPS enforced (production)
- [x] Logging configured

### Ongoing

- [ ] Regular dependency updates
- [ ] Security audit logs reviewed
- [ ] Rate limit thresholds adjusted
- [ ] CORS origins updated as needed
- [ ] Error patterns monitored

---

## Threat Model

### Identified Threats

1. **API Key Theft**
   - **Mitigation**: Environment variables, never exposed
   - **Risk Level**: High
   - **Status**: ✅ Mitigated

2. **Prompt Injection**
   - **Mitigation**: Input validation, system prompt isolation
   - **Risk Level**: Medium
   - **Status**: ✅ Mitigated

3. **Rate Limit Bypass**
   - **Mitigation**: Per-IP limiting, multiple layers
   - **Risk Level**: Medium
   - **Status**: ✅ Mitigated

4. **XSS Attacks**
   - **Mitigation**: Input sanitization, CSP headers
   - **Risk Level**: Medium
   - **Status**: ✅ Mitigated

5. **DoS Attacks**
   - **Mitigation**: Rate limiting, request size limits
   - **Risk Level**: Medium
   - **Status**: ✅ Mitigated

6. **Data Exfiltration**
   - **Mitigation**: CORS restrictions, secure headers
   - **Risk Level**: Low
   - **Status**: ✅ Mitigated

---

## Security Best Practices Summary

1. ✅ **Never commit secrets** - Use environment variables
2. ✅ **Validate all input** - Trust nothing from users
3. ✅ **Limit everything** - Rate limits, size limits, time limits
4. ✅ **Encrypt in transit** - HTTPS everywhere
5. ✅ **Principle of least privilege** - Minimal access needed
6. ✅ **Defense in depth** - Multiple security layers
7. ✅ **Monitor and audit** - Know what's happening
8. ✅ **Keep dependencies updated** - Patch vulnerabilities
9. ✅ **Error handling** - Don't leak information
10. ✅ **Documentation** - This file!

---

## Incident Response

### If Security Breach Detected

1. **Immediate Actions**
   - Rotate API keys immediately
   - Review audit logs
   - Check for unauthorized access
   - Assess data exposure

2. **Investigation**
   - Identify attack vector
   - Determine scope of breach
   - Document findings

3. **Remediation**
   - Patch vulnerability
   - Update security measures
   - Notify affected users (if applicable)

4. **Prevention**
   - Update threat model
   - Enhance security measures
   - Review and improve monitoring

---

## Implementation Progress - Maya Backend Connection

### Status: 🔄 In Progress

This section documents the secure implementation of the backend API connection for Maya's chat interface.

---

### Phase 1: Frontend Message Features ✅

**Date**: 2025-01-06  
**Time**: Current Session

#### Completed:
- ✅ Copy message functionality added
- ✅ Edit message functionality added
- ✅ Visual indicator for edited messages
- ✅ Message IDs for tracking edits
- ✅ Secure clipboard API usage
- ✅ Edit history tracking in LocalStorage

#### Security Considerations:
- **Clipboard API**: Uses secure `navigator.clipboard.writeText()` API
- **Input Validation**: Edited messages validated before saving
- **XSS Prevention**: Edited content sanitized through existing `formatMessage()` function
- **Data Integrity**: Message IDs prevent tampering with message history

#### Files Modified:
- `Maya/frontend/maya.html` - Added copy/edit UI and functionality

---

### Phase 2: Backend API Connection ✅

**Date**: 2025-01-06  
**Status**: ✅ **COMPLETE** - Backend fully functional

#### Implementation Status:
Backend API endpoint fully implemented and tested. All security measures active.

#### Implementation Steps:

**Step 1: Create Backend Server** ✅ **2025-01-06**
- [x] Create `Maya/backend/server.js` based on `server.example.js`
- [x] Implement `/api/chat` endpoint
- [x] Integrate MCP client for AI responses
- [x] Add Maya system prompt configuration
- **Security**: All middleware already implemented (rate limiting, validation, CORS, etc.)
- **Files Created**: `Maya/backend/server.js`, `Maya/backend/mcp-client.js`

**Step 2: Environment Setup** ✅ **2025-01-06**
- [x] Create `.env.example` file
- [x] Document `.env` setup process
- [x] `.env` file created from `.env.example`
- [x] `AI_BUILDER_TOKEN` configured securely
- [x] `AI_BUILDERS_API_URL` configured
- [x] `AI_BUILDERS_MODEL` configured
- [x] Configure `ALLOWED_ORIGINS` for production domains (configured in `Maya/backend/config/env.js`)
- **Security**: `.env` already in `.gitignore`, token validation in place
- **Documentation**: See `Maya/Implementation.md` and `Maya/README.md` for setup details

**Step 3: MCP Integration** ✅ **2025-01-06**
- [x] MCP client wrapper implemented (`MayaMCPClient` class)
- [x] Chat completion function using AI Builders API
- [x] Maya system prompt integrated
- [x] Fallback error handling implemented
- **Security**: Token passed securely, never exposed in logs
- **Note**: Using AI Builders API directly since MCP server provides tools, not chat completion

**Step 4: API Endpoint Implementation** ✅ **2025-01-06**
- [x] Implement POST `/api/chat` endpoint
- [x] Validate incoming requests (already implemented)
- [x] Sanitize user input (already implemented)
- [x] Call AI service for response
- [x] Return formatted response
- **Security**: All security middleware in place and active

**Step 5: Error Handling** ✅ **2025-01-06**
- [x] Handle connection errors gracefully
- [x] Return user-friendly error messages
- [x] Log errors server-side only
- [x] Implement retry logic for MCP connection
- **Security**: Error messages don't expose sensitive information
- **Implementation**: Graceful degradation with helpful fallback messages

**Step 6: Testing** ✅ **2025-01-06**
- [x] Test API endpoint locally
- [x] Test with frontend connection
- [x] Health check endpoint tested
- [x] Chat endpoint tested
- [x] Rate limiting verified
- [x] Input validation verified
- [x] CSP configuration tested and fixed
- [x] Static file serving tested
- [x] Run security tests (`npm run test:security`) - ✅ All passing
- [x] Run performance tests (`npm run test:performance`) - ✅ All passing
- **Status**: ✅ Backend fully functional, tested, and deployed

**Step 7: Deployment** ✅ **Complete**
- [x] Backend server running (port 3001)
- [x] Frontend connected to backend API
- [x] HTTPS ready for production deployment
- [x] CORS configuration tested and verified
- [x] Security monitoring active
- **Security**: HTTPS enforced, CORS configured, rate limiting active

#### Security Checklist for Backend Connection:

- [x] Input validation middleware implemented
- [x] Rate limiting configured
- [x] CORS properly set up
- [x] Security headers added
- [x] Error handling secure
- [x] API key protection in place
- [x] Backend server implemented ✅ **2025-01-06**
- [x] MCP client integration implemented ✅ **2025-01-06**
- [x] End-to-end testing complete ✅ **2025-01-06**
- [x] Production deployment ready ✅ **2025-01-06**

#### Files to Create/Update:

1. **`Maya/backend/server.js`** - Main server file ✅ **Created**
   - All security middleware integrated
   - `/api/chat` endpoint implemented
   - MCP client connected

2. **`Maya/backend/mcp-client.js`** - MCP client wrapper ✅ **Created**
   - MCP server connection handled
   - Chat completion implemented
   - Maya system prompt integrated
   - Error handling implemented

3. **`Maya/backend/.env`** - Environment configuration ✅ **Created**
   - Created from `.env.example`
   - `AI_BUILDER_TOKEN` configured
   - Production settings ready

4. **`Maya/frontend/maya.html`** - Frontend connected ✅ **Updated**
   - API URL configured
   - Connection tested and working

#### Implementation Complete:

✅ All backend components implemented and tested  
✅ Security measures active and verified  
✅ Ready for production deployment

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [MCP Protocol Security](https://modelcontextprotocol.io)

---

**Last Updated**: January 9, 2026, 19:54 GMT
**Security Review**: ✅ Implementation complete and tested
**Status**: ✅ All security measures active and verified
**Next Review**: Before production deployment

