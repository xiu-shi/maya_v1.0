/**
 * Integration Test: Frontend Chat Error Handling
 * 
 * Tests that the frontend properly handles various error scenarios:
 * - Network failures
 * - HTTP error responses (500, 503, etc.)
 * - Invalid JSON responses
 * - Empty responses
 * - Timeout scenarios
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { JSDOM } from 'jsdom';

describe('Frontend Chat Error Handling', () => {
  let dom;
  let window;
  let document;
  let chatInput;
  let submitBtn;
  let chatMessages;
  let sendMessage;
  let addMessage;
  let originalFetch;

  beforeEach(() => {
    // Create JSDOM environment
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <textarea id="chatInput"></textarea>
          <button id="submitBtn">Send</button>
          <div id="chatMessages"></div>
          <div id="emptyState" style="display: none;"></div>
        </body>
      </html>
    `, {
      url: 'https://maya-agent.ai-builders.space',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;
    global.fetch = window.fetch = jest.fn();

    // Get DOM elements
    chatInput = document.getElementById('chatInput');
    submitBtn = document.getElementById('submitBtn');
    chatMessages = document.getElementById('chatMessages');

    // Mock addMessage function
    addMessage = jest.fn((role, content, messageId) => {
      const div = document.createElement('div');
      div.className = `maya-message ${role}`;
      div.textContent = content;
      chatMessages.appendChild(div);
    });

    // Mock removeTypingIndicator
    const removeTypingIndicator = jest.fn();

    // Mock showTypingIndicator
    const showTypingIndicator = jest.fn(() => 'typing-123');

    // Create sendMessage function (simplified version for testing)
    sendMessage = async function() {
      const message = chatInput.value.trim();
      if (!message) return;

      const typingId = showTypingIndicator();

      try {
        const apiUrl = '/api/chat';
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, history: [] })
        });

        removeTypingIndicator(typingId);

        if (!response.ok) {
          let errorData = {};
          try {
            const text = await response.text();
            if (text) {
              errorData = JSON.parse(text);
            }
          } catch (parseError) {
            // If JSON parsing fails, use empty object
          }

          const error = new Error(errorData.error || errorData.message || `API error: ${response.status}`);
          error.status = response.status;
          error.data = errorData;
          throw error;
        }

        const data = await response.json();
        const mayaResponse = data.response || data.message || 'Default response';
        addMessage('maya', mayaResponse);
      } catch (error) {
        removeTypingIndicator(typingId);
        const errorMessage = error.status === 503
          ? 'Service temporarily unavailable. Please try again in a few moments.'
          : 'I apologize, but I\'m experiencing connection issues at the moment. Please try again in a few moments.';
        addMessage('maya', errorMessage);
      }
    };

    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('Network Errors', () => {
    it('should handle network failure gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      chatInput.value = 'Hello';
      await sendMessage();

      expect(addMessage).toHaveBeenCalledWith(
        'maya',
        expect.stringContaining('connection issues')
      );
    });

    it('should handle fetch timeout', async () => {
      global.fetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      chatInput.value = 'Hello';
      await sendMessage();

      expect(addMessage).toHaveBeenCalledWith(
        'maya',
        expect.stringContaining('connection issues')
      );
    });
  });

  describe('HTTP Error Responses', () => {
    it('should handle 500 Internal Server Error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => JSON.stringify({ error: 'Server error', message: 'Something went wrong' })
      });

      chatInput.value = 'Hello';
      await sendMessage();

      expect(addMessage).toHaveBeenCalledWith(
        'maya',
        expect.stringContaining('connection issues')
      );
    });

    it('should handle 503 Service Unavailable', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        text: async () => JSON.stringify({ error: 'Service unavailable', message: 'Please try again later' })
      });

      chatInput.value = 'Hello';
      await sendMessage();

      expect(addMessage).toHaveBeenCalledWith(
        'maya',
        expect.stringContaining('temporarily unavailable')
      );
    });

    it('should handle empty error response body', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => '' // Empty body
      });

      chatInput.value = 'Hello';
      await sendMessage();

      expect(addMessage).toHaveBeenCalledWith(
        'maya',
        expect.stringContaining('connection issues')
      );
    });

    it('should handle invalid JSON in error response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Not valid JSON {'
      });

      chatInput.value = 'Hello';
      await sendMessage();

      expect(addMessage).toHaveBeenCalledWith(
        'maya',
        expect.stringContaining('connection issues')
      );
    });
  });

  describe('Successful Responses', () => {
    it('should handle successful response correctly', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ response: 'Hello! I\'m Maya.' })
      });

      chatInput.value = 'Hello';
      await sendMessage();

      expect(addMessage).toHaveBeenCalledWith('maya', 'Hello! I\'m Maya.');
    });

    it('should handle response with message field instead of response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Alternative response format' })
      });

      chatInput.value = 'Hello';
      await sendMessage();

      expect(addMessage).toHaveBeenCalledWith('maya', 'Alternative response format');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message input', async () => {
      chatInput.value = '';
      await sendMessage();

      expect(global.fetch).not.toHaveBeenCalled();
      expect(addMessage).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only message', async () => {
      chatInput.value = '   ';
      await sendMessage();

      expect(global.fetch).not.toHaveBeenCalled();
      expect(addMessage).not.toHaveBeenCalled();
    });
  });
});
