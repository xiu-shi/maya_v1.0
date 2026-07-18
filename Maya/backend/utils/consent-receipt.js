/**
 * Server-side consent receipts (GDPR Art 7(1) evidence).
 * Stores minimal records: notice version, choice, timestamp, hashed IP.
 */

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logInfo, logError } from "./logger.js";
import { hashIp } from "./ip-hash.js";
import { LOG_RETENTION_DAYS } from "./log-retention.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCAL_RECEIPTS_DIR = path.join(__dirname, "..", "data", "consent-receipts");

const VALID_CHOICES = new Set(["accepted", "declined", "withdrawn"]);

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

  if (
    process.env.ENABLE_S3_LOGGING === "true" &&
    process.env.AWS_S3_BUCKET
  ) {
    try {
      await writeReceiptToS3(receipt);
    } catch (s3Error) {
      logError("S3 consent receipt upload failed; falling back to local storage", s3Error, {
        choice,
        version,
        bucket: process.env.AWS_S3_BUCKET,
      });
      await writeReceiptLocally(receipt);
    }
  } else {
    await writeReceiptLocally(receipt);
  }

  logInfo("Consent receipt recorded", {
    choice,
    version,
    ipHash: receipt.ipHash,
  });

  return receipt;
}

function buildS3Key(receipt) {
  const date = new Date(receipt.recordedAt);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const safeTs = receipt.recordedAt.replace(/:/g, "-").replace(/\./g, "-");
  return `consent/${year}/${month}/${day}/${safeTs}_${receipt.ipHash}_${receipt.choice}.json`;
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
  const filename = `${receipt.recordedAt.replace(/[:.]/g, "-")}_${receipt.ipHash}_${receipt.choice}.json`;
  const filePath = path.join(LOCAL_RECEIPTS_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(receipt, null, 2), "utf8");
}

export { VALID_CHOICES, LOCAL_RECEIPTS_DIR };
