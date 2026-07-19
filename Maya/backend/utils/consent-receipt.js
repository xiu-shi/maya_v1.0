/**
 * Server-side consent receipts (GDPR Art 7(1) evidence).
 * Stores minimal records: notice version, choice, timestamp, hashed IP.
 */

import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logInfo, logError, logWarning } from "./logger.js";
import { hashIp } from "./ip-hash.js";
import { LOG_RETENTION_DAYS } from "./log-retention.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const LOCAL_RECEIPTS_DIR = path.join(__dirname, "..", "data", "consent-receipts");
export const CONSENT_RECEIPT_ID_HEADER = "X-Consent-Receipt-Id";

/** Notice versions that may authorise conversation logging when choice is accepted. */
export const ACCEPTED_CONSENT_VERSIONS = new Set(["2026-07-12", "2026-07-18"]);

const VALID_CHOICES = new Set(["accepted", "declined", "withdrawn"]);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * @param {object} params
 * @param {string|null|undefined} params.ip
 * @param {string|null|undefined} params.userAgent
 * @param {string} params.version
 * @param {string} params.choice - accepted | declined | withdrawn
 * @param {string} params.ts - client ISO timestamp
 * @param {string|null|undefined} params.requestHost
 */
export async function recordConsentReceipt({
  ip,
  userAgent,
  version,
  choice,
  ts,
  requestHost,
}) {
  if (!version || !choice || !ts) {
    throw new Error("Consent receipt requires version, choice, and ts");
  }
  if (!VALID_CHOICES.has(choice)) {
    throw new Error(`Invalid consent choice: ${choice}`);
  }

  const recordedAt = new Date().toISOString();
  const receipt = {
    id: randomUUID(),
    type: "consent_receipt",
    version,
    choice,
    ts,
    recordedAt,
    ipHash: hashIp(ip),
    userAgent: userAgent || "unknown",
    requestHost: requestHost || null,
    retentionDays: LOG_RETENTION_DAYS,
  };

  // Always persist locally first. Chat logging authorization
  // (verifyConsentReceiptForLogging) reads only from local disk. Writing S3
  // alone would make Opt-in appear to succeed in the UI while conversation
  // logs silently fail-closed in production.
  await writeReceiptLocally(receipt);

  if (
    process.env.ENABLE_S3_LOGGING === "true" &&
    process.env.AWS_S3_BUCKET
  ) {
    try {
      await writeReceiptToS3(receipt);
    } catch (s3Error) {
      logError(
        "S3 consent receipt upload failed; local receipt retained for chat authorization",
        s3Error,
        {
          choice,
          version,
          bucket: process.env.AWS_S3_BUCKET,
          receiptId: receipt.id,
        },
      );
    }
  }

  logInfo("Consent receipt recorded", {
    choice,
    version,
    receiptId: receipt.id,
    ipHash: receipt.ipHash,
  });

  return receipt;
}

/**
 * Verify an accepted consent receipt before honouring logging: true on /api/chat.
 * Fail-closed: returns false when receipt missing, wrong choice, version, or IP hash.
 *
 * @param {string} receiptId
 * @param {string|null|undefined} ip
 * @returns {Promise<boolean>}
 */
export async function verifyConsentReceiptForLogging(receiptId, ip) {
  if (!receiptId || typeof receiptId !== "string" || !UUID_PATTERN.test(receiptId)) {
    return false;
  }

  let receipt;
  try {
    const filePath = path.join(LOCAL_RECEIPTS_DIR, `${receiptId}.json`);
    const raw = await fs.readFile(filePath, "utf8");
    receipt = JSON.parse(raw);
  } catch {
    return false;
  }

  if (!receipt || receipt.type !== "consent_receipt") {
    return false;
  }
  if (receipt.choice !== "accepted") {
    return false;
  }
  if (!ACCEPTED_CONSENT_VERSIONS.has(receipt.version)) {
    return false;
  }
  if (receipt.ipHash !== hashIp(ip)) {
    logWarning("Consent receipt IP hash mismatch", {
      receiptId,
      expectedHash: receipt.ipHash,
    });
    return false;
  }

  return true;
}

function buildS3Key(receipt) {
  const date = new Date(receipt.recordedAt);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `consent/${year}/${month}/${day}/${receipt.id}.json`;
}

async function writeReceiptToS3(receipt) {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const { withTimeout, TIMEOUTS } = await import("./timeout.js");

  const s3Client = new S3Client({
    region: process.env.AWS_REGION || "eu-west-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const s3Key = buildS3Key(receipt);
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: s3Key,
    Body: JSON.stringify(receipt, null, 2),
    ContentType: "application/json",
    ServerSideEncryption: "AES256",
  });

  await withTimeout(
    s3Client.send(command),
    TIMEOUTS.S3_UPLOAD,
    `S3 consent receipt: ${s3Key}`,
  );
}

async function writeReceiptLocally(receipt) {
  await fs.mkdir(LOCAL_RECEIPTS_DIR, { recursive: true });
  const filePath = path.join(LOCAL_RECEIPTS_DIR, `${receipt.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(receipt, null, 2), "utf8");
}

export { VALID_CHOICES, UUID_PATTERN };
