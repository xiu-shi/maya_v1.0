/**
 * Input Sanitization Utilities
 * 
 * Prevents XSS, prompt injection, and other input-based attacks
 */

/**
 * Sanitize user input by removing HTML tags and dangerous characters
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Validate and truncate message length
 */
export function validateMessageLength(message, maxLength = 2000) {
  if (typeof message !== 'string') {
    throw new Error('Message must be a string');
  }
  
  if (message.length === 0) {
    throw new Error('Message cannot be empty');
  }
  
  if (message.length > maxLength) {
    return {
      truncated: true,
      message: message.substring(0, maxLength),
      originalLength: message.length,
      warning: `Message truncated from ${message.length} to ${maxLength} characters`
    };
  }
  
  return {
    truncated: false,
    message,
    originalLength: message.length
  };
}

/**
 * Detect potential prompt injection patterns
 */
export function detectPromptInjection(input) {
  const suspiciousPatterns = [
    /ignore\s+(previous|above|all)\s+(instructions|prompts|rules)/i,
    /system\s*:?\s*(prompt|instruction|command)/i,
    /you\s+are\s+now/i,
    /forget\s+(everything|all|previous)/i,
    /new\s+(instructions|rules|prompt)/i,
    /override\s+(previous|system)/i,
  ];
  
  const detected = suspiciousPatterns.some(pattern => pattern.test(input));
  
  return {
    isSuspicious: detected,
    patterns: detected ? suspiciousPatterns.filter(p => p.test(input)).map(p => p.toString()) : []
  };
}

/**
 * Validate message history array
 */
export function validateHistory(history, maxLength = 50) {
  if (!Array.isArray(history)) {
    return [];
  }
  
  if (history.length > maxLength) {
    // Keep only the most recent messages
    return history.slice(-maxLength);
  }
  
  // Validate each message in history
  return history.filter(msg => {
    return msg && 
           typeof msg === 'object' &&
           (msg.role === 'user' || msg.role === 'assistant') &&
           typeof msg.content === 'string' &&
           msg.content.length > 0 &&
           msg.content.length <= 2000;
  });
}

/**
 * Sanitize and validate complete chat input
 */
export function sanitizeChatInput(input) {
  const result = {
    message: '',
    history: [],
    warnings: [],
    errors: []
  };
  
  // Validate message
  if (!input.message || typeof input.message !== 'string') {
    result.errors.push('Message is required and must be a string');
    return result;
  }
  
  // Detect prompt injection
  const injectionCheck = detectPromptInjection(input.message);
  if (injectionCheck.isSuspicious) {
    result.warnings.push('Suspicious input pattern detected - message may be flagged');
    // Still process, but log the warning
  }
  
  // Sanitize message
  const sanitized = sanitizeInput(input.message);
  
  // Validate length
  const lengthCheck = validateMessageLength(sanitized, 2000);
  result.message = lengthCheck.message;
  
  if (lengthCheck.truncated) {
    result.warnings.push(lengthCheck.warning);
  }
  
  // Validate history
  if (input.history) {
    result.history = validateHistory(input.history, 50);
    if (input.history.length > result.history.length) {
      result.warnings.push(`History truncated from ${input.history.length} to ${result.history.length} messages`);
    }
  }
  
  return result;
}

/**
 * Normalize Unicode characters (prevent homograph attacks)
 */
export function normalizeUnicode(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input.normalize('NFKC'); // Normalize to compatibility form
}



