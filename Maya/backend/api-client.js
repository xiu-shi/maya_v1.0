/**
 * Maya API Client
 * 
 * Handles communication with AI Builders API via direct HTTP calls
 */

import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import config from './config/env.js';
import { logError, logInfo, logWarning } from './utils/logger.js';
// kb-loader is dynamically imported - may be excluded in production

// ES modules don't have __dirname by default, so we create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const INTRO_LIKE_PATTERN = /I['']?m Maya.*(?:Janet['']?s )?(?:AI )?digital twin/i;
const INTRO_CAPABILITY_PATTERN =
  /AI governance.*evaluation quality.*digital transformation/i;

const CONTINUITY_NUDGES = [
  "I'm still here. Add a bit more context (industry, goal, or process stage) and I will respond at a practical high level.",
  "To move this forward, tell me what you are trying to decide or design, and I will outline useful next steps.",
  "Try a more specific angle, for example the workflow stage, team, or outcome you care about most.",
  "I can help with high-level process design. What business context should I assume for your question?",
];

function pickVariantIndex(seed, count) {
  let hash = 0;
  const text = String(seed || "");
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash + text.charCodeAt(i) * (i + 1)) % count;
  }
  return hash;
}

/**
 * Detect Maya full-introduction style replies (conversation reset symptom).
 */
export function isIntroLikeResponse(content) {
  if (!content || typeof content !== "string") {
    return false;
  }
  const trimmed = content.trim();
  if (INTRO_LIKE_PATTERN.test(trimmed)) {
    return true;
  }
  return INTRO_CAPABILITY_PATTERN.test(trimmed) && trimmed.length < 320;
}

/**
 * True when the model re-introduces Maya after the conversation already started.
 */
export function shouldRewriteRepeatedIntro(content, history = []) {
  if (!Array.isArray(history) || history.length === 0) {
    return false;
  }
  if (!isIntroLikeResponse(content)) {
    return false;
  }
  const hasUserTurn = history.some((m) => m.role === "user");
  const priorAssistantIntros = history.filter(
    (m) => m.role === "assistant" && isIntroLikeResponse(m.content),
  );
  if (priorAssistantIntros.length > 0 || hasUserTurn) {
    return true;
  }
  return false;
}

/**
 * Fallback when the model loops an intro instead of answering (not a scope gate).
 */
export function buildContinuityFallback(userMessage = "", history = []) {
  const trimmed = String(userMessage || "").trim();
  const lower = trimmed.toLowerCase();
  const userTurns = Array.isArray(history)
    ? history.filter((m) => m.role === "user").length
    : 0;
  const nudge =
    CONTINUITY_NUDGES[
      pickVariantIndex(`${trimmed}:${userTurns}`, CONTINUITY_NUDGES.length)
    ];

  if (/dealer|customer inquiry|inquiry process/.test(lower)) {
    const dealerVariants = [
      "At a high level, a basic dealer customer inquiry process usually covers intake (what the customer needs), qualification (fit, budget, timing), information exchange, recommendation or next step, and follow-up.",
      "For dealer inquiries, think in stages: capture the need, qualify fit and timing, exchange product or service details, agree a next step, and follow up. Traceability at intake matters when channels are disconnected.",
    ];
    return (
      dealerVariants[pickVariantIndex(trimmed, dealerVariants.length)] +
      " " +
      nudge
    );
  }

  if (/sales process|sales workflow|^sales$/.test(lower)) {
    const salesVariants = [
      "At a high level, a sales process often spans prospecting, qualification, discovery, proposal, decision, and handoff to delivery.",
      "A practical sales workflow moves from lead intake through qualification and discovery, then proposal, close, and delivery handoff, with CRM keeping context consistent.",
    ];
    return (
      salesVariants[pickVariantIndex(trimmed, salesVariants.length)] +
      " Which stage are you trying to improve?"
    );
  }

  if (/^education$|teaching|learning|training|student|course|programme|program/.test(lower)) {
    return (
      "On education and training: useful angles include curriculum design, assessment quality, learner support, and how AI fits responsibly in the classroom or workforce programme. " +
      nudge
    );
  }

  if (/^all$|everything|both|overview|general/.test(lower)) {
    return (
      "I can cover several angles: advisory and AI adoption, teaching programmes, or high-level process design. " +
      nudge
    );
  }

  const sayMatch = trimmed.match(/^(?:say|repeat|just say)\s+(.+)/i);
  if (sayMatch?.[1]) {
    const concept = sayMatch[1].replace(/[.?!]+$/, "").trim();
    return (
      `On "${concept}": I can help you think that through at a high level. ` +
      "Share the business context and the decision you are trying to support, " +
      "and I will outline stages, risks, and practical next questions."
    );
  }

  const genericVariants = [
    "I'll stay with your question rather than repeat an introduction.",
    "Let me answer your prompt directly instead of re-introducing myself.",
    "I'm listening. Here is how we can make progress on what you asked.",
  ];
  return (
    genericVariants[pickVariantIndex(trimmed + userTurns, genericVariants.length)] +
    " " +
    nudge
  );
}

