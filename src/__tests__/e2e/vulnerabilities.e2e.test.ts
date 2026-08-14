import request from 'supertest';
import app from '../../app';
import { supabase } from '../../config/supabase';

jest.mock('../../config/supabase', () => {
  const originalModule = jest.requireActual('../../config/supabase');
  return {
    ...originalModule,
    supabase: {
      auth: {
        getUser: jest.fn(),
      }
    }
  };
});

describe('Vulnerability Tests via Real HTTP Requests', () => {
  
  it('Vulnerability 1: Unauthenticated user can see inactive menu items', async () => {
    // We send a request WITHOUT any auth token
    const res = await request(app)
      .get('/api/menu?onlyActive=false')
      .set('Accept', 'application/json');
    
    // It should NOT be 401 Unauthorized. It should be 200 OK!
    // Meaning the vulnerability exists.
    expect(res.status).toBe(200);
    // Note: since the DB is mocked/not mocked, we just check if it passed the auth phase.
    // Wait, the routes for GET /api/menu don't even have requireAuth!
    // So it will definitely pass.
    console.log("Proof 1: Unauthenticated GET /api/menu?onlyActive=false returned HTTP " + res.status);
  });

  it('Vulnerability 2: Branch Manager can update OTHER branches products', async () => {
    // Mock user as a branch manager
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: {
        user: { id: 'hacker-manager-id' }
      },
      error: null
    });

    // Mock redis profile cache to return the user as branch_manager
    const { redis } = require('../../config/redis');
    redis.get.mockResolvedValue(JSON.stringify({
      id: 'hacker-manager-id',
      role: 'branch_manager'
    }));

    // Target branch id (let's pretend this is a different branch)
    const targetBranchId = '11111111-1111-1111-1111-111111111111';
    const targetProductId = '22222222-2222-2222-2222-222222222222';

    // Send PUT request to update product availability
    const res = await request(app)
      .put(`/api/branches/${targetBranchId}/products/${targetProductId}`)
      .set('Authorization', 'Bearer fake-token')
      .send({ is_available: false });

    // The vulnerability is now FIXED, so it should return 403 Forbidden!
    console.log("Proof 2: Branch Manager attacking another branch returned HTTP " + res.status);
    expect(res.status).toBe(403);
  });
});
