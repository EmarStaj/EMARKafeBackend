import 'reflect-metadata';
import { BranchRepository } from '../branch.repository';
import { supabaseAdmin } from '../../../config/supabase';

jest.mock('../../../config/supabase');

describe('BranchRepository', () => {
  let repository: BranchRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new BranchRepository();
  });

  describe('getAllBranches', () => {
    it('should get all branches (only active)', async () => {
      const mockData = [{ id: '1', name: 'Branch 1' }];
      const builder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      (supabaseAdmin.from as jest.Mock).mockReturnValue(builder);

      const result = await repository.getAllBranches(true);
      expect(supabaseAdmin.from).toHaveBeenCalledWith('branches');
      expect(builder.select).toHaveBeenCalledWith('*');
      expect(builder.eq).toHaveBeenCalledWith('is_active', true);
      expect(builder.order).toHaveBeenCalledWith('name', { ascending: true });
      expect(result).toEqual(mockData);
    });

    it('should get all branches (including inactive)', async () => {
      const mockData = [{ id: '1', name: 'Branch 1' }];
      const builder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      (supabaseAdmin.from as jest.Mock).mockReturnValue(builder);

      const result = await repository.getAllBranches(false);
      expect(builder.eq).not.toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    it('should throw error if getAllBranches fails', async () => {
      const builder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
      };
      (supabaseAdmin.from as jest.Mock).mockReturnValue(builder);

      await expect(repository.getAllBranches()).rejects.toThrow('DB Error');
    });
  });

  describe('getBranchById', () => {
    it('should get a branch by ID', async () => {
      const mockData = { id: '1', name: 'Branch 1' };
      const builder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      (supabaseAdmin.from as jest.Mock).mockReturnValue(builder);

      const result = await repository.getBranchById('1');
      expect(builder.eq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual(mockData);
    });

    it('should throw error if getBranchById fails', async () => {
      const builder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
      };
      (supabaseAdmin.from as jest.Mock).mockReturnValue(builder);

      await expect(repository.getBranchById('1')).rejects.toThrow('DB Error');
    });
  });

  describe('createBranch', () => {
    it('should create a branch', async () => {
      const mockData = { id: '1', name: 'Branch 1' };
      const newBranch = { name: 'Branch 1' };
      const builder = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      (supabaseAdmin.from as jest.Mock).mockReturnValue(builder);

      const result = await repository.createBranch(newBranch);
      expect(builder.insert).toHaveBeenCalledWith(newBranch);
      expect(result).toEqual(mockData);
    });

    it('should throw error if createBranch fails', async () => {
      const builder = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
      };
      (supabaseAdmin.from as jest.Mock).mockReturnValue(builder);

      await expect(repository.createBranch({ name: 'Branch 1' })).rejects.toThrow('DB Error');
    });
  });

  describe('updateBranch', () => {
    it('should update a branch', async () => {
      const mockData = { id: '1', name: 'Updated Branch' };
      const updateData = { name: 'Updated Branch' };
      const builder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      (supabaseAdmin.from as jest.Mock).mockReturnValue(builder);

      const result = await repository.updateBranch('1', updateData);
      expect(builder.update).toHaveBeenCalledWith(updateData);
      expect(builder.eq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual(mockData);
    });

    it('should throw error if updateBranch fails', async () => {
      const builder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
      };
      (supabaseAdmin.from as jest.Mock).mockReturnValue(builder);

      await expect(repository.updateBranch('1', {})).rejects.toThrow('DB Error');
    });
  });

  describe('deleteBranch', () => {
    it('should delete a branch', async () => {
      const builder = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      (supabaseAdmin.from as jest.Mock).mockReturnValue(builder);

      await repository.deleteBranch('1');
      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith('id', '1');
    });

    it('should throw error if deleteBranch fails', async () => {
      const builder = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: new Error('DB Error') }),
      };
      (supabaseAdmin.from as jest.Mock).mockReturnValue(builder);

      await expect(repository.deleteBranch('1')).rejects.toThrow('DB Error');
    });
  });

  describe('getBranchProducts', () => {
    it('should get branch products with stock data', async () => {
      const mockProducts = [
        { id: 'p1', name: 'Product 1' },
        { id: 'p2', name: 'Product 2' }
      ];
      const mockStock = [
        { product_id: 'p1', is_available: false, updated_at: '2023-01-01', updated_by: 'user1' }
      ];
      
      const builderProducts = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockProducts, error: null }),
      };
      const builderStock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockStock, error: null }),
      };
      
      (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
        if (table === 'products') return builderProducts;
        if (table === 'branch_products') return builderStock;
        return { select: jest.fn().mockReturnThis() };
      });

      const result = await repository.getBranchProducts('b1');
      expect(result).toHaveLength(2);
      expect(result[0].is_available).toBe(false);
      expect(result[1].is_available).toBe(true);
    });

    it('should handle null stock data gracefully', async () => {
      const mockProducts = [
        { id: 'p1', name: 'Product 1' }
      ];
      
      const builderProducts = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockProducts, error: null }),
      };
      const builderStock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      
      (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
        if (table === 'products') return builderProducts;
        if (table === 'branch_products') return builderStock;
        return { select: jest.fn().mockReturnThis() };
      });

      const result = await repository.getBranchProducts('b1');
      expect(result).toHaveLength(1);
      expect(result[0].is_available).toBe(true);
    });

    it('should throw error if fetching products fails', async () => {
      const builderProducts = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: new Error('Prod Error') }),
      };
      (supabaseAdmin.from as jest.Mock).mockReturnValue(builderProducts);

      await expect(repository.getBranchProducts('b1')).rejects.toThrow('Prod Error');
    });

    it('should throw error if fetching stock fails', async () => {
      const builderProducts = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      const builderStock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: new Error('Stock Error') }),
      };
      (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
        if (table === 'products') return builderProducts;
        if (table === 'branch_products') return builderStock;
        return {};
      });

      await expect(repository.getBranchProducts('b1')).rejects.toThrow('Stock Error');
    });

    it('should handle null products data gracefully', async () => {
      const builderProducts = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      const builderStock = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      
      (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
        if (table === 'products') return builderProducts;
        if (table === 'branch_products') return builderStock;
        return { select: jest.fn().mockReturnThis() };
      });

      const result = await repository.getBranchProducts('b1');
      expect(result).toEqual([]);
    });
  });

  describe('updateBranchProductAvailability', () => {
    it('should update availability', async () => {
      const mockData = { id: '1' };
      const builder = {
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      (supabaseAdmin.from as jest.Mock).mockReturnValue(builder);

      const result = await repository.updateBranchProductAvailability('b1', 'p1', true, 'u1');
      expect(builder.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          branch_id: 'b1',
          product_id: 'p1',
          is_available: true,
          updated_by: 'u1'
        }),
        { onConflict: 'branch_id,product_id' }
      );
      expect(result).toEqual(mockData);
    });

    it('should throw error if upsert fails', async () => {
      const builder = {
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
      };
      (supabaseAdmin.from as jest.Mock).mockReturnValue(builder);

      await expect(repository.updateBranchProductAvailability('b1', 'p1', true, 'u1')).rejects.toThrow('DB Error');
    });
  });
});
