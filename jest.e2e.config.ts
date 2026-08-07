import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.ts'],
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/e2e/**/*.test.ts'],
  moduleNameMapper: {
    '(.*)/config/supabase$': '<rootDir>/src/__mocks__/supabase.ts',
    '(.*)/config/logger$': '<rootDir>/src/__mocks__/logger.ts',
  },
  collectCoverage: false,
};

export default config;
