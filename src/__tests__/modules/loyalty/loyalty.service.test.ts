import { LoyaltyService } from '../../../modules/loyalty/loyalty.service';
import { LoyaltyRepository } from '../../../modules/loyalty/loyalty.repository';
import { NotificationService } from '../../../modules/notification/notification.service';

// Mock the dependencies
jest.mock('../../../modules/loyalty/loyalty.repository');
jest.mock('../../../modules/notification/notification.service');

const MockedLoyaltyRepository = LoyaltyRepository as jest.MockedClass<typeof LoyaltyRepository>;
const MockedNotificationService = NotificationService as jest.MockedClass<typeof NotificationService>;

describe('LoyaltyService.addStampsForProduct', () => {
  let service: LoyaltyService;
  let mockRepo: jest.Mocked<LoyaltyRepository>;
  let mockNotification: jest.Mocked<NotificationService>;

  beforeEach(() => {
    MockedLoyaltyRepository.mockClear();
    MockedNotificationService.mockClear();
    
    mockRepo = new MockedLoyaltyRepository() as any;
    mockNotification = new MockedNotificationService({} as any) as any;
    
    service = new LoyaltyService(mockRepo, mockNotification);
  });

  it('should return early with zero stamps when quantity is 0', async () => {
    const result = await service.addStampsForProduct('user-1', 'cat-1', 0);

    expect(result).toEqual({ stampsAdded: 0, currentStamps: 0, rewardsEarned: 0 });
    expect(mockRepo.findProgress).not.toHaveBeenCalled();
  });

  it('should return early with zero stamps when quantity is negative', async () => {
    const result = await service.addStampsForProduct('user-1', 'cat-1', -1);

    expect(result).toEqual({ stampsAdded: 0, currentStamps: 0, rewardsEarned: 0 });
    expect(mockRepo.findProgress).not.toHaveBeenCalled();
  });

  it('should add stamps when no progress exists yet (first purchase)', async () => {
    mockRepo.findProgress = jest.fn().mockResolvedValue(null); // No prior progress
    mockRepo.saveProgress = jest.fn().mockResolvedValue({});

    const result = await service.addStampsForProduct('user-1', 'cat-1', 2);

    expect(result.stampsAdded).toBe(2);
    expect(result.currentStamps).toBe(2);
    expect(result.rewardsEarned).toBe(0);
    // saveProgress should be called with 2 stamps, default threshold of 4
    expect(mockRepo.saveProgress).toHaveBeenCalledWith('user-1', 'cat-1', 2, 4);
    expect(mockRepo.createReward).not.toHaveBeenCalled();
  });

  it('should earn exactly 1 reward when stamps reach the threshold', async () => {
    mockRepo.findProgress = jest.fn().mockResolvedValue({
      current_count: 2,
      threshold: 4,
    });
    mockRepo.saveProgress = jest.fn().mockResolvedValue({});
    mockRepo.createReward = jest.fn().mockResolvedValue({});

    // 2 existing + 2 new = 4 → exactly hits threshold
    const result = await service.addStampsForProduct('user-1', 'cat-1', 2);

    expect(result.stampsAdded).toBe(2);
    expect(result.currentStamps).toBe(0); // 4 stamps → reward granted, counter resets to 0
    expect(result.rewardsEarned).toBe(1);
    expect(mockRepo.createReward).toHaveBeenCalledTimes(1);
    expect(mockRepo.saveProgress).toHaveBeenCalledWith('user-1', 'cat-1', 0, 4);
  });

  it('should earn 2 rewards when stamps cross threshold twice', async () => {
    mockRepo.findProgress = jest.fn().mockResolvedValue({
      current_count: 2,
      threshold: 4,
    });
    mockRepo.saveProgress = jest.fn().mockResolvedValue({});
    mockRepo.createReward = jest.fn().mockResolvedValue({});

    // 2 existing + 6 new = 8 stamps → 2 full reward cycles (4+4), leftover = 0
    const result = await service.addStampsForProduct('user-1', 'cat-1', 6);

    expect(result.stampsAdded).toBe(6);
    expect(result.currentStamps).toBe(0);
    expect(result.rewardsEarned).toBe(2);
    expect(mockRepo.createReward).toHaveBeenCalledTimes(2);
  });

  it('should carry over leftover stamps after reward', async () => {
    mockRepo.findProgress = jest.fn().mockResolvedValue({
      current_count: 3,
      threshold: 4,
    });
    mockRepo.saveProgress = jest.fn().mockResolvedValue({});
    mockRepo.createReward = jest.fn().mockResolvedValue({});

    // 3 existing + 3 new = 6 stamps → 1 reward (4 stamps), leftover = 2
    const result = await service.addStampsForProduct('user-1', 'cat-1', 3);

    expect(result.stampsAdded).toBe(3);
    expect(result.currentStamps).toBe(2); // 6 - 4 = 2 leftover
    expect(result.rewardsEarned).toBe(1);
    expect(mockRepo.saveProgress).toHaveBeenCalledWith('user-1', 'cat-1', 2, 4);
  });

  it('should respect a custom threshold stored in progress', async () => {
    mockRepo.findProgress = jest.fn().mockResolvedValue({
      current_count: 0,
      threshold: 10, // custom threshold
    });
    mockRepo.saveProgress = jest.fn().mockResolvedValue({});
    mockRepo.createReward = jest.fn().mockResolvedValue({});

    // 0 + 9 = 9, threshold is 10 → no reward yet
    const result = await service.addStampsForProduct('user-1', 'cat-1', 9);

    expect(result.rewardsEarned).toBe(0);
    expect(result.currentStamps).toBe(9);
    expect(mockRepo.createReward).not.toHaveBeenCalled();
  });

  it('should return zeros and NOT crash when repository throws (resilience)', async () => {
    mockRepo.findProgress = jest.fn().mockRejectedValue(new Error('DB connection lost'));

    const result = await service.addStampsForProduct('user-1', 'cat-1', 2);

    // Must not throw — loyalty failure should never crash checkout
    expect(result).toEqual({ stampsAdded: 0, currentStamps: 0, rewardsEarned: 0 });
  });
});
