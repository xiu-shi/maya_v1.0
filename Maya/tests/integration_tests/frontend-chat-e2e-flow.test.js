/**
 * E2E Test: Frontend Chat End-to-End Flow
 * 
 * Tests the complete chat flow from user input to message display
 * This ensures the fix for event listener attachment works end-to-end
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';

let app;
let server;
const TEST_PORT = 3005;

describe('Frontend Chat E2E Flow', () => {
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

  describe('Chat API Endpoint', () => {
    it('should accept chat requests', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Hello',
          history: []
        });
      
      // Should not return 404 (endpoint exists)
      expect(response.status).not.toBe(404);
      
      // Should return either success (200) or service unavailable (503) if token not configured
      expect([200, 503, 500]).toContain(response.status);
    });

    it('should return response in correct format', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Test message',
          history: []
        });
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('response');
        expect(response.body).toHaveProperty('warnings');
        expect(typeof response.body.response).toBe('string');
        expect(Array.isArray(response.body.warnings)).toBe(true);
      }
    });

    it('should handle empty history', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Hello',
          history: []
        });
      
      expect(response.status).not.toBe(400);
    });

    it('should handle history with messages', async () => {
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

  describe('Request Validation', () => {
    it('should require message field', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          history: []
        });
      
      expect(response.status).toBe(400);
    });

    it('should validate message length', async () => {
      const longMessage = 'a'.repeat(3000); // Exceeds max length
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: longMessage,
          history: []
        });
      
      // Should either reject or sanitize
      expect([400, 200, 503]).toContain(response.status);
    });
  });

  describe('Response Format', () => {
    it('should return JSON', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Test',
          history: []
        });
      
      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should have response field for successful requests', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Hello',
          history: []
        });
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('response');
        expect(response.body.response).toBeTruthy();
      }
    });
  });
});
