/**
 * Logger mock for unit tests.
 * Prevents winston from writing to stdout during test runs.
 */
export const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};
