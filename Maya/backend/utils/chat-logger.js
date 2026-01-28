/**
 * Chat Logger Utility
 * 
 * Stores chat conversations for monitoring and analysis
 * Privacy: Logs are stored server-side only, not exposed to users
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logInfo, logError } from './logger.js';
import config from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage directory: Maya/backend/data/chat-logs/
const LOGS_DIR = path.join(__dirname, '..', 'data', 'chat-logs');

/**
 * Ensure logs directory exists
 */
async function ensureLogsDirectory() {
  try {
    await fs.mkdir(LOGS_DIR, { recursive: true });
  } catch (error) {
    logError('Failed to create logs directory', error);
    throw error;
  }
}

/**
 * Get log file path for a given date
 * Format: YYYY-MM-DD.json
 */
function getLogFilePath(date = new Date()) {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(LOGS_DIR, `${dateStr}.json`);
}

/**
 * Generate unique conversation ID
 */
function generateConversationId() {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log a chat message
 * 
 * @param {Object} data - Chat data
 * @param {string} data.userMessage - User's message
 * @param {string} data.assistantResponse - Maya's response
 * @param {Array} data.history - Conversation history (optional)
 * @param {string} data.ip - Client IP address
 * @param {string} data.userAgent - User agent string
 * @param {Array} data.warnings - Validation warnings (optional)
 * @param {number} data.responseTime - Response time in ms (optional)
 * @param {string} data.conversationId - Conversation ID (optional, auto-generated if not provided)
 */
export async function logChatMessage({
  userMessage,
  assistantResponse,
  history = [],
  ip,
  userAgent,
  warnings = [],
  responseTime,
  conversationId
}) {
  try {
    await ensureLogsDirectory();
    
    const now = new Date();
    const logFilePath = getLogFilePath(now);
    
    // Generate conversation ID if not provided
    const convId = conversationId || generateConversationId();
    
    // Create log entry
    const logEntry = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conversationId: convId,
      timestamp: now.toISOString(),
      environment: config.nodeEnv, // 'development' or 'production'
      serverHost: process.env.SERVER_HOST || 'localhost', // Server identifier
      userMessage: userMessage.substring(0, 5000), // Limit message length
      assistantResponse: assistantResponse.substring(0, 5000), // Limit response length
      historyLength: history.length,
      ip: ip || 'unknown',
      userAgent: userAgent || 'unknown',
      warnings: warnings,
      responseTime: responseTime || null,
      messageLength: userMessage.length,
      responseLength: assistantResponse.length
    };
    
    // Read existing logs for today
    let logs = [];
    try {
      const existingData = await fs.readFile(logFilePath, 'utf-8');
      logs = JSON.parse(existingData);
    } catch (error) {
      // File doesn't exist yet, start with empty array
      if (error.code !== 'ENOENT') {
        logError('Failed to read existing logs', error);
      }
    }
    
    // Append new log entry
    logs.push(logEntry);
    
    // Write back to file
    await fs.writeFile(logFilePath, JSON.stringify(logs, null, 2), 'utf-8');
    
    logInfo('Chat message logged', {
      conversationId: convId,
      messageLength: userMessage.length,
      responseLength: assistantResponse.length,
      date: now.toISOString().split('T')[0]
    });
    
    return logEntry;
  } catch (error) {
    // Enhanced error logging for debugging
    let hasLogsDir = false;
    try {
      await fs.access(LOGS_DIR);
      hasLogsDir = true;
    } catch {
      hasLogsDir = false;
    }
    
    logError('Failed to log chat message', error, {
      logsDir: LOGS_DIR,
      errorCode: error.code,
      errorMessage: error.message,
      nodeEnv: config.nodeEnv,
      cwd: process.cwd(),
      hasLogsDir: hasLogsDir
    });
    // Don't throw - logging failure shouldn't break chat functionality
    return null;
  }
}

/**
 * Get chat logs for a date range
 * 
 * @param {Date} startDate - Start date (inclusive)
 * @param {Date} endDate - End date (inclusive)
 * @returns {Promise<Array>} Array of log entries
 */
