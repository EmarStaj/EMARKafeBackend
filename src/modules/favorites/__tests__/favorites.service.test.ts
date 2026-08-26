import { FavoritesService } from '../favorites.service';
import { FavoritesRepository } from '../favorites.repository';
import { AppError } from '../../../utils/app-error';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let repo: jest.Mocked<FavoritesRepository>;

  beforeEach(() => {
    repo = {
      getFavorites: jest.fn(),
      findFavorite: jest.fn(),
      addFavorite: jest.fn(),
      removeFavorite: jest.fn(),
    } as unknown as jest.Mocked<FavoritesRepository>;
    service = new FavoritesService(repo);
  });

  describe('getFavorites', () => {
    it('should get favorites successfully', async () => {
      repo.getFavorites.mockResolvedValue([{ id: 'fav1' }] as any);
      const res = await service.getFavorites('token', 'u1');
      expect(res).toEqual([{ id: 'fav1' }]);
    });

    it('should throw AppError if it fails', async () => {
      repo.getFavorites.mockRejectedValue(new Error('error'));
      await expect(service.getFavorites('token', 'u1')).rejects.toThrow(AppError);
    });
  });

  describe('addFavorite', () => {
    it('should return existing favorite if found', async () => {
      repo.findFavorite.mockResolvedValue({ id: 'fav1' } as any);
      const res = await service.addFavorite('u1', 'p1', 'token');
      expect(res).toEqual({ data: { id: 'fav1' }, isNew: false });
    });

    it('should add new favorite if not found', async () => {
      repo.findFavorite.mockResolvedValue(null);
      repo.addFavorite.mockResolvedValue({ id: 'newFav' } as any);
      const res = await service.addFavorite('u1', 'p1', 'token');
      expect(res).toEqual({ data: { id: 'newFav' }, isNew: true });
    });

    it('should throw AppError on error', async () => {
      repo.findFavorite.mockRejectedValue(new Error('fail'));
      await expect(service.addFavorite('u1', 'p1', 'token')).rejects.toThrow(AppError);
    });
  });

  describe('removeFavorite', () => {
    it('should remove favorite successfully', async () => {
      repo.removeFavorite.mockResolvedValue(undefined);
      await service.removeFavorite('u1', 'p1', 'token');
      expect(repo.removeFavorite).toHaveBeenCalledWith('u1', 'p1', 'token');
    });

    it('should throw AppError on error', async () => {
      repo.removeFavorite.mockRejectedValue(new Error('fail'));
      await expect(service.removeFavorite('u1', 'p1', 'token')).rejects.toThrow(AppError);
    });
  });
});
