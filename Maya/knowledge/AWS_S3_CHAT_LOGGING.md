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

### Full System Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (maya.html)                           │
│                                                                        │
│  Page Load                                                             │
│  ├─ Most recent chat from previous day? → Auto-create NEW CHAT         │
│  └─ Today's chat? → Load normally                                      │
│                                                                        │
│  User Sends Message                                                    │
│  ├─ Previous-day chat? → BLOCK  "Start a NEW CHAT"                     │
│  └─ Today's chat? → POST /api/chat                                     │
│       body: { message, history, conversationId }                       │
│                                     │                                  │
│  Response from Backend              │                                  │
│  ├─ Same conversationId? → Continue │                                  │
│  └─ NEW conversationId?  → Update local state (5-min gap detected)     │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                    POST /api/chat
                              │
┌─────────────────────────────▼───────────────────────────────────────────┐
│                       BACKEND (server.js)                              │
│                                                                        │
│  1. RESOLVE CONVERSATION ID                                            │
│     ├─ wasConversationFinalized(id)?  → generateSegmentId() (new!)     │
│     ├─ Cross-day timestamp in id?     → generateSegmentId() (new!)     │
│     └─ Otherwise                      → use original id               │
│                                                                        │
│  2. CALL AI API → get Maya's response                                  │
│                                                                        │
│  3. LOG (async, non-blocking — does NOT delay the response)            │
│     │                                                                  │
│     ▼                                                                  │
│  ┌──────────────────────────────────────────────────┐                  │
│  │           chat-logger.js                         │                  │
│  │                                                  │                  │
│  │  ├─ Write to local file (data/chat-logs/*.json)  │                  │
│  │  │                                               │                  │
│  │  ├─ Upload to S3 (REAL-TIME) ──────────┐         │                  │
│  │  │                                     │         │                  │
│  │  └─ trackConversationMessage() ────┐   │         │                  │
│  └────────────────────────────────────┼───┼─────────┘                  │
│                                       │   │                            │
│  4. RETURN RESPONSE                   │   │                            │
│     { response, conversationId }      │   │                            │
└───────────────────────────────────────┼───┼────────────────────────────┘
                                        │   │
           ┌────────────────────────────┘   │
           │                                │
           ▼                                ▼
┌─────────────────────────┐   ┌──────────────────────────────────────────┐
│ conversation-session.js │   │         s3-upload-queue.js               │
│                         │   │                                          │
│ In-memory session map:  │   │  Per-key upload queue (mutex):           │
│ { convId → {            │   │  ┌─────────────┐                        │
│     ip, userAgent,      │   │  │ conv_abc.json│──▶ serialize writes    │
│     startedAt,          │   │  ├─────────────┤                        │
│     lastActivity,       │   │  │ conv_xyz.json│──▶ serialize writes    │
│     messageCount,       │   │  └─────────────┘                        │
│     timer (5 min)       │   │         │                                │
│   }                     │   │         ▼                                │
│ }                       │   │  ┌──────────────────────────────────┐    │
│                         │   │  │      s3-logger.js                │    │
│ Timer fires after       │   │  │                                  │    │
│ 5 min inactivity:       │   │  │  uploadConversationToS3()        │    │
│ ┌─────────────────────┐ │   │  │  ├─ GET existing doc from S3    │    │
│ │ onConversationEnd() │ │   │  │  ├─ Append new message          │    │
│ │ → finalize in S3    │─┼───┼──│  ├─ PUT updated doc to S3       │    │
│ │ → mark finalized    │ │   │  │  └─ Deduplicate by msg ID       │    │
│ │   (for segmentation)│ │   │  │                                  │    │
│ └─────────────────────┘ │   │  │  finalizeConversationInS3()      │    │
│                         │   │  │  ├─ status: "active"→"completed" │    │
│ Graceful shutdown:      │   │  │  ├─ endedAt, durationMs          │    │
│ finalizeAllSessions()   │   │  │  └─ endReason: inactivity_timeout│    │
└─────────────────────────┘   │  └──────────────────────────────────┘    │
                              └───────────────────┬──────────────────────┘
                                                  │
                                    REAL-TIME PUT  │
                                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          AWS S3 BUCKET                                 │
│                    maya-ai-builder-prod-logs                            │
│                       (eu-west-1)                                      │
│                                                                        │
│  chat-logs/                                                            │
│    conversations/                                                      │
│      2026/                                                             │
│        02/                                                             │
│          26/                                                           │
│            conv_1740000000_abc.json  ← ACTIVE (3 messages so far)      │
│            conv_1740000500_def.json  ← COMPLETED (5 min timeout)       │
│          24/                                                           │
│            conv_1739900000_ghi.json  ← COMPLETED (from Feb 24)         │
│                                                                        │
│  Each .json document:                                                  │
│  ┌────────────────────────────────────────┐                            │
│  │ {                                      │                            │
│  │   conversationId: "conv_..._abc",      │                            │
│  │   conversationStatus: "active",        │  ← or "completed"         │
│  │   startedAt: "2026-02-26T09:00:00Z",   │                            │
│  │   lastMessageAt: "2026-02-26T09:04Z",  │                            │
│  │   endedAt: null,                       │  ← set on finalize        │
│  │   durationMs: null,                    │  ← set on finalize        │
│  │   messageCount: 3,                     │                            │
│  │   messageCap: 30,                      │                            │
│  │   ip: "203.0.113.1",                   │                            │
│  │   messages: [                          │                            │
│  │     { userMessage, assistantResponse,  │                            │
│  │       timestamp, responseTime, ... },  │                            │
│  │     ...                                │                            │
│  │   ]                                    │                            │
│  │ }                                      │                            │
│  └────────────────────────────────────────┘                            │
└─────────────────────────────────────────────────────────────────────────┘
```

### Conversation Lifecycle Timeline

```
 Time ──────────────────────────────────────────────────────────────▶

 09:00   09:01   09:03              09:08 (5min gap)    09:15
   │       │       │                    │                  │
   ▼       ▼       ▼                    ▼                  ▼
  msg1    msg2    msg3            FINALIZE            msg4 (NEW conv!)
   │       │       │             status→completed        │
   └───────┴───────┘             endedAt set             └──▶ new S3 doc
   conv_aaa (active)             conv_aaa (completed)    conv_bbb (active)
   S3: 1 msg → 2 → 3            S3: final write         S3: 1 msg

 ─────── same day ──────────────────────────────────────────────────

 NEXT DAY (Feb 27):
   User opens Maya → sees yesterday's chat in sidebar
   Clicks on it → READ-ONLY view + "Start a NEW CHAT" prompt
   Clicks "New Chat" → fresh conversationId, new S3 document
```

### Real-Time Upload Behavior

Each message triggers an **immediate** S3 PUT within the same request cycle (fired
async so it does not delay the API response to the user). Messages are never batched
or delayed. The upload queue serializes writes per conversation key so concurrent
requests for the same conversation do not overwrite each other.

The only **delayed** write is the finalization — 5 minutes after the last message, the
session manager updates the S3 document from `"active"` to `"completed"` with
`endedAt` and `durationMs`.

---

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

### Conversation Lifecycle (Flow Detail)

```
Frontend generates conversationId per chat session (stored in browser)
  └─ Sent with every POST /api/chat request

Backend receives message:
  1. server.js checks wasConversationFinalized(conversationId)
     ├─ If finalized (5-min gap) → generate new segment ID, return in response
     ├─ If cross-day timestamp   → generate new segment ID, return in response
     └─ If active or new         → use original conversationId
  2. logChatAttempt() with resolved conversationId
     ├─ Write to local file (data/chat-logs/YYYY-MM-DD.json)
     ├─ Upload to S3 IMMEDIATELY (conversation document, status: "active")
     └─ trackConversationMessage() — reset 5-min timer
  3. Response includes conversationId (frontend updates if changed)

... 5 minutes of silence ...

Timer fires → onConversationInactive()
  ├─ finalizeConversationInS3() — set status: "completed", endedAt, durationMs
  └─ Mark conversationId as finalized (for segmentation)

User resumes after 5-min gap (same day) → new conversationId (new S3 document)
User resumes next day → frontend blocks input, prompts "Start a NEW CHAT"

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
| `utils/conversation-session.js` | Session manager — tracks active conversations, inactivity timers, finalization tracking |
| `utils/s3-logger.js` | S3 operations — upload, finalize, fetch conversations |
| `utils/s3-upload-queue.js` | Per-key upload queue with deduplication |
| `utils/chat-logger.js` | Entry point — local file + S3 logging + session tracking |
| `server.js` | Conversation ID resolution, cross-day check, graceful shutdown |
| `frontend/maya.html` | Generates conversationId, cross-day blocking, "Start a NEW CHAT" prompt |

## Test Coverage

| Test File | What it covers |
|-----------|----------------|
| `conversation-session.test.js` | Session tracking, timer reset, inactivity finalization, concurrency, shutdown, segmentation tracking, segment ID generation (35 tests) |
| `s3-logger.test.js` | Upload, finalize, fetch, circuit breaker, timeout, backward compat |
| `s3-upload-queue.test.js` | Queue serialization, batching, deduplication |
| `s3-chat-logs-capture-requirements.test.js` | Key format, document schema, lifecycle fields |
| `chat-logger-s3-integration.test.js` | Dual storage (local + S3) integration |
