/**
 * Remote Logs Fetcher
 * 
 * Fetches chat logs from remote servers (e.g., production)
 */

import { logInfo, logError } from './logger.js';

/**
 * Fetch logs from a remote server
 * 
 * @param {string} serverUrl - Base URL of the remote server (e.g., 'https://maya-agent.ai-builders.space')
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} groupBy - Grouping option ('none', 'conversation', etc.)
 * @returns {Promise<Array>} Array of log entries
 */
export async function fetchRemoteLogs(serverUrl, startDate, endDate, groupBy = 'none') {
  try {
    const url = new URL(`${serverUrl}/api/admin/chat-logs`);
    url.searchParams.set('startDate', startDate.toISOString().split('T')[0]);
    url.searchParams.set('endDate', endDate.toISOString().split('T')[0]);
    url.searchParams.set('groupBy', groupBy);
    // Don't include remote when fetching from remote (avoid infinite loop)
    url.searchParams.set('includeRemote', 'false');
    
    logInfo('Fetching remote logs', {
      serverUrl: serverUrl,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      url: url.toString()
    });
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Maya-Chat-Logger/1.0'
      },
      // Add timeout
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      logError('Remote logs API returned error', null, {
        serverUrl: serverUrl,
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 200)
      });
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      logError('Remote logs API returned success:false', null, {
        serverUrl: serverUrl,
        error: data.error,
        message: data.message
      });
      throw new Error(data.message || data.error || 'Failed to fetch remote logs');
    }
    
    logInfo('Remote logs fetched successfully', {
      serverUrl: serverUrl,
      logCount: Array.isArray(data.logs) ? data.logs.length : Object.keys(data.logs).length
    });
    
    // Add server identifier to each log entry
    const logs = Array.isArray(data.logs) ? data.logs : Object.values(data.logs).flat();
    return logs.map(log => ({
      ...log,
      remoteServer: serverUrl,
      isRemote: true
    }));
  } catch (error) {
    logError('Failed to fetch remote logs', error, {
      serverUrl: serverUrl,
      errorMessage: error.message,
      errorName: error.name
    });
    throw error;
  }
}

/**
 * Fetch stats from a remote server
 * 
 * @param {string} serverUrl - Base URL of the remote server
 * @returns {Promise<Object>} Stats object
 */
export async function fetchRemoteStats(serverUrl) {
  try {
    const url = `${serverUrl}/api/admin/chat-logs/stats`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || data.error || 'Failed to fetch remote stats');
    }
    
    return {
      ...data.stats,
      remoteServer: serverUrl,
      isRemote: true
    };
  } catch (error) {
    logError('Failed to fetch remote stats', error, {
      serverUrl: serverUrl,
      errorMessage: error.message
    });
    throw error;
  }
}

/**
 * Merge logs from multiple sources
 * 
 * @param {Array<Array>} logArrays - Array of log arrays from different sources
 * @returns {Array} Merged and sorted logs
 */
export function mergeLogs(...logArrays) {
  const allLogs = logArrays.flat();
  
  // Sort by timestamp (newest first)
  allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  return allLogs;
}

/**
 * Merge stats from multiple sources
 * 
 * @param {Array<Object>} statsArray - Array of stats objects from different sources
 * @returns {Object} Merged stats
 */
export function mergeStats(...statsArray) {
  const merged = {
    totalFiles: 0,
    totalSize: 0,
    totalMessages: 0,
    totalConversations: 0,
    sources: []
  };
  
  statsArray.forEach(stats => {
    merged.totalFiles += stats.totalFiles || 0;
    merged.totalSize += stats.totalSize || 0;
    merged.totalMessages += stats.totalMessages || 0;
    merged.totalConversations += stats.totalConversations || 0;
    
    merged.sources.push({
      server: stats.remoteServer || 'local',
      messages: stats.totalMessages || 0,
      conversations: stats.totalConversations || 0,
      size: stats.totalSize || 0
    });
  });
  
  merged.totalSizeMB = (merged.totalSize / 1024 / 1024).toFixed(2);
  merged.averageMessagesPerConversation = merged.totalConversations > 0 
    ? (merged.totalMessages / merged.totalConversations).toFixed(2) 
    : '0.00';
  
  return merged;
}
