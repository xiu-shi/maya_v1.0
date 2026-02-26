# AWS S3 Chat Logging Architecture

## Overview

Maya's backend captures every chat conversation as a single JSON document in AWS S3. Each conversation accumulates up to 30 messages. After 5 minutes of inactivity, the conversation is automatically marked as "completed" with a final S3 write.

Concurrent conversations from different users are fully isolated — each conversation has a unique `conversationId` generated on the frontend, and IP address is stored as an additional differentiator for analytics.

---

## Changelog

### 2026-02-26 — Critical Bug Fixes: S3 Logging Pipeline

**Root Cause Analysis**: S3 logging on production was completely non-functional after Feb 24th. Three bugs identified and fixed:

1. **Deployment script missing AWS env vars** — `DEPLOY_WITH_ENV_VAR.sh` only sent `SYSTEM_INSTRUCTION` to the container. `ENABLE_S3_LOGGING`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_REGION` were never deployed. Fixed by loading AWS vars from `Maya/backend/.env` and including them in the deployment payload.

2. **Frontend never sent `conversationId`** — `maya.html` sent `{ message, history }` without a `conversationId`, so the backend generated a new random ID for every single message. This meant each message was stored as a separate 1-message S3 document instead of accumulating into a conversation. Fixed by generating `conversationId` on the frontend per chat session and sending it with each request.

3. **No conversation segmentation after 5-min gap** — If a user resumes chatting after 5 minutes of inactivity (within the same browser session), the system now treats it as a brand new conversation with a fresh `conversationId`. Backend tracks finalized conversations and generates a new segment ID when a finalized conversation receives a new message. The new `conversationId` is sent back to the frontend in the response.

4. **Cross-day conversation blocking** — If a user tries to continue a conversation from a previous day, the frontend blocks input and prompts "Start a NEW CHAT". The backend also checks the conversationId's embedded timestamp against today's date as defense-in-depth. On page load, if the most recent chat is from a previous day, a new chat is auto-created.

**Conversation Lifecycle Rules**:
- New session start → logged with unique date/time as the conversation starting point
- 5-min inactivity → conversation automatically finalized in S3 (status: "completed")
- Same-day resume after 5-min gap → logged as a NEW conversation (new conversationId + new S3 document)
- Cross-day resume → frontend prompts "Start a NEW CHAT" (input disabled, read-only history)

**Files Changed**:
- `Maya/frontend/maya.html` — generate and send `conversationId`, accept new segment IDs from backend, cross-day chat blocking with "Start a NEW CHAT" prompt
- `Maya/backend/utils/conversation-session.js` — added `wasConversationFinalized()`, `generateSegmentId()`, finalized session tracking
- `Maya/backend/server.js` — resolve conversation segmentation (5-min gap + cross-day) before logging/responding
- `DEPLOY_WITH_ENV_VAR.sh` — load and send all AWS env vars to deployment API
- `Maya/backend/tests/conversation-session.test.js` — 8 new tests for segmentation tracking and segment ID generation (35 total)
- Updated 9 test files to mock the two new exports

### 2026-02-15 — Conversation Lifecycle & Session Manager

**New: Conversation Session Manager** (`utils/conversation-session.js`)
- Tracks all active conversations in-memory with per-conversation inactivity timers
- After 5 minutes of no new messages, automatically finalizes the conversation in S3
- Sets `conversationStatus: "completed"`, `endedAt`, `endReason`, and `durationMs`
- Supports concurrent conversations — each is tracked independently by `conversationId`
- On graceful server shutdown (SIGTERM/SIGINT), all active sessions are finalized before exit

**Updated: S3 Logger** (`utils/s3-logger.js`)
- Added `finalizeConversationInS3(s3Key, metadata)` — reads the existing conversation document, marks it as "completed", and writes it back to S3
- New conversations are initialized with `conversationStatus: "active"`
- Finalized conversations include S3 object metadata: `conversation-status`, `ended-at`

**Updated: Chat Logger** (`utils/chat-logger.js`)
- Now imports and calls `trackConversationMessage()` after each message is logged
- Each message resets the 5-minute inactivity timer for its conversation

**Updated: Server** (`server.js`)
- Graceful shutdown handlers (SIGTERM/SIGINT) now call `finalizeAllSessions()` to flush all active conversations to S3 before exit

**Tests**
- New: `conversation-session.test.js` — 20+ tests covering session creation, timer reset, inactivity finalization, concurrent isolation, graceful shutdown, S3 failure resilience
- Updated: `s3-logger.test.js` — added `finalizeConversationInS3` and `conversationStatus` tests
- Updated: `s3-chat-logs-capture-requirements.test.js` — added lifecycle status requirements
- Updated: All test files that import `chat-logger.js` now mock `conversation-session.js`
- Removed: `chat-logging-retry-health.test.js` (entirely skipped / obsolete)

### 2026-02-14 — Conversation-Based S3 Logging (Initial)

- Changed S3 storage granularity from individual messages to whole conversations
- Each conversation stored as a single S3 object: `chat-logs/conversations/YYYY/MM/DD/{conversationId}.json`
- Messages accumulate via GET-append-PUT pattern with deduplication by message ID
- 30-message cap per conversation
- Upload queue serializes writes per conversation key to prevent race conditions
- `fetchLogsFromS3` reads both new conversation documents and legacy per-message objects

---

## Architecture

### S3 Key Structure

```
chat-logs/
  conversations/
    YYYY/MM/DD/
      {conversationId}.json     ← one JSON doc per conversation
  YYYY/MM/DD/
    {timestamp}_{ip}_{msgId}.json  ← legacy per-message format (read-only)
