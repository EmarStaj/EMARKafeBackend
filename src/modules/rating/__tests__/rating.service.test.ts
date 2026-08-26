import 'reflect-metadata';
import { RatingService } from '../rating.service';
import { RatingRepository } from '../rating.repository';
import { OrderRepository } from '../../order/order.repository';
import { SettingsRepository } from '../../settings/settings.repository';
import { AppError } from '../../../utils/app-error';

describe('RatingService', () => {
  let service: RatingService;
  let ratingRepo: jest.Mocked<RatingRepository>;
  let orderRepo: jest.Mocked<OrderRepository>;
  let settingsRepo: jest.Mocked<SettingsRepository>;

  beforeEach(() => {
    ratingRepo = {
      hasPurchasedProduct: jest.fn(),
      findRatingByOrder: jest.fn(),
      addOrUpdateRating: jest.fn(),
      updateProductRatingStats: jest.fn(),
    } as any;
    orderRepo = {
      getOrderById: jest.fn(),
    } as any;
    settingsRepo = {
      getSettingByKey: jest.fn(),
    } as any;

    service = new RatingService(ratingRepo, orderRepo, settingsRepo);
    jest.clearAllMocks();
  });

  describe('rateProduct', () => {
    it('should throw if rating is invalid', async () => {
      await expect(service.rateProduct('u1', 'p1', 'o1', 0, 'token')).rejects.toThrow('Rating must be an integer between 1 and 5.');
      await expect(service.rateProduct('u1', 'p1', 'o1', 6, 'token')).rejects.toThrow('Rating must be an integer between 1 and 5.');
    });

    it('should throw if order not found (PGRST116)', async () => {
      const err = new Error('not found');
      (err as any).code = 'PGRST116';
      orderRepo.getOrderById.mockRejectedValue(err);
      await expect(service.rateProduct('u1', 'p1', 'o1', 5, 'token')).rejects.toThrow('Order not found or access denied.');
    });

    it('should rethrow order fetch error', async () => {
      const err = new Error('db error');
      orderRepo.getOrderById.mockRejectedValue(err);
      await expect(service.rateProduct('u1', 'p1', 'o1', 5, 'token')).rejects.toThrow('db error');
    });

    it('should throw if order not owned by user', async () => {
      orderRepo.getOrderById.mockResolvedValue({ user_id: 'u2' } as any);
      await expect(service.rateProduct('u1', 'p1', 'o1', 5, 'token')).rejects.toThrow('Order not found or access denied.');
    });

    it('should throw if order is null', async () => {
      orderRepo.getOrderById.mockResolvedValue(null as any);
      await expect(service.rateProduct('u1', 'p1', 'o1', 5, 'token')).rejects.toThrow('Order not found or access denied.');
    });

    it('should throw if order not completed', async () => {
      orderRepo.getOrderById.mockResolvedValue({ user_id: 'u1', status: 'pending' } as any);
      await expect(service.rateProduct('u1', 'p1', 'o1', 5, 'token')).rejects.toThrow('You can only rate products from a completed order.');
    });

    it('should throw if rating time window expired', async () => {
      orderRepo.getOrderById.mockResolvedValue({ user_id: 'u1', status: 'completed', completed_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString() } as any);
      settingsRepo.getSettingByKey.mockResolvedValue({ value: '2' }); // 2 hours
      await expect(service.rateProduct('u1', 'p1', 'o1', 5, 'token')).rejects.toThrow('Rating time window (2 hours) has expired for this order.');
    });

    it('should pass if time limit is <= 0', async () => {
      orderRepo.getOrderById.mockResolvedValue({ user_id: 'u1', status: 'completed', completed_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString() } as any);
      settingsRepo.getSettingByKey.mockResolvedValue({ value: '0' });
      ratingRepo.hasPurchasedProduct.mockResolvedValue(true);
      ratingRepo.addOrUpdateRating.mockResolvedValue({});
      ratingRepo.updateProductRatingStats.mockResolvedValue({ avg_rating: 0, rating_count: 0 });
      await service.rateProduct('u1', 'p1', 'o1', 5, 'token');
    });

    it('should pass if order has no completed_at', async () => {
      orderRepo.getOrderById.mockResolvedValue({ user_id: 'u1', status: 'completed' } as any);
      settingsRepo.getSettingByKey.mockResolvedValue({ value: '2' });
      ratingRepo.hasPurchasedProduct.mockResolvedValue(true);
      ratingRepo.addOrUpdateRating.mockResolvedValue({});
      ratingRepo.updateProductRatingStats.mockResolvedValue({ avg_rating: 0, rating_count: 0 });
      await service.rateProduct('u1', 'p1', 'o1', 5, 'token');
    });

    it('should pass if time limit not exceeded', async () => {
      orderRepo.getOrderById.mockResolvedValue({ user_id: 'u1', status: 'completed', completed_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString() } as any);
      settingsRepo.getSettingByKey.mockResolvedValue({ value: '2' });
      ratingRepo.hasPurchasedProduct.mockResolvedValue(true);
      ratingRepo.addOrUpdateRating.mockResolvedValue({});
      ratingRepo.updateProductRatingStats.mockResolvedValue({ avg_rating: 0, rating_count: 0 });
      await service.rateProduct('u1', 'p1', 'o1', 5, 'token');
    });

    it('should pass if timeLimitSetting has no value', async () => {
      orderRepo.getOrderById.mockResolvedValue({ user_id: 'u1', status: 'completed', completed_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString() } as any);
      settingsRepo.getSettingByKey.mockResolvedValue({} as any);
      ratingRepo.hasPurchasedProduct.mockResolvedValue(true);
      ratingRepo.addOrUpdateRating.mockResolvedValue({});
      ratingRepo.updateProductRatingStats.mockResolvedValue({ avg_rating: 0, rating_count: 0 });
      await service.rateProduct('u1', 'p1', 'o1', 5, 'token');
    });

    it('should ignore settings error if not AppError', async () => {
      orderRepo.getOrderById.mockResolvedValue({ user_id: 'u1', status: 'completed' } as any);
      settingsRepo.getSettingByKey.mockRejectedValue(new Error('ignore me'));
      ratingRepo.hasPurchasedProduct.mockResolvedValue(true);
      ratingRepo.addOrUpdateRating.mockResolvedValue({});
      ratingRepo.updateProductRatingStats.mockResolvedValue({ avg_rating: 0, rating_count: 0 });

      await service.rateProduct('u1', 'p1', 'o1', 5, 'token');
      expect(ratingRepo.hasPurchasedProduct).toHaveBeenCalled();
    });
    
    it('should rethrow settings error if AppError', async () => {
      orderRepo.getOrderById.mockResolvedValue({ user_id: 'u1', status: 'completed' } as any);
      settingsRepo.getSettingByKey.mockRejectedValue(new AppError('throw me', 400));
      await expect(service.rateProduct('u1', 'p1', 'o1', 5, 'token')).rejects.toThrow('throw me');
    });

    it('should throw if not purchased', async () => {
      orderRepo.getOrderById.mockResolvedValue({ user_id: 'u1', status: 'completed' } as any);
      settingsRepo.getSettingByKey.mockResolvedValue(null);
      ratingRepo.hasPurchasedProduct.mockResolvedValue(false);
      await expect(service.rateProduct('u1', 'p1', 'o1', 5, 'token')).rejects.toThrow('You can only rate products you have purchased in a completed order.');
    });

    it('should rate product successfully', async () => {
      orderRepo.getOrderById.mockResolvedValue({ user_id: 'u1', status: 'completed' } as any);
      settingsRepo.getSettingByKey.mockResolvedValue(null);
      ratingRepo.hasPurchasedProduct.mockResolvedValue(true);
      ratingRepo.addOrUpdateRating.mockResolvedValue({ id: 'r1' });
      ratingRepo.updateProductRatingStats.mockResolvedValue({ avg_rating: 5, rating_count: 1 });

      const res = await service.rateProduct('u1', 'p1', 'o1', 5, 'token');
      expect(res.ratingRecord).toEqual({ id: 'r1' });
      expect(res.stats).toEqual({ avg_rating: 5, rating_count: 1 });
    });
    
    it('should throw default AppError if unhandled exception', async () => {
      orderRepo.getOrderById.mockResolvedValue({ user_id: 'u1', status: 'completed' } as any);
      settingsRepo.getSettingByKey.mockResolvedValue(null);
      ratingRepo.hasPurchasedProduct.mockResolvedValue(true);
      ratingRepo.addOrUpdateRating.mockRejectedValue({});
      await expect(service.rateProduct('u1', 'p1', 'o1', 5, 'token')).rejects.toThrow('Failed to submit rating.');
    });
  });
});
