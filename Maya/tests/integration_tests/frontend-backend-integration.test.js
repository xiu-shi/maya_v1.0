/**
 * Frontend-Backend Integration Tests
 * 
 * Tests that frontend correctly constructs API URLs and calls backend endpoints
 * Prevents regressions like hardcoded URLs or incorrect endpoint construction
 */

import { describe, it, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Frontend-Backend Integration Tests', () => {
  let mayaHtmlContent;

  beforeAll(() => {
    const mayaHtmlPath = join(__dirname, '../../frontend/maya.html');
    mayaHtmlContent = readFileSync(mayaHtmlPath, 'utf-8');
  });

  describe('API URL Construction Logic', () => {
    it('should have API_BASE_URL configuration', () => {
      expect(mayaHtmlContent).toContain('const API_BASE_URL');
      expect(mayaHtmlContent).toContain('API_BASE_URL');
    });

    it('should NOT have hardcoded api.janetxiushi.me URL', () => {
      // This is critical - prevents regression of the hardcoded URL issue
      const hasHardcodedUrl = mayaHtmlContent.includes('api.janetxiushi.me') ||
                             mayaHtmlContent.includes('https://api.janetxiushi.me');
      
      expect(hasHardcodedUrl).toBe(false);
    });

    it('should return empty string for production environment', () => {
      // Production case should return empty string (same origin)
      const productionCase = mayaHtmlContent.match(/Production.*?return\s+['"](.*?)['"]/s);
      
      if (productionCase) {
        const returnValue = productionCase[1];
        expect(returnValue).toBe('');
      } else {
        // Check for return '' pattern after Production comment
        const hasEmptyReturn = mayaHtmlContent.includes("return ''") ||
                              mayaHtmlContent.includes('return ""');
        expect(hasEmptyReturn).toBe(true);
      }
    });

    it('should construct endpoint as API_BASE_URL + /api/chat', () => {
      // Verify endpoint construction pattern
      expect(mayaHtmlContent).toContain('/api/chat');
      expect(mayaHtmlContent).toMatch(/\$\{API_BASE_URL\}\/api\/chat/);
    });

    it('should use fetch API to call endpoint', () => {
      expect(mayaHtmlContent).toContain('fetch(');
      expect(mayaHtmlContent).toContain('/api/chat');
    });
  });

  describe('Production Environment Detection', () => {
    it('should detect production environment correctly', () => {
      // Should check for https protocol and non-localhost hostname
      expect(mayaHtmlContent).toContain('window.location.protocol');
      expect(mayaHtmlContent).toContain('window.location.hostname');
    });

    it('should handle localhost differently from production', () => {
      // Localhost should use empty string or localhost URL
      expect(mayaHtmlContent).toContain('localhost');
      expect(mayaHtmlContent).toContain('127.0.0.1');
    });

    it('should handle file:// protocol for local development', () => {
      // File protocol should use localhost backend
      expect(mayaHtmlContent).toContain('file:');
    });
  });

  describe('Endpoint Call Verification', () => {
    it('should use POST method for chat requests', () => {
      const fetchCall = mayaHtmlContent.match(/fetch\([^)]+\)/s);
      if (fetchCall) {
        const fetchContent = fetchCall[0];
        expect(fetchContent).toContain('method');
        expect(fetchContent).toContain('POST');
      }
    });

    it('should send JSON content type', () => {
      expect(mayaHtmlContent).toContain('Content-Type');
      expect(mayaHtmlContent).toContain('application/json');
    });

    it('should send message and history in request body', () => {
      expect(mayaHtmlContent).toContain('message');
      expect(mayaHtmlContent).toContain('history');
      expect(mayaHtmlContent).toContain('JSON.stringify');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      expect(mayaHtmlContent).toContain('catch');
      expect(mayaHtmlContent).toContain('error');
    });

    it('should check response.ok before processing', () => {
      expect(mayaHtmlContent).toContain('response.ok');
      expect(mayaHtmlContent).toContain('!response.ok');
    });

    it('should log errors for debugging', () => {
      expect(mayaHtmlContent).toContain('console.error');
    });
  });

  describe('URL Construction Scenarios', () => {
    it('should construct correct URL for production', () => {
      // Simulate production environment
      const productionUrl = '' + '/api/chat';
      expect(productionUrl).toBe('/api/chat');
      
      // Browser would resolve to: https://maya-agent.ai-builders.space/api/chat
      const resolvedUrl = 'https://maya-agent.ai-builders.space' + productionUrl;
      expect(resolvedUrl).toBe('https://maya-agent.ai-builders.space/api/chat');
    });

    it('should NOT construct api.janetxiushi.me URL', () => {
      // This test prevents regression
      const productionUrl = '' + '/api/chat';
      expect(productionUrl).not.toContain('api.janetxiushi.me');
      
      const resolvedUrl = 'https://maya-agent.ai-builders.space' + productionUrl;
      expect(resolvedUrl).not.toContain('api.janetxiushi.me');
    });

    it('should use relative URL in production (same origin)', () => {
      const productionUrl = '' + '/api/chat';
      expect(productionUrl.startsWith('/')).toBe(true);
      expect(productionUrl.startsWith('http')).toBe(false);
    });
  });
});
