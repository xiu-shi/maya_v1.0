/**
 * HMAC-based IP pseudonymisation for S3 object keys (MAYA-GDPR-002-03).
 *
 * Raw IPs must not appear in S3 keys (listings, CloudTrail). The same IP always
 * yields the same truncated HMAC so erasure-by-IP can match keys without
 * downloading object bodies. Raw IP remains in the JSON body only.
 */

import { createHmac } from "crypto";

export const UNKNOWN_IP_SENTINEL = "unknown";
const HASH_HEX_LENGTH = 16;

/**
 * @returns {string}
 */
export function getIpHashSecret() {
  const secret = process.env.IP_HASH_SECRET;
  if (!secret || !String(secret).trim()) {
    throw new Error(
      "IP_HASH_SECRET environment variable is required for S3 key pseudonymisation",
    );
  }
  return secret;
}

/**
 * Keyed hash of an IP for use in S3 object keys (pseudonymisation, not anonymisation).
 *
 * @param {string|null|undefined} ip
 * @returns {string} 16-char hex HMAC-SHA256 prefix
 */
export function hashIp(ip) {
  const normalized =
    ip && String(ip).trim() ? String(ip).trim() : UNKNOWN_IP_SENTINEL;
  return createHmac("sha256", getIpHashSecret())
    .update(normalized)
    .digest("hex")
    .slice(0, HASH_HEX_LENGTH);
}

/**
 * Fail closed at startup when S3 logging is enabled.
 */
export function assertIpHashSecretConfigured() {
  getIpHashSecret();
}
