# Maya Chat Functionality Diagnosis
**Date**: January 18, 2026, 12:57 GMT  
**Issue**: API responses not surfacing through chat interface  
**Last Working Deployment**: Commit `35d4526` (Jan 17, 23:02:51)

---

## Executive Summary

The chat functionality broke after commit `49cf4b4` (Jan 17, 23:06:09) which implemented "fresh start on each visit". While the API itself is working (verified via curl), responses are not appearing in the frontend chat interface.

---

## Chat Flow Architecture

### 1. Frontend → Backend Flow

```
User Input (maya.html)
  ↓
sendMessage() function
  ↓
fetch('/api/chat', { message, history })
  ↓
Backend: POST /api/chat (server.js)
  ↓
getMCPClient() → lazy load MCP client
  ↓
client.chat(message, history)
  ↓
chatWithAIBuildersAPI() (mcp-client.js)
  ↓
AI Builders API (https://space.ai-builders.com/backend/v1/chat/completions)
  ↓
Response flows back through chain
  ↓
Frontend: addMessage('maya', response)
```

---

## Key Components

### Frontend (`Maya/frontend/maya.html`)

**Critical Variables:**
- `chatInput` - Textarea element for user input
- `submitBtn` - Send button
- `chatMessages` - Container for chat messages
- `currentChatId` - Current chat session ID
- `chats` - Array of chat sessions
- `messageHistory` - Array of messages in current chat

**Key Functions:**
- `sendMessage()` - Async function that sends user message to API
- `addMessage(role, content, messageId)` - Adds message to UI
- `showTypingIndicator()` - Shows typing animation
- `removeTypingIndicator(id)` - Removes typing animation
- `init()` - Initializes chat state on page load

### Backend (`Maya/backend/server.js`)

**Endpoint:** `POST /api/chat`
- Validates request
- Gets MCP client (lazy loaded)
- Calls `client.chat(message, history)`
- Returns `{ response: content, warnings: [] }`

### MCP Client (`Maya/backend/mcp-client.js`)

**Class:** `MayaMCPClient`
- `connect()` - Connects to MCP server
- `chat(message, history)` - Main chat method
- `chatWithAIBuildersAPI(message, history)` - Direct API call
- Returns `{ content: string }` or `{ response: string }`

---

## Changes in Commit `49cf4b4` (The Breaking Change)

**Commit:** `49cf4b4` - "Fix maya.html to start fresh on each visit and scroll to top"  
**Date:** Jan 17, 23:06:09

### What Changed:

1. **Chat State Initialization:**
   ```javascript
   // BEFORE (working):
   let chats = JSON.parse(localStorage.getItem('mayaChats') || '[]');
   
   // AFTER (broken):
   let chats = []; // Always start with empty chats
   ```

2. **init() Function:**
   ```javascript
   // BEFORE (working):
   function init() {
     renderChatHistory();
     if (chats.length > 0) {
       loadChat(chats[0].id);
     }
   }
   
   // AFTER (broken):
   function init() {
     currentChatId = null;
     messageHistory = [];
     chats = [];
     renderChatHistory();
     clearMessages();
     // Scroll to top logic...
   }
   ```

3. **Initialization Timing:**
   ```javascript
   // BEFORE (working):
   init();
   
   // AFTER (broken):
   if (document.readyState === 'loading') {
     document.addEventListener('DOMContentLoaded', function() {
       window.scrollTo({ top: 0, behavior: 'instant' });
       init();
     });
   } else {
     window.scrollTo({ top: 0, behavior: 'instant' });
     init();
   }
   ```

---

## Potential Issues Identified

### Issue #1: Event Listener Timing
**Status:** ⚠️ POTENTIAL ISSUE

Event listeners are attached **outside** `init()`, which means they attach when the script runs. However, if DOM elements don't exist yet, `addEventListener` will fail silently.

**Current Code:**
```javascript
// Event listeners attached here (line ~858)
chatInput.addEventListener('keydown', ...);
submitBtn.addEventListener('click', sendMessage);
```

**Risk:** If `chatInput` or `submitBtn` are `null` when script runs, listeners won't attach.

---

### Issue #2: Response Parsing Order
**Status:** ✅ FIXED (in commit `9a8c10a`)

