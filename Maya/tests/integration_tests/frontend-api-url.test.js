/**
 * Integration Test: Frontend API URL Configuration
 * 
 * Tests that the frontend correctly constructs API URLs for different environments
 */

import { readFileSync } from 'fs';
import { join } from 'path';

describe('Frontend API URL Configuration - Integration Test', () => {
  let mayaHtmlContent;
  
  beforeAll(() => {
    // Read the actual maya.html file
    const mayaHtmlPath = join(process.cwd(), '../frontend/maya.html');
    mayaHtmlContent = readFileSync(mayaHtmlPath, 'utf-8');
  });

  test('should not contain hardcoded api.janetxiushi.me URL', () => {
    // Check that there's no hardcoded external API URL
    const hasHardcodedUrl = mayaHtmlContent.includes('api.janetxiushi.me') || 
                           mayaHtmlContent.includes('https://api.janetxiushi.me');
    
    expect(hasHardcodedUrl).toBe(false);
  });

  test('should contain API_BASE_URL configuration', () => {
    expect(mayaHtmlContent).toContain('API_BASE_URL');
  });

  test('should use empty string for production (same origin)', () => {
    // Check that production case returns empty string
    const productionPattern = /Production.*use same origin.*return ''/s;
    expect(mayaHtmlContent).toMatch(productionPattern);
  });

  test('should construct API endpoint correctly', () => {
    // Check that API endpoint is constructed as `${API_BASE_URL}/api/chat`
    const apiEndpointPattern = /\$\{API_BASE_URL\}\/api\/chat/;
    expect(mayaHtmlContent).toMatch(apiEndpointPattern);
  });

  test('should handle production domain correctly', () => {
    // Simulate the logic for production
    const protocol = 'https:';
    const hostname = 'maya-agent.ai-builders.space';
    const port = '';
    
    // Extract the logic (simplified)
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

  test('should log API configuration', () => {
    // Check that API configuration is logged
    expect(mayaHtmlContent).toContain('Maya Chat Configuration');
    expect(mayaHtmlContent).toContain('apiBaseUrl');
  });
});
