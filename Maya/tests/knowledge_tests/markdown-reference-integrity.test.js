/**
 * Markdown Reference Integrity Tests
 * 
 * Ensures all markdown file references are valid and no broken links exist.
 * Prevents errors, security issues, hang vulnerabilities, and performance problems
 * when documentation is updated.
 * 
 * This test should be run:
 * - Before committing documentation changes
 * - As part of CI/CD pipeline
 * - After merging documentation files
 */

import { describe, test, expect } from '@jest/globals';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative, normalize } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MAYA_ROOT = join(__dirname, '../..');
const KNOWLEDGE_DIR = join(MAYA_ROOT, 'knowledge');
const BACKEND_DIR = join(MAYA_ROOT, 'backend');

/**
 * Extract markdown file references from content
 */
function extractMarkdownReferences(content, filePath) {
  const references = [];
  
  // Match markdown links: [text](./path.md) or [text](../path.md)
  const linkPattern = /\[([^\]]+)\]\(([^)]+\.md[^)]*)\)/g;
  let match;
  
  while ((match = linkPattern.exec(content)) !== null) {
    const [, linkText, linkPath] = match;
    
    // Skip example patterns (FILE_NAME, RELATED_FILE, ACTUAL_FILE_NAME, etc.)
    if (/FILE_NAME|RELATED_FILE|ACTUAL_FILE|EXAMPLE|PATTERN|TEMPLATE/i.test(linkPath)) {
      continue;
    }
    
    const fullPath = resolveMarkdownPath(linkPath, filePath);
    references.push({
      text: linkText,
      path: linkPath,
      fullPath,
      line: content.substring(0, match.index).split('\n').length,
      file: filePath
    });
  }
  
  // Match code references: `KB_STRATEGY.md`, `IMPLEMENTATION_SUMMARY.md`, etc.
  // But skip if it's in a code block or example section
  const codeRefPattern = /`([A-Z_]+\.md)`/g;
  while ((match = codeRefPattern.exec(content)) !== null) {
    const [, fileName] = match;
    const lineContent = content.substring(0, match.index).split('\n').pop();
    
    // Skip if it's in a code block (indented or fenced)
    const beforeMatch = content.substring(Math.max(0, match.index - 100), match.index);
    const isInCodeBlock = beforeMatch.includes('```') || beforeMatch.match(/^\s{4,}/m);
    
    // Skip if it's clearly an example (contains "Example", "Format", "Pattern", etc.)
    const isExample = /example|format|pattern|template|sample/i.test(lineContent);
    
    if (!isInCodeBlock && !isExample) {
      const fullPath = resolveMarkdownPath(fileName, filePath);
      references.push({
        text: fileName,
        path: fileName,
        fullPath,
        line: content.substring(0, match.index).split('\n').length,
        file: filePath,
        type: 'code-reference'
      });
    }
  }
  
  return references;
}

/**
 * Resolve markdown path relative to current file
 */
