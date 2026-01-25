/**
 * Comprehensive Root Route Tests
 * 
 * Tests all possible scenarios for root route handling
 * Ensures root URL properly redirects and doesn't return 404
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';

let app;
let server;
const TEST_PORT = 3009;

beforeAll(async () => {
  // Set test environment BEFORE importing
  process.env.NODE_ENV = 'test';
  process.env.SKIP_SERVER_START = 'true';
  process.env.PORT = TEST_PORT.toString();
  
  // Import server app
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
        setTimeout(resolve, 1000);
      }
    });
  });
}, 60000); // Increased timeout

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

describe('Root Route Comprehensive Tests', () => {
  describe('GET / - Root Route Redirect (Critical)', () => {
    it('should redirect root path (/) to /maya.html with 301 status', async () => {
      const response = await request(app)
        .get('/')
        .expect(301);

      expect(response.headers.location).toBe('/maya.html');
      expect(response.status).toBe(301);
    }, 15000);

    it('should NOT return 404 for root path', async () => {
      const response = await request(app)
        .get('/');

      expect(response.status).not.toBe(404);
      expect(response.status).toBe(301);
    }, 15000);

    it('should redirect root path with query parameters', async () => {
      const response = await request(app)
        .get('/?test=123&foo=bar')
        .expect(301);

      expect(response.headers.location).toBe('/maya.html');
    }, 15000);

    it('should redirect root path without query parameters', async () => {
      const response = await request(app)
        .get('/')
        .expect(301);

      expect(response.headers.location).toBe('/maya.html');
    }, 15000);

    it('should use permanent redirect (301)', async () => {
      const response = await request(app)
        .get('/')
        .expect(301);

      expect(response.status).toBe(301); // Permanent redirect
    }, 15000);
  });

  describe('GET /maya.html - Frontend File Serving', () => {
    it('should serve maya.html with 200 status', async () => {
      const response = await request(app)
        .get('/maya.html')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/text\/html/);
    }, 15000);

    it('should contain expected HTML content', async () => {
      const response = await request(app)
        .get('/maya.html')
        .expect(200);

      expect(response.text).toContain('<!DOCTYPE html>');
      expect(response.text).toContain('Maya');
      expect(response.text).toContain('Janet');
    }, 15000);

    it('should contain chat interface elements', async () => {
      const response = await request(app)
        .get('/maya.html')
        .expect(200);

      expect(response.text).toContain('chatMessages');
      expect(response.text).toContain('chatInput');
    }, 15000);
  });

  describe('Static File Serving', () => {
    it('should serve CSS file', async () => {
      const response = await request(app)
        .get('/styles.css')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/text\/css/);
    }, 15000);

    it('should serve static images', async () => {
      const response = await request(app)
        .get('/static/images/logos/jxs_fav.jpg')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/image/);
    }, 15000);
  });

  describe('API Endpoints', () => {
    it('should serve health endpoint', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
    }, 15000);

    it('should handle chat API endpoint', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'test',
          history: []
        });

      // May return 503 if API client not initialized, or 200 if working
      expect([200, 503]).toContain(response.status);
    }, 15000);
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/nonexistent-route-xyz-12345')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Endpoint not found');
      expect(response.body).toHaveProperty('message');
    }, 15000);

    it('should return 404 for non-existent API routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent-endpoint-xyz')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    }, 15000);
  });

  describe('Route Priority Verification', () => {
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

    it('should handle root route BEFORE static middleware', async () => {
      // Root route handler is defined BEFORE static middleware
      // This ensures it catches root path before static middleware tries to serve files
      const response = await request(app)
        .get('/');

      expect(response.status).toBe(301);
      expect(response.headers.location).toBe('/maya.html');
    }, 15000);
  });

  describe('Edge Cases', () => {
    it('should handle root path with trailing slash', async () => {
      const response = await request(app)
        .get('/')
        .expect(301);

      expect(response.headers.location).toBe('/maya.html');
    }, 15000);

    it('should handle root path with multiple slashes', async () => {
      const response = await request(app)
        .get('//')
        .expect(301);

      expect(response.headers.location).toBe('/maya.html');
    }, 15000);

    it('should handle root path with encoded characters', async () => {
      const response = await request(app)
        .get('/%2F')
        .expect(404); // This is a different path, should 404

      expect(response.status).toBe(404);
    }, 15000);
  });
});