export async function getChatLogs(startDate, endDate) {
  try {
    await ensureLogsDirectory();
    
    const logs = [];
    const currentDate = new Date(startDate);
    
    // Iterate through date range
    while (currentDate <= endDate) {
      const logFilePath = getLogFilePath(currentDate);
      
      try {
        const fileData = await fs.readFile(logFilePath, 'utf-8');
        const dayLogs = JSON.parse(fileData);
        logs.push(...dayLogs);
      } catch (error) {
        // File doesn't exist for this date, skip
        if (error.code !== 'ENOENT') {
          logError(`Failed to read log file for ${currentDate.toISOString().split('T')[0]}`, error);
        }
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Sort by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return logs;
  } catch (error) {
    logError('Failed to get chat logs', error);
    throw error;
  }
}

/**
 * Get chat logs grouped by conversation
 * 
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Object with conversationId as keys
 */
export async function getChatLogsByConversation(startDate, endDate) {
  const logs = await getChatLogs(startDate, endDate);
  
  // Group by conversationId
  const grouped = {};
  logs.forEach(log => {
    if (!grouped[log.conversationId]) {
      grouped[log.conversationId] = {
        conversationId: log.conversationId,
        messages: [],
        firstMessage: log.timestamp,
        lastMessage: log.timestamp,
        totalMessages: 0,
        ip: log.ip,
        userAgent: log.userAgent
      };
    }
    
    grouped[log.conversationId].messages.push(log);
    grouped[log.conversationId].totalMessages++;
    
    // Update timestamps
    if (new Date(log.timestamp) < new Date(grouped[log.conversationId].firstMessage)) {
      grouped[log.conversationId].firstMessage = log.timestamp;
    }
    if (new Date(log.timestamp) > new Date(grouped[log.conversationId].lastMessage)) {
      grouped[log.conversationId].lastMessage = log.timestamp;
    }
  });
  
  // Sort messages within each conversation
  Object.values(grouped).forEach(conv => {
    conv.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  });
  
  return grouped;
}

/**
 * Get storage statistics
 * 
 * @returns {Promise<Object>} Storage stats
 */
export async function getStorageStats() {
  try {
    await ensureLogsDirectory();
    
    const files = await fs.readdir(LOGS_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    let totalSize = 0;
    let totalConversations = 0;
    let totalMessages = 0;
    const fileStats = [];
    
    for (const file of jsonFiles) {
      const filePath = path.join(LOGS_DIR, file);
      const stats = await fs.stat(filePath);
      const fileData = await fs.readFile(filePath, 'utf-8');
      const logs = JSON.parse(fileData);
      
      const uniqueConversations = new Set(logs.map(log => log.conversationId));
      
      totalSize += stats.size;
      totalMessages += logs.length;
      totalConversations += uniqueConversations.size;
      
      fileStats.push({
        date: file.replace('.json', ''),
        size: stats.size,
        messages: logs.length,
        conversations: uniqueConversations.size
      });
    }
    
    return {
      totalFiles: jsonFiles.length,
      totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      totalMessages,
      totalConversations,
      averageMessagesPerConversation: totalConversations > 0 ? (totalMessages / totalConversations).toFixed(2) : 0,
      averageSizePerMessage: totalMessages > 0 ? (totalSize / totalMessages).toFixed(2) : 0,
      files: fileStats.sort((a, b) => b.date.localeCompare(a.date))
    };
  } catch (error) {
    logError('Failed to get storage stats', error);
    throw error;
  }
}

/**
 * Delete old logs (older than specified days)
 * 
 * @param {number} daysToKeep - Number of days to keep (default: 90)
 * @returns {Promise<number>} Number of files deleted
 */
export async function cleanupOldLogs(daysToKeep = 90) {
  try {
    await ensureLogsDirectory();
    
    const files = await fs.readdir(LOGS_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    let deletedCount = 0;
    
    for (const file of jsonFiles) {
      const dateStr = file.replace('.json', '');
      const fileDate = new Date(dateStr);
      
      if (fileDate < cutoffDate) {
        const filePath = path.join(LOGS_DIR, file);
        await fs.unlink(filePath);
        deletedCount++;
        logInfo('Deleted old log file', { file, date: dateStr });
      }
    }
    
    return deletedCount;
  } catch (error) {
    logError('Failed to cleanup old logs', error);
    throw error;
  }
}
