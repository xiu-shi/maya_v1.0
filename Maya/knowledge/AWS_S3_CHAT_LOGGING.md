# AWS S3 Chat Logging Architecture

## Overview

Maya's backend captures every chat conversation as a single JSON document in AWS S3. Each conversation accumulates up to 30 messages. After 5 minutes of inactivity, the conversation is automatically marked as "completed" with a final S3 write.

Concurrent conversations from different users are fully isolated — each conversation has a unique `conversationId` generated on the frontend, and IP address is stored as an additional differentiator for analytics.

---

## Changelog

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
User sends message → logChatAttempt()
  ├─ Write to local file (data/chat-logs/YYYY-MM-DD.json)
  ├─ Upload to S3 (conversation document, status: "active")
  └─ trackConversationMessage() — reset 5-min timer

... 5 minutes of silence ...

Timer fires → onConversationInactive()
  └─ finalizeConversationInS3() — set status: "completed", endedAt, durationMs

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