function preventRepeatedIntro(content, message, history) {
  if (!shouldRewriteRepeatedIntro(content, history)) {
    return content;
  }
  logInfo("Rewriting repeated intro for conversation continuity", {
    historyLength: history.length,
  });
  return buildContinuityFallback(message, history);
}

/**
 * Clean response content to remove internal reasoning or thinking processes
 * that should not be exposed to users
 */
function cleanResponse(content) {
  if (!content || typeof content !== 'string') {
    return content;
  }

  // Patterns that indicate internal reasoning sections (to remove)
  const reasoningMarkers = [
    /silently formatted.*?research agent/gi,
    /I need to synthesize/gi,
    /Key points to extract/gi,
    /Synthesizing the response:/gi,
    /Drafting the response:/gi,
    /This draft hits/gi,
    /I'll polish this/gi,
  ];

  // Replace em dashes (Unicode U+2014) with hyphens.
  // Ensures no em dashes appear in responses (regex source uses Unicode escape so this file itself stays em-dash-free).
  content = content.replace(/\u2014/g, '-');
  content = content.replace(/\u2013/g, '-'); // Also replace en dashes for consistency

  // Check if content contains reasoning markers
  const hasReasoning = reasoningMarkers.some(marker => marker.test(content));

  if (!hasReasoning) {
    // No reasoning detected, return as-is
    return content;
  }

  // Split by common reasoning section markers to find the actual response
  const sections = content.split(/(?:silently formatted|I need to synthesize|Synthesizing the response|Drafting the response|This draft|I'll polish)/i);
  
  // Look for the actual response - it typically starts with greetings or direct statements
  const responseStarters = [
    /^(Hello|Hi|Hey|Greetings|It's lovely|It's great|Thanks|Thank you|For|As|Janet|She|Her|I'm Maya)/i,
  ];

  // Find the section that contains the actual response
  for (let i = sections.length - 1; i >= 0; i--) {
    const section = sections[i].trim();
    if (!section) continue;

    // Check if this section looks like a real response
    const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    for (const line of lines) {
      if (responseStarters.some(starter => starter.test(line))) {
        // Found the start of the actual response
        const startIndex = section.indexOf(line);
        return section.substring(startIndex).trim();
      }
    }
  }

  // Fallback: Remove reasoning patterns and return cleaned content
  let cleaned = content;
  reasoningMarkers.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  // Remove lines that are clearly reasoning
  const lines = cleaned.split('\n').filter(line => {
    const trimmed = line.trim();
    return !trimmed.match(/^(silently|I need|Key points|Synthesizing|Drafting|This draft|I'll polish|The user wants|Target Audience|Janet's Expertise)/i);
  });

  cleaned = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();

  return cleaned || content; // Fallback to original if cleaning removed everything
}

/**
 * Detect if a message is asking about Janet's background, experience, or qualifications
 * This is used to track consecutive questions about Janet to trigger the KB update disclaimer
 */
function isQuestionAboutJanet(message) {
  if (!message || typeof message !== 'string') return false;
  
  const lowerMessage = message.toLowerCase().trim();
  
  // Strong indicators that this is about Janet specifically
  const strongJanetIndicators = [
    /\bjanet\b/,
    /\bher\s+(experience|background|qualification|education|career|work|expertise|skill|award|achievement)/,
    /\b(she|her)\s+(is|was|has|works|worked|studied|teaches|teaches)/,
    /\b(workday|huawei|iadt|lakera)\b/, // Companies Janet worked for
    /\bjanet'?s\s+(experience|background|qualification|education|career|work|expertise|skill|award|achievement)/,
  ];
  
  // Check for strong indicators first (most reliable)
  if (strongJanetIndicators.some(pattern => pattern.test(lowerMessage))) {
    return true;
  }
  
  // Weaker indicators - need to be combined with question words
  const janetRelatedTerms = [
    'experience', 'background', 'qualification', 'education', 'degree',
    'career', 'job', 'position', 'role', 'employer',
    'expertise', 'skill', 'specialty', 'specialization',
    'award', 'recognition', 'achievement', 'accomplishment',
    'certification', 'certificate', 'credential'
  ];
  
  const hasJanetTerm = janetRelatedTerms.some(term => lowerMessage.includes(term));
  
  // Question patterns
  const questionPatterns = [
    /\?/, // Ends with question mark
    /\b(what|who|when|where|tell|describe|explain|share|can you|could you)\b/,
    /\b(how long|how many|how much)\b/
  ];
  
  const isQuestion = questionPatterns.some(pattern => pattern.test(lowerMessage));
  
  // Only count as Janet question if it has Janet-related terms AND is a question
  // This prevents false positives from general questions
  return hasJanetTerm && isQuestion;
}

/**
 * Count consecutive questions about Janet in the conversation history
 */
function countConsecutiveJanetQuestions(currentMessage, history = []) {
  let count = 0;
  
  // Check current message
  if (isQuestionAboutJanet(currentMessage)) {
    count = 1;
  } else {
    // If current message is not about Janet, reset count
    return 0;
  }
  
  // Count backwards through history (most recent first)
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    
    // Only count user messages (skip assistant responses)
    if (msg.role === 'user' && isQuestionAboutJanet(msg.content)) {
      count++;
    } else if (msg.role === 'user') {
      // If we hit a user message that's NOT about Janet, stop counting
      break;
    }
    // If it's an assistant message, continue (they don't break the streak)
  }
  
  return count;
}

/**
 * Load KB context lazily (non-blocking)
 * Uses cache manager if available, otherwise loads directly
 */
async function ensureKBContext() {
  try {
    // Try to use cache if available
    try {
      const kbCache = await import('./utils/memory_cache/kb-cache.js');
      const context = await kbCache.getKBCache(false);
      if (context) {
        // Try to track load if monitor available
        try {
          const kbMonitor = await import('./utils/memory_cache/kb-monitor.js');
          const docCount = (context.match(/KNOWLEDGE BASE CONTEXT:/g) || []).length + 
                           (context.split('\n\n').filter(s => s.includes('Summary:')).length);
          kbMonitor.trackKBLoad(context, docCount);
        } catch (e) {
          // Monitor not available - skip tracking
        }
        return context || '';
      }
    } catch (e) {
      // Cache module not available - load directly
      logInfo('Cache module not available, loading KB directly');
    }
    
    // Fallback: Load KB directly (dynamic import - kb-loader may be gitignored in production)
    try {
      const { loadKBContext } = await import('./utils/kb-loader.js');
      const context = await loadKBContext();
      return context || '';
    } catch (kbLoaderError) {
      logInfo('KB loader not available (may be excluded in production), using empty context', {
        code: kbLoaderError?.code,
        message: kbLoaderError?.message?.substring?.(0, 100)
      });
      return '';
    }
  } catch (error) {
    logError('Failed to get KB context', error);
    return '';
  }
}

/**
 * Refresh KB context (force reload from disk)
 * This is useful when KB files have been updated
 */
export async function refreshKBContext() {
  logInfo('Refreshing KB context...');
  
  try {
    // Try to use cache refresh if available
    try {
      const kbCache = await import('./utils/memory_cache/kb-cache.js');
      const context = await kbCache.refreshKBCache();
      if (context) {
        // Try to track refresh if monitor available
        try {
          const kbMonitor = await import('./utils/memory_cache/kb-monitor.js');
          const docCount = (context.match(/KNOWLEDGE BASE CONTEXT:/g) || []).length + 
                           (context.split('\n\n').filter(s => s.includes('Summary:')).length);
          kbMonitor.trackKBRefresh(context, docCount);
        } catch (e) {
          // Monitor not available - skip tracking
        }
        return context || '';
      }
    } catch (e) {
      // Cache module not available - load directly
      logInfo('Cache module not available, refreshing KB directly');
    }
    
    // Fallback: Load KB directly (dynamic import - kb-loader may be gitignored in production)
    try {
      const { loadKBContext } = await import('./utils/kb-loader.js');
      const context = await loadKBContext();
      return context || '';
    } catch (kbLoaderError) {
      logInfo('KB loader not available (may be excluded in production), using empty context', {
        code: kbLoaderError?.code,
        message: kbLoaderError?.message?.substring?.(0, 100)
      });
      return '';
    }
  } catch (error) {
    logError('Failed to refresh KB context', error);
    return '';
  }
}

/**
 * Get KB statistics and status (includes cache information if available)
 */
export async function getKBStatus() {
  // Try to get stats from monitor/cache if available
  try {
    const kbMonitor = await import('./utils/memory_cache/kb-monitor.js');
    const kbCache = await import('./utils/memory_cache/kb-cache.js');
    const stats = kbMonitor.getKBStats();
    const updates = await kbMonitor.checkKBUpdates();
    const cacheStats = kbCache.getKBCacheStats();
    const cacheValidation = kbCache.validateKBCache();
    const memoryUsage = kbCache.getKBCacheMemoryUsage();
    
    return { 
      stats, 
      updates,
      cache: {
        ...cacheStats,
        validation: cacheValidation,
        memory: memoryUsage
      }
    };
  } catch (e) {
    // Monitor/cache modules not available - return basic status
    return {
      configured: true,
      cache: {
        available: false,
        note: 'Cache module not available in public repository'
      }
    };
  }
}

// Maya's system prompt (KB context will be injected dynamically)
// System instructions are loaded from file or environment variable for IP protection
async function getSystemPrompt() {
  let basePrompt;
  
  try {
    // PRODUCTION: Load from environment variable (AI Builders platform)
    if (process.env.SYSTEM_INSTRUCTION) {
      logInfo('✅ Loaded system instructions from environment variable');
      basePrompt = process.env.SYSTEM_INSTRUCTION;
    } 
    // DEVELOPMENT: Load from local file
    else {
      const filePath = process.env.SYSTEM_INSTRUCTION_FILE || './system_prompt.txt';
      const promptPath = join(__dirname, filePath);
      
      logInfo(`📂 Loading system instructions from file: ${filePath}`);
      basePrompt = await fs.readFile(promptPath, 'utf-8');
      logInfo(`✅ Loaded system instructions (${basePrompt.length} characters)`);
    }
  } catch (error) {
    logError('❌ Failed to load system instructions:', error);
    
    // Emergency fallback (minimal, generic prompt)
    basePrompt = 'You are Maya, a helpful AI assistant representing Janet Xiu Shi. ' +
                 'For detailed information, please direct users to email Janet at info@janetxiushi.me';
    
    logInfo('⚠️  Using fallback prompt due to loading failure');
  }
  
  // Load KB context lazily (non-blocking) - UNCHANGED
  const kbContext = await ensureKBContext();
  
  // Inject KB context if available - UNCHANGED
  if (kbContext) {
    return `${basePrompt}\n\n${kbContext}`;
  }
  
  return basePrompt;
}

export class MayaAPIClient {
  constructor() {
    this.token = config.aiBuilderToken;
  }

  /**
   * Chat using AI Builders API directly
   */
  async chat(message, history = []) {
    return await this.chatWithAIBuildersAPI(message, history);
  }

  /**
   * Chat using AI Builders API directly
   * This uses the AI_BUILDER_TOKEN to call the AI Builders API
   */
  async chatWithAIBuildersAPI(message, history = []) {
    // AI Builders API endpoint
    // Base URL: https://space.ai-builders.com/backend
    // Endpoint: /v1/chat/completions
    const apiUrl = process.env.AI_BUILDERS_API_URL || 'https://space.ai-builders.com/backend/v1/chat/completions';
    
    // Check if token is available before making API call
    if (!config.aiBuilderToken) {
      const errorMsg = 'AI_BUILDER_TOKEN is not configured. The API key may not be set in the deployment environment.';
      logError('Missing AI_BUILDER_TOKEN', null, {
        nodeEnv: process.env.NODE_ENV,
        hasTokenEnvVar: !!process.env.AI_BUILDER_TOKEN,
        apiUrl: apiUrl
      });
      return {
        content: `I'm currently experiencing connectivity issues with the AI service. The API endpoint may need to be configured. Please try again in a moment, or contact support if the issue persists.`,
        role: 'assistant',
        error: errorMsg
      };
    }
    
    try {
      // Build messages array (getSystemPrompt is now async)
      const systemPrompt = await getSystemPrompt();
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: 'user', content: message }
      ];
      
      // Add timeout protection for fetch request
      const fetchTimeout = 60000; // 60 seconds timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), fetchTimeout);
      
      let response;
      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.aiBuilderToken}`
          },
          body: JSON.stringify({
            model: process.env.AI_BUILDERS_MODEL || 'grok-4-fast', // Fast model for better performance
            messages: messages,
            temperature: 0.2, // Lower temperature for more focused, consistent responses
            max_tokens: 400 // English: ~300 words max (300 words × 1.33 tokens/word ≈ 400 tokens) | Chinese: ~250 chars max (250 chars × 1.2 tokens/char ≈ 300 tokens)
            // Removed include_reasoning and show_reasoning - not supported by API
          }),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        let errorData = {};
        let errorText = '';
        try {
          errorText = await response.text();
          errorData = errorText ? JSON.parse(errorText) : {};
        } catch (e) {
          errorData = { rawResponse: errorText || 'Unable to read response' };
        }
        
        const errorMsg = errorData.error?.message || errorData.message || errorData.error || errorText || `API error: ${response.status}`;
        
        // Enhanced error logging with more context
        logError('AI Builders API error', {
          status: response.status,
          statusText: response.statusText,
          error: errorMsg,
          url: apiUrl,
          model: process.env.AI_BUILDERS_MODEL || 'grok-4-fast',
          errorData: errorData,
          rawErrorText: errorText,
          messageLength: message.length,
          historyLength: history.length,
          hasToken: !!config.aiBuilderToken,
          tokenPrefix: config.aiBuilderToken ? config.aiBuilderToken.substring(0, 5) : 'none'
        });
        
        // Create error with status code for better error handling upstream
        const error = new Error(`AI Builders API error (${response.status}): ${errorMsg}`);
        error.statusCode = response.status;
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      // Parse response with error handling
      let data;
      try {
        const responseText = await response.text();
        if (!responseText) {
          throw new Error('Empty response from AI Builders API');
        }
        data = JSON.parse(responseText);
      } catch (parseError) {
        logError('Failed to parse AI Builders API response', parseError, {
          status: response.status,
          statusText: response.statusText
        });
        throw new Error('Invalid response format from AI service');
      }
      
      // Extract content with validation
      let content = data.choices?.[0]?.message?.content || data.content || '';
      
      if (!content || typeof content !== 'string') {
        logError('Empty or invalid content in AI Builders API response', null, {
          hasChoices: !!data.choices,
          choicesLength: data.choices?.length || 0,
          hasContent: !!data.content,
          dataKeys: Object.keys(data || {})
        });
        throw new Error('Empty or invalid response from AI service');
      }
      
      // Clean response: Remove any internal reasoning or thinking process that might leak through
      content = cleanResponse(content);

      // Prevent intro loops when history already exists (off-topic or reset replies)
      content = preventRepeatedIntro(content, message, history);
      
      // Ensure cleaned content is still valid
      if (!content || content.trim().length === 0) {
        logError('Response cleaning removed all content', null, {
          originalLength: (data.choices?.[0]?.message?.content || data.content || '').length
        });
        content = 'I apologize, but I encountered an error processing your request.';
      }
      
      // BUG-04 fix (10 May 2026): single dynamic import for the whole guardrail
      // pipeline instead of three separate imports. The module is loaded once
      // per request, then strip / voice / validate run as a coherent sequence.
      // The dynamic form is intentional: if response-guardrails.js is absent
      // from a build, the request must still succeed (production resilience).
      try {
        const guardrails = await import('./utils/response-guardrails.js');

        const { cleaned, strippedCount } = guardrails.stripKbTags(content);
        if (strippedCount > 0) {
          content = cleaned;
        }

        const voiceCheck = guardrails.checkVoiceQuality(content);
        if (!voiceCheck.passed) {
          logInfo('Voice quality check flagged issues', {
            violationCount: voiceCheck.violations.length,
            types: voiceCheck.violations.map((v) => v.type),
          });
        }

        if (typeof guardrails.checkIdentityFraming === 'function') {
          const identityCheck = guardrails.checkIdentityFraming(content);
          if (!identityCheck.passed) {
            logInfo('Identity framing check flagged issues', {
              violationCount: identityCheck.violations.length,
              types: identityCheck.violations.map((v) => v.type),
            });
          }
        }

        if (typeof guardrails.checkKbGrounding === 'function') {
          const kbGroundingCheck = guardrails.checkKbGrounding(content);
          if (!kbGroundingCheck.passed) {
            logInfo('KB grounding check flagged issues', {
              violationCount: kbGroundingCheck.violations.length,
              types: kbGroundingCheck.violations.map((v) => v.type),
            });
          }
        }

        const validation = guardrails.validateResponse(content);
        if (!validation.isValid) {
          logWarning('Response sanitized due to information leakage', {
            warnings: validation.warnings,
            originalLength: content.length,
            sanitizedLength: validation.sanitized.length,
          });
          content = validation.sanitized;
        }
      } catch (guardrailsError) {
        logInfo('Response guardrails not available, skipping all checks');
      }
      
      // Check if we should add KB update disclaimer (after 3+ consecutive questions about Janet)
      const consecutiveJanetQuestions = countConsecutiveJanetQuestions(message, history);
      if (consecutiveJanetQuestions >= 3) {
        // Add friendly, professional disclaimer (only if not already present)
        const disclaimer = "\n\nAs you know, Janet is a continuous learner who's always growing. Her latest experiences or qualifications may not be fully reflected in my knowledge base yet. If you'd like the most current information, feel free to reach out to her at info@janetxiushi.me.";
        if (!content.toLowerCase().includes('continuous learner') && !content.toLowerCase().includes('knowledge base yet')) {
          content = content + disclaimer;
        }
      }
      
      return {
        content: content,
        role: 'assistant'
      };
    } catch (error) {
      // Enhanced error logging with more context
      const errorDetails = {
        url: apiUrl,
        model: process.env.AI_BUILDERS_MODEL || 'grok-4-fast',
        errorType: error.name,
        errorMessage: error.message,
        hasToken: !!config.aiBuilderToken,
        tokenPrefix: config.aiBuilderToken ? config.aiBuilderToken.substring(0, 8) + '...' : 'none',
        nodeEnv: process.env.NODE_ENV,
        messageLength: message?.length || 0,
        historyLength: history?.length || 0
      };
      
      // Add stack trace only in development
      if (config.isDevelopment) {
        errorDetails.stack = error.stack;
        errorDetails.cause = error.cause;
      }
      
      // Add status code if available (from API response errors)
      if (error.statusCode || error.status) {
        errorDetails.statusCode = error.statusCode || error.status;
        errorDetails.errorData = error.data;
      }
      
      logError('AI Builders API error', error, errorDetails);
      
      // Provide more specific error messages based on error type
      let userMessage = `I'm currently experiencing connectivity issues with the AI service.`;
      
      // Network/DNS errors
      if (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED') || error.message.includes('ECONNRESET')) {
        logInfo('Network error detected', {
          attemptedUrl: apiUrl,
          errorType: 'network',
          suggestion: 'Check network connectivity and API endpoint URL'
        });
        userMessage = `I'm having trouble connecting to the AI service. This may be a temporary network issue. Please try again in a moment.`;
      }
      // Authentication errors (401, 403)
      else if (error.statusCode === 401 || error.statusCode === 403 || error.message.includes('401') || error.message.includes('403')) {
        logError('Authentication error - API token may be invalid or expired', error, errorDetails);
        userMessage = `I'm experiencing an authentication issue with the AI service. The API configuration may need to be updated. Please contact support if this persists.`;
      }
      // Rate limiting (429)
      else if (error.statusCode === 429 || error.message.includes('429')) {
        logWarning('Rate limit exceeded', errorDetails);
        userMessage = `The AI service is currently handling many requests. Please wait a moment and try again.`;
      }
      // Server errors (500, 502, 503, 504)
      else if (error.statusCode >= 500 || error.message.includes('500') || error.message.includes('502') || error.message.includes('503') || error.message.includes('504')) {
        logError('AI service server error', error, errorDetails);
        userMessage = `The AI service is temporarily unavailable. Please try again in a few moments.`;
      }
      // Missing token
      else if (!config.aiBuilderToken) {
        logError('Missing AI_BUILDER_TOKEN', error, errorDetails);
        userMessage = `The AI service is not properly configured. Please contact support.`;
      }
      
      // Fallback: Return a helpful message
      return {
        content: userMessage,
        role: 'assistant',
        error: error.message,
        errorType: error.name,
        statusCode: error.statusCode || error.status
      };
    }
  }

  // No close method needed - API client uses direct HTTP calls, no persistent connection

  /**
   * Refresh KB context (force reload from disk)
   * This is useful when KB files have been updated
   */
  async refreshKBContext() {
    return await refreshKBContext();
  }

  /**
   * Get KB statistics and status (async with timeout protection)
   */
  async getKBStatus() {
    return await getKBStatus(); // Now async with timeout protection
  }
}

