import { LoyaltyService } from '../loyalty.service';
import { LoyaltyRepository } from '../loyalty.repository';
import { NotificationService } from '../../notification/notification.service';
import { AppError } from '../../../utils/app-error';
import { logger } from '../../../config/logger';

jest.mock('../../../config/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn() }
}));

describe('LoyaltyService', () => {
  let service: LoyaltyService;
  let repo: jest.Mocked<LoyaltyRepository>;
  let notif: jest.Mocked<NotificationService>;

  beforeEach(() => {
    repo = {
      getLoyaltyProgress: jest.fn(),
      getLoyaltyRewards: jest.fn(),
      findProgress: jest.fn(),
      saveProgress: jest.fn(),
      createReward: jest.fn(),
      redeemReward: jest.fn(),
    } as any;
    notif = { sendToUser: jest.fn() } as any;
    service = new LoyaltyService(repo, notif);
  });

  describe('getLoyaltyProgress', () => {
    it('should return progress', async () => {
      repo.getLoyaltyProgress.mockResolvedValue([{ id: 'p1' }] as any);
      const res = await service.getLoyaltyProgress('u1');
      expect(res).toEqual([{ id: 'p1' }]);
    });

    it('should throw AppError on failure', async () => {
      repo.getLoyaltyProgress.mockRejectedValue(new Error('err'));
      await expect(service.getLoyaltyProgress('u1')).rejects.toThrow(AppError);
    });
  });

  describe('getLoyaltyRewards', () => {
    it('should return rewards', async () => {
      repo.getLoyaltyRewards.mockResolvedValue([{ id: 'r1' }] as any);
      const res = await service.getLoyaltyRewards('u1');
      expect(res).toEqual([{ id: 'r1' }]);
    });

    it('should throw AppError on failure', async () => {
      repo.getLoyaltyRewards.mockRejectedValue(new Error('err'));
      await expect(service.getLoyaltyRewards('u1')).rejects.toThrow(AppError);
    });
  });

  describe('getLoyaltySummary', () => {
    it('should return summary', async () => {
      repo.getLoyaltyProgress.mockResolvedValue([{ id: 'p1' }] as any);
      repo.getLoyaltyRewards.mockResolvedValue([{ id: 'r1' }] as any);
      const res = await service.getLoyaltySummary('u1');
      expect(res).toEqual({ progress: [{ id: 'p1' }], rewards: [{ id: 'r1' }] });
    });
  });

  describe('addStampsForProduct', () => {
    it('should return zeros if quantity <= 0', async () => {
      const res = await service.addStampsForProduct('u1', 'c1', 0);
      expect(res).toEqual({ stampsAdded: 0, currentStamps: 0, rewardsEarned: 0 });
    });

    it('should add stamps, no rewards if threshold not met', async () => {
      repo.findProgress.mockResolvedValue({ current_count: 1, threshold: 4 } as any);
      const res = await service.addStampsForProduct('u1', 'c1', 2);
      
      expect(repo.saveProgress).toHaveBeenCalledWith('u1', 'c1', 3, 4);
      expect(notif.sendToUser).toHaveBeenCalled();
      expect(res).toEqual({ stampsAdded: 2, currentStamps: 3, rewardsEarned: 0 });
    });

    it('should add stamps and rewards if threshold met', async () => {
      repo.findProgress.mockResolvedValue({ current_count: 2, threshold: 4 } as any);
      const res = await service.addStampsForProduct('u1', 'c1', 3); // 2+3 = 5 => 1 reward, 1 left
      
      expect(repo.saveProgress).toHaveBeenCalledWith('u1', 'c1', 1, 4);
      expect(repo.createReward).toHaveBeenCalledTimes(1);
      expect(notif.sendToUser).toHaveBeenCalled();
      expect(res).toEqual({ stampsAdded: 3, currentStamps: 1, rewardsEarned: 1 });
    });

    it('should use default threshold if progress not found', async () => {
      repo.findProgress.mockResolvedValue(null);
      const res = await service.addStampsForProduct('u1', 'c1', 4); // 4 => 1 reward, 0 left
      
      expect(repo.saveProgress).toHaveBeenCalledWith('u1', 'c1', 0, 4);
      expect(repo.createReward).toHaveBeenCalledTimes(1);
      expect(notif.sendToUser).toHaveBeenCalled();
      expect(res).toEqual({ stampsAdded: 4, currentStamps: 0, rewardsEarned: 1 });
    });

    it('should handle errors gracefully', async () => {
      repo.findProgress.mockRejectedValue(new Error('db err'));
      const res = await service.addStampsForProduct('u1', 'c1', 1);
      expect(logger.error).toHaveBeenCalled();
      expect(res).toEqual({ stampsAdded: 0, currentStamps: 0, rewardsEarned: 0 });
    });
  });
});
