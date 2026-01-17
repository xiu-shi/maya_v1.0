/**
 * KB Monitor - Track KB loading, updates, and usage
 * 
 * This module provides monitoring and refresh capabilities for the Knowledge Base
 * Refactored to use async operations with timeouts to prevent hangs (Issue #10, #11)
 */

import { promises as fs, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { logInfo, logError } from '../logger.js';
import { loadKBContext } from '../kb-loader.js';
import { readFileWithTimeout, TIMEOUTS } from '../timeout.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const KB_PATH = join(__dirname, '../../knowledge');

/**
 * KB Statistics
 */
let kbStats = {
  firstLoadTime: null,
  lastLoadTime: null,
  lastRefreshTime: null,
  loadCount: 0,
  refreshCount: 0,
  documentCount: 0,
  totalContextLength: 0,
  documents: []
};

/**
 * Track KB load event
 */
export function trackKBLoad(context, documentCount) {
  const now = new Date();
  
  if (!kbStats.firstLoadTime) {
    kbStats.firstLoadTime = now;
  }
  
  kbStats.lastLoadTime = now;
  kbStats.loadCount++;
  kbStats.documentCount = documentCount;
  kbStats.totalContextLength = context ? context.length : 0;
  
  logInfo('KB load tracked', {
    loadCount: kbStats.loadCount,
    documentCount,
    contextLength: kbStats.totalContextLength,
    timeSinceFirstLoad: kbStats.firstLoadTime ? 
      Math.round((now - kbStats.firstLoadTime) / 1000) + 's' : 'N/A'
  });
}

/**
 * Track KB refresh event
 */
export function trackKBRefresh(context, documentCount) {
  const now = new Date();
  
  kbStats.lastRefreshTime = now;
  kbStats.refreshCount++;
  kbStats.documentCount = documentCount;
  kbStats.totalContextLength = context ? context.length : 0;
  
  logInfo('KB refresh tracked', {
    refreshCount: kbStats.refreshCount,
    documentCount,
    contextLength: kbStats.totalContextLength,
    timeSinceLastLoad: kbStats.lastLoadTime ? 
      Math.round((now - kbStats.lastLoadTime) / 1000) + 's' : 'N/A'
  });
}

/**
 * Get KB statistics
 */
export function getKBStats() {
  return {
    ...kbStats,
    // Calculate time since last load
    timeSinceLastLoad: kbStats.lastLoadTime ? 
      Math.round((Date.now() - kbStats.lastLoadTime.getTime()) / 1000) : null,
    // Calculate time since last refresh
    timeSinceLastRefresh: kbStats.lastRefreshTime ? 
      Math.round((Date.now() - kbStats.lastRefreshTime.getTime()) / 1000) : null,
    // Calculate uptime
    uptime: kbStats.firstLoadTime ? 
      Math.round((Date.now() - kbStats.firstLoadTime.getTime()) / 1000) : null
  };
}

/**
 * Check if KB files have been modified since last load (async with timeout)
 * Refactored from synchronous operations to prevent blocking (Issue #10)
 */
export async function checkKBUpdates() {
  try {
    const prioritiesPath = join(KB_PATH, 'config/priorities.json');
    
    if (!existsSync(prioritiesPath)) {
      return { hasUpdates: false, reason: 'Priorities config not found' };
    }
    
    // Use async file read with timeout
    const prioritiesContent = await readFileWithTimeout(
      fs.readFile(prioritiesPath, 'utf-8'),
      prioritiesPath
    );
    const prioritiesConfig = JSON.parse(prioritiesContent);
    const highPriorityDocs = prioritiesConfig.high || [];
    
    const updates = [];
    let latestModTime = null;
    
    // Check file stats in parallel with timeout protection
    const statPromises = highPriorityDocs.map(async (docKey) => {
      const docPath = join(KB_PATH, docKey);
      if (existsSync(docPath)) {
        try {
          const stats = await fs.stat(docPath);
          const modTime = stats.mtime;
          
          if (!latestModTime || modTime > latestModTime) {
            latestModTime = modTime;
          }
          
          // Check if file was modified after last load
          if (kbStats.lastLoadTime && modTime > kbStats.lastLoadTime) {
            return {
              document: docKey,
              modified: modTime.toISOString(),
              modifiedAgo: Math.round((Date.now() - modTime.getTime()) / 1000) + 's'
            };
          }
        } catch (error) {
          logError('Failed to stat KB document', error, { docKey });
        }
      }
      return null;
    });
    
    // Execute all stat operations with timeout
    const statResults = await Promise.all(statPromises);
    updates.push(...statResults.filter(update => update !== null));
    
    return {
      hasUpdates: updates.length > 0,
      latestModification: latestModTime ? latestModTime.toISOString() : null,
      updatedDocuments: updates,
      totalDocuments: highPriorityDocs.length
    };
  } catch (error) {
    logError('Failed to check KB updates', error);
    return { hasUpdates: false, error: error.message };
  }
}

/**
 * Get detailed KB status report (async with timeout)
 */
export async function getKBStatusReport() {
  const stats = getKBStats();
  const updates = await checkKBUpdates(); // Now async
  
  return {
    statistics: stats,
    updates: updates,
    recommendations: generateRecommendations(stats, updates)
  };
}

/**
 * Generate recommendations based on KB status
 */
function generateRecommendations(stats, updates) {
  const recommendations = [];
  
  // Check if KB needs refresh
  if (updates.hasUpdates) {
    recommendations.push({
      type: 'refresh_needed',
      priority: 'high',
      message: `${updates.updatedDocuments.length} document(s) have been modified since last load. Consider refreshing the KB.`,
      action: 'Call /api/admin/kb-refresh endpoint or restart server'
    });
  }
  
  // Check if KB hasn't been refreshed in a while
  if (stats.timeSinceLastRefresh && stats.timeSinceLastRefresh > 3600) {
    recommendations.push({
      type: 'stale_cache',
      priority: 'medium',
      message: `KB hasn't been refreshed in ${Math.round(stats.timeSinceLastRefresh / 60)} minutes. Consider refreshing if you've updated KB files.`,
      action: 'Call /api/admin/kb-refresh endpoint'
    });
  }
  
  // Check if KB has never been loaded
  if (!stats.firstLoadTime) {
    recommendations.push({
      type: 'not_loaded',
      priority: 'high',
      message: 'KB has never been loaded. It will be loaded on first chat request.',
      action: 'Send a chat request to trigger KB loading'
    });
  }
  
  return recommendations;
}

/**
 * Reset KB statistics (useful for testing)
 */
export function resetKBStats() {
  kbStats = {
    firstLoadTime: null,
    lastLoadTime: null,
    lastRefreshTime: null,
    loadCount: 0,
    refreshCount: 0,
    documentCount: 0,
    totalContextLength: 0,
    documents: []
  };
  logInfo('KB statistics reset');
}
