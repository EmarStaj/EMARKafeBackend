import { ProfileService } from '../profile.service';

describe('ProfileService', () => {
  let service: ProfileService;
  let mockProfileRepo: any;

  beforeEach(() => {
    mockProfileRepo = {
      getProfile: jest.fn(),
      updateProfile: jest.fn()
    };
    service = new ProfileService(mockProfileRepo);
  });

  describe('getProfile', () => {
    it('success', async () => {
      mockProfileRepo.getProfile.mockResolvedValue({ id: 'u1' });
      expect(await service.getProfile('u1', 't1')).toEqual({ id: 'u1' });
    });

    it('not found error', async () => {
      mockProfileRepo.getProfile.mockRejectedValue({ code: 'PGRST116' });
      await expect(service.getProfile('u1', 't1')).rejects.toThrow('Profile not found');
    });

    it('generic error', async () => {
      mockProfileRepo.getProfile.mockRejectedValue(new Error('err'));
      await expect(service.getProfile('u1', 't1')).rejects.toThrow('err');
    });
  });

  describe('updateProfile', () => {
    it('success', async () => {
      mockProfileRepo.updateProfile.mockResolvedValue({ id: 'u1' });
      expect(await service.updateProfile('u1', {}, 't1')).toEqual({ id: 'u1' });
    });

    it('error', async () => {
      mockProfileRepo.updateProfile.mockRejectedValue(new Error('err'));
      await expect(service.updateProfile('u1', {}, 't1')).rejects.toThrow('err');
    });
  });
});
