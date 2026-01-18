# Chat Logs Access Guide

**Date**: January 17, 2026  
**Purpose**: Explain what chat logs exist, where they're stored, and how to access them

---

## 🔍 What Is Logged

### ✅ What IS Logged (Server-Side)

**Request Metadata** (via `auditLog` middleware):

- HTTP method (GET, POST, etc.)
- Request path (`/api/chat`)
- Client IP address
- User agent (browser info)
- Timestamp
- Request duration

**Security Events**:

- Rate limit violations (429 errors)
- CORS policy violations (403 errors)
- Server errors (500+)
- Input validation warnings
- Prompt injection detection warnings

**Example Log Entry**:

```json
{
  "method": "POST",
  "path": "/api/chat",
  "ip": "::ffff:127.0.0.1",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2026-01-17T20:15:21.197Z",
  "statusCode": 200,
  "duration": "1250ms"
}
```

### ❌ What IS NOT Logged

**Chat Message Content**:

- ❌ User messages (not logged for privacy)
- ❌ Maya's responses (not logged for privacy)
- ❌ Conversation history (not stored server-side)

**Why**: Privacy and security - chat content is not stored server-side to protect user privacy.

---

## 📍 Where Logs Are Stored

### Local Development

**Location**: `Maya/backend/server.log`

**Access**:

```bash
# View recent logs
tail -f Maya/backend/server.log

# View last 100 lines
tail -n 100 Maya/backend/server.log

# Search for specific entries
grep "api/chat" Maya/backend/server.log
```

**Note**: Logs also go to `stdout` (console) when running `npm start`.

### Production (Deployed Service)

**Location**: Deployment platform logs (AI Builders Space)

**Access Methods**:

1. **Deployment Dashboard**:
   - Go to: <https://space.ai-builders.com>
   - Navigate to service: `maya-agent`
   - Click "Logs" or "View Logs"
   - Should show real-time server logs

2. **Platform Logs API** (if available):

   ```bash
   # Check platform documentation for log access API
   curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://space.ai-builders.com/backend/v1/services/maya-agent/logs
   ```

3. **SSH/Container Access** (if available):

   ```bash
   # If platform provides SSH access
   ssh user@maya-agent.ai-builders.space
   # Then check logs in container
   ```

---

## 🔍 What You Can See in Logs

### Request Logs

```
[INFO] Request received {
  method: 'POST',
  path: '/api/chat',
  ip: '::ffff:127.0.0.1',
  userAgent: 'Mozilla/5.0...',
  timestamp: '2026-01-17T20:15:21.197Z'
}
```

### Response Logs

```
[INFO] Request completed {
  method: 'POST',
  path: '/api/chat',
  statusCode: 200,
  duration: '1250ms',
  ip: '::ffff:127.0.0.1'
}
```

### Security Events

```
[WARN] Rate limit exceeded {
  ip: '::ffff:127.0.0.1',
  path: '/api/chat'
}

[WARN] Input validation warnings {
  warnings: ['Suspicious input pattern detected']
}
```

### Error Logs

```
[ERROR] MCP client initialization failed {
  hasToken: true,
  tokenLength: 45
}
```

---

## ⚠️ Important Privacy Note

**Chat message content is NOT logged server-side** for privacy reasons:

- ✅ User privacy protected
- ✅ No conversation data stored
- ✅ GDPR/privacy compliant
- ❌ Cannot retrieve past conversations from server logs

**Frontend Storage**:

- Chat history stored in browser `localStorage` (client-side only)
- Each user's browser stores their own chat history
- Not accessible from server

---

## 🛠️ How to Access Logs

### Method 1: Local Development Logs

```bash
cd Maya/backend

# View live logs (follow mode)
tail -f server.log

# View last 50 lines
tail -n 50 server.log

# Search for chat requests
grep "api/chat" server.log

# Search for errors
grep "ERROR" server.log

# Search for security events
grep "WARN" server.log | grep -i "rate\|cors\|security"
```

### Method 2: Production Deployment Logs

