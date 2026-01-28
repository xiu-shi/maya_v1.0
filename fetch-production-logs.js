#!/usr/bin/env node
/**
 * Fetch Production Chat Logs
 *
 * Fetches chat logs from production server and saves them locally for analysis
 * Usage: node fetch-production-logs.js [days] [output-file]
 *
 * Examples:
 *   node fetch-production-logs.js 7                    # Last 7 days, save to production-logs-YYYYMMDD.json
 *   node fetch-production-logs.js 30 logs.json         # Last 30 days, save to logs.json
 */

import { writeFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PRODUCTION_URL = "https://maya-agent.ai-builders.space";
const DEFAULT_DAYS = 7;

// Parse command line arguments
const days = parseInt(process.argv[2]) || DEFAULT_DAYS;
const outputFile =
  process.argv[3] ||
  `production-logs-${new Date().toISOString().split("T")[0]}.json`;

// Calculate date range
const endDate = new Date();
const startDate = new Date();
startDate.setDate(startDate.getDate() - days);

const startDateStr = startDate.toISOString().split("T")[0];
const endDateStr = endDate.toISOString().split("T")[0];

console.log("📥 Fetching Production Chat Logs");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`Production URL: ${PRODUCTION_URL}`);
console.log(`Date Range: ${startDateStr} to ${endDateStr} (${days} days)`);
console.log(`Output File: ${outputFile}`);
console.log("");

async function fetchLogs() {
  try {
    // Fetch logs endpoint
    const logsUrl = `${PRODUCTION_URL}/api/admin/chat-logs?startDate=${startDateStr}&endDate=${endDateStr}&groupBy=none`;
    console.log(`🔍 Fetching logs from: ${logsUrl}`);

    const logsResponse = await fetch(logsUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Maya-Log-Fetcher/1.0",
      },
      signal: AbortSignal.timeout(60000), // 60 second timeout
    });

    if (!logsResponse.ok) {
      const errorText = await logsResponse.text();
      throw new Error(
        `HTTP ${logsResponse.status}: ${logsResponse.statusText}\n${errorText.substring(0, 200)}`,
      );
    }

    const logsData = await logsResponse.json();

    if (!logsData.success) {
      throw new Error(
        logsData.message || logsData.error || "Failed to fetch logs",
      );
    }

    const logs = Array.isArray(logsData.logs) ? logsData.logs : [];
    console.log(`✅ Fetched ${logs.length} log entries`);

    // Fetch stats endpoint
    const statsUrl = `${PRODUCTION_URL}/api/admin/chat-logs/stats`;
    console.log(`🔍 Fetching stats from: ${statsUrl}`);

    const statsResponse = await fetch(statsUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    let stats = null;
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      if (statsData.success) {
        stats = statsData.stats;
        console.log(
          `✅ Fetched stats: ${stats.totalMessages} messages, ${stats.totalConversations} conversations`,
        );
      }
    }

    // Prepare output data
    const outputData = {
      fetchedAt: new Date().toISOString(),
      dateRange: {
        start: startDateStr,
        end: endDateStr,
        days: days,
      },
      productionUrl: PRODUCTION_URL,
      summary: {
        totalLogs: logs.length,
        totalMessages: stats?.totalMessages || logs.length,
        totalConversations:
          stats?.totalConversations ||
          new Set(logs.map((l) => l.conversationId)).size,
        storageSizeMB: stats?.totalSizeMB || "N/A",
      },
      stats: stats,
      logs: logs,
    };

    // Save to file
    const outputPath = join(__dirname, outputFile);
    await writeFile(outputPath, JSON.stringify(outputData, null, 2), "utf-8");

    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ Success!");
    console.log(`📁 Saved to: ${outputPath}`);
    console.log("");
    console.log("📊 Summary:");
    console.log(`   Total Log Entries: ${outputData.summary.totalLogs}`);
    console.log(`   Total Messages: ${outputData.summary.totalMessages}`);
    console.log(
      `   Total Conversations: ${outputData.summary.totalConversations}`,
    );
    console.log(`   Storage Size: ${outputData.summary.storageSizeMB} MB`);
    console.log("");
    console.log("💡 Next steps:");
    console.log(`   - Analyze logs: node analyze-logs.js ${outputFile}`);
    console.log(`   - View in browser: Open ${outputFile} in a JSON viewer`);

    return outputData;
  } catch (error) {
    console.error("");
    console.error("❌ Error fetching production logs:");
    console.error(`   ${error.message}`);
    console.error("");

    if (
      error.message.includes("fetch failed") ||
      error.message.includes("ECONNREFUSED")
    ) {
      console.error("💡 Troubleshooting:");
      console.error("   1. Check if production server is accessible:");
      console.error(`      curl ${PRODUCTION_URL}/health`);
      console.error("   2. Verify the endpoint is accessible:");
      console.error(`      curl ${PRODUCTION_URL}/api/admin/chat-logs`);
      console.error("   3. Check for CORS or network issues");
    }

    process.exit(1);
  }
}

// Run
fetchLogs();
