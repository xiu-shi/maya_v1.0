# Maya Production Data Flow - Step by Step Guide

## 🎯 Overview

This diagram shows exactly how Maya (frontend) communicates with the backend in production.

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Frontend: maya.html                                    │  │
│  │  URL: https://maya-agent.ai-builders.space/maya.html    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│                           │ Step 1: User types message          │
│                           │ "hello"                             │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  JavaScript Code (maya.html)                            │  │
│  │                                                           │  │
│  │  const API_BASE_URL = '';  // Empty = same origin        │  │
│  │  const apiUrl = `${API_BASE_URL}/api/chat`;              │  │
│  │  // Result: '/api/chat' (relative URL)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│                           │ Step 2: fetch('/api/chat', ...)    │
│                           │ Browser resolves to:                │
│                           │ https://maya-agent.ai-builders.    │
│                           │   space/api/chat                    │
│                           ▼                                     │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS Request
                           │ POST /api/chat
                           │ Body: { message: "hello", history: [] }
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              DEPLOYED SERVER (Docker Container)                  │
│              https://maya-agent.ai-builders.space               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Express Server (server.js)                              │  │
│  │  Port: 3000 (internal)                                   │  │
│  │  Listening on: 0.0.0.0:3000                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│                           │ Step 3: Request arrives            │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Middleware Chain:                                       │  │
│  │  1. CORS (allows same-origin requests)                  │  │
│  │  2. Rate Limiting (20 requests per 15 min)              │  │
│  │  3. Validation (checks message format)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│                           │ Step 4: Route handler             │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  POST /api/chat Handler                                 │  │
│  │                                                           │  │
│  │  ✅ Check: AI_BUILDER_TOKEN configured?                 │  │
│  │  ✅ Get MCP Client (lazy load)                          │  │
│  │  ✅ Call AI Builders API                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│                           │ Step 5: MCP Client Call            │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  MCP Client (mcp-client.js)                            │  │
│  │                                                           │  │
│  │  Uses: AI_BUILDER_TOKEN (from env var)                  │  │
│  │  Connects to: AI Builders MCP Server                    │  │
│  │  Sends: User message + system prompt                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│                           │ Step 6: External API Call          │
│                           ▼                                     │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS Request
                           │ To: AI Builders API
                           │ Auth: AI_BUILDER_TOKEN
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              AI BUILDERS API (External Service)                  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Processes request                                       │  │
│  │  Returns: AI response                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ Response: "Hello! How can I help?"
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              DEPLOYED SERVER                                     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  MCP Client receives response                            │  │
│  │  → Backend processes response                            │  │
│  │  → Returns JSON to frontend                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│                           │ Step 7: Response sent              │
│                           │ Status: 200 OK                      │
│                           │ Body: { response: "Hello!..." }     │
│                           ▼                                     │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS Response
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Frontend receives response                             │  │
│  │  → Displays message in chat                             │  │
│  │  → User sees Maya's response                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔍 Step-by-Step Breakdown

### Step 1: User Types Message
- User types "hello" in the chat input
- Clicks "Send" button

### Step 2: Frontend JavaScript Executes
**Location**: `maya.html` lines 772-797

```javascript
// API_BASE_URL is determined:
const protocol = 'https:';
const hostname = 'maya-agent.ai-builders.space';
const port = '';

// Logic checks:
// - Is localhost? NO
// - Is file://? NO
// - Is production? YES
// → Returns: '' (empty string)

const API_BASE_URL = '';  // Empty = same origin
const apiUrl = `${API_BASE_URL}/api/chat`;  // Result: '/api/chat'
```

**What happens**: Browser sees `/api/chat` as a relative URL and resolves it to:
- `https://maya-agent.ai-builders.space/api/chat`

### Step 3: Browser Makes HTTP Request
**Request Details**:
```
Method: POST
URL: https://maya-agent.ai-builders.space/api/chat
Headers:
  Content-Type: application/json
Body:
  {
    "message": "hello",
    "history": []
  }
```

### Step 4: Request Arrives at Server
**Location**: `server.js` - Express server listening on port 3000

The request goes through middleware:
1. **CORS** - Allows requests from same origin ✅
2. **Rate Limiting** - Checks if user exceeded limit
3. **Validation** - Validates message format
4. **Route Handler** - Processes `/api/chat` request

### Step 5: Backend Checks Configuration
**Location**: `server.js` - Chat endpoint handler

```javascript
// Check if AI_BUILDER_TOKEN is configured
if (!config.aiBuilderToken) {
  return res.status(503).json({
    error: 'Service temporarily unavailable',
    message: 'AI service token is not configured.'
  });
}
```

**⚠️ Common Issue**: If `AI_BUILDER_TOKEN` is not set in deployment environment variables, this returns 503 error.

### Step 6: Backend Calls AI Builders API
**Location**: `mcp-client.js`

- Uses `AI_BUILDER_TOKEN` from environment variables
- Connects to AI Builders MCP Server
- Sends user message + system prompt
- Waits for AI response

### Step 7: Response Sent Back to Frontend
**Response Format**:
```json
{
  "response": "Hello! How can I help you today?"
}
```

### Step 8: Frontend Displays Response
- JavaScript receives response
- Adds message to chat UI
- User sees Maya's response

## 🐛 Troubleshooting: Why "Connection Issues"?

Based on the error message you're seeing, here are the most likely causes:

### Issue 1: AI_BUILDER_TOKEN Not Configured ⚠️ MOST LIKELY

**Symptom**: Error message "I apologize, but I'm experiencing connection issues"

**Check**:
1. Go to deployment dashboard
2. Check Environment Variables
3. Look for `AI_BUILDER_TOKEN`
4. Should be set to: `sk_937d9f12_...` (your development key)

**Fix**: Set `AI_BUILDER_TOKEN` in deployment environment variables

### Issue 2: Frontend Still Using Old Code

**Symptom**: Browser console shows `apiBaseUrl: "https://api.janetxiushi.me"`

**Check**: Open browser console (F12), look for:
```
🔧 Maya Chat Configuration: {
  apiBaseUrl: "..."
}
```

**Fix**: 
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Or clear browser cache completely

### Issue 3: Backend Server Not Running

**Symptom**: Network tab shows request failed or timeout

**Check**: 
- Go to: `https://maya-agent.ai-builders.space/health`
- Should return: `{"status":"ok",...}`

**Fix**: Check deployment status in dashboard

### Issue 4: CORS Issue

**Symptom**: Browser console shows CORS error

**Check**: Browser console for CORS errors

**Fix**: Should not happen (same origin), but check CORS middleware

## 🔧 Quick Diagnostic Steps

1. **Check Browser Console** (F12):
   ```
   Look for:
   - apiBaseUrl: "" (should be empty)
   - 📤 Sending request to: /api/chat
   - Any error messages
   ```

2. **Check Network Tab** (F12 → Network):
   ```
   Look for:
   - Request to /api/chat
   - Status code: 200, 503, or 500?
   - Response body
   ```

3. **Check Server Health**:
   ```
   Visit: https://maya-agent.ai-builders.space/health
   Should return: {"status":"ok",...}
   ```

4. **Check Environment Variables**:
   ```
   In deployment dashboard:
   - AI_BUILDER_TOKEN should be set
   - Should be your development key (sk_937d9f12_...)
   ```

## 📋 Next Steps

1. ✅ Check browser console for `apiBaseUrl` value
2. ✅ Check Network tab for `/api/chat` request
3. ✅ Check `/health` endpoint
4. ✅ Verify `AI_BUILDER_TOKEN` is set in deployment

---

**Remember**: This is your first production deployment - take it step by step! 🚀
