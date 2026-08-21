import 'reflect-metadata';
import { ProfileService } from '../../../modules/profile/profile.service';
import { ProfileRepository } from '../../../modules/profile/profile.repository';

describe('ProfileService Unit Tests', () => {
  let profileService: ProfileService;
  let mockRepo: jest.Mocked<ProfileRepository>;

  beforeEach(() => {
    mockRepo = {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
    } as any;
    profileService = new ProfileService(mockRepo);
  });

  describe('getProfile', () => {
    it('should return profile data for existing user', async () => {
      const mockProfile = { id: 'u-1', full_name: 'Ahmet Y.', role: 'customer' };
      mockRepo.getProfile.mockResolvedValue(mockProfile as any);

      const res = await profileService.getProfile('u-1', 'tok-1');
      expect(res).toEqual(mockProfile);
      expect(mockRepo.getProfile).toHaveBeenCalledWith('u-1', 'tok-1');
    });

    it('should throw 404 AppError when profile is not found', async () => {
      mockRepo.getProfile.mockRejectedValue({ code: 'PGRST116' });

      await expect(profileService.getProfile('u-missing', 'tok-1')).rejects.toThrow('Profile not found');
    });
  });

  describe('updateProfile', () => {
    it('should update profile fields successfully', async () => {
      const updated = { id: 'u-1', full_name: 'Mehmet Y.' };
      mockRepo.updateProfile.mockResolvedValue(updated as any);

      const res = await profileService.updateProfile('u-1', { full_name: 'Mehmet Y.' }, 'tok-1');
      expect(res).toEqual(updated);
      expect(mockRepo.updateProfile).toHaveBeenCalledWith('u-1', { full_name: 'Mehmet Y.' }, 'tok-1');
    });
  });
});
