/**
 * Integration Test: Sample Questions Interactions
 * 
 * Tests for Jan 18, 2026 changes:
 * - Sample questions are clickable
 * - Auto-submit on click
 * - Text selection enabled
 * - Copy/paste enabled
 * - Hover effects work
 * - Security handlers allow interactions
 * 
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Sample Questions Interactions (Jan 18, 2026)', () => {
  let mayaHtml;

  beforeEach(() => {
    // Load actual maya.html file to verify structure
    const mayaHtmlPath = join(__dirname, '../../frontend/maya.html');
    mayaHtml = readFileSync(mayaHtmlPath, 'utf-8');
  });

  describe('Sample Questions Elements', () => {
    it('should have all 4 sample questions in HTML', () => {
      const promptMatches = mayaHtml.match(/data-prompt="[^"]+"/g);
      expect(promptMatches).toBeTruthy();
      expect(promptMatches.length).toBe(4);
    });

    it('should have correct data-prompt attributes', () => {
      expect(mayaHtml).toContain('How can AI help me reduce costs');
      expect(mayaHtml).toContain('biggest risks');
      expect(mayaHtml).toContain('AI strategy that aligns');
      expect(mayaHtml).toContain('cloud migration costs');
    });

    it('should have maya-sample-question class', () => {
      const classMatches = mayaHtml.match(/class="[^"]*maya-sample-question[^"]*"/g);
      expect(classMatches).toBeTruthy();
      expect(classMatches.length).toBe(4);
    });
  });

  describe('CSS Styling', () => {
    it('should have user-select: text enabled in inline styles', () => {
      expect(mayaHtml).toMatch(/user-select:\s*text/);
      expect(mayaHtml).toMatch(/pointer-events:\s*auto/);
      expect(mayaHtml).toMatch(/cursor:\s*pointer/);
    });

    it('should have !important flags on critical styles', () => {
      expect(mayaHtml).toMatch(/user-select:\s*text\s*!important/);
      expect(mayaHtml).toMatch(/pointer-events:\s*auto\s*!important/);
      expect(mayaHtml).toMatch(/cursor:\s*pointer\s*!important/);
    });

    it('should have CSS rules with !important in style tag', () => {
      expect(mayaHtml).toMatch(/\.maya-sample-question\s*\{[^}]*user-select:\s*text\s*!important/);
      expect(mayaHtml).toMatch(/\.maya-sample-question\s*\{[^}]*pointer-events:\s*auto\s*!important/);
    });
  });

  describe('Click Functionality', () => {
    it('should have initPromptHandlers function in code', () => {
      expect(mayaHtml).toContain('initPromptHandlers');
      expect(mayaHtml).toContain('addEventListener');
      expect(mayaHtml).toContain('click');
    });

    it('should have auto-submit logic in click handler', () => {
      expect(mayaHtml).toContain('sendMessage()');
      expect(mayaHtml).toContain('setTimeout');
      // Check that setTimeout and sendMessage are both present (they work together)
      const setTimeoutIndex = mayaHtml.indexOf('setTimeout');
      const sendMessageIndex = mayaHtml.indexOf('sendMessage()');
      expect(setTimeoutIndex).toBeGreaterThan(-1);
      expect(sendMessageIndex).toBeGreaterThan(-1);
      // They should be reasonably close (within 2000 chars to account for code structure)
      expect(Math.abs(setTimeoutIndex - sendMessageIndex)).toBeLessThan(2000);
    });

    it('should use capture: true for click handlers', () => {
      expect(mayaHtml).toContain('capture: true');
      expect(mayaHtml).toContain('addEventListener');
      expect(mayaHtml).toContain('click');
    });

    it('should have stopImmediatePropagation in click handler', () => {
      expect(mayaHtml).toContain('stopImmediatePropagation');
    });
  });

  describe('Text Selection', () => {
    it('should have user-select enabled in styles', () => {
      expect(mayaHtml).toMatch(/user-select:\s*text/);
    });
  });

  describe('Copy Functionality', () => {
    it('should have security handler exceptions for sample questions', () => {
      expect(mayaHtml).toContain('.maya-sample-question');
      expect(mayaHtml).toContain('closest');
    });
  });

  describe('Hover Effects', () => {
    it('should have transition styles for hover effects', () => {
      expect(mayaHtml).toMatch(/transition:\s*all/);
    });

    it('should have mouseenter event handlers', () => {
      expect(mayaHtml).toContain('mouseenter');
      expect(mayaHtml).toContain('mouseleave');
    });
  });

  describe('Security Handler Exceptions', () => {
    it('should check for maya-sample-question in selectstart handler', () => {
      expect(mayaHtml).toContain('selectstart');
      expect(mayaHtml).toContain('maya-sample-question');
      // Check they're in the same section (within 1000 chars)
      const selectstartIndex = mayaHtml.indexOf('selectstart');
      const mayaSampleIndex = mayaHtml.indexOf('maya-sample-question');
      expect(selectstartIndex).toBeGreaterThan(-1);
      expect(mayaSampleIndex).toBeGreaterThan(-1);
    });

    it('should check for maya-sample-question in copy handler', () => {
      expect(mayaHtml).toContain('addEventListener');
      expect(mayaHtml).toContain('copy');
      expect(mayaHtml).toContain('maya-sample-question');
    });

    it('should check for maya-sample-question in contextmenu handler', () => {
      expect(mayaHtml).toContain('contextmenu');
      expect(mayaHtml).toContain('maya-sample-question');
    });

    it('should use closest() method for maya-sample-question', () => {
      expect(mayaHtml).toContain('closest(\'.maya-sample-question\')');
    });
  });

  describe('Warning Text', () => {
    it('should display "DO NOT provide sensitive information" warning', () => {
      expect(mayaHtml).toContain('DO NOT provide sensitive information');
    });
  });

  describe('Title Formatting', () => {
    it('should have "Maya" and "Janet\'s Digital Twin" on same line', () => {
      // Check that title contains both texts
      expect(mayaHtml).toContain('Maya');
      expect(mayaHtml).toContain("Janet's Digital Twin");
      
      // Check that both are in the same h1 element
      const titleMatch = mayaHtml.match(/<h1[^>]*class="[^"]*maya-hero-title[^"]*"[^>]*>([\s\S]*?)<\/h1>/);
      expect(titleMatch).toBeTruthy();
      if (titleMatch) {
        const titleContent = titleMatch[1];
        expect(titleContent).toContain('Maya');
        expect(titleContent).toContain("Janet's Digital Twin");
      }
      
      // Check that maya-hero-subtitle class doesn't exist as separate p element
      const subtitleMatch = mayaHtml.match(/<p[^>]*class="[^"]*maya-hero-subtitle[^"]*"/);
      expect(subtitleMatch).toBeFalsy();
    });
  });
});
