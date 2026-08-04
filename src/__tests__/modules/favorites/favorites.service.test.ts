import { FavoritesService } from '../../../modules/favorites/favorites.service';
import { FavoritesRepository } from '../../../modules/favorites/favorites.repository';
import { AppError } from '../../../utils/app-error';

jest.mock('../../../modules/favorites/favorites.repository');

const MockedFavoritesRepository = FavoritesRepository as jest.MockedClass<typeof FavoritesRepository>;

const MOCK_USER_ID = 'user-uuid-1234';
const MOCK_PRODUCT_ID = 'product-uuid-5678';
const MOCK_TOKEN = 'mock-jwt-token';
const MOCK_FAVORITE = {
  id: 'fav-uuid-1',
  user_id: MOCK_USER_ID,
  product_id: MOCK_PRODUCT_ID,
  created_at: '2026-08-04T00:00:00Z',
};

describe('FavoritesService.addFavorite', () => {
  let service: FavoritesService;
  let mockRepo: jest.Mocked<FavoritesRepository>;

  beforeEach(() => {
    MockedFavoritesRepository.mockClear();
    service = new FavoritesService();
    mockRepo = MockedFavoritesRepository.mock.instances[0] as jest.Mocked<FavoritesRepository>;
  });

  it('should return { isNew: true } and the new record when adding a new favorite', async () => {
    mockRepo.findFavorite = jest.fn().mockResolvedValue(null); // Not yet in favorites
    mockRepo.addFavorite = jest.fn().mockResolvedValue(MOCK_FAVORITE);

    const result = await service.addFavorite(MOCK_USER_ID, MOCK_PRODUCT_ID, MOCK_TOKEN);

    expect(result.isNew).toBe(true);
    expect(result.data).toEqual(MOCK_FAVORITE);
    expect(mockRepo.findFavorite).toHaveBeenCalledWith(MOCK_USER_ID, MOCK_PRODUCT_ID, MOCK_TOKEN);
    expect(mockRepo.addFavorite).toHaveBeenCalledWith(MOCK_USER_ID, MOCK_PRODUCT_ID, MOCK_TOKEN);
  });

  it('should return { isNew: false } and existing record when favorite already exists (idempotent)', async () => {
    mockRepo.findFavorite = jest.fn().mockResolvedValue(MOCK_FAVORITE); // Already in favorites
    mockRepo.addFavorite = jest.fn();

    const result = await service.addFavorite(MOCK_USER_ID, MOCK_PRODUCT_ID, MOCK_TOKEN);

    expect(result.isNew).toBe(false);
    expect(result.data).toEqual(MOCK_FAVORITE);
    // Must NOT call addFavorite — no duplicate insert
    expect(mockRepo.addFavorite).not.toHaveBeenCalled();
  });

  it('should throw AppError when repository throws during findFavorite', async () => {
    mockRepo.findFavorite = jest.fn().mockRejectedValue(new Error('DB error'));

    await expect(
      service.addFavorite(MOCK_USER_ID, MOCK_PRODUCT_ID, MOCK_TOKEN)
    ).rejects.toBeInstanceOf(AppError);
  });

  it('should throw AppError when repository throws during addFavorite insert', async () => {
    mockRepo.findFavorite = jest.fn().mockResolvedValue(null);
    mockRepo.addFavorite = jest.fn().mockRejectedValue(new Error('Insert failed'));

    await expect(
      service.addFavorite(MOCK_USER_ID, MOCK_PRODUCT_ID, MOCK_TOKEN)
    ).rejects.toBeInstanceOf(AppError);
  });
});

describe('FavoritesService.removeFavorite', () => {
  let service: FavoritesService;
  let mockRepo: jest.Mocked<FavoritesRepository>;

  beforeEach(() => {
    MockedFavoritesRepository.mockClear();
    service = new FavoritesService();
    mockRepo = MockedFavoritesRepository.mock.instances[0] as jest.Mocked<FavoritesRepository>;
  });

  it('should call removeFavorite on the repository', async () => {
    mockRepo.removeFavorite = jest.fn().mockResolvedValue(undefined);

    await service.removeFavorite(MOCK_USER_ID, MOCK_PRODUCT_ID, MOCK_TOKEN);

    expect(mockRepo.removeFavorite).toHaveBeenCalledWith(MOCK_USER_ID, MOCK_PRODUCT_ID, MOCK_TOKEN);
  });

  it('should throw AppError when repository throws', async () => {
    mockRepo.removeFavorite = jest.fn().mockRejectedValue(new Error('Delete failed'));

    await expect(
      service.removeFavorite(MOCK_USER_ID, MOCK_PRODUCT_ID, MOCK_TOKEN)
    ).rejects.toBeInstanceOf(AppError);
  });
});
