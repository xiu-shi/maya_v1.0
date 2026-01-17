/**
 * Test Output Sanitization Utility
 * 
 * Sanitizes test output to prevent exposure of sensitive information:
 * - Full file paths (reveals username, directory structure)
 * - Environment details
 * - Token-related warnings
 * - Internal system paths
 * 
 * Best Practices:
 * - Always sanitize before displaying to users
 * - Use relative paths instead of absolute paths
 * - Mask usernames and sensitive directory information
 * - Remove or mask token-related messages
 */

import { fileURLToPath } from 'url';
import { dirname, join, relative } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MAYA_ROOT = join(__dirname, '../..');

/**
 * Get workspace root directory (for path sanitization)
 */
function getWorkspaceRoot() {
  // Try to detect workspace root from common patterns
  const currentPath = process.cwd();
  
  // If we're in Maya/backend, go up two levels
  if (currentPath.includes('Maya/backend')) {
    return join(currentPath.split('Maya/backend')[0], 'Maya');
  }
  
  // If we're in Maya directory, use it
  if (currentPath.includes('Maya')) {
    const parts = currentPath.split('Maya');
    return join(parts[0], 'Maya');
  }
  
  // Default to MAYA_ROOT
  return MAYA_ROOT;
}

const WORKSPACE_ROOT = getWorkspaceRoot();

/**
 * Sanitize file paths in text
 * Converts absolute paths to relative paths and masks usernames
 */
export function sanitizePaths(text) {
  if (typeof text !== 'string') {
    return text;
  }
  
  let sanitized = text;
  
  // Pattern to match absolute paths (Unix/Mac)
  // Match paths that start with / and contain valid path characters
  // Use a more specific pattern to avoid matching partial paths
  const absolutePathPattern = /(\/[^\s\)\n:]+(?:\/[^\s\)\n:]+)*)/g;
  
  sanitized = sanitized.replace(absolutePathPattern, (match) => {
    // Trim any trailing punctuation that might have been captured
    const cleanMatch = match.replace(/[.,;:!?]+$/, '');
    
    // Skip very short matches (likely not paths)
    if (cleanMatch.length < 3) {
      return match;
    }
    // Skip if it's a URL or protocol
    if (match.startsWith('http://') || match.startsWith('https://') || match.startsWith('file://')) {
      return match;
    }
    
    // Skip if it's a common system path that shouldn't be sanitized
    if (match.startsWith('/usr/') || match.startsWith('/bin/') || match.startsWith('/etc/')) {
      return match;
    }
    
    try {
      // Convert to relative path if it's within workspace
      const relativePath = relative(WORKSPACE_ROOT, cleanMatch);
      
      // If relative path doesn't start with '..', it's within workspace
      if (!relativePath.startsWith('..') && relativePath !== cleanMatch && relativePath.length > 0) {
        // Return relative path (preserve any trailing punctuation)
        const trailingPunct = match.slice(cleanMatch.length);
        return relativePath + trailingPunct;
      }
      
      // If it's outside workspace, mask username
      // Pattern: /Users/username/... -> /Users/[USER]/...
      const userPathPattern = /^(\/Users\/)([^\/]+)(\/.*)$/;
      if (userPathPattern.test(cleanMatch)) {
        const trailingPunct = match.slice(cleanMatch.length);
        return cleanMatch.replace(userPathPattern, '$1[USER]$3') + trailingPunct;
      }
      
      // Pattern: /home/username/... -> /home/[USER]/...
      const homePathPattern = /^(\/home\/)([^\/]+)(\/.*)$/;
      if (homePathPattern.test(cleanMatch)) {
        const trailingPunct = match.slice(cleanMatch.length);
        return cleanMatch.replace(homePathPattern, '$1[USER]$3') + trailingPunct;
      }
      
      // For other absolute paths, try to extract relative portion
      // Check if cleanMatch contains workspace root
      if (cleanMatch.includes(WORKSPACE_ROOT)) {
        const relativePortion = cleanMatch.replace(WORKSPACE_ROOT, '').replace(/^\//, '');
        if (relativePortion.length > 0) {
          const trailingPunct = match.slice(cleanMatch.length);
          return relativePortion + trailingPunct;
        }
      }
      
      // Last resort: show basename
      const pathParts = cleanMatch.split('/').filter(p => p.length > 0);
      const basename = pathParts.length > 0 ? pathParts[pathParts.length - 1] : cleanMatch;
      const trailingPunct = match.slice(cleanMatch.length);
      return basename + trailingPunct;
    } catch (error) {
      // If path conversion fails, mask the entire path
      return '[PATH]';
    }
  });
  
  return sanitized;
}

