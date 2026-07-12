/**
 * Single source of truth for chat log retention (GDPR-002-01 / 002-02).
 * Must stay aligned with privacy.html, maya.html, and S3 lifecycle rule.
 */
export const LOG_RETENTION_DAYS = 90;
