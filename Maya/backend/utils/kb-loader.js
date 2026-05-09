/**
 * Knowledge Base Loader
 * 
 * Loads KB documents from local filesystem (development) or S3 (production)
 * Refactored to use async operations with timeouts to prevent hangs (Issue #10, #11)
 */

import { promises as fs, existsSync } from 'fs';
import { join, resolve, sep } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { logInfo, logError, logWarning } from './logger.js';
import { readFileWithTimeout, TIMEOUTS, bulkOperationWithTimeout } from './timeout.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const KB_PATH = join(__dirname, '../../knowledge');
const KB_PATH_RESOLVED = resolve(KB_PATH);

/**
 * Confine a configured KB key to a resolved KB root so a malformed or
 * malicious priorities.json (e.g. "../../etc/passwd") cannot probe paths
 * outside the knowledge directory. Returns null if the key escapes the root.
 */
function resolveKBKeySafe(key, kbRoot = KB_PATH_RESOLVED) {
  if (typeof key !== 'string' || key.length === 0) return null;
  const root = resolve(kbRoot);
  const candidate = resolve(root, key);
  if (candidate !== root && !candidate.startsWith(root + sep)) {
    return null;
  }
  return candidate;
}

/**
 * Load document from local filesystem (async with timeout)
 * Refactored from synchronous readFileSync to prevent blocking (Issue #10)
 */
