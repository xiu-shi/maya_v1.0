/**
 * Fail-closed conversation logging gate (MAYA-GDPR-002-04 / Sprint 1.6).
 *
 * Conversation content is stored ONLY when the client sends logging: true
 * AND the server verifies a matching accepted consent receipt (Sprint 1.7 / H1).
 * Absent flag, malformed body, failed verification, or ambiguity → do not log.
 * Consent receipts are exempt and handled by consent-receipt.js.
 */

import { logChatAttempt, logChatMessage } from "./chat-logger.js";
import { verifyConsentReceiptForLogging } from "./consent-receipt.js";
import { logWarning } from "./logger.js";
import { hashIp } from "./ip-hash.js";

/**
 * Strip frontend model-only session context so quality logs store the user's real message.
 * Prefix format is owned by maya.html buildModelMessageWithSavingContext().
 *
 * @param {unknown} text
 * @returns {unknown}
 */
export function stripMayaSessionContext(text) {
  if (typeof text !== "string") return text;
  const marker = "[User message]\n";
  const idx = text.indexOf(marker);
  if (text.startsWith("[Maya session context") && idx !== -1) {
    return text.slice(idx + marker.length);
  }
  return text;
}

/**
 * Resolve whether conversation logging is permitted for this request.
 *
 * @param {import('express').Request} req
 * @returns {Promise<boolean>}
 */
export async function resolveConversationLogging(req) {
  if (req.body?.logging !== true) {
    return false;
  }

  const receiptId = req.body?.consentReceiptId;
  const verified = await verifyConsentReceiptForLogging(receiptId, req.ip);
  if (!verified) {
    logWarning("Conversation logging denied: consent receipt not verified", {
      receiptId: typeof receiptId === "string" ? receiptId : null,
      ipHash: hashIp(req.ip),
    });
    return false;
  }

  return true;
}

/**
 * @param {import('express').Request} req
 * @returns {boolean}
 */
export function shouldLogConversation(req) {
  if (req.sanitized && typeof req.sanitized.conversationLogging === "boolean") {
    return req.sanitized.conversationLogging;
  }
  return false;
}

/**
 * @param {import('express').Request} req
 * @param {Parameters<typeof logChatAttempt>[0]} payload
 */
export async function logChatAttemptIfAllowed(req, payload) {
  const enabled =
    typeof req.sanitized?.conversationLogging === "boolean"
      ? req.sanitized.conversationLogging
      : await resolveConversationLogging(req);

  if (!enabled) {
    return null;
  }
  return logChatAttempt(payload);
}

/**
 * @param {import('express').Request} req
 * @param {Parameters<typeof logChatMessage>[0]} payload
 */
export async function logChatMessageIfAllowed(req, payload) {
  const enabled =
    typeof req.sanitized?.conversationLogging === "boolean"
      ? req.sanitized.conversationLogging
      : await resolveConversationLogging(req);

  if (!enabled) {
    return null;
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
  const next = { ...payload };
  if (Object.prototype.hasOwnProperty.call(next, "userMessage")) {
    next.userMessage = stripMayaSessionContext(next.userMessage);
  }
  return logChatAttempt(next);
}

/**
 * @param {boolean} enabled
 * @param {Parameters<typeof logChatMessage>[0]} payload
 */
export function logChatMessageIfEnabled(enabled, payload) {
  if (!enabled) {
    return Promise.resolve(null);
  }
  const next = { ...payload };
  if (Object.prototype.hasOwnProperty.call(next, "userMessage")) {
    next.userMessage = stripMayaSessionContext(next.userMessage);
  }
  return logChatMessage(next);
}
