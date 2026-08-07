import request from 'supertest';
import app from '../../../src/app';
import { supabase } from '../../../src/config/supabase';

// Mock Supabase to avoid real network calls during E2E
jest.mock('../../../src/config/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
    },
  },
  supabaseAdmin: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue({ data: [{ key: 'test' }], error: null }),
  },
}));

describe('E2E: Auth Module', () => {
  const mockUser = {
    id: 'e2e-user-id',
    email: 'e2e@test.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'e2e@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(mockUser.id);
    });

    it('should return 400 for invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login and return a session token', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: {
          session: { access_token: 'e2e-access-token' },
          user: mockUser,
        },
        error: null,
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'e2e@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.session.access_token).toBe('e2e-access-token');
    });
  });
});
