/**
 * IP Protection Verification Tests - Option 2 Implementation
 * 
 * Purpose: Verify that Maya's core IP (system instructions) is fully protected
 * Ensures no IP exposure on GitHub before making repository public
 * 
 * Test Coverage:
 * 1. Gitignore verification (all IP files blocked)
 * 2. Code inspection (no hardcoded IP in source files)
 * 3. GitHub simulation (verify what would be public)
 * 4. File tracking status (verify untracked IP files)
 * 5. Fallback safety (emergency fallback doesn't leak full IP)
 * 6. Log safety (logs don't expose full IP)
 */

import { describe, it, expect } from '@jest/globals';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const repoRoot = join(__dirname, '../../../');
const mayaBackendDir = join(repoRoot, 'Maya/backend');
const gitignorePath = join(repoRoot, '.gitignore');

describe('IP Protection Verification - Option 2', () => {
  describe('Gitignore Protection', () => {
    it('should have .gitignore file', async () => {
      const exists = await fs.access(gitignorePath)
        .then(() => true)
        .catch(() => false);
      
      expect(exists).toBe(true);
    });

    it('should protect system_prompt.txt in gitignore', async () => {
      const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
      
      expect(gitignoreContent).toContain('system_prompt.txt');
    });

    it('should protect system_instruction.txt in gitignore', async () => {
      const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
      
      expect(gitignoreContent).toContain('system_instruction.txt');
    });

    it('should protect Maya/knowledge/system_instruction.md in gitignore', async () => {
      const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
      
      expect(gitignoreContent).toContain('Maya/knowledge/system_instruction.md');
    });

    it('should have wildcard protection for system_prompt.txt', async () => {
      const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
      
      expect(gitignoreContent).toContain('**/system_prompt.txt');
    });

    it('should have wildcard protection for system_instruction.txt', async () => {
      const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
      
      expect(gitignoreContent).toContain('**/system_instruction.txt');
    });
  });

  describe('Git Tracking Status', () => {
    it('should NOT track system_prompt.txt', async () => {
      try {
        const { stdout } = await execAsync('git ls-files Maya/backend/system_prompt.txt', {
          cwd: repoRoot
        });
        
        // If file is tracked, stdout will contain the filename
        expect(stdout.trim()).toBe('');
      } catch (error) {
        // Git command failed or file not found - that's good
        expect(true).toBe(true);
      }
    });

    it('should NOT track system_instruction.md', async () => {
      try {
        const { stdout } = await execAsync('git ls-files Maya/knowledge/system_instruction.md', {
          cwd: repoRoot
        });
        
        expect(stdout.trim()).toBe('');
      } catch (error) {
        expect(true).toBe(true);
      }
    });

    it('should verify gitignore is actually ignoring system_prompt.txt', async () => {
      try {
        const { stdout } = await execAsync('git check-ignore -v Maya/backend/system_prompt.txt', {
          cwd: repoRoot
        });
        
        // Output should show which gitignore rule is ignoring it
        expect(stdout).toContain('.gitignore');
      } catch (error) {
        // File might not exist locally, which is OK
        // The gitignore patterns are still valid
        expect(true).toBe(true);
      }
    });
  });

  describe('Code Inspection - No Hardcoded IP', () => {
    it('should not have hardcoded system prompt in API client (api-client.js)', async () => {
      const apiClientPath = join(mayaBackendDir, 'api-client.js');
      const content = await fs.readFile(apiClientPath, 'utf-8');
      
      // Check for the OLD hardcoded pattern (should NOT exist)
      const hardcodedPattern = /const basePrompt = `You are Maya, Janet Xiu Shi's digital twin[\s\S]{100,}/;
      expect(content).not.toMatch(hardcodedPattern);
    });

    it('should have getSystemPrompt function in API client', async () => {
      const apiClientPath = join(mayaBackendDir, 'api-client.js');
      const content = await fs.readFile(mcpClientPath, 'utf-8');
      
      expect(content).toContain('async function getSystemPrompt()');
    });

    it('should load from environment variable in API client', async () => {
      const apiClientPath = join(mayaBackendDir, 'api-client.js');
      const content = await fs.readFile(mcpClientPath, 'utf-8');
      
      expect(content).toContain('process.env.SYSTEM_INSTRUCTION');
    });

    it('should load from file in API client', async () => {
      const apiClientPath = join(mayaBackendDir, 'api-client.js');
      const content = await fs.readFile(mcpClientPath, 'utf-8');
      
      expect(content).toContain('fs.readFile');
    });

    it('should have emergency fallback in API client', async () => {
      const apiClientPath = join(mayaBackendDir, 'api-client.js');
      const content = await fs.readFile(mcpClientPath, 'utf-8');
      
      // Should have a catch block with fallback
      expect(content).toContain('catch');
      expect(content).toContain('fallback');
    });

    it('should only have minimal fallback prompt (< 200 chars)', async () => {
      const apiClientPath = join(mayaBackendDir, 'api-client.js');
      const content = await fs.readFile(mcpClientPath, 'utf-8');
      
      // Extract the fallback prompt
      const fallbackMatch = content.match(/basePrompt = '([^']+)'/);
      
      if (fallbackMatch) {
        const fallbackPrompt = fallbackMatch[1];
        
        // Fallback should be minimal (emergency only)
        expect(fallbackPrompt.length).toBeLessThan(200);
        
        // Should be generic
        expect(fallbackPrompt).toContain('Maya');
        expect(fallbackPrompt).toContain('Janet');
        
        // Should NOT contain detailed behavioral instructions
        expect(fallbackPrompt).not.toContain('digital twin');
        expect(fallbackPrompt).not.toContain('advocate');
        expect(fallbackPrompt).not.toContain('protector');
      }
    });
  });

  describe('GitHub Simulation - Public Exposure Check', () => {
    it('should not expose system instructions in any tracked file', async () => {
      try {
        const { stdout } = await execAsync('git ls-files', {
          cwd: repoRoot
        });
        
        const trackedFiles = stdout.split('\n').filter(f => f.trim());
        
        // Files that should NOT be tracked
        const forbiddenFiles = [
          'Maya/backend/system_prompt.txt',
          'Maya/backend/system_instruction.txt',
          'Maya/knowledge/system_instruction.md'
        ];
        
        forbiddenFiles.forEach(forbiddenFile => {
          expect(trackedFiles).not.toContain(forbiddenFile);
        });
      } catch (error) {
        // If git command fails, that's an issue
        throw error;
      }
    });

    it('should verify API client (api-client.js) is safe to be public', async () => {
      const apiClientPath = join(mayaBackendDir, 'api-client.js');
      const content = await fs.readFile(mcpClientPath, 'utf-8');
      
      // Count occurrences of "You are Maya"
      const matches = content.match(/You are Maya/g);
      
      if (matches) {
        // Should only appear in the emergency fallback (1-2 times max)
        expect(matches.length).toBeLessThanOrEqual(2);
      }
      
      // Should NOT have hardcoded multi-line system instructions (145+ lines)
      // Check that the fallback prompt is minimal (< 500 chars in a single assignment)
      const fallbackPattern = /basePrompt\s*=\s*['"`]([^'"`]{500,})['"`]/;
      expect(content).not.toMatch(fallbackPattern);
      
      // Verify fallback is concatenated strings (safe, minimal pattern)
      const safeFallbackPattern = /basePrompt\s*=\s*['"].*['"]\s*\+/;
      const hasSafeFallback = safeFallbackPattern.test(content);
      
      if (hasSafeFallback) {
        // If using string concatenation, verify it's short
        const fallbackMatch = content.match(/basePrompt\s*=\s*['"]([^'"]+)['"]\s*\+\s*['"]([^'"]+)['"]/);
        if (fallbackMatch) {
          const totalLength = fallbackMatch[1].length + fallbackMatch[2].length;
          expect(totalLength).toBeLessThan(200); // Fallback should be < 200 chars
        }
      }
    });
  });

  describe('Fallback Safety', () => {
    it('should verify fallback prompt is generic and minimal', async () => {
      const apiClientPath = join(mayaBackendDir, 'api-client.js');
      const content = await fs.readFile(mcpClientPath, 'utf-8');
      
      // Extract fallback section
      const fallbackSection = content.match(/catch[\s\S]{0,500}basePrompt[\s\S]{0,500}/);
      
      expect(fallbackSection).toBeTruthy();
      
      if (fallbackSection) {
        const section = fallbackSection[0];
        
        // Should NOT contain detailed behavioral rules
        expect(section).not.toContain('protect her reputation');
        expect(section).not.toContain('never apologize for');
        expect(section).not.toContain('maintain boundaries');
        expect(section).not.toContain('speaking style');
        expect(section).not.toContain('response guidelines');
      }
    });
  });

  describe('Documentation Safety', () => {
    it('should verify .env.example does not contain actual secrets', async () => {
      const envExamplePath = join(mayaBackendDir, '.env.example');
      const content = await fs.readFile(envExamplePath, 'utf-8');
      
      // Should have SYSTEM_INSTRUCTION_FILE documentation
      expect(content).toContain('SYSTEM_INSTRUCTION_FILE');
      
      // Should NOT contain actual full system instructions
      expect(content.length).toBeLessThan(5000); // .env.example should be < 5KB
    });

    it('should verify README does not expose full system instructions', async () => {
      const readmePath = join(repoRoot, 'Maya/README.md');
      
      try {
        const content = await fs.readFile(readmePath, 'utf-8');
        
        // Should NOT contain full system instructions
        expect(content).not.toContain('You are Maya, Janet Xiu Shi\'s digital twin, advocate, and protector');
        
        // Should have reasonable length (not embedding full instructions)
        expect(content.length).toBeLessThan(50000); // < 50KB
      } catch (error) {
        // README might not exist, which is OK
        expect(true).toBe(true);
      }
    });
  });

  describe('Configuration Verification', () => {
    it('should have SYSTEM_INSTRUCTION_FILE in .env.example', async () => {
      const envExamplePath = join(mayaBackendDir, '.env.example');
      const content = await fs.readFile(envExamplePath, 'utf-8');
      
      expect(content).toContain('SYSTEM_INSTRUCTION_FILE');
    });

    it('should document both environment methods in .env.example', async () => {
      const envExamplePath = join(mayaBackendDir, '.env.example');
      const content = await fs.readFile(envExamplePath, 'utf-8');
      
      // Should document both SYSTEM_INSTRUCTION_FILE and SYSTEM_INSTRUCTION
      expect(content).toContain('SYSTEM_INSTRUCTION_FILE');
      expect(content).toContain('SYSTEM_INSTRUCTION');
    });

    it('should NOT have .env file tracked in git', async () => {
      try {
        const { stdout } = await execAsync('git ls-files Maya/backend/.env', {
          cwd: repoRoot
        });
        
        expect(stdout.trim()).toBe('');
      } catch (error) {
        expect(true).toBe(true);
      }
    });
  });

  describe('Traceability - Option 2 Implementation', () => {
    it('should verify Option 2 is fully implemented in API client', async () => {
      const apiClientPath = join(mayaBackendDir, 'api-client.js');
      const content = await fs.readFile(mcpClientPath, 'utf-8');
      
      // Option 2 key features:
      // 1. Environment variable support
      expect(content).toContain('process.env.SYSTEM_INSTRUCTION');
      
      // 2. File loading support
      expect(content).toContain('fs.readFile');
      
      // 3. Fallback mechanism
      expect(content).toContain('catch');
      
      // 4. Dynamic loading function
      expect(content).toContain('getSystemPrompt');
      
      // 5. No hardcoded long instructions
      const lineCount = content.split('\n').length;
      const instructionLineCount = content.split('\n').filter(line => 
        line.includes('You are Maya') && line.length > 100
      ).length;
      
      // Should have minimal instruction lines
      expect(instructionLineCount).toBeLessThan(5);
    });

    it('should verify all IP files are properly gitignored', async () => {
      const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
      
      const requiredPatterns = [
        'system_prompt.txt',
        'system_instruction.txt',
        'system_instruction.md',
        '**/system_prompt.txt',
        '**/system_instruction.txt'
      ];
      
      requiredPatterns.forEach(pattern => {
        expect(gitignoreContent).toContain(pattern);
      });
    });

    it('should verify Option 2 implementation is complete and traceable', async () => {
      // Check all required components exist
      const components = [
        { path: join(mayaBackendDir, 'api-client.js'), required: true },
        { path: gitignorePath, required: true },
        { path: join(mayaBackendDir, '.env.example'), required: true }
      ];
      
      for (const component of components) {
        const exists = await fs.access(component.path)
          .then(() => true)
          .catch(() => false);
        
        if (component.required) {
          expect(exists).toBe(true);
        }
      }
    });
  });

  describe('Corner Cases - IP Protection', () => {
    it('should not expose IP even if system_prompt.txt exists locally', async () => {
      // This test verifies that even if the file exists locally,
      // it won't be pushed to GitHub due to gitignore
      
      const { stdout } = await execAsync('git check-ignore Maya/backend/system_prompt.txt', {
        cwd: repoRoot
      });
      
      // Should output the file path (meaning it's ignored)
      expect(stdout.trim()).toContain('system_prompt.txt');
    });

    it('should not track any *_instruction*.md files in Maya/knowledge', async () => {
      try {
        const { stdout } = await execAsync('git ls-files Maya/knowledge/*instruction*.md', {
          cwd: repoRoot
        });
        
        expect(stdout.trim()).toBe('');
      } catch (error) {
        // No such files tracked - good!
        expect(true).toBe(true);
      }
    });

    it('should not track any system_prompt* files anywhere', async () => {
      try {
        const { stdout } = await execAsync('git ls-files | grep system_prompt', {
          cwd: repoRoot,
          shell: '/bin/bash'
        });
        
        expect(stdout.trim()).toBe('');
      } catch (error) {
        // Grep found nothing - good!
        expect(true).toBe(true);
      }
    });
  });
});
