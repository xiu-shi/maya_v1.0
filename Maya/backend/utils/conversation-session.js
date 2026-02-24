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
const activeSessions = new Map();

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
}

export { INACTIVITY_TIMEOUT_MS };
