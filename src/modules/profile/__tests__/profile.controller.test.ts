import { ProfileController } from '../profile.controller';
import { Request, Response } from 'express';
import { profileCache } from '../../../config/profile-cache';

jest.mock('../../../config/profile-cache', () => ({
  profileCache: {
    invalidate: jest.fn()
  }
}));

describe('ProfileController', () => {
  let controller: ProfileController;
  let mockProfileService: any;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockProfileService = {
      getProfile: jest.fn(),
      updateProfile: jest.fn()
    };
    controller = new ProfileController(mockProfileService);

    mockReq = {
      user: { id: 'u1' } as any,
      token: 't1',
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('success', async () => {
      mockProfileService.getProfile.mockResolvedValue({ id: 'u1' });
      await controller.getProfile(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('unauthorized no user', async () => {
      mockReq.user = undefined;
      await controller.getProfile(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('unauthorized no token', async () => {
      mockReq.token = undefined;
      await controller.getProfile(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('error', async () => {
      mockProfileService.getProfile.mockRejectedValue(new Error('err'));
      await controller.getProfile(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('success', async () => {
      mockReq.body = { full_name: 'n1' };
      mockProfileService.updateProfile.mockResolvedValue({ id: 'u1', full_name: 'n1' });
      await controller.updateProfile(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(profileCache.invalidate).toHaveBeenCalledWith('u1');
    });

    it('unauthorized', async () => {
      mockReq.user = undefined;
      await controller.updateProfile(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('error', async () => {
      mockProfileService.updateProfile.mockRejectedValue(new Error('err'));
      await controller.updateProfile(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('updateDefaultBranch', () => {
    it('success', async () => {
      mockReq.body = { branch_id: 'b1' };
      mockProfileService.updateProfile.mockResolvedValue({ id: 'u1', branch_id: 'b1' });
      await controller.updateDefaultBranch(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(profileCache.invalidate).toHaveBeenCalledWith('u1');
    });

    it('unauthorized', async () => {
      mockReq.user = undefined;
      await controller.updateDefaultBranch(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('error', async () => {
      mockProfileService.updateProfile.mockRejectedValue(new Error('err'));
      await controller.updateDefaultBranch(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('clearCache', () => {
    it('success with user', async () => {
      await controller.clearCache(mockReq as Request, mockRes as Response, mockNext);
      expect(profileCache.invalidate).toHaveBeenCalledWith('u1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('success without user', async () => {
      mockReq.user = undefined;
      await controller.clearCache(mockReq as Request, mockRes as Response, mockNext);
      expect(profileCache.invalidate).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('error', async () => {
      (profileCache.invalidate as jest.Mock).mockRejectedValue(new Error('err'));
      await controller.clearCache(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
