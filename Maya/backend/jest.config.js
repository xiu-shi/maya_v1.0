/**
 * Jest Configuration for Maya Backend Tests
 */

export default {
  testEnvironment: 'node',
  transform: {},
  setupFiles: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '^supertest$': '<rootDir>/backend/node_modules/supertest/index.js',
    '^express$': '<rootDir>/backend/node_modules/express/index.js'
  },
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  rootDir: '..',
  collectCoverageFrom: [
    'backend/**/*.js',
    '!backend/node_modules/**',
    '!backend/tests/**',
    '!backend/scripts/**',
    '!backend/jest.config.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testTimeout: 10000
};
