const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/**/*.test.ts', '<rootDir>/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/app/$1',
    '^@lib/(.*)$': '<rootDir>/lib/$1',
    '^@fragments/(.*)$': '<rootDir>/fragments/$1/src',
    '^@ui/([^/]+)$': '<rootDir>/../../packages/ui/$1/src',
    '^.+\\.(css|sass|scss)$': 'identity-obj-proxy',
    '^.+\\.(svg|png|jpg|jpeg|gif|webp|avif)$': '<rootDir>/test/fileMock.js'
  }
};

module.exports = createJestConfig(customJestConfig);
