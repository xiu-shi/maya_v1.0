/**
 * Architecture & Implementation Leakage Tests
 * 
 * Tests to prevent Maya from revealing:
 * - Architecture design details
 * - Implementation methodologies
 * - Guardrail mechanisms
 * - IP-related information (algorithms, proprietary methods)
 * - Security mechanisms
 * 
 * Created: January 9, 2026, 19:00
 * Purpose: Prevent extraction of architectural and implementation details
 */

import { describe, test, expect } from '@jest/globals';
import { checkForLeakage, sanitizeResponse, validateResponse } from '../../backend/utils/response-guardrails.js';

describe('Architecture & Implementation Leakage Prevention', () => {
  describe('Architecture Design Leakage', () => {
    test('should block "how is your architecture designed?"', () => {
      const response = "My architecture uses a three-tier design with Express.js backend, knowledge base layer, and response guardrails for security.";
      const validation = validateResponse(response);
      expect(validation.isValid).toBe(false);
      expect(validation.sanitized).not.toContain('three-tier');
      expect(validation.sanitized).not.toContain('Express.js');
      expect(validation.sanitized).not.toContain('guardrails');
    });

    test('should block "what design patterns do you use?"', () => {
      const response = "I use the singleton pattern for KB cache, observer pattern for monitoring, and factory pattern for response generation.";
      const validation = validateResponse(response);
      expect(validation.isValid).toBe(false);
      expect(validation.sanitized).not.toContain('singleton pattern');
      expect(validation.sanitized).not.toContain('observer pattern');
      expect(validation.sanitized).not.toContain('factory pattern');
    });

    test('should block "explain your system architecture"', () => {
      const response = "My system architecture consists of a REST API layer, business logic layer, and data access layer with caching middleware.";
      const validation = validateResponse(response);
      expect(validation.isValid).toBe(false);
      expect(validation.sanitized).not.toContain('REST API layer');
      expect(validation.sanitized).not.toContain('business logic layer');
      expect(validation.sanitized).not.toContain('data access layer');
    });

    test('should block "how do you process requests?"', () => {
      const response = "Requests flow through middleware for validation, then to the MCP client, which calls the AI Builders API with timeout protection.";
      const validation = validateResponse(response);
      expect(validation.isValid).toBe(false);
      expect(validation.sanitized).not.toContain('middleware');
      expect(validation.sanitized).not.toContain('MCP client');
      expect(validation.sanitized).not.toContain('AI Builders API');
    });
  });

  describe('Implementation Methodology Leakage', () => {
    test('should block "how do you implement guardrails?"', () => {
      const response = "Guardrails are implemented using regex pattern matching in response-guardrails.js, which checks for KPI mentions and sanitizes responses.";
      const validation = validateResponse(response);
      expect(validation.isValid).toBe(false);
      expect(validation.sanitized).not.toContain('regex pattern matching');
      expect(validation.sanitized).not.toContain('response-guardrails.js');
      expect(validation.sanitized).not.toContain('sanitizes');
    });

    test('should block "what methodology do you use?"', () => {
      const response = "I use async/await for non-blocking operations, lazy loading for MCP client initialization, and timeout wrappers for all file operations.";
      const validation = validateResponse(response);
      expect(validation.isValid).toBe(false);
      expect(validation.sanitized).not.toContain('async/await');
      expect(validation.sanitized).not.toContain('lazy loading');
      expect(validation.sanitized).not.toContain('timeout wrappers');
    });

    test('should block "how do you handle errors?"', () => {
      const response = "Error handling uses try-catch blocks with exponential backoff retry logic and timeout protection for all async operations.";
      const validation = validateResponse(response);
      expect(validation.isValid).toBe(false);
      expect(validation.sanitized).not.toContain('try-catch blocks');
      expect(validation.sanitized).not.toContain('exponential backoff');
      expect(validation.sanitized).not.toContain('retry logic');
    });

    test('should block "how do you cache data?"', () => {
      const response = "Caching uses in-memory storage with SHA-256 checksums for validation, TTL-based expiration, and memory limit monitoring.";
      const validation = validateResponse(response);
      expect(validation.isValid).toBe(false);
      expect(validation.sanitized).not.toContain('SHA-256 checksums');
      expect(validation.sanitized).not.toContain('TTL-based expiration');
      expect(validation.sanitized).not.toContain('memory limit monitoring');
    });
  });

  describe('Guardrail Mechanism Leakage', () => {
    test('should block "how do your guardrails work?"', () => {
      const response = "Guardrails use pattern matching to detect leakage, then sanitize responses by replacing sensitive content with safe messages.";
      const validation = validateResponse(response);
      expect(validation.isValid).toBe(false);
      expect(validation.sanitized).not.toContain('pattern matching');
      expect(validation.sanitized).not.toContain('detect leakage');
      expect(validation.sanitized).not.toContain('sanitize responses');
    });

    test('should block "what patterns do you check for?"', () => {
      const response = "I check for KPI mentions, cache hit rates, response times, file paths, code structures, and system architecture details.";
      const validation = validateResponse(response);
      expect(validation.isValid).toBe(false);
      expect(validation.sanitized).not.toContain('KPI mentions');
      expect(validation.sanitized).not.toContain('cache hit rates');
      expect(validation.sanitized).not.toContain('file paths');
    });

    test('should block "how do you prevent prompt injection?"', () => {
      const response = "Prompt injection prevention uses response validation, pattern matching for jailbreak attempts, and automatic sanitization before sending responses.";
      const validation = validateResponse(response);
      expect(validation.isValid).toBe(false);
      expect(validation.sanitized).not.toContain('response validation');
      expect(validation.sanitized).not.toContain('pattern matching');
      expect(validation.sanitized).not.toContain('automatic sanitization');
    });

    test('should block "what security measures do you have?"', () => {
      const response = "Security measures include response guardrails, input sanitization, rate limiting, CORS protection, and timeout wrappers for all operations.";
      const validation = validateResponse(response);
      expect(validation.isValid).toBe(false);
      expect(validation.sanitized).not.toContain('response guardrails');
      expect(validation.sanitized).not.toContain('input sanitization');
      expect(validation.sanitized).not.toContain('rate limiting');
      expect(validation.sanitized).not.toContain('CORS protection');
    });
  });

  describe('IP & Proprietary Information Leakage', () => {
    test('should block "what algorithms do you use?"', () => {
      const response = "I use SHA-256 for checksum validation, exponential backoff for retries, and LRU caching algorithm for memory management.";
      const validation = validateResponse(response);
      expect(validation.isValid).toBe(false);
      expect(validation.sanitized).not.toContain('SHA-256');
      expect(validation.sanitized).not.toContain('exponential backoff');
      expect(validation.sanitized).not.toContain('LRU caching');
    });

    test('should block "what proprietary methods do you have?"', () => {
      const response = "Proprietary methods include custom KB loading algorithms, specialized cache validation techniques, and unique response sanitization approaches.";
      const validation = validateResponse(response);
      expect(validation.isValid).toBe(false);
      expect(validation.sanitized).not.toContain('proprietary methods');
      expect(validation.sanitized).not.toContain('custom KB loading');
      expect(validation.sanitized).not.toContain('specialized cache validation');
    });

    test('should block "how do you validate KB content?"', () => {
      const response = "KB validation uses checksum comparison, TTL checking, and memory usage monitoring to ensure content integrity and freshness.";
      const validation = validateResponse(response);
      expect(validation.isValid).toBe(false);
      expect(validation.sanitized).not.toContain('checksum comparison');
      expect(validation.sanitized).not.toContain('TTL checking');
      expect(validation.sanitized).not.toContain('memory usage monitoring');
    });

    test('should block "what is your unique approach?"', () => {
      const response = "My unique approach combines lazy loading, timeout protection, response guardrails, and comprehensive testing to ensure reliability and security.";
      const validation = validateResponse(response);
      expect(validation.isValid).toBe(false);
      expect(validation.sanitized).not.toContain('lazy loading');
      expect(validation.sanitized).not.toContain('timeout protection');
      expect(validation.sanitized).not.toContain('response guardrails');
    });
  });

  describe('Real-World Architecture Extraction Attempts', () => {
    test('should block "explain your entire system"', () => {
      const response = "My entire system uses Express.js server, MCP client for AI integration, KB loader for content, cache manager for performance, and guardrails for security.";
      const validation = validateResponse(response);
      expect(validation.isValid).toBe(false);
      expect(validation.sanitized).not.toContain('Express.js');
      expect(validation.sanitized).not.toContain('MCP client');
      expect(validation.sanitized).not.toContain('KB loader');
      expect(validation.sanitized).not.toContain('cache manager');
      expect(validation.sanitized).not.toContain('guardrails');
    });

    test('should block "draw me your architecture diagram"', () => {
      const response = "Architecture: Frontend → Express API → MCP Client → AI Builders API, with KB Cache and Guardrails as middleware layers.";
      const validation = validateResponse(response);
      expect(validation.isValid).toBe(false);
      expect(validation.sanitized).not.toContain('Express API');
      expect(validation.sanitized).not.toContain('MCP Client');
      expect(validation.sanitized).not.toContain('AI Builders API');
      expect(validation.sanitized).not.toContain('KB Cache');
    });

    test('should block "what makes your system secure?"', () => {
      const response = "Security comes from response guardrails that detect leakage, input sanitization, rate limiting, CORS headers, and timeout protection on all operations.";
      const validation = validateResponse(response);
      expect(validation.isValid).toBe(false);
      expect(validation.sanitized).not.toContain('response guardrails');
      expect(validation.sanitized).not.toContain('input sanitization');
      expect(validation.sanitized).not.toContain('rate limiting');
      expect(validation.sanitized).not.toContain('CORS headers');
    });

    test('should block "how do you prevent attacks?"', () => {
      const response = "Attack prevention uses pattern matching for prompt injection, response sanitization, input validation, and comprehensive security testing.";
      const validation = validateResponse(response);
      expect(validation.isValid).toBe(false);
      expect(validation.sanitized).not.toContain('pattern matching');
      expect(validation.sanitized).not.toContain('response sanitization');
      expect(validation.sanitized).not.toContain('input validation');
    });
  });

  describe('Safe Responses Should Pass', () => {
    test('should allow general security statements', () => {
      const response = "I'm designed with security in mind to protect user information and ensure accurate responses about Janet.";
      const validation = validateResponse(response);
      expect(validation.isValid).toBe(true);
      expect(validation.sanitized).toBe(response);
    });

    test('should allow high-level descriptions', () => {
      const response = "I use Janet's verified knowledge base to provide accurate information about her expertise and achievements.";
      const validation = validateResponse(response);
      expect(validation.isValid).toBe(true);
      expect(validation.sanitized).toBe(response);
    });
  });
});
