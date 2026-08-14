import { BranchService } from '../../../modules/branch/branch.service';
import { BranchRepository } from '../../../modules/branch/branch.repository';
import { MenuRepository } from '../../../modules/menu/menu.repository';

jest.mock('../../../modules/branch/branch.repository');
jest.mock('../../../modules/menu/menu.repository');

const MockedBranchRepository = BranchRepository as jest.MockedClass<typeof BranchRepository>;
const MockedMenuRepository = MenuRepository as jest.MockedClass<typeof MenuRepository>;

describe('BranchService', () => {
  let service: BranchService;
  let mockBranchRepo: jest.Mocked<BranchRepository>;
  let mockMenuRepo: jest.Mocked<MenuRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBranchRepo = new MockedBranchRepository() as any;
    mockMenuRepo = new MockedMenuRepository() as any;
    service = new BranchService(mockBranchRepo, mockMenuRepo);
  });

  describe('getAllBranches', () => {
    it('should return list of branches', async () => {
      const mockBranches = [{ id: 'b-1', name: 'Kadıköy', is_active: true }];
      mockBranchRepo.getAllBranches = jest.fn().mockResolvedValue(mockBranches);

      const result = await service.getAllBranches();

      expect(result).toEqual(mockBranches);
      expect(mockBranchRepo.getAllBranches).toHaveBeenCalledWith(true);
    });
  });

  describe('getBranchById', () => {
    it('should return branch by id', async () => {
      const mockBranch = { id: 'b-1', name: 'Kadıköy', is_active: true };
      mockBranchRepo.getBranchById = jest.fn().mockResolvedValue(mockBranch);

      const result = await service.getBranchById('b-1');

      expect(result).toEqual(mockBranch);
      expect(mockBranchRepo.getBranchById).toHaveBeenCalledWith('b-1');
    });

    it('should throw 404 when branch is not found', async () => {
      mockBranchRepo.getBranchById = jest.fn().mockRejectedValue({ code: 'PGRST116' });

      await expect(service.getBranchById('unknown-branch')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('updateBranchProductAvailability', () => {
    it('should update branch product stock', async () => {
      mockBranchRepo.getBranchById = jest.fn().mockResolvedValue({ id: 'b-1' });
      mockMenuRepo.getItemById = jest.fn().mockResolvedValue({ id: 'p-1', name: 'Latte' });
      mockBranchRepo.updateBranchProductAvailability = jest.fn().mockResolvedValue({
        branch_id: 'b-1',
        product_id: 'p-1',
        is_available: false,
      });

      const result = await service.updateBranchProductAvailability('b-1', 'p-1', false, 'user-123');

      expect(result.is_available).toBe(false);
      expect(mockBranchRepo.updateBranchProductAvailability).toHaveBeenCalledWith('b-1', 'p-1', false, 'user-123');
    });
  });
});
