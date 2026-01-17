/**
 * Knowledge Base Loader
 * 
 * Loads KB documents from local filesystem (development) or S3 (production)
 * Refactored to use async operations with timeouts to prevent hangs (Issue #10, #11)
 */

import { promises as fs, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { logInfo, logError } from './logger.js';
import { readFileWithTimeout, TIMEOUTS, bulkOperationWithTimeout } from './timeout.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const KB_PATH = join(__dirname, '../../knowledge');

/**
 * Load document from local filesystem (async with timeout)
 * Refactored from synchronous readFileSync to prevent blocking (Issue #10)
 */
async function loadLocalDocument(key) {
  try {
    const filePath = join(KB_PATH, key);
    
    if (!existsSync(filePath)) {
      logError('KB document not found', new Error(`File not found: ${key}`), { key, filePath });
      return null;
    }
    
    // Use async file read with timeout to prevent hangs
    const content = await readFileWithTimeout(
      fs.readFile(filePath, 'utf-8'),
      filePath
    );
    
    logInfo('Loaded KB document', { key, size: content.length });
    return content;
  } catch (error) {
    logError('Failed to load local KB document', error, { key });
    return null;
  }
}

/**
 * Extract key information from document content
 */
function extractKBInfo(content) {
  if (!content) return { summary: '', keyPoints: [], details: '' };
  
  const info = { summary: '', keyPoints: [], details: '' };
  
  // Extract Summary section (safer string-based approach)
  const summaryIndex = content.toLowerCase().indexOf('## summary');
  if (summaryIndex !== -1) {
    const afterSummary = content.substring(summaryIndex + 10);
    const nextSectionIndex = afterSummary.search(/\n## |\n$/);
    const summaryContent = nextSectionIndex !== -1 
      ? afterSummary.substring(0, nextSectionIndex)
      : afterSummary.substring(0, 500); // Limit to 500 chars
    info.summary = summaryContent.trim();
  }
  
  // Extract Key Points section (safer string-based approach)
  const keyPointsIndex = content.toLowerCase().indexOf('## key points');
  if (keyPointsIndex !== -1) {
    const afterKeyPoints = content.substring(keyPointsIndex + 13);
    const nextSectionIndex = afterKeyPoints.search(/\n## |\n$/);
    const keyPointsContent = nextSectionIndex !== -1 
      ? afterKeyPoints.substring(0, nextSectionIndex)
      : afterKeyPoints.substring(0, 2000); // Limit to 2000 chars
    const points = keyPointsContent
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(point => point.length > 0);
    info.keyPoints = points;
  }
  
  // Extract Details section (important for comprehensive information)
  // Use simpler approach to avoid regex backtracking issues
  const detailsIndex = content.indexOf('## Details');
  if (detailsIndex !== -1) {
    const afterDetails = content.substring(detailsIndex + 10); // Skip "## Details"
    const nextSectionIndex = afterDetails.search(/\n## |\n$/);
    const detailsContent = nextSectionIndex !== -1 
      ? afterDetails.substring(0, nextSectionIndex)
      : afterDetails.substring(0, 1000); // Limit to 1000 chars max
    info.details = detailsContent.trim().substring(0, 500);
  }
  
  // Fallback: Get first paragraph if no summary
  if (!info.summary) {
    const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
    if (lines.length > 0) {
      info.summary = lines[0].substring(0, 200);
    }
  }
  
  return info;
}

/**
 * Load KB context (high-priority documents)
 * @returns {Promise<string>} Formatted KB context
 */
export async function loadKBContext() {
  try {
    // Load priorities config with timeout
    const prioritiesPath = join(KB_PATH, 'config/priorities.json');
    
    if (!existsSync(prioritiesPath)) {
      logInfo('KB priorities config not found, skipping KB context', { path: prioritiesPath });
      return '';
    }
    
    // Use async file read with timeout
    const prioritiesContent = await readFileWithTimeout(
      fs.readFile(prioritiesPath, 'utf-8'),
      prioritiesPath
    );
    const prioritiesConfig = JSON.parse(prioritiesContent);
    const highPriorityDocs = prioritiesConfig.high || [];

    if (highPriorityDocs.length === 0) {
      logInfo('No high-priority KB documents configured');
      return '';
    }

    // Load documents in parallel with timeout protection
    // This prevents blocking when loading multiple files (Issue #11)
    const documentPromises = highPriorityDocs.map(async (key) => {
      logInfo('Processing KB document', { key });
      try {
        const content = await loadLocalDocument(key);
        if (content) {
          logInfo('Extracting KB info', { key, contentLength: content.length });
          const kbInfo = extractKBInfo(content);
          logInfo('KB info extracted', { key, hasSummary: !!kbInfo.summary, keyPointsCount: kbInfo.keyPoints?.length || 0 });
          return { key, ...kbInfo };
        } else {
          logInfo('Skipping document (not found or failed to load)', { key });
          return null;
        }
      } catch (error) {
        logError('Failed to process KB document', error, { key });
        // Continue with next document instead of failing completely
        return null;
      }
    });

    // Execute all document loads with timeout protection
    const documentResults = await bulkOperationWithTimeout(
      documentPromises,
      TIMEOUTS.KB_LOAD / highPriorityDocs.length, // Distribute timeout across documents
      'KB document loading'
    );
    
    const documents = documentResults.filter(doc => doc !== null);

    if (documents.length === 0) {
      logInfo('No KB documents loaded', { attempted: highPriorityDocs.length });
      return '';
    }

    // Format context for system prompt with detailed information
    const contextSections = documents.map(({ key, summary, keyPoints, details }) => {
      const docName = key.split('/').pop().replace('.md', '').replace(/-/g, ' ');
      let section = `${docName}:\n  Summary: ${summary}`;
      
      if (keyPoints && keyPoints.length > 0) {
        section += `\n  Key Points:\n${keyPoints.map(p => `    - ${p}`).join('\n')}`;
      }
      
      // Include details section if available (contains important context like bilingual info)
      if (details && details.length > 0) {
        section += `\n  Details: ${details}`;
      }
      
      return section;
    });

    const context = `KNOWLEDGE BASE CONTEXT:\n\n${contextSections.join('\n\n')}\n\nIMPORTANT: Use this information when answering questions about Janet. Reference specific details from the knowledge base. Be accurate and factual.`;

    logInfo('KB context loaded', { 
      source: 'local',
      documentCount: documents.length,
      totalDocs: highPriorityDocs.length
    });

    return context;
  } catch (error) {
    logError('Failed to load KB context', error);
    return ''; // Return empty context if KB loading fails
  }
}

/**
 * Load specific document by key (async with timeout)
 * @param {string} key - Document key (e.g., 'docs/bio/janet-bio.md')
 * @returns {Promise<string|null>} Document content or null
 */
export async function loadDocument(key) {
  return await loadLocalDocument(key);
}

/**
 * Check if KB is configured
 * @returns {boolean}
 */
export function isKBConfigured() {
  const prioritiesPath = join(KB_PATH, 'config/priorities.json');
  return existsSync(prioritiesPath);
}

