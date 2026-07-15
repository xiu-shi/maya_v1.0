/**
 * Jest Configuration for Maya Backend Tests
 *
 * Sprint 0 (MAYA-DEVOPS-001-03) changes applied 8 Jul 2026:
 *   - collectCoverageFrom: runtime code only (Finding F - removed dev scripts from denominator)
 *   - maxWorkers: 1 - prevents parallel file-system conflicts in chat-logger tests
 *   - testPathIgnorePatterns: excludes Maya/backend/tests after consolidation into Maya/tests
 *   - coverageThreshold: set to Sprint 0 measured floor (branches 50%, functions 66%, lines 61%, stmts 61%)
 *   - coverageReporters: text + json-summary + lcov (for artifact storage)
 */

export default {
  testEnvironment: 'node',
  transform: {},
  setupFiles: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '^supertest$': '<rootDir>/backend/node_modules/supertest/index.js',
    '^express$': '<rootDir>/backend/node_modules/express/index.js',
    '^jsdom$': '<rootDir>/backend/node_modules/jsdom/lib/api.js',
    '^dotenv$': '<rootDir>/backend/node_modules/dotenv/lib/main.js',
    '^@aws-sdk/client-s3$': '<rootDir>/backend/node_modules/@aws-sdk/client-s3/dist-cjs/index.js'
  },
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  testPathIgnorePatterns: [
    'post-deployment-verification\\.test\\.js$',  // Run via run-post-deployment-tests.sh after deploy
    '/backend/tests/',  // Old location - consolidated into Maya/tests/backend_tests/ (MAYA-DEVOPS-001-03)
    'tests/maya-html\\.test\\.js$',  // node:test runner (see Maya/tests/package.json)
    'tests/privacy-consent\\.test\\.js$',
    'tests/seo-geo-files\\.test\\.js$',
  ],
  rootDir: '..',
  // Runtime code only - excludes dev/test scripts that inflated the denominator (Finding F).
  // Dev scripts excluded: run-all-tests.js, server.example.js, test-*.js, verify-*.js
  collectCoverageFrom: [
    'backend/server.js',
    'backend/api-client.js',
    'backend/config/**/*.js',
    'backend/middleware/**/*.js',
    'backend/utils/**/*.js',
    '!backend/node_modules/**',
    '!backend/utils/memory_cache/kb-monitor.js',
    '!backend/utils/memory_cache/kb-cache.js',
    '!backend/utils/response-guardrails.js'
  ],
  coverageReporters: ['text', 'json-summary', 'lcov'],
  // Sprint 0 measured baseline (9 Jul 2026, MAYA-DEVOPS-001-03).
  // Ratchet UP each sprint per TEST_PLAN_MAYA_V1.5.md section 5.
  // Numbers are the measured floor rounded down to the nearest integer.
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 66,
      lines: 61,
      statements: 61
    }
  },
  // Serialize test workers to prevent parallel chat-log file-system conflicts.
  // Long-term: fix tests to use isolated temp dirs, then remove this constraint.
  maxWorkers: 1,
  testTimeout: 30000
};