```

### Conversation Document Schema

```json
{
  "conversationId": "conv_1740000000000_abc123",
  "conversationStatus": "active | completed",
  "startedAt": "2026-02-15T10:00:00.000Z",
  "lastMessageAt": "2026-02-15T10:04:30.000Z",
  "endedAt": "2026-02-15T10:09:30.000Z",
  "endReason": "inactivity_timeout",
  "durationMs": 570000,
  "messageCount": 5,
  "messageCap": 30,
  "environment": "production",
  "serverHost": "maya-agent.ai-builders.space",
  "ip": "203.0.113.1",
  "region": "EU",
  "userAgent": "Mozilla/5.0 ...",
  "messages": [
    {
      "id": "msg_1740000000000_xyz",
      "timestamp": "2026-02-15T10:00:00.000Z",
      "status": "success",
      "statusCode": 200,
      "userMessage": "Hello Maya",
      "assistantResponse": "Hi! How can I help?",
      "responseTime": 1500,
      "messageLength": 10,
      "responseLength": 20,
      "historyLength": 0,
      "warnings": [],
      "errorType": null,
      "errorMessage": null
    }
  ]
}
```

### Conversation Lifecycle

```
Frontend generates conversationId per chat session (stored in browser)
  └─ Sent with every POST /api/chat request

Backend receives message:
  1. server.js checks wasConversationFinalized(conversationId)
     ├─ If finalized (5-min gap) → generate new segment ID, return in response
     └─ If active or new → use original conversationId
  2. logChatAttempt() with resolved conversationId
     ├─ Write to local file (data/chat-logs/YYYY-MM-DD.json)
     ├─ Upload to S3 (conversation document, status: "active")
     └─ trackConversationMessage() — reset 5-min timer
  3. Response includes conversationId (frontend updates if changed)

... 5 minutes of silence ...

Timer fires → onConversationInactive()
  ├─ finalizeConversationInS3() — set status: "completed", endedAt, durationMs
  └─ Mark conversationId as finalized (for segmentation)

User resumes after 5-min gap → new conversationId segment (new S3 document)

Server shutdown (SIGTERM/SIGINT):
  └─ finalizeAllSessions() — finalize all active conversations
```

### Concurrent Chat Isolation

| Differentiator    | How it's used                                      |
|-------------------|----------------------------------------------------|
| `conversationId`  | Primary key — unique per browser session            |
| IP address        | Stored in conversation doc for analytics filtering  |
| S3 key            | Derived from `conversationId` — no cross-talk       |
| Upload queue      | Serializes writes per S3 key — no race conditions   |
| Session manager   | Independent timer per `conversationId`              |

---

## Files

| File | Purpose |
|------|---------|
| `utils/conversation-session.js` | Session manager — tracks active conversations, inactivity timers |
| `utils/s3-logger.js` | S3 operations — upload, finalize, fetch conversations |
| `utils/s3-upload-queue.js` | Per-key upload queue with deduplication |
| `utils/chat-logger.js` | Entry point — local file + S3 logging + session tracking |
| `server.js` | Graceful shutdown integration |

## Test Coverage

| Test File | What it covers |
|-----------|----------------|
| `conversation-session.test.js` | Session tracking, timer reset, inactivity finalization, concurrency, shutdown |
| `s3-logger.test.js` | Upload, finalize, fetch, circuit breaker, timeout, backward compat |
| `s3-upload-queue.test.js` | Queue serialization, batching, deduplication |
| `s3-chat-logs-capture-requirements.test.js` | Key format, document schema, lifecycle fields |
| `chat-logger-s3-integration.test.js` | Dual storage (local + S3) integration |