**Previous Issue:** Code parsed JSON before checking `response.ok`, causing errors on failed requests.

**Current Status:** Fixed - checks `response.ok` first, then parses JSON.

---

### Issue #3: Message History State
**Status:** ⚠️ NEEDS INVESTIGATION

When `init()` resets `messageHistory = []`, but `sendMessage()` uses `messageHistory` to send to API. If `init()` runs AFTER event listeners attach but BEFORE user sends message, state might be inconsistent.

**Flow Concern:**
1. Page loads
2. Event listeners attach (reference `sendMessage`)
3. `init()` runs (resets `messageHistory = []`)
4. User types message
5. `sendMessage()` called
6. Uses `messageHistory` (should be empty for new chat)

**This should be fine** - empty history is correct for new chat.

---

### Issue #4: DOM Element Availability
**Status:** ⚠️ CRITICAL CONCERN

**Current Code:**
```javascript
const chatInput = document.getElementById('chatInput');
const submitBtn = document.getElementById('submitBtn');
// ... (line ~802-807)

// Later (line ~858):
chatInput.addEventListener('keydown', ...);
```

**Problem:** If script runs before DOM is ready, `chatInput` and `submitBtn` will be `null`, and `addEventListener` will throw an error, breaking the entire script.

**Evidence:** The fact that we moved event listeners into `init()` in commit `a2be4d0` suggests this was a known issue.

---

### Issue #5: addMessage Function Availability
**Status:** ✅ LIKELY OK

`addMessage()` is defined as a function declaration, which is hoisted. It should be available when `sendMessage()` calls it.

---

## Current State Analysis

### What We Know Works:
1. ✅ API endpoint responds correctly (verified via curl)
2. ✅ Backend `/api/chat` endpoint exists and processes requests
3. ✅ MCP client connects and calls AI Builders API
4. ✅ Response format is correct: `{ response: "...", warnings: [] }`

### What We Know Is Broken:
1. ❌ Frontend not displaying API responses
2. ❌ Typing indicator may not be showing
3. ❌ User messages may not be sending

---

## Diagnostic Checklist

### Frontend Issues to Verify:

1. **Are event listeners attached?**
   - Check browser console for errors
   - Verify `chatInput` and `submitBtn` exist when listeners attach
   - Test: Click Send button - does it trigger?

2. **Is sendMessage() being called?**
   - Check console logs: `📤 Sending request to:`
   - If not appearing, event listeners aren't working

3. **Is API call being made?**
   - Check Network tab in DevTools
   - Look for POST request to `/api/chat`
   - Check request payload and response

4. **Is response being received?**
   - Check console logs: `📥 Response status:`, `📥 Response data:`
   - Verify response structure matches expected format

5. **Is addMessage() being called?**
   - Check console logs: `💬 Adding message to UI`
   - Verify `chatMessages` element exists

6. **Is message being added to DOM?**
   - Check console logs: `✅ Message element added`
   - Inspect DOM: Are message divs being created?

---

## Root Cause Hypothesis

**Most Likely:** Event listeners are failing to attach because DOM elements don't exist when script runs.

**Evidence:**
- Commit `a2be4d0` moved listeners into `init()` to fix DOM timing
- Commit `a5b03f9` moved them back out (reverting to working structure)
- But the "working structure" assumes DOM is ready when script runs

**The Real Issue:**
The script runs **before** DOM is ready. When we try to attach listeners:
```javascript
chatInput.addEventListener(...) // chatInput is null!
```
This throws an error, breaking the entire script execution.

---

## Next Steps for Diagnosis

1. **Check browser console** for JavaScript errors
2. **Verify DOM readiness** - when do elements exist?
3. **Test event listener attachment** - are they actually attached?
4. **Trace execution flow** - follow a message from input to display
5. **Compare with working version** - what's different?

---

## Files to Review

1. `Maya/frontend/maya.html` - Frontend chat logic
2. `Maya/backend/server.js` - API endpoint
3. `Maya/backend/mcp-client.js` - MCP client and API calls
4. Git history: Commits `35d4526` (working) vs `49cf4b4` (broken) vs current

---

**Status:** Diagnosis in progress - awaiting browser console logs to confirm hypothesis.
