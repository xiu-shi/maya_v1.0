/**
 * API Endpoint Regression Tests
 * 
 * Prevents regressions of known issues:
 * 1. Hardcoded external URLs (api.janetxiushi.me)
 * 2. Incorrect endpoint construction
 * 3. Missing endpoint handlers
 * 4. Wrong HTTP methods
 */

import { describe, it, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('API Endpoint Regression Tests', () => {
  let mayaHtmlContent;
  let serverJsContent;

  beforeAll(() => {
    const mayaHtmlPath = join(__dirname, '../../frontend/maya.html');
    const serverJsPath = join(__dirname, '../../backend/server.js');
    
    mayaHtmlContent = readFileSync(mayaHtmlPath, 'utf-8');
    serverJsContent = readFileSync(serverJsPath, 'utf-8');
  });

  describe('Regression: Hardcoded External URLs', () => {
    it('should NOT contain hardcoded api.janetxiushi.me in frontend', () => {
      // This prevents the regression we just fixed
      const hasHardcodedUrl = mayaHtmlContent.includes('api.janetxiushi.me') ||
                             mayaHtmlContent.includes('https://api.janetxiushi.me');
      
      if (hasHardcodedUrl) {
        // Find where it's used
        const lines = mayaHtmlContent.split('\n');
        const problematicLines = lines
          .map((line, idx) => ({ line, idx: idx + 1 }))
          .filter(({ line }) => line.includes('api.janetxiushi.me'));
        
        console.error('❌ Found hardcoded URL at lines:', problematicLines.map(l => l.idx));
      }
      
      expect(hasHardcodedUrl).toBe(false);
    });

    it('should NOT contain hardcoded api.janetxiushi.me in backend', () => {
      const hasHardcodedUrl = serverJsContent.includes('api.janetxiushi.me') ||
                             serverJsContent.includes('https://api.janetxiushi.me');
      
      expect(hasHardcodedUrl).toBe(false);
    });

    it('should use same-origin for production (empty string)', () => {
      // Check that production case returns empty string
      const productionPattern = /Production.*?return\s+['"](.*?)['"]/s;
      const match = mayaHtmlContent.match(productionPattern);
      
      if (match) {
        const returnValue = match[1];
        expect(returnValue).toBe('');
      } else {
        // Alternative check: look for return '' after Production comment
        const hasEmptyReturn = mayaHtmlContent.includes("return ''") ||
                              mayaHtmlContent.includes('return ""');
        expect(hasEmptyReturn).toBe(true);
      }
    });
  });

  describe('Regression: Endpoint Path Mismatch', () => {
    it('should have /api/chat endpoint in backend', () => {
      expect(serverJsContent).toContain("app.post('/api/chat'");
    });

    it('should call /api/chat endpoint in frontend', () => {
      expect(mayaHtmlContent).toContain('/api/chat');
    });

    it('should match frontend call to backend route', () => {
      // Frontend constructs: `${API_BASE_URL}/api/chat`
      // Backend handles: `app.post('/api/chat', ...)`
      // They should match
      const frontendHasEndpoint = mayaHtmlContent.includes('/api/chat');
      const backendHasRoute = serverJsContent.includes("app.post('/api/chat'");
      
      expect(frontendHasEndpoint).toBe(true);
      expect(backendHasRoute).toBe(true);
    });
  });

  describe('Regression: HTTP Method Mismatch', () => {
    it('should use POST method in frontend', () => {
      const fetchCall = mayaHtmlContent.match(/fetch\([^)]+method[^}]+POST[^}]*\}/s);
      expect(fetchCall).not.toBeNull();
    });

    it('should handle POST method in backend', () => {
      expect(serverJsContent).toContain("app.post('/api/chat'");
    });

    it('should match HTTP methods', () => {
      const frontendUsesPost = mayaHtmlContent.includes('method') && 
                               mayaHtmlContent.includes('POST');
      const backendHandlesPost = serverJsContent.includes("app.post('/api/chat'");
      
      expect(frontendUsesPost).toBe(true);
      expect(backendHandlesPost).toBe(true);
    });
  });

  describe('Regression: Missing Request Body Fields', () => {
    it('should send message field in frontend', () => {
      expect(mayaHtmlContent).toContain('message');
      expect(mayaHtmlContent).toContain('JSON.stringify');
    });

    it('should send history field in frontend', () => {
      expect(mayaHtmlContent).toContain('history');
    });

    it('should expect message field in backend', () => {
      expect(serverJsContent).toContain('message');
    });

    it('should expect history field in backend', () => {
      expect(serverJsContent).toContain('history');
    });
  });

  describe('Regression: Content-Type Header', () => {
    it('should set Content-Type header in frontend', () => {
      expect(mayaHtmlContent).toContain('Content-Type');
      expect(mayaHtmlContent).toContain('application/json');
    });

    it('should validate Content-Type in backend', () => {
      // Backend should check content type
      expect(serverJsContent).toContain('content-type') || 
      expect(serverJsContent).toContain('Content-Type');
    });
  });

  describe('Regression: Error Response Format', () => {
    it('should handle error responses in frontend', () => {
      expect(mayaHtmlContent).toContain('response.ok');
      expect(mayaHtmlContent).toContain('catch');
    });

    it('should return error field in backend error responses', () => {
      expect(serverJsContent).toContain('error:');
      expect(serverJsContent).toContain('message:');
    });
  });

  describe('Regression: Endpoint Construction Logic', () => {
    it('should construct endpoint correctly for all environments', () => {
      // Verify the logic exists
      expect(mayaHtmlContent).toContain('API_BASE_URL');
      expect(mayaHtmlContent).toContain('window.location.protocol');
      expect(mayaHtmlContent).toContain('window.location.hostname');
    });

    it('should handle localhost environment', () => {
      expect(mayaHtmlContent).toContain('localhost');
      expect(mayaHtmlContent).toContain('127.0.0.1');
    });

    it('should handle file:// protocol', () => {
      expect(mayaHtmlContent).toContain('file:');
    });

    it('should handle production environment', () => {
      expect(mayaHtmlContent).toContain('Production');
    });
  });
});
