import { ProfileRepository } from '../profile.repository';
import { supabaseAdmin } from '../../../config/supabase';

jest.mock('../../../config/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis()
  }
}));

describe('ProfileRepository', () => {
  let repository: ProfileRepository;

  beforeEach(() => {
    repository = new ProfileRepository();
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('success', async () => {
      (supabaseAdmin.from as jest.Mock)().single.mockResolvedValue({ data: { id: 'u1' }, error: null });
      expect(await repository.getProfile('u1', 't1')).toEqual({ id: 'u1' });
    });

    it('error', async () => {
      (supabaseAdmin.from as jest.Mock)().single.mockResolvedValue({ data: null, error: new Error('err') });
      await expect(repository.getProfile('u1', 't1')).rejects.toThrow('err');
    });
  });

  describe('updateProfile', () => {
    it('success', async () => {
      (supabaseAdmin.from as jest.Mock)().single.mockResolvedValue({ data: { id: 'u1' }, error: null });
      expect(await repository.updateProfile('u1', {}, 't1')).toEqual({ id: 'u1' });
    });

    it('error', async () => {
      (supabaseAdmin.from as jest.Mock)().single.mockResolvedValue({ data: null, error: new Error('err') });
      await expect(repository.updateProfile('u1', {}, 't1')).rejects.toThrow('err');
    });
  });
});
