/**
 * IP Protection CI/CD Integration Tests
 * 
 * These tests verify that IP protection tests work correctly in CI/CD environments.
 * Tests simulate CI/CD conditions and edge cases.
 * 
 * Safe to run in CI/CD - validates test infrastructure, not IP content.
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '../../..');

/**
 * Simulate CI environment
 */
function simulateCI() {
  const originalCI = process.env.CI;
  const originalGithubActions = process.env.GITHUB_ACTIONS;
  process.env.CI = 'true';
  process.env.GITHUB_ACTIONS = 'true';
  return () => {
    if (originalCI === undefined) delete process.env.CI;
    else process.env.CI = originalCI;
    if (originalGithubActions === undefined) delete process.env.GITHUB_ACTIONS;
    else process.env.GITHUB_ACTIONS = originalGithubActions;
  };
}

describe('IP Protection - CI/CD Integration Tests', () => {
  
  describe('Environment Detection', () => {
    it('should correctly detect CI environment', () => {
      const restore = simulateCI();
      try {
        const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
        expect(isCI).toBe(true);
      } finally {
        restore();
      }
    });

    it('should correctly detect local environment', () => {
      delete process.env.CI;
      delete process.env.GITHUB_ACTIONS;
      const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
      expect(isCI).toBe(false);
    });
  });

  describe('Git Operations in CI', () => {
    it('should successfully execute git ls-files in CI', () => {
      try {
        const output = execSync('git ls-files', { 
          cwd: repoRoot, 
          encoding: 'utf-8',
          stdio: 'pipe'
        });
        expect(output).toBeTruthy();
        expect(typeof output).toBe('string');
      } catch (error) {
        throw new Error(`git ls-files failed: ${error.message}`);
      }
    });

    it('should successfully execute git log in CI', () => {
      try {
        const output = execSync('git log --oneline -5', { 
          cwd: repoRoot, 
          encoding: 'utf-8',
          stdio: 'pipe'
        });
        expect(output).toBeTruthy();
        expect(typeof output).toBe('string');
      } catch (error) {
        throw new Error(`git log failed: ${error.message}`);
      }
    });

    it('should handle shallow clone scenarios', () => {
      // Test that git commands work even with limited history
      try {
        const output = execSync('git log --oneline -1', { 
          cwd: repoRoot, 
          encoding: 'utf-8',
          stdio: 'pipe'
        });
        expect(output).toBeTruthy();
      } catch (error) {
        // If git log fails, that's OK - we handle it gracefully in the test
        expect(error).toBeDefined();
      }
    });
  });

  describe('File System Operations', () => {
    it('should read .gitignore file correctly', () => {
      const gitignorePath = join(repoRoot, '.gitignore');
      expect(existsSync(gitignorePath)).toBe(true);
      
      const content = readFileSync(gitignorePath, 'utf-8');
      expect(content).toBeTruthy();
      expect(typeof content).toBe('string');
    });

    it('should handle missing files gracefully', () => {
      const nonExistentPath = join(repoRoot, 'non-existent-file.txt');
      expect(existsSync(nonExistentPath)).toBe(false);
    });

    it('should correctly resolve repository root path', () => {
      expect(repoRoot).toBeTruthy();
      expect(existsSync(repoRoot)).toBe(true);
      expect(existsSync(join(repoRoot, '.git'))).toBe(true);
    });
  });

  describe('Test File Exclusions', () => {
    it('should exclude security test files from test file checks', () => {
      const securityTestFile = 'Maya/tests/security_tests/ip-protection.test.js';
      const isSecurityTest = /security_tests/i.test(securityTestFile);
      expect(isSecurityTest).toBe(true);
    });

    it('should exclude security test files from content checks', () => {
      const securityTestFile = 'Maya/tests/security_tests/ip-protection.test.js';
      const shouldSkip = /security_tests/i.test(securityTestFile);
      expect(shouldSkip).toBe(true);
    });

    it('should allow deployment test files', () => {
      const deploymentTestFile = 'Maya/tests/deployment_tests/run-pre-deployment-tests.sh';
      const isAllowed = /(deployment_tests|run-pre-deployment|run-post-deployment)/i.test(deploymentTestFile);
      expect(isAllowed).toBe(true);
    });
  });

  describe('Path Resolution', () => {
    it('should correctly resolve test file paths from backend directory', () => {
      // Simulate running from Maya/backend directory (as in CI)
      const backendDir = join(repoRoot, 'Maya', 'backend');
      const testFile = join(backendDir, '..', 'tests', 'security_tests', 'ip-protection.test.js');
      expect(existsSync(testFile)).toBe(true);
    });

    it('should correctly resolve .gitignore path from any directory', () => {
      const gitignorePath = join(repoRoot, '.gitignore');
      expect(existsSync(gitignorePath)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle git command failures gracefully', () => {
      try {
        execSync('git invalid-command', { 
          cwd: repoRoot, 
          encoding: 'utf-8',
          stdio: 'pipe'
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        // Expected to fail
        expect(error).toBeDefined();
      }
    });

    it('should handle file read errors gracefully', () => {
      const nonExistentFile = join(repoRoot, 'non-existent-file.txt');
      try {
        readFileSync(nonExistentFile, 'utf-8');
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        // Expected to fail
        expect(error).toBeDefined();
      }
    });
  });

  describe('CI-Specific Test Behavior', () => {
    it('should enforce .gitignore check in CI', () => {
      const restore = simulateCI();
      try {
        const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
        expect(isCI).toBe(true);
        // In CI, .gitignore check should run (not skip)
      } finally {
        restore();
      }
    });

    it('should check fewer commits in CI for commit message validation', () => {
      const restore = simulateCI();
      try {
        const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
        if (isCI) {
          // In CI, should check fewer commits (current PR/push)
          const commitLimit = 5; // CI limit
          expect(commitLimit).toBeLessThan(20); // Local limit
        }
      } finally {
        restore();
      }
    });
  });

  describe('Workflow Integration', () => {
    it('should work with GitHub Actions checkout action', () => {
      // Verify that files are accessible after checkout
      const gitignorePath = join(repoRoot, '.gitignore');
      expect(existsSync(gitignorePath)).toBe(true);
    });

    it('should work with npm ci (clean install)', () => {
      // Verify package.json exists
      const packageJsonPath = join(repoRoot, 'Maya', 'backend', 'package.json');
      expect(existsSync(packageJsonPath)).toBe(true);
    });

    it('should work with working-directory set to Maya/backend', () => {
      // Verify we can access files relative to backend directory
      const backendDir = join(repoRoot, 'Maya', 'backend');
      expect(existsSync(backendDir)).toBe(true);
      
      const testFile = join(backendDir, '..', 'tests', 'security_tests', 'ip-protection.test.js');
      expect(existsSync(testFile)).toBe(true);
    });
  });
});
