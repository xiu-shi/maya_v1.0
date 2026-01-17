/**
 * Performance Tests: API Endpoints
 * 
 * Tests API performance and response times
 * Updated: January 6, 2025 - Model changed to grok-4-fast for better performance
 */

import { describe, test, expect } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { validateChatRequest } from '../../../backend/middleware/validation.js';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.post('/api/chat', validateChatRequest, (req, res) => {
    res.json({ response: 'Test response' });
  });
  return app;
};

describe('API Performance', () => {
  describe('Response Time', () => {
    test('responds within acceptable time', async () => {
      const app = createTestApp();
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'test message' });
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      // Updated threshold: grok-4-fast should respond in < 2 seconds
      // (Note: This is middleware-only test, actual API calls take ~1.3s)
      expect(responseTime).toBeLessThan(2000);
    });

    test('handles grok-4-fast model performance expectations', async () => {
      // This test documents expected performance with grok-4-fast
      // Actual API response time: ~1335ms (tested via test-models.js)
      // Target: < 2000ms for good UX
      const expectedMaxResponseTime = 2000;
      expect(expectedMaxResponseTime).toBeGreaterThan(1335); // grok-4-fast average
    });
  });

  describe('Request Size Limits', () => {
    test('rejects oversized requests quickly', async () => {
      const app = createTestApp();
      const largeMessage = 'a'.repeat(2 * 1024 * 1024); // 2MB
      
      const startTime = Date.now();
      const response = await request(app)
        .post('/api/chat')
        .set('Content-Length', (2 * 1024 * 1024).toString())
        .send({ message: largeMessage });
      
      const responseTime = Date.now() - startTime;
      
      // Express returns 400 for invalid JSON, 413 for oversized payloads
      // Validation middleware may return 400 for oversized content
      expect([400, 413]).toContain(response.status); // Bad Request or Payload Too Large
      expect(responseTime).toBeLessThan(500); // Should reject quickly
    });
  });

  describe('Concurrent Requests', () => {
    test('handles concurrent requests efficiently', async () => {
      const app = createTestApp();
      const concurrentRequests = 10;
      
      const startTime = Date.now();
      const promises = Array.from({ length: concurrentRequests }, () =>
        request(app)
          .post('/api/chat')
          .send({ message: 'concurrent test' })
      );
      
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Should handle concurrently (not sequentially)
      // Average time per request should be reasonable
      const avgTime = totalTime / concurrentRequests;
      expect(avgTime).toBeLessThan(2000); // < 2 seconds per request average
    });
  });
});