async function loadLocalDocument(key) {
  try {
    const filePath = resolveKBKeySafe(key);

    if (filePath === null) {
      logError(
        'KB document key rejected as unsafe (path traversal attempt)',
        new Error(`Unsafe key: ${key}`),
        { key }
      );
      return null;
    }

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
  // Check for both "## Summary" and "## Executive Summary"
  const contentLower = content.toLowerCase();
  let summaryIndex = contentLower.indexOf('## summary');
  let summaryOffset = 10; // Length of "## Summary"
  
  // If not found, try "## Executive Summary"
  if (summaryIndex === -1) {
    summaryIndex = contentLower.indexOf('## executive summary');
    if (summaryIndex !== -1) {
      summaryOffset = 22; // Length of "## Executive Summary"
    }
  }
  
  if (summaryIndex !== -1) {
    const afterSummary = content.substring(summaryIndex + summaryOffset);
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
  
  // Enhanced extraction: If no key points found, try to extract from bullet lists in first few sections
  if (info.keyPoints.length === 0) {
    // Look for bullet points in the first 3000 characters (usually contains key info)
    const earlyContent = content.substring(0, 3000);
    const bulletLines = earlyContent
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return (trimmed.startsWith('-') || trimmed.startsWith('*')) && trimmed.length > 10;
      })
      .slice(0, 10); // Limit to first 10 bullets
    
    if (bulletLines.length > 0) {
      info.keyPoints = bulletLines
        .map(line => line.replace(/^[-*]\s*/, '').trim())
        .filter(point => point.length > 0 && point.length < 200); // Filter out too short or too long
    }
  }
  
  // Enhanced: Extract more content if summary is too short
  if (info.summary && info.summary.length < 100) {
    // Try to get more content from Executive Summary section
    const execIndex = contentLower.indexOf('## executive summary');
    if (execIndex !== -1) {
      const afterExec = content.substring(execIndex + 22);
      const nextSectionIndex = afterExec.search(/\n## |\n---/);
      const execContent = nextSectionIndex !== -1 
        ? afterExec.substring(0, Math.min(nextSectionIndex, 800))
        : afterExec.substring(0, 800);
      if (execContent.trim().length > info.summary.length) {
        info.summary = execContent.trim();
      }
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

    // Validate that all configured files are present on disk.
    // This catches the class of BUG-C1 failures where files are added to
    // priorities.json (or gitignored away from the repo) and the server
    // silently loads a smaller context than intended.
    const validation = await validateKBConfig();
    if (!validation.valid) {
      const highMissing = validation.missing.filter((m) => m.tier === 'high');
      logWarning(
        `KB context load proceeding with ${highMissing.length} high-priority file(s) absent. ` +
        `LLM will operate WITHOUT: ${highMissing.map((m) => m.key).join(', ')}`,
        { highPriorityMissingCount: highMissing.length }
      );
    }

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

    const context = `KNOWLEDGE BASE CONTEXT:\n\n${contextSections.join('\n\n')}\n\nIMPORTANT: Use this information when answering questions about Janet. You are Maya, the advisory agent representing Janet - speak ON BEHALF OF Janet, not AS Janet (see MAYA VOICE DIRECTIVES). When attribution adds value, reference the specific real-world context - the company, role, credential, or programme - rather than citing a knowledge base section name. Never annotate responses with internal tags or labels. Be accurate and factual.`;

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

// Validation result cache. The KB manifest does not change at runtime so we
// memoise the validation result per process. Tests that need fresh state can
// call clearKBConfigCache() between runs.
let _validationCache = null;

/**
 * Reset the cached validation result. Intended for tests and rare hot-reload
 * scenarios. Production code does not need to call this.
 */
export function clearKBConfigCache() {
  _validationCache = null;
}

/**
 * Validate that every file listed in priorities.json exists on disk and that
 * no configured key escapes the KB directory.
 *
 * Returns a report so callers can emit startup warnings or block boot.
 * A file that is listed as high-priority but absent, OR any key that resolves
 * outside KB_PATH, is treated as a structural failure because the LLM will
 * silently run without that context (see BUG-C1, 9 May 2026).
 *
 * @param {{ force?: boolean, prioritiesPath?: string, kbRoot?: string }} [options]
 *   - force=true bypasses the result cache
 *   - prioritiesPath overrides the manifest location (test only)
 *   - kbRoot overrides the KB directory used for path resolution (test only)
 * @returns {Promise<{valid: boolean, missing: Array<{key: string, tier: string}>, present: string[], warnings: string[], rejected: Array<{key: string, tier: string, reason: string}>}>}
 */
export async function validateKBConfig(options = {}) {
  // Only the unparameterised call uses the cache; tests that pass overrides
  // always force a fresh evaluation.
  const usingDefaults = !options.prioritiesPath && !options.kbRoot;
  if (usingDefaults && !options.force && _validationCache !== null) {
    return _validationCache;
  }
  const prioritiesPath = options.prioritiesPath || join(KB_PATH, 'config/priorities.json');
  const kbRoot = options.kbRoot || KB_PATH;

  if (!existsSync(prioritiesPath)) {
    return {
      valid: false,
      missing: [],
      present: [],
      warnings: ['priorities.json not found - KB validation cannot run'],
      rejected: [],
    };
  }

  let prioritiesConfig;
  try {
    const raw = await fs.readFile(prioritiesPath, 'utf-8');
    prioritiesConfig = JSON.parse(raw);
  } catch (err) {
    return {
      valid: false,
      missing: [],
      present: [],
      warnings: [`Failed to parse priorities.json: ${err.message}`],
      rejected: [],
    };
  }

  const tiers = ['high', 'medium', 'low'];
  const result = { valid: true, missing: [], present: [], warnings: [], rejected: [] };

  for (const tier of tiers) {
    const docs = prioritiesConfig[tier] || [];
    for (const key of docs) {
      const safePath = resolveKBKeySafe(key, kbRoot);
      if (safePath === null) {
        // Key tries to escape KB_PATH (e.g. "../../etc/passwd") - reject and
        // do not perform any filesystem check on it.
        result.rejected.push({ key, tier, reason: 'path_outside_kb' });
        result.warnings.push(`[${tier.toUpperCase()}] Rejected unsafe KB key: ${key}`);
        result.valid = false;
        continue;
      }
      if (existsSync(safePath)) {
        result.present.push(key);
      } else {
        result.missing.push({ key, tier });
        result.warnings.push(`[${tier.toUpperCase()}] Missing KB file: ${key}`);
        if (tier === 'high') {
          // A missing high-priority file is a hard failure: the LLM will run
          // without critical context (no-commitments policy, conversation
          // boundaries, voice positioning docs) with no visible indication.
          result.valid = false;
        }
      }
    }
  }

  if (result.missing.length > 0) {
    const highMissing = result.missing.filter((m) => m.tier === 'high');
    logWarning('KB config validation: missing files detected', {
      missingCount: result.missing.length,
      highPriorityMissingCount: highMissing.length,
      missingFiles: result.missing.map((m) => `[${m.tier}] ${m.key}`),
    });
    if (highMissing.length > 0) {
      logError(
        'CRITICAL: High-priority KB files missing - LLM will operate without this context in production',
        new Error(`${highMissing.length} high-priority KB file(s) absent from disk`),
        { missingHighPriorityFiles: highMissing.map((m) => m.key) }
      );
    }
  }

  if (result.rejected.length > 0) {
    logError(
      'CRITICAL: priorities.json contains keys that escape KB_PATH (path traversal protection triggered)',
      new Error(`${result.rejected.length} unsafe key(s) rejected`),
      { rejectedKeys: result.rejected.map((r) => `[${r.tier}] ${r.key}`) }
    );
  }

  // Only cache the default-arg result; tests using overrides should not
  // poison the production cache.
  if (usingDefaults) {
    _validationCache = result;
  }
  return result;
}

/**
 * Check if KB is configured
 * @returns {boolean}
 */
export function isKBConfigured() {
  const prioritiesPath = join(KB_PATH, 'config/priorities.json');
  return existsSync(prioritiesPath);
}

