/**
 * Conversation Session Manager
 *
 * Tracks active chat conversations and detects when they end via inactivity.
 * After 5 minutes of no new messages, the conversation is finalized by
 * calling the registered end handler (which performs the S3 write).
 *
 * Concurrent conversations are isolated by conversationId (which is unique
 * per browser session: conv_<timestamp>_<random>). IP address is stored
 * as an additional differentiator for analytics.
 */

import { logInfo, logWarning } from './logger.js';

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
// TTL for the finalizedSessions dedup window. Late messages for a finalized conversation
// are impossible after 24 h, so entries older than this are stale and can be pruned.
// This bounds the Map to O(conversations_per_day) rather than O(conversations_ever).
const FINALIZED_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const activeSessions = new Map();
const finalizedSessions = new Map(); // conversationId → finalizedAt (ms timestamp)

let _onConversationEnd = null;

/**
 * Register a handler to be called when a conversation ends (inactivity timeout).
 * The handler receives (conversationId, sessionMetadata).
 * In production, chat-logger.js registers the S3 finalization handler.
 *
 * @param {Function} handler - async (conversationId, session) => void
 */
export function setConversationEndHandler(handler) {
  _onConversationEnd = handler;
}

/**
 * Check if a conversationId was previously finalized (5-min inactivity).
 * If so, the caller should create a new conversation segment.
 *
 * @param {string} conversationId
 * @returns {boolean}
 */
export function wasConversationFinalized(conversationId) {
  const finalizedAt = finalizedSessions.get(conversationId);
  if (finalizedAt === undefined) return false;
  if (Date.now() - finalizedAt > FINALIZED_TTL_MS) {
    finalizedSessions.delete(conversationId); // lazy eviction on lookup
    return false;
  }
  return true;
}

/**
 * Generate a new segment ID for a conversation that was finalized.
 * Format: conv_<timestamp>_<random>  (completely new ID for S3 isolation)
 *
 * @returns {string} New conversation ID
 */
export function generateSegmentId() {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Track a message in a conversation session.
 * Creates a new session or resets the inactivity timer for an existing one.
 * After INACTIVITY_TIMEOUT_MS of silence, the conversation is finalized.
 *
 * @param {string} conversationId - Unique conversation identifier
 * @param {Object} metadata - Message metadata (ip, userAgent, etc.)
 */
export function trackConversationMessage(conversationId, metadata = {}) {
  if (!conversationId) return;

  const existing = activeSessions.get(conversationId);
  if (existing && existing.timer) {
    clearTimeout(existing.timer);
  }

  const timer = setTimeout(() => {
    onConversationInactive(conversationId);
  }, INACTIVITY_TIMEOUT_MS);

  if (timer.unref) timer.unref();

  activeSessions.set(conversationId, {
    conversationId,
    ip: metadata.ip || existing?.ip || 'unknown',
    userAgent: metadata.userAgent || existing?.userAgent || 'unknown',
    startedAt: existing?.startedAt || new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    messageCount: (existing?.messageCount || 0) + 1,
    timer,
  });
}

/**
 * Called when a conversation has been inactive for INACTIVITY_TIMEOUT_MS.
 * Removes the session and invokes the registered end handler.
 */
async function onConversationInactive(conversationId) {
  const session = activeSessions.get(conversationId);
  if (!session) return;

  activeSessions.delete(conversationId);
  finalizedSessions.set(conversationId, Date.now()); // store finalisation timestamp

  // Prune entries older than FINALIZED_TTL_MS on every write.
  // Keeps the Map bounded to O(conversations within the last 24 h).
  const cutoff = Date.now() - FINALIZED_TTL_MS;
  for (const [id, ts] of finalizedSessions) {
    if (ts < cutoff) finalizedSessions.delete(id);
  }

  const endedAt = new Date().toISOString();
  const durationMs = Date.now() - new Date(session.startedAt).getTime();

  logInfo('Conversation ended (inactivity timeout)', {
    conversationId,
    ip: session.ip,
    messageCount: session.messageCount,
    durationMs,
  });

  if (_onConversationEnd) {
    try {
      await _onConversationEnd(conversationId, {
        ...session,
        endedAt,
        durationMs,
      });
    } catch (error) {
      logWarning('Conversation end handler failed', {
        conversationId,
        error: error.message,
      });
    }
  }
}

/**
 * Get the number of currently active sessions.
 */
export function getActiveSessionCount() {
  return activeSessions.size;
}

/**
 * Get the number of entries in the finalizedSessions TTL window.
 * Should stay bounded to recent conversations (within FINALIZED_TTL_MS).
 * Exposed for monitoring and tests (MAYA-ARCH-001-06).
 */
export function getFinalizedSessionCount() {
  return finalizedSessions.size;
}

/**
 * Get metadata for all active sessions (for monitoring/health endpoints).
 */
export function getActiveSessions() {
  const sessions = [];
  for (const [, session] of activeSessions) {
    sessions.push({
      conversationId: session.conversationId,
      ip: session.ip,
      messageCount: session.messageCount,
      startedAt: session.startedAt,
      lastActivity: session.lastActivity,
    });
  }
  return sessions;
}

/**
 * Force-finalize all active sessions (for graceful server shutdown).
 */
export async function finalizeAllSessions() {
  const ids = [...activeSessions.keys()];
  const promises = ids.map((id) => onConversationInactive(id));
  await Promise.allSettled(promises);
}

/**
 * Clear all sessions and their timers without invoking the end handler.
 * Used in testing.
 */
export function clearAllSessions() {
  for (const [, session] of activeSessions) {
    if (session.timer) clearTimeout(session.timer);
  }
  activeSessions.clear();
  finalizedSessions.clear();
}

export { INACTIVITY_TIMEOUT_MS, FINALIZED_TTL_MS };
