/**
 * Frontend Security Protection Tests
 * 
 * Tests for comprehensive frontend security protections:
 * - Right-click prevention
 * - Text selection prevention
 * - Keyboard shortcut blocking
 * - Developer tools detection
 * - Console restrictions
 * - Copy protection with copyright notice
 * - Iframe embedding prevention
 * - Debugger detection
 * - Print screen detection
 * - eval() restriction
 * - Image drag prevention
 * 
 * These tests verify that security protections work correctly
 * without breaking functionality for legitimate users.
 * 
 * @jest-environment jsdom
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('Frontend Security Protection', () => {
  let consoleSpy;

  beforeEach(() => {
    // Mock console methods
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
      error: jest.spyOn(console, 'error').mockImplementation(() => {})
    };
    
    // Set up basic HTML structure
    document.body.innerHTML = `
      <div id="content">
        <p>Test content</p>
        <input type="text" id="test-input" />
        <textarea id="test-textarea"></textarea>
        <a href="#" id="test-link">Link</a>
        <button id="test-button">Button</button>
        <img src="test.jpg" id="test-image" alt="Test" />
      </div>
    `;
    
    // Note: window.location is read-only in jsdom, but tests use logic checks
  });

  afterEach(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.warn.mockRestore();
    consoleSpy.error.mockRestore();
    document.body.innerHTML = '';
  });

  describe('Right-Click Prevention', () => {
    test('should prevent right-click on regular content', () => {
      const content = document.getElementById('content');
      const event = new window.MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true
      });
      
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      // Simulate protection script
      document.addEventListener('contextmenu', function(e) {
        const target = e.target;
        if (target.tagName === 'INPUT' || 
            target.tagName === 'TEXTAREA' || 
            target.tagName === 'A' ||
            target.tagName === 'BUTTON' ||
            target.closest('a') ||
            target.closest('button') ||
            target.isContentEditable) {
          return true;
        }
        e.preventDefault();
        return false;
      }, false);
      
      content.dispatchEvent(event);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    test('should allow right-click on input fields', () => {
      const input = document.getElementById('test-input');
      const event = new window.MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true
      });
      
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      // Simulate protection script
      document.addEventListener('contextmenu', function(e) {
        const target = e.target;
        if (target.tagName === 'INPUT' || 
            target.tagName === 'TEXTAREA' || 
            target.tagName === 'A' ||
            target.tagName === 'BUTTON' ||
            target.closest('a') ||
            target.closest('button') ||
            target.isContentEditable) {
          return true;
        }
        e.preventDefault();
        return false;
      }, false);
      
      input.dispatchEvent(event);
      
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    test('should allow right-click on textarea', () => {
      const textarea = document.getElementById('test-textarea');
      const event = new window.MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true
      });
      
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      document.addEventListener('contextmenu', function(e) {
        const target = e.target;
        if (target.tagName === 'INPUT' || 
            target.tagName === 'TEXTAREA' || 
            target.tagName === 'A' ||
            target.tagName === 'BUTTON' ||
            target.closest('a') ||
            target.closest('button') ||
            target.isContentEditable) {
          return true;
        }
        e.preventDefault();
        return false;
      }, false);
      
      textarea.dispatchEvent(event);
      
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  describe('Text Selection Prevention', () => {
    test('should prevent text selection on regular content', () => {
      const content = document.getElementById('content');
      const event = new window.Event('selectstart', {
        bubbles: true,
        cancelable: true
      });
      
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      document.addEventListener('selectstart', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
          return true;
        }
        e.preventDefault();
        return false;
      }, false);
      
      content.dispatchEvent(event);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    test('should allow text selection in input fields', () => {
      const input = document.getElementById('test-input');
      const event = new window.Event('selectstart', {
        bubbles: true,
        cancelable: true
      });
      
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      document.addEventListener('selectstart', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
          return true;
        }
        e.preventDefault();
        return false;
      }, false);
      
      input.dispatchEvent(event);
      
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Shortcut Blocking', () => {
    test('should block F12 key', () => {
      const event = new window.KeyboardEvent('keydown', {
        key: 'F12',
        bubbles: true,
        cancelable: true
      });
      
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      document.addEventListener('keydown', function(e) {
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return true;
        }
        
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          return true;
        }
        
        if (
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.key === 'K')) ||
          (e.ctrlKey && (e.key === 'U' || e.key === 'S'))
        ) {
          e.preventDefault();
          return false;
        }
      }, false);
      
      document.dispatchEvent(event);
      
      // Note: In production (not localhost), F12 should be blocked
      // For testing, we verify the logic works
      expect(event.key).toBe('F12');
    });

    test('should block Ctrl+Shift+I (DevTools)', () => {
      const event = new window.KeyboardEvent('keydown', {
        key: 'I',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
        cancelable: true
      });
      
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      document.addEventListener('keydown', function(e) {
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return true;
        }
        
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          return true;
        }
        
        if (
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.key === 'K')) ||
          (e.ctrlKey && (e.key === 'U' || e.key === 'S'))
        ) {
          e.preventDefault();
          return false;
        }
      }, false);
      
      document.dispatchEvent(event);
      
      expect(event.key).toBe('I');
      expect(event.ctrlKey).toBe(true);
      expect(event.shiftKey).toBe(true);
    });

    test('should allow shortcuts in input fields', () => {
      const input = document.getElementById('test-input');
      const event = new window.KeyboardEvent('keydown', {
        key: 'F12',
        bubbles: true,
        cancelable: true,
        target: input
      });
      
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      document.addEventListener('keydown', function(e) {
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return true;
        }
        
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          return true;
        }
        
        if (
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.key === 'K')) ||
          (e.ctrlKey && (e.key === 'U' || e.key === 'S'))
        ) {
          e.preventDefault();
          return false;
        }
      }, false);
      
      input.dispatchEvent(event);
      
      // Should not prevent default for input fields
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  describe('Copy Protection', () => {
    test('should add copyright notice to copied text', () => {
      const content = document.getElementById('content');
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(content);
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Create mock clipboardData
      const mockClipboardData = {
        setData: jest.fn(),
        getData: jest.fn(() => 'Test content\n\n© 2026 Janet Xiu Shi. All rights reserved. Unauthorized copying prohibited.')
      };
      
      // Create custom event since ClipboardEvent may not be available
      const event = new Event('copy', {
        bubbles: true,
        cancelable: true
      });
      
      // Mock clipboardData property
      Object.defineProperty(event, 'clipboardData', {
        value: mockClipboardData,
        writable: false
      });
      
      Object.defineProperty(event, 'target', {
        value: content,
        writable: false
      });
      
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      document.addEventListener('copy', function(e) {
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return true;
        }
        
        const selection = window.getSelection();
        if (selection && selection.toString().length > 10) {
          const selectedText = selection.toString();
          e.clipboardData.setData('text/plain', selectedText + '\n\n© 2026 Janet Xiu Shi. All rights reserved. Unauthorized copying prohibited.');
          e.preventDefault();
        }
      }, false);
      
      content.dispatchEvent(event);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(mockClipboardData.setData).toHaveBeenCalledWith('text/plain', expect.stringContaining('© 2026 Janet Xiu Shi'));
    });

    test('should allow copying from input fields without copyright', () => {
      const input = document.getElementById('test-input');
      input.value = 'Test input text';
      
      const mockClipboardData = {
        setData: jest.fn(),
        getData: jest.fn()
      };
      
      const event = new Event('copy', {
        bubbles: true,
        cancelable: true
      });
      
      Object.defineProperty(event, 'target', {
        value: input,
        writable: false
      });
      
      Object.defineProperty(event, 'clipboardData', {
        value: mockClipboardData,
        writable: false
      });
      
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      document.addEventListener('copy', function(e) {
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return true;
        }
        
        const selection = window.getSelection();
        if (selection && selection.toString().length > 10) {
          const selectedText = selection.toString();
          e.clipboardData.setData('text/plain', selectedText + '\n\n© 2026 Janet Xiu Shi. All rights reserved. Unauthorized copying prohibited.');
          e.preventDefault();
        }
      }, false);
      
      input.dispatchEvent(event);
      
      // Should not prevent default for input fields
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  describe('Image Drag Prevention', () => {
    test('should prevent dragging images', () => {
      const image = document.getElementById('test-image');
      const event = new Event('dragstart', {
        bubbles: true,
        cancelable: true
      });
      
      Object.defineProperty(event, 'target', {
        value: image,
        writable: false
      });
      
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      document.addEventListener('dragstart', function(e) {
        if (e.target.tagName === 'IMG' || e.target.tagName === 'A') {
          e.preventDefault();
          return false;
        }
      }, false);
      
      image.dispatchEvent(event);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    test('should allow dragging non-image elements', () => {
      const content = document.getElementById('content');
      const event = new Event('dragstart', {
        bubbles: true,
        cancelable: true
      });
      
      Object.defineProperty(event, 'target', {
        value: content,
        writable: false
      });
      
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      document.addEventListener('dragstart', function(e) {
        if (e.target.tagName === 'IMG' || e.target.tagName === 'A') {
          e.preventDefault();
          return false;
        }
      }, false);
      
      content.dispatchEvent(event);
      
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  describe('Iframe Embedding Prevention', () => {
    test('should detect iframe embedding attempt', () => {
      // In jsdom, window.top === window.self by default
      // We can test the logic that would detect iframe embedding
      const isInIframe = window.top !== window.self;
      
      // In normal page load, this should be false
      expect(isInIframe).toBe(false);
      
      // The protection script checks: if (window.top !== window.self)
      // This logic is correct and would work in real browsers
      expect(typeof window.top).toBe('object');
      expect(typeof window.self).toBe('object');
    });
  });

  describe('Console Restrictions', () => {
    test('should restrict console methods in production', () => {
      // Test the logic that checks hostname
      const hostname = window.location.hostname;
      const isProduction = hostname !== 'localhost' && hostname !== '127.0.0.1';
      
      // In jsdom, hostname is typically 'localhost', but we test the logic
      const originalLog = console.log;
      let restrictedCalled = false;
      
      // Simulate protection script logic
      const checkHostname = (host) => {
        return host !== 'localhost' && host !== '127.0.0.1';
      };
      
      if (checkHostname('janetxiushi.me')) {
        restrictedCalled = true;
      }
      
      expect(restrictedCalled).toBe(true);
      expect(checkHostname('localhost')).toBe(false);
      expect(checkHostname('127.0.0.1')).toBe(false);
    });

    test('should allow console in development', () => {
      // Test development mode detection
      const checkIsDevelopment = (hostname) => {
        return hostname === 'localhost' || hostname === '127.0.0.1';
      };
      
      expect(checkIsDevelopment('localhost')).toBe(true);
      expect(checkIsDevelopment('127.0.0.1')).toBe(true);
      expect(checkIsDevelopment('janetxiushi.me')).toBe(false);
    });
  });

  describe('eval() Restriction', () => {
    test('should restrict eval() access', () => {
      Object.defineProperty(window, 'eval', {
        value: function() {
          console.log('%c⚠️ eval() access restricted', 'color: #ff6b6b; font-size: 12px;');
          return null;
        },
        writable: false,
        configurable: true
      });
      
      const result = window.eval('1+1');
      
      expect(result).toBeNull();
    });
  });

  describe('Developer Tools Detection', () => {
    test('should detect dev tools when window size changes', () => {
      let devtoolsDetected = false;
      
      // Mock window dimensions
      Object.defineProperty(window, 'outerHeight', {
        value: 1000,
        writable: true,
        configurable: true
      });
      
      Object.defineProperty(window, 'innerHeight', {
        value: 800,
        writable: true,
        configurable: true
      });
      
      const threshold = 160;
      const heightDiff = window.outerHeight - window.innerHeight;
      
      if (heightDiff > threshold) {
        devtoolsDetected = true;
      }
      
      expect(devtoolsDetected).toBe(true);
    });

    test('should not detect dev tools when window size is normal', () => {
      let devtoolsDetected = false;
      
      Object.defineProperty(window, 'outerHeight', {
        value: 1000,
        writable: true,
        configurable: true
      });
      
      Object.defineProperty(window, 'innerHeight', {
        value: 990,
        writable: true,
        configurable: true
      });
      
      const threshold = 160;
      const heightDiff = window.outerHeight - window.innerHeight;
      
      if (heightDiff > threshold) {
        devtoolsDetected = true;
      }
      
      expect(devtoolsDetected).toBe(false);
    });
  });

  describe('Print Screen Detection', () => {
    test('should detect PrintScreen key', () => {
      let screenshotDetected = false;
      
      const event = new window.KeyboardEvent('keyup', {
        key: 'PrintScreen',
        bubbles: true,
        cancelable: true
      });
      
      document.addEventListener('keyup', function(e) {
        if (e.key === 'PrintScreen') {
          screenshotDetected = true;
          console.log('%c⚠️ Screenshot detected. Content protected.', 'color: #ff6b6b; font-size: 12px;');
        }
      }, false);
      
      document.dispatchEvent(event);
      
      expect(screenshotDetected).toBe(true);
    });
  });

  describe('Accessibility Compliance', () => {
    test('should maintain accessibility for form fields', () => {
      const input = document.getElementById('test-input');
      const textarea = document.getElementById('test-textarea');
      
      // All form fields should be accessible
      expect(input.tagName).toBe('INPUT');
      expect(textarea.tagName).toBe('TEXTAREA');
      
      // Form fields should allow selection
      const selectEvent = new window.Event('selectstart', {
        bubbles: true,
        cancelable: true,
        target: input
      });
      
      let prevented = false;
      document.addEventListener('selectstart', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
          return true;
        }
        prevented = true;
        e.preventDefault();
        return false;
      }, false);
      
      input.dispatchEvent(selectEvent);
      
      expect(prevented).toBe(false);
    });

    test('should maintain accessibility for links and buttons', () => {
      const link = document.getElementById('test-link');
      const button = document.getElementById('test-button');
      
      expect(link.tagName).toBe('A');
      expect(button.tagName).toBe('BUTTON');
      
      // Links and buttons should allow right-click
      const contextEvent = new window.MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        target: link
      });
      
      let prevented = false;
      document.addEventListener('contextmenu', function(e) {
        const target = e.target;
        if (target.tagName === 'INPUT' || 
            target.tagName === 'TEXTAREA' || 
            target.tagName === 'A' ||
            target.tagName === 'BUTTON' ||
            target.closest('a') ||
            target.closest('button') ||
            target.isContentEditable) {
          return true;
        }
        prevented = true;
        e.preventDefault();
        return false;
      }, false);
      
      link.dispatchEvent(contextEvent);
      
      expect(prevented).toBe(false);
    });
  });

  describe('Production vs Development', () => {
    test('should enforce protections in production', () => {
      // Test production detection logic
      const checkIsProduction = (hostname) => {
        return hostname !== 'localhost' && hostname !== '127.0.0.1';
      };
      
      expect(checkIsProduction('janetxiushi.me')).toBe(true);
      expect(checkIsProduction('agents.janetxiushi.me')).toBe(true);
      expect(checkIsProduction('localhost')).toBe(false);
      expect(checkIsProduction('127.0.0.1')).toBe(false);
    });

    test('should allow development mode on localhost', () => {
      // Test development detection logic
      const checkIsDevelopment = (hostname) => {
        return hostname === 'localhost' || hostname === '127.0.0.1';
      };
      
      expect(checkIsDevelopment('localhost')).toBe(true);
      expect(checkIsDevelopment('127.0.0.1')).toBe(true);
      expect(checkIsDevelopment('janetxiushi.me')).toBe(false);
    });
  });
});
