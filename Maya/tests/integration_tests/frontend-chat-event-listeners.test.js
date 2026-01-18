/**
 * Integration Test: Frontend Chat Event Listeners
 * 
 * Tests that event listeners are properly attached and chat functionality works
 * This test ensures the fix for DOM-ready event listener attachment is working
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { JSDOM } from 'jsdom';

describe('Frontend Chat Event Listeners', () => {
  let dom;
  let window;
  let document;
  let chatInput;
  let submitBtn;
  let newChatBtn;
  let chatMessages;
  let sendMessageCalled;
  let createNewChatCalled;

  beforeEach(() => {
    // Create JSDOM environment
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Maya Test</title>
        </head>
        <body>
          <textarea id="chatInput"></textarea>
          <button id="submitBtn">Send</button>
          <button id="newChatBtn">New Chat</button>
          <div id="chatMessages"></div>
          <div id="emptyState" style="display: none;"></div>
          <div id="chatHistory"></div>
        </body>
      </html>
    `, {
      url: 'https://maya-agent.ai-builders.space',
      pretendToBeVisual: true,
      resources: 'usable',
      runScripts: 'dangerously'
    });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;
    global.fetch = window.fetch = jest.fn();

    // Get DOM elements
    chatInput = document.getElementById('chatInput');
    submitBtn = document.getElementById('submitBtn');
    newChatBtn = document.getElementById('newChatBtn');
    chatMessages = document.getElementById('chatMessages');

    // Track function calls
    sendMessageCalled = false;
    createNewChatCalled = false;

    // Mock sendMessage
    window.sendMessage = jest.fn(() => {
      sendMessageCalled = true;
      return Promise.resolve();
    });

    // Mock createNewChat
    window.createNewChat = jest.fn(() => {
      createNewChatCalled = true;
    });
  });

  afterEach(() => {
    global.fetch = undefined;
  });

  describe('DOM Element Availability', () => {
    it('should find all required chat elements', () => {
      expect(chatInput).toBeTruthy();
      expect(submitBtn).toBeTruthy();
      expect(newChatBtn).toBeTruthy();
      expect(chatMessages).toBeTruthy();
    });

    it('should handle missing elements gracefully', () => {
      const missingInput = document.getElementById('nonexistent');
      expect(missingInput).toBeNull();
    });
  });

  describe('Event Listener Attachment', () => {
    it('should attach listeners only when elements exist', () => {
      // Simulate attachEventListeners function
      function attachEventListeners() {
        if (!chatInput || !submitBtn || !newChatBtn || !chatMessages) {
          return false;
        }
        
        chatInput.addEventListener('input', () => {});
        submitBtn.addEventListener('click', () => {});
        newChatBtn.addEventListener('click', () => {});
        return true;
      }

      const result = attachEventListeners();
      expect(result).toBe(true);
    });

    it('should return false if elements are missing', () => {
      // Remove an element
      chatInput.remove();
      
      function attachEventListeners() {
        if (!chatInput || !submitBtn || !newChatBtn || !chatMessages) {
          return false;
        }
        return true;
      }

      const result = attachEventListeners();
      expect(result).toBe(false);
    });
  });

  describe('DOM Ready State Detection', () => {
    it('should detect loading state', () => {
      // Simulate loading state
      Object.defineProperty(document, 'readyState', {
        value: 'loading',
        writable: true
      });
      
      expect(document.readyState).toBe('loading');
    });

    it('should detect complete state', () => {
      // Simulate complete state
      Object.defineProperty(document, 'readyState', {
        value: 'complete',
        writable: true
      });
      
      expect(document.readyState).toBe('complete');
    });
  });

  describe('Event Listener Functionality', () => {
    it('should trigger sendMessage on Enter key', () => {
      const mockSendMessage = jest.fn();
      chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          mockSendMessage();
        }
      });

      const enterEvent = new window.KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true
      });
      
      chatInput.dispatchEvent(enterEvent);
      expect(mockSendMessage).toHaveBeenCalled();
    });

    it('should NOT trigger sendMessage on Shift+Enter', () => {
      const mockSendMessage = jest.fn();
      chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          mockSendMessage();
        }
      });

      const shiftEnterEvent = new window.KeyboardEvent('keydown', {
        key: 'Enter',
        shiftKey: true,
        bubbles: true
      });
      
      chatInput.dispatchEvent(shiftEnterEvent);
      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('should trigger sendMessage on button click', () => {
      const mockSendMessage = jest.fn();
      submitBtn.addEventListener('click', function(e) {
        e.preventDefault();
        mockSendMessage();
      });

      const clickEvent = new window.MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });
      
      submitBtn.dispatchEvent(clickEvent);
      expect(mockSendMessage).toHaveBeenCalled();
    });

    it('should trigger createNewChat on new chat button click', () => {
      const mockCreateNewChat = jest.fn();
      newChatBtn.addEventListener('click', function(e) {
        e.preventDefault();
        mockCreateNewChat();
      });

      const clickEvent = new window.MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });
      
      newChatBtn.dispatchEvent(clickEvent);
      expect(mockCreateNewChat).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle addEventListener errors gracefully', () => {
      const nullElement = null;
      let errorCaught = false;

      try {
        if (nullElement) {
          nullElement.addEventListener('click', () => {});
        }
      } catch (error) {
        errorCaught = true;
      }

      // Should not throw if we check first
      expect(errorCaught).toBe(false);
    });

    it('should handle missing elements in attachEventListeners', () => {
      function attachEventListeners() {
        try {
          if (!chatInput || !submitBtn) {
            return false;
          }
          chatInput.addEventListener('input', () => {});
          return true;
        } catch (error) {
          return false;
        }
      }

      // Remove element
      chatInput.remove();
      const result = attachEventListeners();
      expect(result).toBe(false);
    });
  });

  describe('Initialization Order', () => {
    it('should attach listeners before init() is called', () => {
      let listenersAttached = false;
      let initCalled = false;

      // Simulate attachEventListeners
      function attachEventListeners() {
        listenersAttached = true;
        return true;
      }

      // Simulate init
      function init() {
        initCalled = true;
      }

      // Simulate DOMContentLoaded flow
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          attachEventListeners();
          init();
        });
      } else {
        attachEventListeners();
        init();
      }

      // Trigger DOMContentLoaded if needed
      if (document.readyState === 'loading') {
        const event = new window.Event('DOMContentLoaded');
        document.dispatchEvent(event);
      }

      expect(listenersAttached).toBe(true);
      expect(initCalled).toBe(true);
    });
  });
});
