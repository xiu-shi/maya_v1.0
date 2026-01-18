/**
 * Root Route Integration Tests
 * 
 * Tests for root route (/) redirect functionality
 * Ensures root URL properly redirects to /maya.html
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';

let app;
let server;
const TEST_PORT = 3002;

beforeAll(async () => {
  // Set test environment BEFORE importing server
  process.env.NODE_ENV = 'test';
  process.env.PORT = TEST_PORT.toString();
  process.env.SKIP_SERVER_START = 'true';
  
  // Import server app (won't auto-start due to NODE_ENV=test)
  const serverModule = await import('../../backend/server.js');
  app = serverModule.default;
  
  // Start server on test port
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
        setTimeout(resolve, 1000); // Give server time to initialize
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

describe('Root Route Integration Tests', () => {
  describe('GET / - Root Route Redirect', () => {
    it('should redirect root path (/) to /maya.html with 301 status', async () => {
      const response = await request(app)
        .get('/')
        .expect(301);

      expect(response.headers.location).toBe('/maya.html');
    }, 15000);

    it('should redirect root path with query parameters', async () => {
      const response = await request(app)
        .get('/?test=123&foo=bar')
        .expect(301);

      expect(response.headers.location).toBe('/maya.html');
    }, 15000);

    it('should NOT return 404 for root path', async () => {
      const response = await request(app)
        .get('/');

      expect(response.status).not.toBe(404);
      expect(response.status).toBe(301);
    }, 15000);
  });

  describe('GET /maya.html - Frontend Route', () => {
    it('should serve maya.html with 200 status', async () => {
      const response = await request(app)
        .get('/maya.html')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/text\/html/);
      expect(response.text).toContain('Maya');
    }, 15000);

    it('should contain expected HTML content', async () => {
      const response = await request(app)
        .get('/maya.html')
        .expect(200);

      expect(response.text).toContain('<!DOCTYPE html>');
      expect(response.text).toContain('Janet');
    }, 15000);
  });

  describe('Static File Serving', () => {
    it('should serve CSS file', async () => {
      const response = await request(app)
        .get('/styles.css')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/text\/css/);
    }, 15000);
  });

  describe('Health Endpoint', () => {
    it('should return 200 for /health', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
    }, 15000);
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/nonexistent-route-xyz-123')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Endpoint not found');
    }, 15000);
  });

  describe('Route Priority Tests', () => {
    it('should handle root route BEFORE 404 handler', async () => {
      const response = await request(app)
        .get('/');

      // Root should redirect (301), NOT return 404
      expect(response.status).toBe(301);
      expect(response.status).not.toBe(404);
      expect(response.headers.location).toBe('/maya.html');
    }, 15000);

    it('should serve static files BEFORE 404 handler', async () => {
      const response = await request(app)
        .get('/maya.html');

      // Should serve file (200), NOT return 404
      expect(response.status).toBe(200);
      expect(response.status).not.toBe(404);
    }, 15000);
  });
});