**Via Dashboard**:

1. Go to: <https://space.ai-builders.com>
2. Login with your credentials
3. Navigate to: Services → `maya-agent`
4. Click: "Logs" or "View Logs"
5. Filter by: Time range, log level (INFO, WARN, ERROR)

**Via API** (if available):

```bash
# Check platform API documentation
# May require authentication token
```

### Method 3: Real-Time Monitoring

**If platform supports streaming logs**:

```bash
# Platform may provide log streaming
# Check deployment dashboard for "Stream Logs" option
```

---

## 📊 Log Analysis Examples

### Find All Chat Requests

```bash
grep "POST.*api/chat" Maya/backend/server.log
```

### Find Rate Limit Violations

```bash
grep "Rate limit exceeded" Maya/backend/server.log
```

### Find CORS Errors

```bash
grep "CORS\|403" Maya/backend/server.log
```

### Find Prompt Injection Attempts

```bash
grep "Suspicious input pattern\|prompt injection" Maya/backend/server.log
```

### Find Errors

```bash
grep "ERROR" Maya/backend/server.log | tail -20
```

### Count Total Requests

```bash
grep "Request received" Maya/backend/server.log | wc -l
```

---

## 🔐 Security Considerations

### What Logs Reveal

- ✅ Request patterns (frequency, timing)
- ✅ IP addresses (for rate limiting)
- ✅ Error patterns (for debugging)
- ✅ Security events (attacks, violations)
- ❌ Chat message content (privacy protected)
- ❌ User identities (no authentication)
- ❌ Personal information (not logged)

### Log Retention

- **Local**: `server.log` file (may grow over time)
- **Production**: Platform-dependent (check deployment platform)
- **Recommendation**: Rotate logs regularly to prevent disk space issues

---

## 📝 Adding Chat Content Logging (Optional)

**⚠️ Privacy Warning**: Logging chat content requires:

- User consent/notification
- GDPR compliance
- Data retention policies
- Secure storage

**If you want to add chat logging**:

1. **Add logging to `/api/chat` endpoint**:

   ```javascript
   // In server.js, after receiving message
   logInfo('Chat message received', {
     messageLength: message.length,
     hasHistory: history.length > 0,
     historyLength: history.length,
     // Optionally log sanitized message preview (first 50 chars)
     messagePreview: message.substring(0, 50) + '...'
   });
   ```

2. **Add response logging**:

   ```javascript
   // After getting response
   logInfo('Chat response sent', {
     responseLength: content.length,
     statusCode: 200
   });
   ```

3. **Consider privacy**:
   - Only log if user consents
   - Anonymize IP addresses
   - Set retention policies
   - Encrypt stored logs

---

## 🎯 Quick Reference

| Log Type | Location | Contains | Privacy |
|----------|----------|----------|---------|
| **Request Metadata** | `server.log` / stdout | Method, path, IP, timestamp | ✅ Safe |
| **Response Metadata** | `server.log` / stdout | Status, duration | ✅ Safe |
| **Security Events** | `server.log` / stdout | Rate limits, CORS, errors | ✅ Safe |
| **Chat Content** | ❌ Not logged | User messages, responses | ❌ Not stored |
| **Frontend History** | Browser localStorage | User's chat history | Client-side only |

---

## 📋 Summary

**What You Can Access**:

- ✅ Request/response metadata (method, path, IP, timing)
- ✅ Security events (rate limits, CORS violations)
- ✅ Error logs (server errors, connection issues)
- ✅ Input validation warnings (prompt injection attempts)

**What You Cannot Access**:

- ❌ Chat message content (not logged for privacy)
- ❌ Conversation history (stored client-side only)
- ❌ User identities (no authentication system)

**Where to Find Logs**:

- **Local**: `Maya/backend/server.log` or `stdout`
- **Production**: Deployment platform dashboard (<https://space.ai-builders.com>)

---

**Status**: Chat content logging disabled for privacy  
**Access**: Metadata logs available via `server.log` or deployment platform  
**Privacy**: User conversations not stored server-side