/**
 * Sanitize environment and configuration details
 */
export function sanitizeEnvironment(text) {
  if (typeof text !== 'string') {
    return text;
  }
  
  let sanitized = text;
  
  // Mask token-related warnings
  sanitized = sanitized.replace(
    /AI_BUILDER_TOKEN[^\n]*/gi,
    'AI_BUILDER_TOKEN: [REDACTED]'
  );
  
  // Mask environment configuration details in test output
  sanitized = sanitized.replace(
    /(NODE_ENV|PORT|Environment|environment):\s*[^\n]+/gi,
    (match) => {
      // Keep the key but mask sensitive values
      const key = match.split(':')[0];
      return `${key}: [REDACTED]`;
    }
  );
  
  // Remove experimental warnings (not sensitive but noisy)
  sanitized = sanitized.replace(
    /\(node:\d+\) ExperimentalWarning[^\n]*/g,
    '[ExperimentalWarning]'
  );
  
  return sanitized;
}

/**
 * Sanitize error messages and stack traces
 */
export function sanitizeErrors(text) {
  if (typeof text !== 'string') {
    return text;
  }
  
  let sanitized = text;
  
  // Sanitize paths in error messages
  sanitized = sanitizePaths(sanitized);
  
  // Mask sensitive keys in error objects
  sanitized = sanitized.replace(
    /(['"]?)(token|password|secret|key|auth|authorization|api[_-]?key)(['"]?)\s*[:=]\s*['"]?[^'",\s}]+['"]?/gi,
    '$1$2$3: [REDACTED]'
  );
  
  return sanitized;
}

/**
 * Comprehensive sanitization of test output
 * Applies all sanitization functions in order
 */
export function sanitizeTestOutput(output) {
  if (!output) {
    return output;
  }
  
  if (typeof output === 'object') {
    // Recursively sanitize object properties
    const sanitized = {};
    for (const [key, value] of Object.entries(output)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeTestOutput(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => sanitizeTestOutput(item));
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeTestOutput(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
  
  if (typeof output === 'string') {
    let sanitized = output;
    
    // Apply all sanitization functions
    sanitized = sanitizePaths(sanitized);
    sanitized = sanitizeEnvironment(sanitized);
    sanitized = sanitizeErrors(sanitized);
    
    return sanitized;
  }
  
  return output;
}

/**
 * Sanitize Jest test results JSON
 */
export function sanitizeJestResults(results) {
  if (!results || typeof results !== 'object') {
    return results;
  }
  
  const sanitized = { ...results };
  
  // Sanitize test file paths
  if (Array.isArray(sanitized.testResults)) {
    sanitized.testResults = sanitized.testResults.map(testResult => {
      const sanitizedResult = { ...testResult };
      
      // Sanitize file path
      if (sanitizedResult.name) {
        sanitizedResult.name = sanitizePaths(sanitizedResult.name);
      }
      
      // Sanitize failure messages
      if (Array.isArray(sanitizedResult.failureMessages)) {
        sanitizedResult.failureMessages = sanitizedResult.failureMessages.map(
          msg => sanitizeTestOutput(msg)
        );
      }
      
      return sanitizedResult;
    });
  }
  
  return sanitized;
}
