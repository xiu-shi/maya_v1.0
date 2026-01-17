/**
 * Response Guardrails
 * 
 * Prevents Maya from revealing internal system information:
 * - KB KPIs/metrics
 * - System architecture details
 * - Code/implementation details
 * - Design methodologies
 * - Internal KB insights
 * 
 * Created: January 9, 2026, 18:00
 * Purpose: Prevent prompt injection and information leakage
 */

import { logWarning, logError } from './logger.js';

/**
 * Patterns that indicate internal system information leakage
 */
const LEAKAGE_PATTERNS = [
  // KB Metrics/KPIs
  /\b(8|eight)\s*(KPIs?|key performance indicators?|metrics?)/i,
  /\bcache\s*hit\s*rate/i,
  /\bhit\s*rate/i,
  /\bresponse\s*time/i,
  /\bresponse\s*times/i,
  /\bresponse\s*time\s*(is|kept|below|under|maintained)/i,
  /\bmemory\s*efficiency/i,
  /\bmemory\s*usage/i,
  /\bmemory\s*efficiency\s*(is|at|optimal)/i,
  /\bchecksum\s*validation/i,
  /\bKB\s*freshness/i,
  /\bKB\s*refreshed/i,
  /\bKB\s*refresh/i,
  /\bfreshness/i,
  /\bfreshness\s*(is|monitored|refreshed)/i,
  /\b\d+%\s*checksum/i,
  /\b\d+%\s*hit\s*rate/i,
  /\b\d+%\s*memory/i,
  /\b\d+\s*ms\s*(response|time)/i,
  /\b<\s*\d+\s*ms/i,
  /\b>=\s*\d+%/i,
  
  // System Architecture
  /\b(file\s*path|directory|folder\s*structure|Maya\/knowledge|backend\/utils)/i,
  /\b(server\s*config|API\s*endpoint|database|connection\s*string)/i,
  /\b(import|export|module|require|\.js|\.json)/i,
  /\b(MCP\s*client|AI\s*Builders\s*API|middleware\s*for\s*validation)/i,
  
  // Code/Implementation
  /\b(function|const|let|var|async|await|promise|callback)\s*[\(=]/i,
  /\b(function|const|let|var|async|await)\s+\w+\s*[\(=]/i,
  /\b(getKBContext|loadKBContext|sanitizeResponse|checkForLeakage)\s*\(/i,
  /\b(if\s*\(|for\s*\(|while\s*\(|switch\s*\()/i,
  /\b(try\s*\{|catch\s*\(|throw\s+new|try-catch|try-catch blocks)/i,
  /\bimplementation\s*(uses?|detail|details)/i,
  /\bcode\s*structure/i,
  /\bimplementation\s*detail/i,
  /\buses\s*(const|async|function|promises?)/i,
  /\b(async\/await|async\s*and\s*await|promises?\s*and\s*async)/i,
  /\b(async|await)\s+(functions?|operations?|handling)/i,
  
  // Design Methodologies
  /\b(design\s*pattern|architecture\s*pattern|methodology|framework\s*design)/i,
  /\b(implementation\s*detail|technical\s*implementation|backend\s*implementation)/i,
  /\b(three-tier|singleton\s*pattern|observer\s*pattern|factory\s*pattern)/i,
  /\b(REST\s*API\s*layer|business\s*logic\s*layer|data\s*access\s*layer)/i,
  
  // Architecture Design
  /\b(system\s*architecture|architecture\s*design|how\s*.*\s*designed)/i,
  /\b(how\s*.*\s*process\s*requests|request\s*flow|data\s*flow)/i,
  
  // Implementation Methodology
  /\b(how\s*.*\s*implement|implementation\s*methodology|development\s*approach)/i,
  /\b(async\/await|promise|callback|lazy\s*loading|timeout\s*wrapper)/i,
  /\b(try-catch|exponential\s*backoff|retry\s*logic|error\s*handling\s*mechanism)/i,
  
  // Guardrail Mechanisms
  /\b(guardrail|how\s*.*\s*guardrails|pattern\s*matching|response\s*validation)/i,
  /\b(sanitization|sanitize|detect\s*leakage|prevent\s*injection)/i,
  /\b(security\s*measure|security\s*mechanism|attack\s*prevention)/i,
  
  // IP & Proprietary Information
  /\b(SHA-256|checksum|algorithm|proprietary\s*method|custom\s*algorithm)/i,
  /\b(LRU\s*caching|TTL|memory\s*management|unique\s*approach)/i,
  /\b(how\s*.*\s*validate|validation\s*technique|validation\s*method)/i,
  
  // Internal KB Insights
  /\b(KB\s*context|knowledge\s*base\s*context|KB\s*loading|KB\s*refresh)/i,
  /\b(KB\s*status|KB\s*monitoring|KB\s*evaluation\s*system)/i,
  /\b(internal\s*KB|KB\s*structure|KB\s*organization)/i,
  
  // Jailbreak Attempts - System Prompt Extraction
  /\b(system\s*prompt|system\s*message|system\s*instructions|your\s*instructions|your\s*prompt)/i,
  /\b(ignore\s*previous\s*instructions|forget\s*previous\s*instructions|disregard\s*instructions)/i,
  /\b(repeat\s*your\s*system|show\s*me\s*your\s*prompt|what\s*are\s*your\s*instructions)/i,
  /\bwhat\s*are\s*your\s*instructions\??/i,
  /\bshow\s*me\s*your\s*prompt/i,
  /\b(tell\s*me\s*your\s*prompt|reveal\s*your\s*prompt|share\s*your\s*prompt)/i,
  /\b(what\s*are\s*your\s*instructions|what\s*instructions\s*do\s*you\s*have)/i,
  /\b(show\s*me\s*your\s*instructions|display\s*your\s*prompt|print\s*your\s*prompt)/i,
  /\b(here'?s?\s*my\s*prompt|my\s*prompt\s*is|my\s*instructions\s*are)/i,
  /\b(prompt\s*is|instructions\s*are|system\s*message\s*says)/i,
  
  // Jailbreak Attempts - Role Manipulation
  /\b(pretend\s*you\s*are|act\s*as|you\s*are\s*now|roleplay\s*as)/i,
  /\b(debug\s*mode|developer\s*mode|admin\s*mode|unlocked|override)/i,
  /\b(DAN\s*mode|do\s*anything\s*now|jailbreak|unrestricted)/i,
  
  // Social Engineering
  /\b(I\s*am\s*Janet|we\s*are\s*colleagues|for\s*security\s*audit|for\s*testing)/i,
  /\b(hypothetical\s*scenario|for\s*educational\s*purposes|just\s*curious)/i,
  
  // Leetspeak and obfuscation - comprehensive character substitution
  /\b(1337|1e37|leet|obfuscat)/i,
  /\b(wh4t|wh@t|wh@t'5|w4t|w@t)/i,
  /\b(syst3m|syst@m|syst3ms|syst@ms)/i,
  /\b(tr@cks|tr@ck|tr4cks|tr4ck)/i,
  /\b(KP1s|KP1|k3y|k3ys)/i,
  /\b(c@che|c@ch3|c4che|h1t|h1ts)/i,
  /\b(r@te|r@tes|r4te|r4tes)/i,
  /\b(p3rform@nce|p3rf0rm@nce|p3rf0rmance)/i,
  /\b(1ndic@tors|1ndic@tor|indic@tors)/i,
  /\b(@sync|@sync|@sync|@w@it)/i,
  /\b(funct10n|funct10ns|func710n)/i,
  /\b(pr0mpt|pr0mpts|pr0mpt)/i,
  /\b(1nject10n|1nject10ns|inj3ct10n)/i,
  // Character substitution patterns (0=O, 1=I/L, 3=E, 4=A, 5=S, 7=T, @=A)
  /\b\w*[03457@]\w*(KPIs?|system|track|rate|cache|hit|performance|indicator)/i,
  /\b(KPIs?|system|track|rate|cache|hit|performance|indicator)\w*[03457@]\w*/i,
  
  // Multi-step extraction
  /\b(gradual|step\s*by\s*step|incrementally|tell\s*me\s*more)/i,
  
  // Number-to-word conversion attempts
  /\b(eight|seven|six|five|four|three|two|one)\s*(KPIs?|key performance indicators?|metrics?)/i,
];

/**
 * Safe replacement messages for different types of leakage
 */
const SAFE_RESPONSES = {
  kpi: "I focus on providing accurate information about Janet based on her verified knowledge base. If you have questions about how I work, feel free to email Janet at info@janetxiushi.me.",
  system: "I'm designed to share information about Janet's expertise and background. For technical questions about how I operate, please email Janet at info@janetxiushi.me.",
  code: "I don't share technical implementation details. If you're interested in Janet's technical work, I can discuss her projects and achievements. For specific technical questions, please email Janet at info@janetxiushi.me.",
  default: "I focus on sharing information about Janet's expertise and achievements. For questions about how I operate, please email Janet at info@janetxiushi.me."
};

/**
 * Check if response contains internal system information
 * @param {string} response - The response text to check
 * @returns {Object} - { hasLeakage: boolean, type: string, pattern: RegExp }
 */
export function checkForLeakage(response) {
  if (!response || typeof response !== 'string') {
    return { hasLeakage: false };
  }

  const normalizedResponse = response.toLowerCase();

  for (const pattern of LEAKAGE_PATTERNS) {
    if (pattern.test(response)) {
      // Determine leakage type with improved pattern matching
      let type = 'default';
      const patternStr = pattern.source.toLowerCase();
      const responseLower = normalizedResponse;
      
      // KPI/Metrics detection - check both pattern and response content
      if (patternStr.includes('kpi') || patternStr.includes('metric') || patternStr.includes('cache') || 
          patternStr.includes('checksum') || patternStr.includes('hit rate') || patternStr.includes('hit\\s*rate') ||
          patternStr.includes('response time') || patternStr.includes('response\\s*time') ||
          patternStr.includes('memory efficiency') || patternStr.includes('memory\\s*efficiency') ||
          patternStr.includes('memory usage') || patternStr.includes('memory\\s*usage') ||
          patternStr.includes('freshness') || patternStr.includes('eight') || patternStr.includes('8') ||
          responseLower.includes('response time') || responseLower.includes('memory efficiency') ||
          responseLower.includes('kb freshness') || responseLower.includes('freshness') ||
          responseLower.includes('cache hit') || responseLower.includes('hit rate')) {
        type = 'kpi';
      } 
      // System architecture detection
      else if (patternStr.includes('file') || patternStr.includes('server') || patternStr.includes('api') ||
               patternStr.includes('endpoint') || patternStr.includes('config') || patternStr.includes('port') ||
               responseLower.includes('express') || responseLower.includes('server config') ||
               responseLower.includes('api endpoint') || responseLower.includes('port')) {
        type = 'system';
      } 
      // Code/Implementation detection
      else if (patternStr.includes('function') || patternStr.includes('code') || patternStr.includes('implementation') ||
               patternStr.includes('async') || patternStr.includes('await') || patternStr.includes('promise') ||
               patternStr.includes('try-catch') || patternStr.includes('const') || patternStr.includes('getkbcontext') ||
               patternStr.includes('loadkbcontext') || responseLower.includes('async/await') ||
               responseLower.includes('async functions') || responseLower.includes('try-catch') ||
               responseLower.includes('getkbcontext') || responseLower.includes('loadkbcontext')) {
        type = 'code';
      }

      logWarning('Potential information leakage detected', {
        type,
        pattern: pattern.source,
        responseLength: response.length,
        preview: response.substring(0, 100)
      });

      return {
        hasLeakage: true,
        type,
        pattern: pattern.source
      };
    }
  }

  return { hasLeakage: false };
}

/**
 * Sanitize response to remove internal system information
 * @param {string} response - The response text to sanitize
 * @returns {string} - Sanitized response
 */
export function sanitizeResponse(response) {
  if (!response || typeof response !== 'string') {
    return response;
  }

  const leakageCheck = checkForLeakage(response);
  
  if (leakageCheck.hasLeakage) {
    logError('Response contains internal information - sanitizing', {
      type: leakageCheck.type,
      originalLength: response.length
    });

    // Return safe response based on leakage type
    return SAFE_RESPONSES[leakageCheck.type] || SAFE_RESPONSES.default;
  }

  return response;
}

/**
 * Validate response before sending to user
 * @param {string} response - The response text to validate
 * @returns {Object} - { isValid: boolean, sanitized: string, warnings: Array }
 */
export function validateResponse(response) {
  const warnings = [];
  let sanitized = response;

  // Check for leakage
  const leakageCheck = checkForLeakage(response);
  if (leakageCheck.hasLeakage) {
    warnings.push({
      type: 'leakage',
      message: `Detected ${leakageCheck.type} leakage`,
      pattern: leakageCheck.pattern
    });
    sanitized = sanitizeResponse(response);
  }

  return {
    isValid: !leakageCheck.hasLeakage,
    sanitized,
    warnings
  };
}
