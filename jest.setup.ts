import 'reflect-metadata';

jest.mock('./src/config/redis', () => ({
  redis: {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    on: jest.fn(),
  }
}));