function resolveMarkdownPath(linkPath, fromFile) {
  // Remove query strings and anchors
  const cleanPath = linkPath.split('?')[0].split('#')[0];
  
  // If absolute path
  if (cleanPath.startsWith('/')) {
    return join(MAYA_ROOT, cleanPath);
  }
  
  // If relative path (starts with ./ or ../)
  const fromDir = dirname(fromFile);
  let resolvedPath = join(fromDir, cleanPath);
  
  // Normalize path (resolve .. and .)
  try {
    // Use path normalization to resolve .. and .
    resolvedPath = normalize(resolvedPath);
    
    // Check if resolved path exists
    if (existsSync(resolvedPath)) {
      return resolvedPath;
    }
    
    // If path doesn't exist, try alternative resolutions
    // This handles cases where relative paths might resolve differently
    
    // Handle relative paths with ../
    if (cleanPath.startsWith('../')) {
      // Count how many ../ we have
      const upLevels = (cleanPath.match(/\.\.\//g) || []).length;
      const remainingPath = cleanPath.replace(/^(\.\.\/)+/, '');
      
      // Go up from fromDir
      let baseDir = fromDir;
      for (let i = 0; i < upLevels; i++) {
        baseDir = dirname(baseDir);
      }
      
      const upResolved = join(baseDir, remainingPath);
      if (existsSync(upResolved)) {
        return upResolved;
      }
    }
    
    // Try resolving relative to MAYA_ROOT
    const relativeToRoot = join(MAYA_ROOT, cleanPath.replace(/^\.\.\//, ''));
    if (existsSync(relativeToRoot)) {
      return relativeToRoot;
    }
    
    // Try resolving from knowledge directory (if path contains knowledge/)
    if (cleanPath.includes('knowledge/')) {
      const knowledgePath = cleanPath.replace(/.*knowledge\//, '');
      const knowledgeResolved = join(KNOWLEDGE_DIR, knowledgePath);
      if (existsSync(knowledgeResolved)) {
        return knowledgeResolved;
      }
    }
    
    // Try resolving from tests directory (if path contains tests/)
    if (cleanPath.includes('tests/')) {
      const testsPath = cleanPath.replace(/.*tests\//, '');
      const testsResolved = join(MAYA_ROOT, 'tests', testsPath);
      if (existsSync(testsResolved)) {
        return testsResolved;
      }
    }
    
    // Try resolving from knowledge_tests directory
    if (cleanPath.includes('knowledge_tests/')) {
      const knowledgeTestsPath = cleanPath.replace(/.*knowledge_tests\//, '');
      const knowledgeTestsResolved = join(MAYA_ROOT, 'tests/knowledge_tests', knowledgeTestsPath);
      if (existsSync(knowledgeTestsResolved)) {
        return knowledgeTestsResolved;
      }
    }
    
    // Try resolving from backend directory (if path contains backend/)
    if (cleanPath.includes('backend/')) {
      const backendPath = cleanPath.replace(/.*backend\//, '');
      const backendResolved = join(BACKEND_DIR, backendPath);
      if (existsSync(backendResolved)) {
        return backendResolved;
      }
    }
    
    // Return original resolved path (will be checked for existence later)
    return resolvedPath;
  } catch (error) {
    // If path resolution fails, return original resolved path
    return resolvedPath;
  }
}

/**
 * Find all markdown files recursively
 */
function findAllMarkdownFiles(dir, fileList = []) {
  try {
    const files = readdirSync(dir);
    
    for (const file of files) {
      const filePath = join(dir, file);
      
      try {
        const stat = statSync(filePath);
        
        if (stat.isDirectory()) {
          // Skip node_modules and other ignored directories
          if (!['node_modules', '.git', 'embeddings', 'processed', 'pdfs'].includes(file)) {
            findAllMarkdownFiles(filePath, fileList);
          }
        } else if (file.endsWith('.md')) {
          fileList.push(filePath);
        }
      } catch (error) {
        // File may have been deleted between readdirSync and statSync
        // Skip it and continue
        if (error.code !== 'ENOENT') {
          // Re-throw if it's not a "file not found" error
          throw error;
        }
        // Otherwise, silently skip the file
      }
    }
  } catch (error) {
    // Directory may not exist or be inaccessible
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
  
  return fileList;
}

/**
 * Check if file exists (with common variations)
 */
function checkFileExists(filePath) {
  // Direct check
  if (existsSync(filePath)) {
    return { exists: true, path: filePath };
  }
  
  // Check common variations
  const variations = [
    filePath.replace(/\.md$/, '.MD'),
    filePath.replace(/KB_/g, 'kb_'),
    filePath.replace(/IMPLEMENTATION_/g, 'implementation_'),
  ];
  
  for (const variant of variations) {
    if (existsSync(variant)) {
      return { exists: true, path: variant, note: 'case-variant' };
    }
  }
  
  return { exists: false, path: filePath };
}

describe('Markdown Reference Integrity', () => {
  let allMarkdownFiles;
  let allReferences;
  
  beforeAll(() => {
    // Find all markdown files
    allMarkdownFiles = [
      ...findAllMarkdownFiles(MAYA_ROOT),
      ...findAllMarkdownFiles(BACKEND_DIR)
    ];
    
    // Extract all references
    allReferences = [];
    for (const file of allMarkdownFiles) {
      try {
        const content = readFileSync(file, 'utf-8');
        const refs = extractMarkdownReferences(content, file);
        allReferences.push(...refs);
      } catch (error) {
        // Skip files that can't be read
        console.warn(`Warning: Could not read ${file}:`, error.message);
      }
    }
  });

  test('all markdown file references should exist', () => {
    const brokenRefs = [];
    
    // Exclude consolidation reports, analysis files, and historical timeline documents
    // - they are expected to mention old files historically
    const excludedFiles = [
      'knowledge/CONSOLIDATION_REPORT.md',
      'knowledge/CONSOLIDATION_ANALYSIS_QUICK_START_REORG.md',
      'knowledge/FILE_REVIEW_ANALYSIS_2.md',
      'knowledge/DOCS_REVIEW_ANALYSIS_3.md',
      'tests/JAN_11_2026_TIMELINE.md', // Historical timeline document
      'tests/CPU_USAGE_REVIEW_SUMMARY.md', // Historical review document
      'OPTION2_DOCUMENTATION_REVIEW.md' // OPTION2 consolidation review - January 25, 2026
    ];
    
    for (const ref of allReferences) {
      // Skip excluded files - they are expected to mention old files
      const relativePath = relative(MAYA_ROOT, ref.file);
      // Check both with and without "Maya/" prefix for excluded files
      const normalizedRelativePath = relativePath.replace(/^Maya\//, '');
      if (excludedFiles.some(excluded => {
        const normalizedExcluded = excluded.replace(/^Maya\//, '');
        return relativePath.includes(excluded) || normalizedRelativePath.includes(normalizedExcluded);
      })) {
        continue;
      }
      
      // Skip glob patterns (e.g., tests/**/*.test.js)
      if (ref.path.includes('**') || ref.path.includes('*')) {
        continue;
      }
      
      // Check if the reference path needs a prefix (e.g., "TEST_ISOLATION_GUIDELINES.md" should be "tests/TEST_ISOLATION_GUIDELINES.md")
      let checkPath = ref.fullPath;
      const refPath = ref.path;
      
      // If reference doesn't start with a path separator and the file doesn't exist, try adding "tests/" prefix
      if (!existsSync(checkPath) && !refPath.includes('/') && !refPath.startsWith('.')) {
        const testPath = join(MAYA_ROOT, 'tests', refPath);
        if (existsSync(testPath)) {
          checkPath = testPath;
        }
      }
      
      // Also check if it's in the backend directory (e.g., TEST_COMMANDS.md)
      if (!existsSync(checkPath) && !refPath.includes('/') && !refPath.startsWith('.')) {
        const backendPath = join(MAYA_ROOT, 'backend', refPath);
        if (existsSync(backendPath)) {
          checkPath = backendPath;
        }
      }
      
      // For code references, also try resolving relative to tests/ directory
      // This handles cases like Implementation.md referencing TEST_ISOLATION_GUIDELINES.md
      if (!existsSync(checkPath) && ref.type === 'code-reference' && !refPath.includes('/') && !refPath.startsWith('.')) {
        // Try tests/ directory first (most common location for test-related docs)
        const testPath = join(MAYA_ROOT, 'tests', refPath);
        if (existsSync(testPath)) {
          checkPath = testPath;
        } else {
          // Then try backend/ directory
          const backendPath = join(MAYA_ROOT, 'backend', refPath);
          if (existsSync(backendPath)) {
            checkPath = backendPath;
          }
        }
      }
      
      const check = checkFileExists(checkPath);
      if (!check.exists) {
        brokenRefs.push({
          ...ref,
          relativePath: relative(MAYA_ROOT, ref.file),
          expectedPath: relative(MAYA_ROOT, checkPath)
        });
      }
    }
    
    if (brokenRefs.length > 0) {
      const errorMessage = `Found ${brokenRefs.length} broken markdown references:\n\n` +
        brokenRefs.map(ref => 
          `  ❌ ${ref.relativePath}:${ref.line}\n` +
          `     Reference: ${ref.path}\n` +
          `     Expected: ${ref.expectedPath}\n` +
          `     Type: ${ref.type || 'link'}\n`
        ).join('\n') +
        '\nPlease update references to point to correct files.';
      
      console.error(errorMessage);
      expect(brokenRefs).toHaveLength(0);
    }
  });

  test('critical documentation files should exist', () => {
    const criticalFiles = [
      'tests/knowledge_tests/KB_MANAGEMENT_STRATEGY.md',
      'tests/knowledge_tests/KB_TRANSPARENCY_AND_EXPLAINABILITY.md',
      'tests/documentation/THINGS_TO_BE_AWARE_MAYAGPT.md',
      'Implementation.md',
      'README.md'
    ];
    
    const missingFiles = [];
    
    for (const file of criticalFiles) {
      const filePath = join(MAYA_ROOT, file);
      if (!existsSync(filePath)) {
        missingFiles.push(file);
      }
    }
    
    expect(missingFiles).toHaveLength(0);
  });

  test('old merged files should not exist', () => {
    const oldFiles = [
      'knowledge/IMPLEMENTATION_DECISION.md',
      'knowledge/KB_CACHING_AND_MEMORY_MANAGEMENT.md',
      'knowledge/KB_MONITORING_GUIDE.md',
      'knowledge/KB_STRATEGY.md',
      'knowledge/KB_TEST_RESULTS.md',
      'tests/TEST_STRUCTURE.md', // Renamed to TEST_SUITE_STRUCTURE.md on January 9, 2026, then consolidated into TESTING_GUIDE.md
      'tests/TEST_SUITE_STRUCTURE.md', // Consolidated into TESTING_GUIDE.md on January 9, 2026
      'tests/README.md', // Renamed to TESTING_GUIDE.md on January 9, 2026
      'MCP_progress.md', // Renamed to PROJECT_PROGRESS.md on January 9, 2026
      'tests/documentation/ISSUE_LOG.md',
      'tests/documentation/HANG_PREVENTION.md',
      'tests/documentation/ROBUSTNESS_EVALUATION.md',
      'tests/documentation/README.md',
      'knowledge/KB_TEST_SUITE.md',
      'knowledge/KB_IMPLEMENTATION_SUMMARY.md',
      'knowledge/KB_DOCUMENTATION_INTEGRITY.md',
      'knowledge/IMPLEMENTATION_SUMMARY.md',
      'knowledge/DOCUMENTATION_INTEGRITY.md',
      'knowledge/QUICK_START_KB.md',
      'knowledge/REORGANIZATION_SUMMARY.md',
      'knowledge/CONSOLIDATION_ANALYSIS_QUICK_START_REORG.md',
      'knowledge/CONSOLIDATION_REPORT.md',
      'knowledge/SETUP_COMPLETE.md',
      'knowledge/AWS_S3_INTEGRATION.md',
      'knowledge/S3_QUICK_START.md',
      'REPO_RENAME.md',
      'TEST_RESULTS.md',
      'knowledge/FILE_REVIEW_ANALYSIS.md',
      'knowledge/FILE_REVIEW_ANALYSIS_2.md',
      'knowledge/DOCS_REVIEW_ANALYSIS_3.md',
      'tests/knowledge_tests/README.md',
      'tests/documentation/ISSUE_LOG.md',
      'tests/documentation/HANG_PREVENTION.md',
      'tests/documentation/ROBUSTNESS_EVALUATION.md',
      'tests/documentation/README.md',
      'tests/integration_tests/mock-failures-toggle.test.js', // Removed January 11, 2026 - mock toggle functionality removed
      'backend/run-tests-with-preference.js', // Removed January 11, 2026 - mock toggle functionality removed
      'tests/integration_tests/e2e-test-execution.test.js', // Removed January 11, 2026 - recursive test execution causing CPU freeze
      'tests/integration/root-route.test.js', // Removed January 17, 2026 - duplicate of integration_tests/root-route.test.js
      'tests/integration/root-route-server.test.js', // Removed January 17, 2026 - duplicate functionality covered by integration_tests/root-route-comprehensive.test.js
      // Deployment documentation consolidation - January 18, 2026
      'DEPLOYMENT_IN_PROGRESS.md', // Historical snapshot - consolidated into Maya/DEPLOYMENT.md
      'DEPLOYMENT_SUCCESS.md', // Historical snapshot - consolidated into Maya/DEPLOYMENT.md
      'DEPLOYMENT_TIMING.md', // Timing info - consolidated into Maya/DEPLOYMENT.md
      'DEPLOYMENT_TRIGGER.md', // Trigger info - consolidated into Maya/DEPLOYMENT.md
      'Maya/DEPLOYMENT_FIX_SUMMARY.md', // Fix summary - consolidated into Maya/DEPLOYMENT.md
      'Maya/DEPLOYMENT_IN_PROGRESS_CHECKLIST.md', // Checklist - consolidated into Maya/DEPLOYMENT.md
      'Maya/DEPLOYMENT_LLM_CONNECTION_FIX.md', // LLM fix - consolidated into Maya/DEPLOYMENT.md
      'Maya/DEPLOYMENT_NEXT_STEPS.md', // Next steps - consolidated into Maya/DEPLOYMENT.md
      'Maya/DEPLOYMENT_STATUS.md', // Status snapshot - consolidated into Maya/DEPLOYMENT.md
      'Maya/DEPLOYMENT_SUCCESS_FINAL.md', // Success summary - consolidated into Maya/DEPLOYMENT.md
      'Maya/DEPLOYMENT_WAIT_TIME.md', // Wait time info - consolidated into Maya/DEPLOYMENT.md
      'Maya/DEPLOYMENT_API.md', // API deployment guide - consolidated into Maya/DEPLOYMENT.md
      'Maya/DEPLOYMENT_SPACE.md', // Main deployment guide - consolidated into Maya/DEPLOYMENT.md
      'Maya/DEPLOYMENT_TROUBLESHOOTING.md', // Troubleshooting guide - consolidated into Maya/DEPLOYMENT.md
      'Maya/FIRST_DEPLOYMENT_GUIDE.md', // First deployment guide - consolidated into Maya/DEPLOYMENT.md
      'Maya/PRODUCTION_LOGS_DEPLOYMENT_STATUS.md', // Production logs status - consolidated into Maya/DEPLOYMENT.md
      'Maya/ROOT_ROUTE_DEPLOYMENT_STATUS.md', // Root route status - consolidated into Maya/DEPLOYMENT.md
      'Maya/DEPLOY_PRODUCTION_LOGS.md', // Production logs deployment - consolidated into Maya/DEPLOYMENT.md
      'Maya/DEPLOY_MAYA_HTML.md', // Frontend deployment - consolidated into Maya/DEPLOYMENT.md
      'Maya/frontend/DEPLOYMENT_SUMMARY.md', // Frontend summary - consolidated into Maya/DEPLOYMENT.md
      'Maya/frontend/MAYA_DEPLOYMENT_READY.md', // Frontend ready status - consolidated into Maya/DEPLOYMENT.md
      'Maya/tests/security_tests/GITHUB_DEPLOYMENT_SECURITY_CHECKLIST.md', // Security checklist - consolidated into Maya/DEPLOYMENT.md
      // Additional deployment documentation consolidation - January 18, 2026
      'Maya/DEPLOYMENT_CHECKLIST.md', // Pre-deployment checklist - consolidated into Maya/DEPLOYMENT.md
      'Maya/DEPLOYMENT_COMPLETE_SUMMARY.md', // Deployment completion summary - consolidated into Maya/DEPLOYMENT.md
      'Maya/DEPLOYMENT_EXECUTION_LOG.md', // Execution log - consolidated into Maya/DEPLOYMENT.md
      'Maya/DEPLOYMENT_STATUS_SUMMARY.md', // Status summary - consolidated into Maya/DEPLOYMENT.md
      'Maya/FINAL_REVIEW_AND_DEPLOYMENT_READY.md', // Final review - consolidated into Maya/DEPLOYMENT.md
      // Frontend API documentation consolidation - January 18, 2026
      'Maya/FRONTEND_API_ENDPOINT_TESTS.md', // Endpoint tests - consolidated into Maya/FRONTEND_API.md
      'Maya/FRONTEND_API_URL_FIX_VERIFICATION.md', // Fix verification - consolidated into Maya/FRONTEND_API.md
      'Maya/FRONTEND_API_URL_FIX.md', // URL fix - consolidated into Maya/FRONTEND_API.md
      'Maya/FRONTEND_API_URL_VERIFICATION.md', // URL verification - consolidated into Maya/FRONTEND_API.md
      // OPTION2 and IP Protection documentation consolidation - January 25, 2026
      'OPTION_2_DETAILED_PLAN.md', // Planning document - consolidated into MAYA_IP_PROTECTION_OPTION2_COMPLETE_GUIDE.md
      'OPTION_2_COMPLETE_SUMMARY.md', // Summary - consolidated into MAYA_IP_PROTECTION_OPTION2_COMPLETE_GUIDE.md
      'OPTION_2_COMPLETE_TECHNICAL_EXPLANATION.md', // Technical explanation - consolidated into MAYA_IP_PROTECTION_OPTION2_COMPLETE_GUIDE.md
      'OPTION_2_BEHAVIOR_GUARANTEE.md', // Behavior guarantee - consolidated into MAYA_IP_PROTECTION_OPTION2_COMPLETE_GUIDE.md
      'OPTION_2_IMPLEMENTATION_LOG.md', // Implementation log - consolidated into MAYA_IP_PROTECTION_OPTION2_COMPLETE_GUIDE.md
      'OPTION_2_IMPLEMENTATION_PLAN.md', // Implementation plan - consolidated into MAYA_IP_PROTECTION_OPTION2_COMPLETE_GUIDE.md
      'OPTION2_TESTABILITY_TRACEABILITY_REPORT.md', // Test report - consolidated into MAYA_IP_PROTECTION_OPTION2_COMPLETE_GUIDE.md
      'TEST_RESULTS_OPTION2_JAN25_2026.md', // Test results - consolidated into MAYA_IP_PROTECTION_OPTION2_COMPLETE_GUIDE.md
      'IP_PROTECTION_ARCHITECTURE_DIAGRAM.md', // Architecture diagrams - consolidated into MAYA_IP_PROTECTION_OPTION2_COMPLETE_GUIDE.md
      'IP_PROTECTION_COMPREHENSIVE_AUDIT.md', // Audit - consolidated into MAYA_IP_PROTECTION_OPTION2_COMPLETE_GUIDE.md
      'IP_MANAGEMENT_GUIDE.md', // Management guide - consolidated into MAYA_IP_PROTECTION_OPTION2_COMPLETE_GUIDE.md
      'DEPLOYMENT_SYSTEM_INSTRUCTIONS.md', // Deployment guide - consolidated into MAYA_IP_PROTECTION_OPTION2_COMPLETE_GUIDE.md
      'UPDATING_MAYA_INSTRUCTIONS.md', // Update guide - consolidated into MAYA_IP_PROTECTION_OPTION2_COMPLETE_GUIDE.md
      'CRITICAL_IP_FIX_JAN25_2026.md' // Critical fix - consolidated into MAYA_IP_PROTECTION_OPTION2_COMPLETE_GUIDE.md
    ];
    
    const existingOldFiles = [];
    
    for (const file of oldFiles) {
      const filePath = join(MAYA_ROOT, file);
      if (existsSync(filePath)) {
        existingOldFiles.push(file);
      }
    }
    
    if (existingOldFiles.length > 0) {
      console.warn(`Warning: Old merged files still exist:\n${existingOldFiles.join('\n')}\n` +
        'These should have been deleted after merging.');
    }
    
    // This is informational - old files existing is not a test failure
    // but we log it for awareness
  });

  test('references should point to merged files', () => {
    // Exclude consolidation reports and analysis files - they are expected to mention old files historically
    const excludedFiles = [
      'knowledge/CONSOLIDATION_REPORT.md',
      'knowledge/CONSOLIDATION_ANALYSIS_QUICK_START_REORG.md',
      'knowledge/FILE_REVIEW_ANALYSIS_2.md',
      'knowledge/DOCS_REVIEW_ANALYSIS_3.md',
      'tests/TEST_SUITE_REVIEW_JAN_17_2026.md' // Historical test review document
    ];
    
    const mergedFileMappings = {
      'IMPLEMENTATION_DECISION.md': 'IMPLEMENTATION_SUMMARY.md',
      'KB_CACHING_AND_MEMORY_MANAGEMENT.md': 'tests/knowledge_tests/KB_MANAGEMENT_STRATEGY.md',
      'KB_MONITORING_GUIDE.md': 'tests/knowledge_tests/KB_MANAGEMENT_STRATEGY.md',
      'KB_STRATEGY.md': 'tests/knowledge_tests/KB_MANAGEMENT_STRATEGY.md',
      'KB_TEST_RESULTS.md': 'tests/knowledge_tests/KB_MANAGEMENT_STRATEGY.md',
      'TEST_STRUCTURE.md': 'tests/TESTING_GUIDE.md', // Renamed to TEST_SUITE_STRUCTURE.md, then consolidated into TESTING_GUIDE.md on January 9, 2026
      'TEST_SUITE_STRUCTURE.md': 'tests/TESTING_GUIDE.md', // Consolidated into TESTING_GUIDE.md on January 9, 2026
      'README.md': 'tests/TESTING_GUIDE.md', // Renamed tests/README.md to tests/TESTING_GUIDE.md on January 9, 2026
      'MCP_progress.md': 'PROJECT_PROGRESS.md', // Renamed for better clarity on January 9, 2026
      'KB_TEST_SUITE.md': 'tests/knowledge_tests/KB_MANAGEMENT_STRATEGY.md',
      'EVALUATION_GUIDE.md': 'tests/knowledge_tests/KB_TRANSPARENCY_AND_EXPLAINABILITY.md',
      'EVALUATION_SYSTEM.md': 'tests/knowledge_tests/KB_TRANSPARENCY_AND_EXPLAINABILITY.md',
      'KPI_MATRIX.md': 'tests/knowledge_tests/KB_TRANSPARENCY_AND_EXPLAINABILITY.md',
      'TRANSPARENCY_TESTS.md': 'tests/knowledge_tests/KB_TRANSPARENCY_AND_EXPLAINABILITY.md',
      'TRANSPARENCY_AND_EXPLAINABILITY.md': 'tests/knowledge_tests/KB_TRANSPARENCY_AND_EXPLAINABILITY.md',
      'README_KB_TESTS.md': 'tests/knowledge_tests/KB_MANAGEMENT_STRATEGY.md',
      'QUICK_START_KB.md': 'tests/knowledge_tests/KB_MANAGEMENT_STRATEGY.md',
      'REORGANIZATION_SUMMARY.md': 'tests/knowledge_tests/KB_MANAGEMENT_STRATEGY.md',
      'CONSOLIDATION_ANALYSIS_QUICK_START_REORG.md': 'tests/knowledge_tests/KB_MANAGEMENT_STRATEGY.md',
      'ISSUE_LOG.md': 'tests/documentation/THINGS_TO_BE_AWARE_MAYAGPT.md',
      'mock-failures-toggle.test.js': 'REMOVED', // Mock toggle functionality removed January 11, 2026
      'run-tests-with-preference.js': 'REMOVED', // Mock toggle functionality removed January 11, 2026
      'HANG_PREVENTION.md': 'tests/documentation/THINGS_TO_BE_AWARE_MAYAGPT.md',
      'ROBUSTNESS_EVALUATION.md': 'tests/documentation/THINGS_TO_BE_AWARE_MAYAGPT.md',
      'README.md': 'tests/documentation/THINGS_TO_BE_AWARE_MAYAGPT.md',
      'CONSOLIDATION_REPORT.md': 'tests/knowledge_tests/KB_MANAGEMENT_STRATEGY.md',
      'SETUP_COMPLETE.md': 'knowledge/LOCAL_DEVELOPMENT_GUIDE.md',
      'AWS_S3_INTEGRATION.md': 'tests/knowledge_tests/KB_MANAGEMENT_STRATEGY.md',
      'S3_QUICK_START.md': 'tests/knowledge_tests/KB_MANAGEMENT_STRATEGY.md',
      'REPO_RENAME.md': 'tests/knowledge_tests/KB_MANAGEMENT_STRATEGY.md',
      'TEST_RESULTS.md': 'tests/knowledge_tests/KB_MANAGEMENT_STRATEGY.md',
      'mock-failures-toggle.test.js': 'REMOVED', // Mock toggle functionality removed January 11, 2026
      'run-tests-with-preference.js': 'REMOVED', // Mock toggle functionality removed January 11, 2026
      'e2e-test-execution.test.js': 'REMOVED', // Recursive test execution causing CPU freeze - removed January 11, 2026
      'root-route.test.js': 'tests/integration_tests/root-route.test.js', // Moved from integration/ to integration_tests/ for consistency - January 17, 2026
      'root-route-server.test.js': 'tests/integration_tests/root-route-comprehensive.test.js', // Functionality consolidated into comprehensive test - January 17, 2026
      'FILE_REVIEW_ANALYSIS.md': 'tests/knowledge_tests/KB_MANAGEMENT_STRATEGY.md',
      'FILE_REVIEW_ANALYSIS_2.md': 'tests/knowledge_tests/KB_MANAGEMENT_STRATEGY.md',
      'DOCS_REVIEW_ANALYSIS_3.md': 'tests/knowledge_tests/KB_MANAGEMENT_STRATEGY.md',
      // Deployment documentation consolidation - January 18, 2026
      // Deployment documentation consolidation - January 18, 2026
      'DEPLOYMENT_IN_PROGRESS.md': 'Maya/DEPLOYMENT.md', // Historical snapshot consolidated into DEPLOYMENT.md
      'DEPLOYMENT_SUCCESS.md': 'Maya/DEPLOYMENT.md', // Historical snapshot consolidated into DEPLOYMENT.md
      'DEPLOYMENT_TIMING.md': 'Maya/DEPLOYMENT.md', // Timing info consolidated into DEPLOYMENT.md
      'DEPLOYMENT_TRIGGER.md': 'Maya/DEPLOYMENT.md', // Trigger info consolidated into DEPLOYMENT.md
      'DEPLOYMENT_FIX_SUMMARY.md': 'Maya/DEPLOYMENT.md', // Fix summary consolidated into DEPLOYMENT.md
      'DEPLOYMENT_IN_PROGRESS_CHECKLIST.md': 'Maya/DEPLOYMENT.md', // Checklist consolidated into DEPLOYMENT.md
      'DEPLOYMENT_LLM_CONNECTION_FIX.md': 'Maya/DEPLOYMENT.md', // LLM fix consolidated into DEPLOYMENT.md
      'DEPLOYMENT_NEXT_STEPS.md': 'Maya/DEPLOYMENT.md', // Next steps consolidated into DEPLOYMENT.md
      'DEPLOYMENT_STATUS.md': 'Maya/DEPLOYMENT.md', // Status snapshot consolidated into DEPLOYMENT.md
      'DEPLOYMENT_SUCCESS_FINAL.md': 'Maya/DEPLOYMENT.md', // Success summary consolidated into DEPLOYMENT.md
      'DEPLOYMENT_WAIT_TIME.md': 'Maya/DEPLOYMENT.md', // Wait time info consolidated into DEPLOYMENT.md
      'DEPLOYMENT_CONSOLIDATION_ANALYSIS.md': 'REMOVED', // Temporary analysis document removed after consolidation
      'DEPLOYMENT_API.md': 'Maya/DEPLOYMENT.md', // API deployment guide consolidated into DEPLOYMENT.md
      'DEPLOYMENT_SPACE.md': 'Maya/DEPLOYMENT.md', // Main deployment guide consolidated into DEPLOYMENT.md
      'DEPLOYMENT_TROUBLESHOOTING.md': 'Maya/DEPLOYMENT.md', // Troubleshooting guide consolidated into DEPLOYMENT.md
      'FIRST_DEPLOYMENT_GUIDE.md': 'Maya/DEPLOYMENT.md', // First deployment guide consolidated into DEPLOYMENT.md
      'PRODUCTION_LOGS_DEPLOYMENT_STATUS.md': 'Maya/DEPLOYMENT.md', // Production logs status consolidated into DEPLOYMENT.md
      'ROOT_ROUTE_DEPLOYMENT_STATUS.md': 'Maya/DEPLOYMENT.md', // Root route status consolidated into DEPLOYMENT.md
      'DEPLOY_PRODUCTION_LOGS.md': 'Maya/DEPLOYMENT.md', // Production logs deployment consolidated into DEPLOYMENT.md
      'DEPLOY_MAYA_HTML.md': 'Maya/DEPLOYMENT.md', // Frontend deployment consolidated into DEPLOYMENT.md
      'frontend/DEPLOYMENT_SUMMARY.md': 'Maya/DEPLOYMENT.md', // Frontend summary consolidated into DEPLOYMENT.md
      'frontend/MAYA_DEPLOYMENT_READY.md': 'Maya/DEPLOYMENT.md', // Frontend ready status consolidated into DEPLOYMENT.md
      'tests/security_tests/GITHUB_DEPLOYMENT_SECURITY_CHECKLIST.md': 'Maya/DEPLOYMENT.md', // Security checklist consolidated into DEPLOYMENT.md
      // Additional deployment documentation consolidation - January 18, 2026
      'DEPLOYMENT_CHECKLIST.md': 'Maya/DEPLOYMENT.md', // Pre-deployment checklist consolidated into DEPLOYMENT.md
      'DEPLOYMENT_COMPLETE_SUMMARY.md': 'Maya/DEPLOYMENT.md', // Deployment completion summary consolidated into DEPLOYMENT.md
      'DEPLOYMENT_EXECUTION_LOG.md': 'Maya/DEPLOYMENT.md', // Execution log consolidated into DEPLOYMENT.md
      'DEPLOYMENT_STATUS_SUMMARY.md': 'Maya/DEPLOYMENT.md', // Status summary consolidated into DEPLOYMENT.md
      'FINAL_REVIEW_AND_DEPLOYMENT_READY.md': 'Maya/DEPLOYMENT.md', // Final review consolidated into DEPLOYMENT.md
      // Frontend API documentation consolidation - January 18, 2026
      'FRONTEND_API_ENDPOINT_TESTS.md': 'Maya/FRONTEND_API.md', // Endpoint tests consolidated into FRONTEND_API.md
      'FRONTEND_API_URL_FIX_VERIFICATION.md': 'Maya/FRONTEND_API.md', // Fix verification consolidated into FRONTEND_API.md
      'FRONTEND_API_URL_FIX.md': 'Maya/FRONTEND_API.md', // URL fix consolidated into FRONTEND_API.md
      'FRONTEND_API_URL_VERIFICATION.md': 'Maya/FRONTEND_API.md', // URL verification consolidated into FRONTEND_API.md
      // OPTION2 and IP Protection documentation consolidation - January 25, 2026
      'OPTION_2_DETAILED_PLAN.md': 'MAYA_IP_PROTECTION_OPTION2_COMPLETE_GUIDE.md', // Planning document consolidated
      'OPTION_2_COMPLETE_SUMMARY.md': 'MAYA_IP_PROTECTION_OPTION2_COMPLETE_GUIDE.md', // Summary consolidated
      'OPTION_2_COMPLETE_TECHNICAL_EXPLANATION.md': 'MAYA_IP_PROTECTION_OPTION2_COMPLETE_GUIDE.md', // Technical explanation consolidated
      'OPTION_2_BEHAVIOR_GUARANTEE.md': 'MAYA_IP_PROTECTION_OPTION2_COMPLETE_GUIDE.md', // Behavior guarantee consolidated
      'OPTION_2_IMPLEMENTATION_LOG.md': 'MAYA_IP_PROTECTION_OPTION2_COMPLETE_GUIDE.md', // Implementation log consolidated
      'OPTION_2_IMPLEMENTATION_PLAN.md': 'MAYA_IP_PROTECTION_OPTION2_COMPLETE_GUIDE.md', // Implementation plan consolidated
      'OPTION2_TESTABILITY_TRACEABILITY_REPORT.md': 'MAYA_IP_PROTECTION_OPTION2_COMPLETE_GUIDE.md', // Test report consolidated
      'TEST_RESULTS_OPTION2_JAN25_2026.md': 'MAYA_IP_PROTECTION_OPTION2_COMPLETE_GUIDE.md', // Test results consolidated
      'IP_PROTECTION_ARCHITECTURE_DIAGRAM.md': 'MAYA_IP_PROTECTION_OPTION2_COMPLETE_GUIDE.md', // Architecture diagrams consolidated
      'IP_PROTECTION_COMPREHENSIVE_AUDIT.md': 'MAYA_IP_PROTECTION_OPTION2_COMPLETE_GUIDE.md', // Audit consolidated
      'IP_MANAGEMENT_GUIDE.md': 'MAYA_IP_PROTECTION_OPTION2_COMPLETE_GUIDE.md', // Management guide consolidated
      'DEPLOYMENT_SYSTEM_INSTRUCTIONS.md': 'MAYA_IP_PROTECTION_OPTION2_COMPLETE_GUIDE.md', // Deployment guide consolidated
      'UPDATING_MAYA_INSTRUCTIONS.md': 'MAYA_IP_PROTECTION_OPTION2_COMPLETE_GUIDE.md', // Update guide consolidated
      'CRITICAL_IP_FIX_JAN25_2026.md': 'MAYA_IP_PROTECTION_OPTION2_COMPLETE_GUIDE.md' // Critical fix consolidated
    };
    
    const incorrectRefs = [];
    
    for (const ref of allReferences) {
      // Skip consolidation reports - they are expected to mention old files
      const relativePath = relative(MAYA_ROOT, ref.file);
      // Check both with and without "Maya/" prefix for excluded files
      const normalizedRelativePath = relativePath.replace(/^Maya\//, '');
      if (excludedFiles.some(excluded => {
        const normalizedExcluded = excluded.replace(/^Maya\//, '');
        return relativePath.includes(excluded) || normalizedRelativePath.includes(normalizedExcluded);
      })) {
        continue;
      }
      
      const fileName = ref.path.split('/').pop();
      if (mergedFileMappings[fileName]) {
        // Skip if the reference is to a different README.md (e.g., tests/TESTING_GUIDE.md, backend/utils/memory_cache/README.md)
        // Only check if it's specifically referencing the merged file
        const refPath = ref.path.toLowerCase();
        const isMergedFile = 
          (fileName === 'README.md' && (refPath.includes('documentation/readme') || refPath === 'readme.md') || refPath.includes('tests/readme')) ||
          (fileName !== 'README.md');
        
        if (isMergedFile) {
          const expectedFile = mergedFileMappings[fileName];
          const expectedPath = ref.fullPath.replace(fileName, expectedFile);
          
          if (!existsSync(expectedPath)) {
            incorrectRefs.push({
              ...ref,
              oldFile: fileName,
              expectedFile,
              relativePath: relative(MAYA_ROOT, ref.file)
            });
          }
        }
      }
    }
    
    if (incorrectRefs.length > 0) {
      const errorMessage = `Found references to old merged files:\n\n` +
        incorrectRefs.map(ref => 
          `  ❌ ${ref.relativePath}:${ref.line}\n` +
          `     Old reference: ${ref.oldFile}\n` +
          `     Should point to: ${ref.expectedFile}\n`
        ).join('\n') +
        '\nPlease update references to point to merged files.';
      
      console.error(errorMessage);
      expect(incorrectRefs).toHaveLength(0);
    }
  });

  test('no circular references in markdown files', () => {
    const circularRefs = [];
    const visited = new Set();
    
    function checkCircular(filePath, path = []) {
      // Skip if file doesn't exist
      if (!existsSync(filePath)) {
        return;
      }
      
      // Check for actual circular reference (file references itself in a loop)
      const pathIndex = path.indexOf(filePath);
      if (pathIndex !== -1 && path.length > pathIndex + 1) {
        // Found a loop (not just self-reference)
        circularRefs.push([...path.slice(pathIndex), filePath]);
        return;
      }
      
      // Skip if already visited in this path (prevents infinite recursion)
      if (path.includes(filePath)) {
        return;
      }
      
      // Limit depth to prevent false positives
      if (path.length > 10) {
        return;
      }
      
      visited.add(filePath);
      const content = readFileSync(filePath, 'utf-8');
      const refs = extractMarkdownReferences(content, filePath);
      
      for (const ref of refs) {
        if (ref.fullPath.endsWith('.md') && existsSync(ref.fullPath)) {
          checkCircular(ref.fullPath, [...path, filePath]);
        }
      }
    }
    
    // Check critical files for circular references
    const criticalFiles = [
      join(KNOWLEDGE_DIR, 'IMPLEMENTATION_SUMMARY.md'),
      join(KNOWLEDGE_DIR, 'KB_MANAGEMENT_STRATEGY.md')
    ];
    
    for (const file of criticalFiles) {
      if (existsSync(file)) {
        visited.clear();
        checkCircular(file);
      }
    }
    
    // Filter out false positives (self-references are OK)
    const actualCircularRefs = circularRefs.filter(circle => {
      // A real circular reference should have at least 3 unique files
      const uniqueFiles = new Set(circle);
      return uniqueFiles.size >= 3;
    });
    
    if (actualCircularRefs.length > 0) {
      const errorMessage = `Found circular references in markdown files:\n\n` +
        actualCircularRefs.map(circle => 
          `  ❌ Circular reference:\n` +
          circle.map((f, i) => `     ${i + 1}. ${relative(MAYA_ROOT, f)}`).join('\n') +
          '\n'
        ).join('\n');
      
      console.error(errorMessage);
    }
    
    expect(actualCircularRefs).toHaveLength(0);
  });

  test('all code files referencing markdown should have valid paths', () => {
    const codeFiles = [
      join(BACKEND_DIR, 'server.js'),
      join(BACKEND_DIR, 'mcp-client.js'),
      join(BACKEND_DIR, 'utils/kb-loader.js'),
      join(BACKEND_DIR, 'utils/memory_cache/kb-cache.js'),
      join(BACKEND_DIR, 'utils/memory_cache/kb-monitor.js')
    ];
    
    const invalidRefs = [];
    
    for (const codeFile of codeFiles) {
      if (!existsSync(codeFile)) continue;
      
      const content = readFileSync(codeFile, 'utf-8');
      // Match markdown file references in strings, but skip:
      // - Comments (// or /*)
      // - String operations (.replace('.md'))
      // - JSDoc examples
      const mdRefPattern = /['"`]([^'"`]*\.md)['"`]/g;
      let match;
      
      while ((match = mdRefPattern.exec(content)) !== null) {
        const mdPath = match[1];
        const beforeMatch = content.substring(Math.max(0, match.index - 50), match.index);
        
        // Skip if it's in a comment
        if (beforeMatch.includes('//') || beforeMatch.includes('/*')) {
          continue;
        }
        
        // Skip if it's a string operation (like .replace('.md'))
        if (beforeMatch.includes('.replace') || beforeMatch.includes('.split')) {
          continue;
        }
        
        // Skip if it's in JSDoc example
        if (beforeMatch.includes('@example') || beforeMatch.includes('e.g.')) {
          continue;
        }
        
        // Only check if it looks like a file path reference (contains / or starts with knowledge/)
        if (mdPath.includes('/') || mdPath.startsWith('knowledge/') || mdPath.includes('docs/')) {
          const fullPath = resolveMarkdownPath(mdPath, codeFile);
          
          if (!existsSync(fullPath)) {
            invalidRefs.push({
              file: relative(MAYA_ROOT, codeFile),
              reference: mdPath,
              expectedPath: relative(MAYA_ROOT, fullPath),
              line: content.substring(0, match.index).split('\n').length
            });
          }
        }
      }
    }
    
    if (invalidRefs.length > 0) {
      const errorMessage = `Found invalid markdown references in code files:\n\n` +
        invalidRefs.map(ref => 
          `  ❌ ${ref.file}:${ref.line}\n` +
          `     Reference: ${ref.reference}\n` +
          `     Expected: ${ref.expectedPath}\n`
        ).join('\n');
      
      console.error(errorMessage);
      expect(invalidRefs).toHaveLength(0);
    }
  });

  test('test files should reference correct documentation', () => {
    const testFiles = findAllMarkdownFiles(join(MAYA_ROOT, 'tests'));
    
    const invalidRefs = [];
    
    for (const testFile of testFiles) {
      const content = readFileSync(testFile, 'utf-8');
      const refs = extractMarkdownReferences(content, testFile);
      
      for (const ref of refs) {
        // Check if the reference path needs a prefix (e.g., "TEST_COMMANDS.md" should be "backend/TEST_COMMANDS.md")
        let checkPath = ref.fullPath;
        const refPath = ref.path;
        
        // If reference doesn't start with a path separator and the file doesn't exist, try adding "backend/" prefix
        if (!existsSync(checkPath) && !refPath.includes('/') && !refPath.startsWith('.')) {
          const backendPath = join(MAYA_ROOT, 'backend', refPath);
          if (existsSync(backendPath)) {
            checkPath = backendPath;
          }
        }
        
        // Also check if it's in the tests directory
        if (!existsSync(checkPath) && !refPath.includes('/') && !refPath.startsWith('.')) {
          const testPath = join(MAYA_ROOT, 'tests', refPath);
          if (existsSync(testPath)) {
            checkPath = testPath;
          }
        }
        
        const check = checkFileExists(checkPath);
        if (!check.exists) {
          invalidRefs.push({
            ...ref,
            relativePath: relative(MAYA_ROOT, testFile)
          });
        }
      }
    }
    
    if (invalidRefs.length > 0) {
      const errorMessage = `Found invalid references in test documentation:\n\n` +
        invalidRefs.map(ref => 
          `  ❌ ${ref.relativePath}:${ref.line}\n` +
          `     Reference: ${ref.path}\n` +
          `     Expected: ${relative(MAYA_ROOT, ref.fullPath)}\n`
        ).join('\n');
      
      console.error(errorMessage);
      expect(invalidRefs).toHaveLength(0);
    }
  });

  test('documentation should not reference non-existent test files', () => {
    const testFiles = findAllMarkdownFiles(join(MAYA_ROOT, 'tests'))
      .map(f => relative(MAYA_ROOT, f));
    
    // Exclude timeline and review documents that document deleted files
    const excludedHistoricalDocs = [
      'tests/JAN_11_2026_TIMELINE.md', // Timeline document that references deleted files
      'tests/CPU_USAGE_REVIEW_SUMMARY.md', // Review document that references deleted files
      'tests/TEST_SUITE_REVIEW_JAN_17_2026.md' // Historical test review document
    ];
    
    const invalidTestRefs = [];
    
    for (const mdFile of allMarkdownFiles) {
      const relativePath = relative(MAYA_ROOT, mdFile);
      
      // Skip historical/timeline documents
      if (excludedHistoricalDocs.includes(relativePath)) {
        continue;
      }
      
      const content = readFileSync(mdFile, 'utf-8');
      const testRefPattern = /tests\/[^\s\)]+\.test\.js/g;
      let match;
      
      while ((match = testRefPattern.exec(content)) !== null) {
        const testPath = join(MAYA_ROOT, match[0]);
        const beforeMatch = content.substring(Math.max(0, match.index - 100), match.index);
        
        // Skip if it's in a code example, comment, or note
        const isInCodeExample = beforeMatch.includes('```') ||
                                beforeMatch.match(/^\s{4,}/m) ||
                                /example|format|pattern|template|sample|note|comment|see|translated/i.test(beforeMatch);
        
        // Skip glob patterns (e.g., tests/**/*.test.js)
        // Also skip if it's in TEST_ISOLATION_GUIDELINES.md which documents the pattern
        if (match[0].includes('**') || match[0].includes('*')) {
          continue;
        }
        
        // Skip references in TEST_ISOLATION_GUIDELINES.md that mention glob patterns
        if (relativePath.includes('TEST_ISOLATION_GUIDELINES.md')) {
          const beforeMatch = content.substring(Math.max(0, match.index - 50), match.index);
          if (beforeMatch.includes('**') || beforeMatch.includes('matching')) {
            continue;
          }
        }
        
        if (!existsSync(testPath) && !isInCodeExample) {
          // Try to find the test file in different locations
          const testFileName = match[0].split('/').pop();
          const foundInTests = findAllMarkdownFiles(join(MAYA_ROOT, 'tests'))
            .some(f => f.endsWith(testFileName));
          
          // Also check if it's a moved file (check knowledge_tests directory)
          const knowledgeTestsPath = join(MAYA_ROOT, 'tests/knowledge_tests', testFileName);
          const foundInKnowledgeTests = existsSync(knowledgeTestsPath);
          
          // Legacy check for memory_cache directory (for backward compatibility)
          const memoryCachePath = join(MAYA_ROOT, 'tests/memory_cache', testFileName);
          const foundInMemoryCache = existsSync(memoryCachePath);
          
          if (!foundInTests && !foundInKnowledgeTests && !foundInMemoryCache) {
            invalidTestRefs.push({
              file: relative(MAYA_ROOT, mdFile),
              reference: match[0],
              line: content.substring(0, match.index).split('\n').length
            });
          }
        }
      }
    }
    
    if (invalidTestRefs.length > 0) {
      const errorMessage = `Found references to non-existent test files:\n\n` +
        invalidTestRefs.map(ref => 
          `  ❌ ${ref.file}:${ref.line}\n` +
          `     Reference: ${ref.reference}\n` +
          `     Action: Update reference or create test file\n`
        ).join('\n') +
        '\nNote: References in code examples, comments, or notes are ignored.';
      
      console.error(errorMessage);
      expect(invalidTestRefs).toHaveLength(0);
    }
  });
});
