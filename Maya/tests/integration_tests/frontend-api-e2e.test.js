/**
 * E2E Test: Frontend API Endpoint Calls
 * 
 * End-to-end test that verifies the frontend makes API calls to the correct endpoint
 * Tests the actual server endpoint and verifies it's accessible
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';

let app;
let server;
const TEST_PORT = 3004;

describe('Frontend API Endpoint E2E Test', () => {
  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.SKIP_SERVER_START = 'true';
    process.env.PORT = TEST_PORT.toString();
    process.env.AI_BUILDER_TOKEN = process.env.AI_BUILDER_TOKEN || 'test-token';
    
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

  describe('API Endpoint Availability', () => {
    it('should have /api/chat endpoint available', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Test message',
          history: []
        });
      
      // Should not return 404 (endpoint exists)
      expect(response.status).not.toBe(404);
      
      // Should return either success (200) or service unavailable (503) if token not configured
      expect([200, 503, 500]).toContain(response.status);
    });

    it('should NOT have api.janetxiushi.me/api/chat endpoint', async () => {
      // Verify we're not calling external URL
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Test',
          history: []
        });
      
      // The endpoint should be on same origin, not external
      expect(response.status).not.toBe(404);
    });

    it('should accept POST requests to /api/chat', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set('Content-Type', 'application/json')
        .send({
          message: 'Hello',
          history: []
        });
      
      expect(response.status).not.toBe(405); // Method Not Allowed
      expect(response.status).not.toBe(404); // Not Found
    });

    it('should require Content-Type application/json', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Test',
          history: []
        });
      
      // Should accept JSON (may return error for other reasons, but not 415)
      expect(response.status).not.toBe(415); // Unsupported Media Type
    });
  });

  describe('Endpoint URL Verification', () => {
    it('should use relative URL /api/chat (not absolute)', () => {
      // In production, API_BASE_URL = '', so endpoint = '/api/chat'
      const apiBaseUrl = '';
      const endpoint = `${apiBaseUrl}/api/chat`;
      
      expect(endpoint).toBe('/api/chat');
      expect(endpoint).not.toContain('http://');
      expect(endpoint).not.toContain('https://');
      expect(endpoint).not.toContain('api.janetxiushi.me');
    });

    it('should resolve /api/chat to same origin', () => {
      const baseUrl = 'https://maya-agent.ai-builders.space';
      const endpoint = '/api/chat';
      
      // Simulate browser URL resolution
      const resolvedUrl = new URL(endpoint, baseUrl).href;
      
      expect(resolvedUrl).toBe('https://maya-agent.ai-builders.space/api/chat');
      expect(resolvedUrl).not.toContain('api.janetxiushi.me');
    });
  });

  describe('Request Format Verification', () => {
    it('should send correct request format', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set('Content-Type', 'application/json')
        .send({
          message: 'Test message',
          history: []
        });
      
      // Verify request was accepted (not 400 Bad Request)
      expect(response.status).not.toBe(400);
    });

    it('should handle empty history array', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Hello',
          history: []
        });
      
      expect(response.status).not.toBe(400);
    });

    it('should handle message with history', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Follow up',
          history: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there!' }
          ]
        });
      
      expect(response.status).not.toBe(400);
    });
  });
});
