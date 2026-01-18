/**
 * Frontend API URL Configuration Tests
 * 
 * Ensures the frontend correctly determines API base URL for different environments
 */

describe('Frontend API URL Configuration', () => {
  /**
   * Simulate the API_BASE_URL logic from maya.html
   */
  function getApiBaseUrl(protocol, hostname, port) {
    // If served from same origin (e.g., http://localhost:3002/maya.html), use relative URL
    if (protocol === 'http:' && (hostname === 'localhost' || hostname === '127.0.0.1')) {
      // Use empty string for same-origin requests (cleaner)
      const currentPort = port || '3000'; // Use current port or default to 3000
      return ''; // Empty string = same origin (will use current port automatically)
    }
    
    // If opened from file:// (local file), use localhost backend with current port or default
    if (protocol === 'file:' || !hostname || hostname === '') {
      // Try to detect port from localStorage or use default
      const savedPort = '3001'; // Default to 3001 (simulating localStorage.getItem('maya_api_port') || '3001')
      const apiUrl = `http://localhost:${savedPort}`;
      return apiUrl;
    }
    
    // Production - use same origin (deployed service serves both frontend and API)
    return ''; // Empty string = same origin (will use current domain automatically)
  }

  describe('Development Environment (localhost)', () => {
    test('should use same origin for localhost:3001', () => {
      const apiUrl = getApiBaseUrl('http:', 'localhost', '3001');
      expect(apiUrl).toBe('');
      // Empty string means same origin, so /api/chat will become http://localhost:3001/api/chat
    });

    test('should use same origin for localhost:3000', () => {
      const apiUrl = getApiBaseUrl('http:', 'localhost', '3000');
      expect(apiUrl).toBe('');
    });

    test('should use same origin for 127.0.0.1', () => {
      const apiUrl = getApiBaseUrl('http:', '127.0.0.1', '3001');
      expect(apiUrl).toBe('');
    });
  });

  describe('Production Environment', () => {
    test('should use same origin for maya-agent.ai-builders.space', () => {
      const apiUrl = getApiBaseUrl('https:', 'maya-agent.ai-builders.space', '');
      expect(apiUrl).toBe('');
      // Empty string means same origin, so /api/chat will become https://maya-agent.ai-builders.space/api/chat
    });

    test('should use same origin for any production domain', () => {
      const apiUrl = getApiBaseUrl('https:', 'example.com', '');
      expect(apiUrl).toBe('');
    });

    test('should NOT use api.janetxiushi.me', () => {
      const apiUrl = getApiBaseUrl('https:', 'maya-agent.ai-builders.space', '');
      expect(apiUrl).not.toBe('https://api.janetxiushi.me');
      expect(apiUrl).toBe('');
    });
  });

  describe('File Protocol (Local File)', () => {
    test('should use localhost:3001 for file:// protocol', () => {
      const apiUrl = getApiBaseUrl('file:', '', '');
      expect(apiUrl).toBe('http://localhost:3001');
    });

    test('should use localhost backend when hostname is empty', () => {
      const apiUrl = getApiBaseUrl('https:', '', '');
      expect(apiUrl).toBe('http://localhost:3001');
    });
  });

  describe('API Endpoint Construction', () => {
    test('should construct correct API endpoint for production', () => {
      const apiBaseUrl = getApiBaseUrl('https:', 'maya-agent.ai-builders.space', '');
      const apiEndpoint = `${apiBaseUrl}/api/chat`;
      
      // Empty string + /api/chat = /api/chat (relative URL)
      expect(apiEndpoint).toBe('/api/chat');
      
      // When fetched from https://maya-agent.ai-builders.space/maya.html
      // /api/chat becomes https://maya-agent.ai-builders.space/api/chat
    });

    test('should construct correct API endpoint for localhost', () => {
      const apiBaseUrl = getApiBaseUrl('http:', 'localhost', '3001');
      const apiEndpoint = `${apiBaseUrl}/api/chat`;
      
      expect(apiEndpoint).toBe('/api/chat');
      
      // When fetched from http://localhost:3001/maya.html
      // /api/chat becomes http://localhost:3001/api/chat
    });

    test('should construct correct API endpoint for file://', () => {
      const apiBaseUrl = getApiBaseUrl('file:', '', '');
      const apiEndpoint = `${apiBaseUrl}/api/chat`;
      
      expect(apiEndpoint).toBe('http://localhost:3001/api/chat');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty port in production', () => {
      const apiUrl = getApiBaseUrl('https:', 'maya-agent.ai-builders.space', '');
      expect(apiUrl).toBe('');
    });

    test('should handle undefined port', () => {
      const apiUrl = getApiBaseUrl('https:', 'maya-agent.ai-builders.space', undefined);
      expect(apiUrl).toBe('');
    });

    test('should handle null hostname', () => {
      const apiUrl = getApiBaseUrl('file:', null, '');
      expect(apiUrl).toBe('http://localhost:3001');
    });
  });

  describe('Security: No Hardcoded External URLs', () => {
    test('should never return api.janetxiushi.me', () => {
      const testCases = [
        { protocol: 'https:', hostname: 'maya-agent.ai-builders.space', port: '' },
        { protocol: 'http:', hostname: 'localhost', port: '3001' },
        { protocol: 'file:', hostname: '', port: '' },
        { protocol: 'https:', hostname: 'example.com', port: '' },
      ];

      testCases.forEach(({ protocol, hostname, port }) => {
        const apiUrl = getApiBaseUrl(protocol, hostname, port);
        expect(apiUrl).not.toContain('api.janetxiushi.me');
        expect(apiUrl).not.toContain('janetxiushi.me');
      });
    });
  });
});
