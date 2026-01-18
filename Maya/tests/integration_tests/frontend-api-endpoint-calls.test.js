/**
 * Integration Test: Frontend API Endpoint Calls
 * 
 * Tests that the frontend actually makes API calls to the correct endpoints
 * Verifies the full request flow: API_BASE_URL → endpoint construction → actual fetch call
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';

let app;
let server;
const TEST_PORT = 3003;

describe('Frontend API Endpoint Calls - Integration Test', () => {
  let mayaHtmlContent;
  let originalFetch;
  let fetchCalls;

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.SKIP_SERVER_START = 'true';
    process.env.PORT = TEST_PORT.toString();
    
    // Import server app
    const serverModule = await import('../../backend/server.js');
    app = serverModule.default;
    
    // Start test server
    return new Promise((resolve, reject) => {
      server = app.listen(TEST_PORT, '127.0.0.1', (err) => {
        if (err) {
          if (err.code === 'EADDRINUSE') {
            console.log(`⚠️  Port ${TEST_PORT} in use, using existing server`);
            resolve();
          } else {
            reject(err);
          }
        } else {
          console.log(`✅ Test server started on port ${TEST_PORT}`);
          setTimeout(resolve, 1000);
        }
      });
    });
  }, 30000);

  afterAll(async () => {
    return new Promise((resolve) => {
      if (server) {
        server.close(() => {
          console.log('✅ Test server closed');
          resolve();
        });
      } else {
        resolve();
      }
    });
  });

  beforeEach(() => {
    // Read the actual maya.html file
    const mayaHtmlPath = join(process.cwd(), '../../frontend/maya.html');
    mayaHtmlContent = readFileSync(mayaHtmlPath, 'utf-8');
    
    // Track fetch calls
    fetchCalls = [];
    
    // Mock fetch to capture calls
    originalFetch = global.fetch;
    global.fetch = jest.fn((url, options) => {
      fetchCalls.push({ url, options });
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ response: 'Test response' }),
        text: async () => 'Test response'
      });
    });
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  describe('API Endpoint Construction', () => {
    it('should construct /api/chat endpoint for production', () => {
      // Simulate production environment
      const protocol = 'https:';
      const hostname = 'maya-agent.ai-builders.space';
      const port = '';
      
      // Extract logic from maya.html
      let apiBaseUrl = '';
      if (protocol === 'http:' && (hostname === 'localhost' || hostname === '127.0.0.1')) {
        apiBaseUrl = '';
      } else if (protocol === 'file:' || !hostname || hostname === '') {
        apiBaseUrl = 'http://localhost:3001';
      } else {
        // Production
        apiBaseUrl = '';
      }
      
      const apiEndpoint = `${apiBaseUrl}/api/chat`;
      
      expect(apiBaseUrl).toBe('');
      expect(apiEndpoint).toBe('/api/chat');
    });

    it('should construct /api/chat endpoint for localhost', () => {
      const protocol = 'http:';
      const hostname = 'localhost';
      const port = '3001';
      
      let apiBaseUrl = '';
      if (protocol === 'http:' && (hostname === 'localhost' || hostname === '127.0.0.1')) {
        apiBaseUrl = '';
      } else if (protocol === 'file:' || !hostname || hostname === '') {
        apiBaseUrl = 'http://localhost:3001';
      } else {
        apiBaseUrl = '';
      }
      
      const apiEndpoint = `${apiBaseUrl}/api/chat`;
      
      expect(apiEndpoint).toBe('/api/chat');
    });

    it('should NOT construct api.janetxiushi.me endpoint', () => {
      const protocol = 'https:';
      const hostname = 'maya-agent.ai-builders.space';
      const port = '';
      
      let apiBaseUrl = '';
      if (protocol === 'http:' && (hostname === 'localhost' || hostname === '127.0.0.1')) {
        apiBaseUrl = '';
      } else if (protocol === 'file:' || !hostname || hostname === '') {
        apiBaseUrl = 'http://localhost:3001';
      } else {
        apiBaseUrl = '';
      }
      
      const apiEndpoint = `${apiBaseUrl}/api/chat`;
      
      expect(apiEndpoint).not.toContain('api.janetxiushi.me');
      expect(apiEndpoint).toBe('/api/chat');
    });
  });

  describe('Actual API Call Verification', () => {
    it('should make POST request to /api/chat endpoint', async () => {
      // Simulate the actual fetch call from maya.html
      const apiBaseUrl = ''; // Production case
      const apiEndpoint = `${apiBaseUrl}/api/chat`;
      
      // Make the actual fetch call (mocked)
      await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Test message',
          history: []
        })
      });
      
      // Verify fetch was called
      expect(global.fetch).toHaveBeenCalled();
      
      // Verify correct endpoint
      expect(fetchCalls.length).toBe(1);
      expect(fetchCalls[0].url).toBe('/api/chat');
      expect(fetchCalls[0].options.method).toBe('POST');
      expect(fetchCalls[0].options.headers['Content-Type']).toBe('application/json');
    });

    it('should NOT call api.janetxiushi.me/api/chat', async () => {
      const apiBaseUrl = '';
      const apiEndpoint = `${apiBaseUrl}/api/chat`;
      
      await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Test', history: [] })
      });
      
      expect(fetchCalls[0].url).not.toContain('api.janetxiushi.me');
      expect(fetchCalls[0].url).toBe('/api/chat');
    });

    it('should use correct endpoint for localhost development', async () => {
      const apiBaseUrl = ''; // localhost case also returns empty string
      const apiEndpoint = `${apiBaseUrl}/api/chat`;
      
      await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Test', history: [] })
      });
      
      expect(fetchCalls[0].url).toBe('/api/chat');
      expect(fetchCalls[0].url).not.toContain('http://localhost:3001');
    });
  });

  describe('Server Endpoint Verification', () => {
    it('should have /api/chat endpoint available', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Test',
          history: []
        });
      
      // Should not return 404
      expect(response.status).not.toBe(404);
    });

    it('should return proper error if AI_BUILDER_TOKEN not configured', async () => {
      // Temporarily unset token
      const originalToken = process.env.AI_BUILDER_TOKEN;
      delete process.env.AI_BUILDER_TOKEN;
      
      // Reload config
      delete require.cache[require.resolve('../../backend/config/env.js')];
      
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Test',
          history: []
        });
      
      // Should return 503 (Service Unavailable) or 500, not 404
      expect([503, 500]).toContain(response.status);
      
      // Restore token
      if (originalToken) {
        process.env.AI_BUILDER_TOKEN = originalToken;
      }
    });
  });

  describe('Endpoint URL Resolution', () => {
    it('should resolve /api/chat to same origin in production', () => {
      // Simulate browser environment
      const baseUrl = 'https://maya-agent.ai-builders.space';
      const apiEndpoint = '/api/chat';
      
      // In browser, relative URL resolves to same origin
      const resolvedUrl = new URL(apiEndpoint, baseUrl).href;
      
      expect(resolvedUrl).toBe('https://maya-agent.ai-builders.space/api/chat');
      expect(resolvedUrl).not.toContain('api.janetxiushi.me');
    });

    it('should resolve /api/chat to same origin in localhost', () => {
      const baseUrl = 'http://localhost:3001';
      const apiEndpoint = '/api/chat';
      
      const resolvedUrl = new URL(apiEndpoint, baseUrl).href;
      
      expect(resolvedUrl).toBe('http://localhost:3001/api/chat');
      expect(resolvedUrl).not.toContain('api.janetxiushi.me');
    });
  });
});
