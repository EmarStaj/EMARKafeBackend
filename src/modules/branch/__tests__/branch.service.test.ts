import 'reflect-metadata';
import { BranchService } from '../branch.service';
import { BranchRepository } from '../branch.repository';
import { MenuRepository } from '../../menu/menu.repository';
import { AppError } from '../../../utils/app-error';

describe('BranchService', () => {
  let service: BranchService;
  let branchRepoMock: jest.Mocked<BranchRepository>;
  let menuRepoMock: jest.Mocked<MenuRepository>;

  beforeEach(() => {
    branchRepoMock = {
      getAllBranches: jest.fn(),
      getBranchById: jest.fn(),
      createBranch: jest.fn(),
      updateBranch: jest.fn(),
      deleteBranch: jest.fn(),
      getBranchProducts: jest.fn(),
      updateBranchProductAvailability: jest.fn(),
    } as unknown as jest.Mocked<BranchRepository>;

    menuRepoMock = {
      getItemById: jest.fn(),
    } as unknown as jest.Mocked<MenuRepository>;

    service = new BranchService(branchRepoMock, menuRepoMock);
  });

  describe('getAllBranches', () => {
    it('should return branches', async () => {
      const mockBranches = [{ id: '1', name: 'Branch 1' }];
      branchRepoMock.getAllBranches.mockResolvedValue(mockBranches);
      
      const result = await service.getAllBranches(true);
      expect(result).toEqual(mockBranches);
      expect(branchRepoMock.getAllBranches).toHaveBeenCalledWith(true);
    });

    it('should throw AppError on failure', async () => {
      branchRepoMock.getAllBranches.mockRejectedValue(new Error('Repo error'));
      
      await expect(service.getAllBranches(true)).rejects.toThrow(AppError);
      await expect(service.getAllBranches(true)).rejects.toThrow('Repo error');
    });

    it('should default to generic error message', async () => {
      branchRepoMock.getAllBranches.mockRejectedValue({});
      
      await expect(service.getAllBranches()).rejects.toThrow('Failed to retrieve branches.');
    });
  });

  describe('getBranchById', () => {
    it('should return a branch', async () => {
      const mockBranch = { id: '1', name: 'Branch 1' };
      branchRepoMock.getBranchById.mockResolvedValue(mockBranch);
      
      const result = await service.getBranchById('1');
      expect(result).toEqual(mockBranch);
      expect(branchRepoMock.getBranchById).toHaveBeenCalledWith('1');
    });

    it('should throw 404 AppError if PGRST116 (not found)', async () => {
      const err = new Error('Not Found') as any;
      err.code = 'PGRST116';
      branchRepoMock.getBranchById.mockRejectedValue(err);
      
      await expect(service.getBranchById('1')).rejects.toThrow(AppError);
      await expect(service.getBranchById('1')).rejects.toMatchObject({ statusCode: 404, message: 'Branch not found.' });
    });

    it('should throw 400 AppError on other errors', async () => {
      branchRepoMock.getBranchById.mockRejectedValue(new Error('Repo error'));
      
      await expect(service.getBranchById('1')).rejects.toMatchObject({ statusCode: 400, message: 'Repo error' });
    });
  });

  describe('createBranch', () => {
    it('should create and return a branch', async () => {
      const mockBranch = { id: '1', name: 'Branch 1' };
      branchRepoMock.createBranch.mockResolvedValue(mockBranch);
      
      const result = await service.createBranch({ name: 'Branch 1' });
      expect(result).toEqual(mockBranch);
      expect(branchRepoMock.createBranch).toHaveBeenCalledWith({ name: 'Branch 1' });
    });

    it('should throw AppError on failure', async () => {
      branchRepoMock.createBranch.mockRejectedValue(new Error('Repo error'));
      
      await expect(service.createBranch({ name: 'Branch 1' })).rejects.toThrow(AppError);
    });

    it('should throw default AppError message if missing', async () => {
      branchRepoMock.createBranch.mockRejectedValue({});
      
      await expect(service.createBranch({ name: 'Branch 1' })).rejects.toThrow('Failed to create branch.');
    });
  });

  describe('updateBranch', () => {
    it('should update and return a branch', async () => {
      const mockBranch = { id: '1', name: 'Updated Branch' };
      branchRepoMock.updateBranch.mockResolvedValue(mockBranch);
      
      const result = await service.updateBranch('1', { name: 'Updated Branch' });
      expect(result).toEqual(mockBranch);
      expect(branchRepoMock.updateBranch).toHaveBeenCalledWith('1', { name: 'Updated Branch' });
    });

    it('should throw AppError on failure', async () => {
      branchRepoMock.updateBranch.mockRejectedValue(new Error('Repo error'));
      
      await expect(service.updateBranch('1', {})).rejects.toThrow(AppError);
    });

    it('should throw default message if no error message', async () => {
      branchRepoMock.updateBranch.mockRejectedValue({});
      
      await expect(service.updateBranch('1', {})).rejects.toThrow('Failed to update branch.');
    });
  });

  describe('deleteBranch', () => {
    it('should call getBranchById and deleteBranch', async () => {
      branchRepoMock.getBranchById.mockResolvedValue({ id: '1', name: 'Branch 1' });
      branchRepoMock.deleteBranch.mockResolvedValue();
      
      await service.deleteBranch('1');
      expect(branchRepoMock.getBranchById).toHaveBeenCalledWith('1');
      expect(branchRepoMock.deleteBranch).toHaveBeenCalledWith('1');
    });

    it('should throw AppError on failure', async () => {
      branchRepoMock.getBranchById.mockRejectedValue(new Error('Repo error'));
      
      await expect(service.deleteBranch('1')).rejects.toThrow(AppError);
    });

    it('should default error message if none', async () => {
      branchRepoMock.getBranchById.mockRejectedValue({});
      
      await expect(service.deleteBranch('1')).rejects.toThrow('Failed to delete branch.');
    });
  });

  describe('getBranchProducts', () => {
    it('should call getBranchById and getBranchProducts', async () => {
      branchRepoMock.getBranchById.mockResolvedValue({ id: '1', name: 'Branch 1' });
      const mockProducts: any = [{ product_id: 'p1' }];
      branchRepoMock.getBranchProducts.mockResolvedValue(mockProducts);
      
      const result = await service.getBranchProducts('1');
      expect(result).toEqual(mockProducts);
      expect(branchRepoMock.getBranchById).toHaveBeenCalledWith('1');
      expect(branchRepoMock.getBranchProducts).toHaveBeenCalledWith('1');
    });

    it('should throw AppError on failure', async () => {
      branchRepoMock.getBranchById.mockRejectedValue(new Error('Repo error'));
      
      await expect(service.getBranchProducts('1')).rejects.toThrow(AppError);
    });

    it('should fallback to default error message', async () => {
      branchRepoMock.getBranchById.mockRejectedValue({});
      
      await expect(service.getBranchProducts('1')).rejects.toThrow('Failed to retrieve branch product stock list.');
    });
  });

  describe('updateBranchProductAvailability', () => {
    it('should verify branch, verify product and update availability', async () => {
      branchRepoMock.getBranchById.mockResolvedValue({ id: 'b1', name: 'Branch 1' });
      menuRepoMock.getItemById.mockResolvedValue({ id: 'p1', name: 'Product 1' } as any);
      const mockResult = { id: 'mapping-1' };
      branchRepoMock.updateBranchProductAvailability.mockResolvedValue(mockResult);

      const result = await service.updateBranchProductAvailability('b1', 'p1', true, 'u1');
      expect(branchRepoMock.getBranchById).toHaveBeenCalledWith('b1');
      expect(menuRepoMock.getItemById).toHaveBeenCalledWith('p1');
      expect(branchRepoMock.updateBranchProductAvailability).toHaveBeenCalledWith('b1', 'p1', true, 'u1');
      expect(result).toEqual(mockResult);
    });

    it('should throw 404 if product not found', async () => {
      branchRepoMock.getBranchById.mockResolvedValue({ id: 'b1', name: 'Branch 1' });
      menuRepoMock.getItemById.mockResolvedValue(null as any);

      await expect(service.updateBranchProductAvailability('b1', 'p1', true, 'u1'))
        .rejects.toMatchObject({ statusCode: 400, message: 'Product not found.' });
    });

    it('should throw 400 AppError on failure', async () => {
      branchRepoMock.getBranchById.mockRejectedValue(new Error('Repo error'));

      await expect(service.updateBranchProductAvailability('b1', 'p1', true, 'u1'))
        .rejects.toThrow('Repo error');
    });

    it('should fallback to default error message', async () => {
      branchRepoMock.getBranchById.mockRejectedValue({});

      await expect(service.updateBranchProductAvailability('b1', 'p1', true, 'u1'))
        .rejects.toThrow('Failed to update product availability.');
    });
  });
});
