import 'reflect-metadata';

process.env.JWT_SECRET = 'test_secret';

jest.mock('./src/config/redis', () => ({
  redis: {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    on: jest.fn(),
  }
}));
