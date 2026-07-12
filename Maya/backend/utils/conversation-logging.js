/**
 * Fail-closed conversation logging gate (MAYA-GDPR-002-04 / Sprint 1.6).
 *
 * Conversation content is stored ONLY when the client sends logging: true.
 * Absent flag, malformed body, or ambiguity → do not log (default deny).
 * Consent receipts are exempt and handled by consent-receipt.js.
 */

import { logChatAttempt, logChatMessage } from "./chat-logger.js";

/**
 * @param {import('express').Request} req
 * @returns {boolean}
 */
export function shouldLogConversation(req) {
  return req.body?.logging === true;
}

/**
 * @param {import('express').Request} req
 * @param {Parameters<typeof logChatAttempt>[0]} payload
 */
export function logChatAttemptIfAllowed(req, payload) {
  if (!shouldLogConversation(req)) {
    return Promise.resolve(null);
  }
  return logChatAttempt(payload);
}

/**
 * @param {import('express').Request} req
 * @param {Parameters<typeof logChatMessage>[0]} payload
 */
export function logChatMessageIfAllowed(req, payload) {
  if (!shouldLogConversation(req)) {
    return Promise.resolve(null);
  }
  return logChatMessage(payload);
}

/**
 * @param {boolean} enabled - from req.sanitized.conversationLogging (fail-closed)
 * @param {Parameters<typeof logChatAttempt>[0]} payload
 */
export function logChatAttemptIfEnabled(enabled, payload) {
  if (!enabled) {
    return Promise.resolve(null);
  }
  return logChatAttempt(payload);
}

/**
 * @param {boolean} enabled
 * @param {Parameters<typeof logChatMessage>[0]} payload
 */
export function logChatMessageIfEnabled(enabled, payload) {
  if (!enabled) {
    return Promise.resolve(null);
  }
  return logChatMessage(payload);
}
