import 'reflect-metadata';
import { RatingService } from '../../../modules/rating/rating.service';
import { RatingRepository } from '../../../modules/rating/rating.repository';
import { OrderRepository } from '../../../modules/order/order.repository';
import { SettingsRepository } from '../../../modules/settings/settings.repository';

describe('RatingService Unit Tests', () => {
  let ratingService: RatingService;
  let mockRatingRepository: jest.Mocked<RatingRepository>;
  let mockOrderRepository: jest.Mocked<OrderRepository>;
  let mockSettingsRepository: jest.Mocked<SettingsRepository>;

  beforeEach(() => {
    mockRatingRepository = {
      hasPurchasedProduct: jest.fn(),
      addOrUpdateRating: jest.fn(),
      updateProductRatingStats: jest.fn(),
    } as any;

    mockOrderRepository = {
      getOrderById: jest.fn(),
    } as any;

    mockSettingsRepository = {
      getSettingByKey: jest.fn(),
    } as any;

    ratingService = new RatingService(
      mockRatingRepository,
      mockOrderRepository,
      mockSettingsRepository
    );
  });

  describe('rateProduct', () => {
    it('should throw error for invalid rating bounds (<1 or >5)', async () => {
      await expect(
        ratingService.rateProduct('u-1', 'p-1', 'ord-1', 6, 'token')
      ).rejects.toThrow('Rating must be an integer between 1 and 5.');

      await expect(
        ratingService.rateProduct('u-1', 'p-1', 'ord-1', 0, 'token')
      ).rejects.toThrow('Rating must be an integer between 1 and 5.');
    });

    it('should throw 404 error if order does not belong to user', async () => {
      mockOrderRepository.getOrderById.mockResolvedValue({
        id: 'ord-1',
        user_id: 'different-user',
        status: 'completed',
      } as any);

      await expect(
        ratingService.rateProduct('u-1', 'p-1', 'ord-1', 5, 'token')
      ).rejects.toThrow('Order not found or access denied.');
    });

    it('should throw 400 error if order is not completed', async () => {
      mockOrderRepository.getOrderById.mockResolvedValue({
        id: 'ord-1',
        user_id: 'u-1',
        status: 'preparing',
      } as any);

      await expect(
        ratingService.rateProduct('u-1', 'p-1', 'ord-1', 5, 'token')
      ).rejects.toThrow('You can only rate products from a completed order.');
    });

    it('should throw 400 error if user did not purchase product', async () => {
      mockOrderRepository.getOrderById.mockResolvedValue({
        id: 'ord-1',
        user_id: 'u-1',
        status: 'completed',
      } as any);
      mockSettingsRepository.getSettingByKey.mockResolvedValue(null as any);
      mockRatingRepository.hasPurchasedProduct.mockResolvedValue(false);

      await expect(
        ratingService.rateProduct('u-1', 'p-1', 'ord-1', 5, 'token')
      ).rejects.toThrow('You can only rate products you have purchased in a completed order.');
    });

    it('should successfully submit rating and recalculate stats', async () => {
      mockOrderRepository.getOrderById.mockResolvedValue({
        id: 'ord-1',
        user_id: 'u-1',
        status: 'completed',
      } as any);
      mockSettingsRepository.getSettingByKey.mockResolvedValue(null as any);
      mockRatingRepository.hasPurchasedProduct.mockResolvedValue(true);
      mockRatingRepository.addOrUpdateRating.mockResolvedValue({
        id: 'r-1',
        rating: 5,
      } as any);
      mockRatingRepository.updateProductRatingStats.mockResolvedValue({
        avg_rating: 4.8,
        rating_count: 10,
      } as any);

      const result = await ratingService.rateProduct('u-1', 'p-1', 'ord-1', 5, 'token');

      expect(result.ratingRecord).toEqual({ id: 'r-1', rating: 5 });
      expect(result.stats).toEqual({ avg_rating: 4.8, rating_count: 10 });
    });
  });
});
