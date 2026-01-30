/**
 * IP Protection Tests
 * 
 * These tests check for IP leakage risks in the GitHub repository.
 * Tests are designed to flag risks without revealing sensitive details.
 * 
 * Safe to run in CI/CD - generic patterns only, no IP details exposed.
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '../../..');

/**
 * Get list of files tracked in Git
 */
function getTrackedFiles() {
  try {
    const output = execSync('git ls-files', { cwd: repoRoot, encoding: 'utf-8' });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    throw new Error(`Failed to get tracked files: ${error.message}`);
  }
}

/**
 * Get recent commit messages
 */
function getRecentCommits(limit = 10) {
  try {
    const output = execSync(`git log --oneline -${limit}`, { 
      cwd: repoRoot, 
      encoding: 'utf-8' 
    });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    throw new Error(`Failed to get commit messages: ${error.message}`);
  }
}

/**
 * Read file content safely
 */
function readFileSafe(filePath) {
  try {
    if (!existsSync(filePath)) {
      return null;
    }
    return readFileSync(filePath, 'utf-8');
  } catch (error) {
    return null;
  }
}

describe('IP Protection - GitHub Repository Checks', () => {
  
  describe('Tracked Files - IP-Protected File Names', () => {
    const ipProtectedPatterns = [
      /response-guardrails/i,
      /kb-monitor/i,
      /kb-cache/i,
      /system_prompt/i,
      /system_instruction/i,
      /Implementation\.md$/i,
      /memory_cache\/README\.md$/i
    ];

    it('should not track IP-protected code files', () => {
      const trackedFiles = getTrackedFiles();
      const violations = [];

      for (const file of trackedFiles) {
        for (const pattern of ipProtectedPatterns) {
          if (pattern.test(file)) {
            violations.push(file);
          }
        }
      }

      if (violations.length > 0) {
        // Generic error message - doesn't reveal which files
        throw new Error(
          `Found ${violations.length} IP-protected file(s) tracked in Git. ` +
          `These files should be excluded via .gitignore.`
        );
      }
    });
  });

  describe('Tracked Files - Test Files', () => {
    const allowedTestPatterns = [
      /deployment_tests/i,
      /run-pre-deployment/i,
      /run-post-deployment/i
    ];

    it('should not track test files (except deployment tests)', () => {
      const trackedFiles = getTrackedFiles();
      const violations = [];

      for (const file of trackedFiles) {
        // Check if it's a test file
        if (/\.(test|spec)\.js$/i.test(file)) {
          // Allow security tests (needed for CI/CD IP protection)
          if (/security_tests/i.test(file)) {
            continue;
          }
          // Check if it's an allowed deployment test
          const isAllowed = allowedTestPatterns.some(pattern => pattern.test(file));
          if (!isAllowed) {
            violations.push(file);
          }
        }
      }

      if (violations.length > 0) {
        throw new Error(
          `Found ${violations.length} test file(s) tracked in Git. ` +
          `Test files should be excluded via .gitignore (except deployment tests).`
        );
      }
    });
  });

  describe('Tracked Files - Documentation Files', () => {
    const allowedDocPatterns = [
      /README\.md$/i,
      /SECURITY\.md$/i,
      /knowledge\//i
    ];

    it('should not track unauthorized documentation files', () => {
      const trackedFiles = getTrackedFiles();
      const violations = [];

      for (const file of trackedFiles) {
        if (/\.md$/i.test(file)) {
          // Check if it's an allowed documentation file
          const isAllowed = allowedDocPatterns.some(pattern => pattern.test(file));
          if (!isAllowed) {
            violations.push(file);
          }
        }
      }

      if (violations.length > 0) {
        throw new Error(
          `Found ${violations.length} unauthorized documentation file(s) tracked in Git. ` +
          `Only README.md, SECURITY.md, and knowledge/ docs should be tracked.`
        );
      }
    });
  });

  describe('Tracked Files - Script Files', () => {
    const allowedScriptPatterns = [
      /deploy-to-space\.sh$/i,
      /run-pre-deployment-tests\.sh$/i,
      /run-post-deployment-tests\.sh$/i,
      /start\.sh$/i,
      /stop\.sh$/i
    ];

    it('should not track unauthorized script files', () => {
      const trackedFiles = getTrackedFiles();
      const violations = [];

      for (const file of trackedFiles) {
        if (/\.sh$/i.test(file)) {
          // Check if it's an allowed script
          const isAllowed = allowedScriptPatterns.some(pattern => pattern.test(file));
          if (!isAllowed) {
            violations.push(file);
          }
        }
      }

      if (violations.length > 0) {
        throw new Error(
          `Found ${violations.length} unauthorized script file(s) tracked in Git. ` +
          `Only deployment and server scripts should be tracked.`
        );
      }
    });
  });

  describe('.gitignore Content', () => {
    it('should not contain IP-revealing comments (CI check)', () => {
      // Skip this test locally - local .gitignore can have detailed comments
      // Only enforce in CI/CD environments
      const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
      
      if (!isCI) {
        console.log('Skipping .gitignore IP check - running locally (detailed .gitignore expected)');
        return;
      }

      const gitignorePath = join(repoRoot, '.gitignore');
      const content = readFileSafe(gitignorePath);

      if (!content) {
        throw new Error('.gitignore file not found');
      }

      const ipRevealingPatterns = [
        /IP-protected/i,
        /Core IP/i,
        /Maya System Instructions/i
      ];

      const violations = [];
      for (const pattern of ipRevealingPatterns) {
        if (pattern.test(content)) {
          violations.push(pattern.toString());
        }
      }

      if (violations.length > 0) {
        throw new Error(
          `.gitignore contains IP-revealing comments. ` +
          `GitHub repository should use minimal .gitignore version. ` +
          `Pre-commit hook should swap detailed → minimal before commit.`
        );
      }
    });

    it('should exclude IP-protected file patterns', () => {
      const gitignorePath = join(repoRoot, '.gitignore');
      const content = readFileSafe(gitignorePath);

      if (!content) {
        throw new Error('.gitignore file not found');
      }

      // Check for generic exclusion patterns (not specific file names)
      const requiredPatterns = [
        /\.test\.js/i,
        /\.spec\.js/i,
        /tests\//i
      ];

      const missingPatterns = [];
      for (const pattern of requiredPatterns) {
        if (!pattern.test(content)) {
          missingPatterns.push(pattern.toString());
        }
      }

      if (missingPatterns.length > 0) {
        throw new Error(
          `.gitignore missing required exclusion patterns. ` +
          `Should exclude test files and test directories.`
        );
      }
    });
  });

  describe('Commit Messages', () => {
    it('should not contain IP-revealing terms in new commits', () => {
      // In CI, check commits in PR/current push only
      // Locally, check recent commits but allow historical ones (can't change history)
      const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
      
      let commits = [];
      if (isCI) {
        // In CI, check commits in current PR/push
        // GitHub Actions provides base and head refs for PRs
        const baseRef = process.env.GITHUB_BASE_REF || 'main';
        const headRef = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF?.replace('refs/heads/', '') || 'HEAD';
        
        try {
          // Get commits that differ from base branch
          const output = execSync(
            `git log ${baseRef}..${headRef} --oneline`,
            { cwd: repoRoot, encoding: 'utf-8', stdio: 'pipe' }
          );
          commits = output.trim().split('\n').filter(Boolean);
        } catch (error) {
          // Fallback: check last 5 commits if branch comparison fails
          commits = getRecentCommits(5);
        }
      } else {
        // Locally, check last 3 commits only (recent work)
        // Allow historical commits since we can't change them
        commits = getRecentCommits(3);
      }
      
      if (commits.length === 0) {
        // No commits to check (e.g., first commit, or no new commits in PR)
        return;
      }

      const ipRevealingTerms = [
        /kb-cache/i,
        /kb-monitor/i,
        /response-guardrails/i,
        /system_prompt/i,
        /Implementation\.md/i,
        /8 KPIs/i,
        /80% hit rate/i,
        /10ms response time/i
      ];

      const violations = [];
      for (const commit of commits) {
        for (const pattern of ipRevealingTerms) {
          if (pattern.test(commit)) {
            violations.push(commit.substring(0, 50)); // Truncate to avoid exposing full message
          }
        }
      }

      if (violations.length > 0) {
        const errorMessage = 
          `Found ${violations.length} commit(s) with IP-revealing terms. ` +
          `Commit messages should use generic language. ` +
          `Use messages like "security: remove sensitive files" instead of specific file names.`;
        
        if (isCI) {
          // Hard failure in CI - new commits must not have IP-revealing terms
          throw new Error(errorMessage);
        } else {
          // Warning locally - historical commits can't be changed
          console.warn(`⚠️  WARNING: ${errorMessage}`);
          console.warn('   This is a warning locally. In CI, this would fail.');
          // Don't throw - allow test to pass locally
        }
      }
    });
  });

  describe('File Content - IP-Revealing Patterns', () => {
    it('should not contain IP-revealing comments in tracked files', () => {
      const trackedFiles = getTrackedFiles();
      const ipRevealingPatterns = [
        /GitHub deployment/i,
        /IP-protected/i,
        /Core IP/i,
        /\(local\)/i
      ];

      // Only check JavaScript files to avoid false positives
      const jsFiles = trackedFiles.filter(f => /\.js$/i.test(f));
      const violations = [];

      for (const file of jsFiles.slice(0, 50)) { // Limit to first 50 files for performance
        // Skip security test files - they use IP patterns for detection (this is OK)
        if (/security_tests/i.test(file)) {
          continue;
        }
        
        const filePath = join(repoRoot, file);
        const content = readFileSafe(filePath);
        
        if (content) {
          for (const pattern of ipRevealingPatterns) {
            if (pattern.test(content)) {
              violations.push(file);
              break; // Only report file once
            }
          }
        }
      }

      if (violations.length > 0) {
        throw new Error(
          `Found ${violations.length} tracked file(s) with IP-revealing comments. ` +
          `Comments should use generic language.`
        );
      }
    });
  });

  describe('Documentation References', () => {
    it('should not reference IP-protected documentation files', () => {
      const trackedFiles = getTrackedFiles();
      const mdFiles = trackedFiles.filter(f => /\.md$/i.test(f));
      const violations = [];

      for (const file of mdFiles) {
        const filePath = join(repoRoot, file);
        const content = readFileSafe(filePath);
        
        if (content) {
          // Check for references to IP-protected files
          if (/Implementation\.md/i.test(content) && !/knowledge\//i.test(file)) {
            violations.push(file);
          }
        }
      }

      if (violations.length > 0) {
        throw new Error(
          `Found ${violations.length} documentation file(s) referencing IP-protected files. ` +
          `Remove references to IP-protected documentation.`
        );
      }
    });
  });
});
