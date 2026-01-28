#!/usr/bin/env node
/**
 * Analyze Production Chat Logs
 *
 * Analyzes fetched production chat logs and generates insights
 * Usage: node analyze-logs.js [log-file]
 *
 * Example:
 *   node analyze-logs.js production-logs-2026-01-26.json
 */

import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logFile = process.argv[2] || "production-logs-*.json";

async function analyzeLogs() {
  try {
    console.log("📊 Analyzing Production Chat Logs");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Reading: ${logFile}`);
    console.log("");

    const fileContent = await readFile(logFile, "utf-8");
    const data = JSON.parse(fileContent);

    if (!data.logs || !Array.isArray(data.logs)) {
      throw new Error("Invalid log file format - missing logs array");
    }

    const logs = data.logs;
    const totalLogs = logs.length;

    if (totalLogs === 0) {
      console.log("⚠️  No logs found in file");
      return;
    }

    // Basic Statistics
    console.log("📈 Basic Statistics");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Total Log Entries: ${totalLogs}`);
    console.log(
      `Date Range: ${data.dateRange?.start || "N/A"} to ${data.dateRange?.end || "N/A"}`,
    );
    console.log(`Fetched At: ${data.fetchedAt || "N/A"}`);
    console.log("");

    // Conversation Analysis
    const conversations = new Map();
    logs.forEach((log) => {
      const convId = log.conversationId || "unknown";
      if (!conversations.has(convId)) {
        conversations.set(convId, {
          id: convId,
          messages: [],
          firstMessage: log.timestamp,
          lastMessage: log.timestamp,
          totalMessages: 0,
        });
      }
      const conv = conversations.get(convId);
      conv.messages.push(log);
      conv.totalMessages++;
      if (new Date(log.timestamp) < new Date(conv.firstMessage)) {
        conv.firstMessage = log.timestamp;
      }
      if (new Date(log.timestamp) > new Date(conv.lastMessage)) {
        conv.lastMessage = log.timestamp;
      }
    });

    console.log("💬 Conversation Analysis");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Total Conversations: ${conversations.size}`);

    const conversationLengths = Array.from(conversations.values()).map(
      (c) => c.totalMessages,
    );
    const avgConversationLength =
      conversationLengths.reduce((a, b) => a + b, 0) /
      conversationLengths.length;
    const maxConversationLength = Math.max(...conversationLengths);
    const minConversationLength = Math.min(...conversationLengths);

    console.log(
      `Average Messages per Conversation: ${avgConversationLength.toFixed(2)}`,
    );
    console.log(`Max Conversation Length: ${maxConversationLength} messages`);
    console.log(`Min Conversation Length: ${minConversationLength} messages`);
    console.log("");

    // Response Time Analysis
    const responseTimes = logs
      .filter((log) => log.responseTime && log.responseTime > 0)
      .map((log) => log.responseTime);

    if (responseTimes.length > 0) {
      console.log("⏱️  Response Time Analysis");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      const avgResponseTime =
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const p50 = responseTimes.sort((a, b) => a - b)[
        Math.floor(responseTimes.length * 0.5)
      ];
      const p95 = responseTimes.sort((a, b) => a - b)[
        Math.floor(responseTimes.length * 0.95)
      ];
      const p99 = responseTimes.sort((a, b) => a - b)[
        Math.floor(responseTimes.length * 0.99)
      ];

      console.log(`Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
      console.log(`P50 (Median): ${p50.toFixed(0)}ms`);
      console.log(`P95: ${p95.toFixed(0)}ms`);
      console.log(`P99: ${p99.toFixed(0)}ms`);
      console.log(
        `Total with Response Times: ${responseTimes.length}/${totalLogs}`,
      );
      console.log("");
    }

    // Message Length Analysis
    const messageLengths = logs
      .filter((log) => log.messageLength && log.messageLength > 0)
      .map((log) => log.messageLength);
    const responseLengths = logs
      .filter((log) => log.responseLength && log.responseLength > 0)
      .map((log) => log.responseLength);

    if (messageLengths.length > 0 || responseLengths.length > 0) {
      console.log("📏 Message Length Analysis");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      if (messageLengths.length > 0) {
        const avgUserMessageLength =
          messageLengths.reduce((a, b) => a + b, 0) / messageLengths.length;
        console.log(
          `Average User Message Length: ${avgUserMessageLength.toFixed(0)} characters`,
        );
      }
      if (responseLengths.length > 0) {
        const avgResponseLength =
          responseLengths.reduce((a, b) => a + b, 0) / responseLengths.length;
        console.log(
          `Average Response Length: ${avgResponseLength.toFixed(0)} characters`,
        );
      }
      console.log("");
    }

    // Time Distribution
    const hourlyDistribution = new Map();
    logs.forEach((log) => {
      const hour = new Date(log.timestamp).getHours();
      hourlyDistribution.set(hour, (hourlyDistribution.get(hour) || 0) + 1);
    });

    if (hourlyDistribution.size > 0) {
      console.log("🕐 Hourly Distribution (UTC)");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      const sortedHours = Array.from(hourlyDistribution.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      sortedHours.forEach(([hour, count]) => {
        const bar = "█".repeat(
          Math.floor((count / Math.max(...hourlyDistribution.values())) * 20),
        );
        console.log(
          `  ${hour.toString().padStart(2, "0")}:00 - ${count.toString().padStart(4)} messages ${bar}`,
        );
      });
      console.log("");
    }

    // Top Conversations (by message count)
    const topConversations = Array.from(conversations.values())
      .sort((a, b) => b.totalMessages - a.totalMessages)
      .slice(0, 5);

    if (topConversations.length > 0) {
      console.log("🏆 Top 5 Conversations (by message count)");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      topConversations.forEach((conv, index) => {
        console.log(
          `${index + 1}. Conversation ${conv.id.substring(0, 20)}...`,
        );
        console.log(`   Messages: ${conv.totalMessages}`);
        console.log(`   Duration: ${conv.firstMessage} to ${conv.lastMessage}`);
        if (conv.messages[0]) {
          const firstMsg =
            conv.messages[0].userMessage?.substring(0, 60) || "N/A";
          console.log(
            `   First Message: "${firstMsg}${firstMsg.length >= 60 ? "..." : ""}"`,
          );
        }
        console.log("");
      });
    }

    // Warnings Analysis
    const logsWithWarnings = logs.filter(
      (log) => log.warnings && log.warnings.length > 0,
    );
    if (logsWithWarnings.length > 0) {
      console.log("⚠️  Warnings Analysis");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(
        `Logs with Warnings: ${logsWithWarnings.length}/${totalLogs} (${((logsWithWarnings.length / totalLogs) * 100).toFixed(1)}%)`,
      );
      console.log("");
    }

    // Summary
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ Analysis Complete!");
    console.log("");
    console.log("💡 Key Insights:");
    console.log(`   • ${conversations.size} unique conversations`);
    console.log(
      `   • Average ${avgConversationLength.toFixed(1)} messages per conversation`,
    );
    if (responseTimes.length > 0) {
      console.log(
        `   • Average response time: ${(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(0)}ms`,
      );
    }
    console.log("");
  } catch (error) {
    console.error("");
    console.error("❌ Error analyzing logs:");
    console.error(`   ${error.message}`);
    console.error("");
    console.error("💡 Make sure you have fetched logs first:");
    console.error("   node fetch-production-logs.js");
    process.exit(1);
  }
}

// Run
analyzeLogs();
