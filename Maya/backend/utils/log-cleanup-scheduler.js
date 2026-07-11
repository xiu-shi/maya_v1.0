/**
 * Daily scheduler for local chat log retention (MAYA-GDPR-002-02).
 *
 * Runs cleanupOldLogs() once per day at 03:00 UTC in non-test environments.
 */

import { cleanupOldLogs } from "./chat-logger.js";
import { logInfo, logError } from "./logger.js";

export const LOG_CLEANUP_HOUR_UTC = 3;
export const LOG_RETENTION_DAYS = 180;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

let activeTimer = null;
let activeInterval = null;

/**
 * Milliseconds until the next occurrence of targetHourUtc (0-23) in UTC.
 *
 * @param {number} targetHourUtc
 * @returns {number}
 */
export function msUntilNextUtcHour(targetHourUtc) {
  const now = new Date();
  const next = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      targetHourUtc,
      0,
      0,
      0,
    ),
  );
  if (now.getTime() >= next.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next.getTime() - now.getTime();
}

/**
 * @param {number} retentionDays
 * @returns {Promise<{ deletedCount: number, bytesReclaimed: number }>}
 */
async function runDefaultCleanup(retentionDays) {
  const result = await cleanupOldLogs(retentionDays);
  logInfo("Scheduled local chat log cleanup completed", {
    retentionDays,
    deletedCount: result.deletedCount,
    bytesReclaimed: result.bytesReclaimed,
  });
  return result;
}

/**
 * Register the daily cleanup scheduler. No-op in test unless skipInTest is false.
 *
 * @param {object} [options]
 * @param {number} [options.retentionDays]
 * @param {number} [options.hourUtc]
 * @param {boolean} [options.skipInTest]
 * @param {(retentionDays: number) => Promise<unknown>} [options.cleanupFn]
 * @returns {{ started: boolean, hourUtc?: number, retentionDays?: number, reason?: string }}
 */
export function startLogCleanupScheduler(options = {}) {
  const {
    retentionDays = LOG_RETENTION_DAYS,
    hourUtc = LOG_CLEANUP_HOUR_UTC,
    skipInTest = process.env.NODE_ENV === "test",
    cleanupFn = runDefaultCleanup,
  } = options;

  stopLogCleanupScheduler();

  if (skipInTest) {
    return { started: false, reason: "test_environment" };
  }

  const delayMs = msUntilNextUtcHour(hourUtc);
  activeTimer = setTimeout(async () => {
    try {
      await cleanupFn(retentionDays);
    } catch (error) {
      logError("Scheduled local chat log cleanup failed", error, {
        retentionDays,
      });
    }

    activeInterval = setInterval(async () => {
      try {
        await cleanupFn(retentionDays);
      } catch (error) {
        logError("Scheduled local chat log cleanup failed", error, {
          retentionDays,
        });
      }
    }, MS_PER_DAY);
    if (typeof activeInterval.unref === "function") {
      activeInterval.unref();
    }
  }, delayMs);

  if (typeof activeTimer.unref === "function") {
    activeTimer.unref();
  }

  logInfo("Local chat log cleanup scheduler registered", {
    hourUtc,
    retentionDays,
    nextRunInMs: delayMs,
  });

  return { started: true, hourUtc, retentionDays };
}

/**
 * Clear scheduled cleanup timers (for shutdown or tests).
 */
export function stopLogCleanupScheduler() {
  if (activeTimer) {
    clearTimeout(activeTimer);
    activeTimer = null;
  }
  if (activeInterval) {
    clearInterval(activeInterval);
    activeInterval = null;
  }
}
