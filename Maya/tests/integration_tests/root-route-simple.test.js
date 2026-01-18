/**
 * Simple Root Route Test
 * 
 * Tests root route redirect functionality
 * Can be run against local server or deployed server
 */

import { describe, it, expect } from '@jest/globals';
import request from 'supertest';

// Import server app
let app;

beforeAll(async () => {
  // Set test environment BEFORE importing
  process.env.NODE_ENV = 'test';
  process.env.SKIP_SERVER_START = 'true';
  
  // Import server
  const serverModule = await import('../../backend/server.js');
  app = serverModule.default;
}, 10000);

describe('Root Route Simple Tests', () => {
  describe('GET / - Root Route', () => {
    it('should redirect root path to /maya.html with 301 status', async () => {
      const response = await request(app)
        .get('/')
        .expect(301);

      expect(response.headers.location).toBe('/maya.html');
    }, 15000);

    it('should NOT return 404 for root path', async () => {
      const response = await request(app)
        .get('/');

      expect(response.status).toBe(301);
      expect(response.status).not.toBe(404);
      expect(response.headers.location).toBe('/maya.html');
    }, 15000);
  });

  describe('GET /maya.html', () => {
    it('should serve maya.html with 200 status', async () => {
      const response = await request(app)
        .get('/maya.html')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/text\/html/);
    }, 15000);
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/nonexistent-xyz-123')
        .expect(404);

      expect(response.body.error).toBe('Endpoint not found');
    }, 15000);
  });
});
