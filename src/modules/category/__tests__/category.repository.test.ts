import 'reflect-metadata';
import { CategoryRepository } from '../category.repository';
import { supabaseAdmin } from '../../../config/supabase';

jest.mock('../../../config/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn()
  }
}));

describe('CategoryRepository', () => {
  let repo: CategoryRepository;

  beforeEach(() => {
    repo = new CategoryRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCategories', () => {
    it('should fetch all categories with product count', async () => {
      const mockData = [
        { id: '1', name: 'Cat 1', products: [{ count: 5 }] }, { id: '4', name: 'Cat 4', products: [{ }] },
        { id: '2', name: 'Cat 2', products: [] },
        { id: '3', name: 'Cat 3' }, { id: '4', name: 'Cat 4', products: { count: 5 } }
      ];
      
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockData, error: null })
        })
      });

      const result = await repo.getAllCategories();
      expect(result).toEqual([
        { id: '1', name: 'Cat 1', product_count: 5 }, { id: '4', name: 'Cat 4', product_count: 0 },
        { id: '2', name: 'Cat 2', product_count: 0 },
        { id: '3', name: 'Cat 3', product_count: 0 }, { id: '4', name: 'Cat 4', product_count: 0 }
      ]);
      expect(supabaseAdmin.from).toHaveBeenCalledWith('categories');
    });

    it('should throw error if fetching categories fails', async () => {
      const mockError = new Error('db error');
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: null, error: mockError })
        })
      });
      
      await expect(repo.getAllCategories()).rejects.toThrow('db error');
    });
  });

  describe('getCategoryById', () => {
    it('should fetch a single category', async () => {
      const mockCat = { id: '1', name: 'Cat 1' };
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockCat, error: null })
          })
        })
      });
      
      const result = await repo.getCategoryById('1');
      expect(result).toEqual(mockCat);
      expect(supabaseAdmin.from).toHaveBeenCalledWith('categories');
    });

    it('should throw error if fetching fails', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: new Error('db error') })
          })
        })
      });
      
      await expect(repo.getCategoryById('1')).rejects.toThrow('db error');
    });
  });

  describe('createCategory', () => {
    it('should create a category', async () => {
      const mockCat = { name: 'Cat 1', sort_order: 1 };
      const createdCat = { id: '1', ...mockCat };
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: createdCat, error: null })
          })
        })
      });
      
      const result = await repo.createCategory(mockCat);
      expect(result).toEqual(createdCat);
      expect(supabaseAdmin.from).toHaveBeenCalledWith('categories');
    });

    it('should throw error if creation fails', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: new Error('db error') })
          })
        })
      });
      
      await expect(repo.createCategory({ name: 'Cat 1' })).rejects.toThrow('db error');
    });
  });

  describe('updateCategory', () => {
    it('should update a category', async () => {
      const updatedCat = { id: '1', name: 'Cat 2' };
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: updatedCat, error: null })
            })
          })
        })
      });
      
      const result = await repo.updateCategory('1', { name: 'Cat 2' });
      expect(result).toEqual(updatedCat);
      expect(supabaseAdmin.from).toHaveBeenCalledWith('categories');
    });

    it('should throw error if update fails', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: new Error('db error') })
            })
          })
        })
      });
      
      await expect(repo.updateCategory('1', { name: 'Cat 2' })).rejects.toThrow('db error');
    });
  });

  describe('deleteCategory', () => {
    it('should delete a category if it has no products', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ count: 0, error: null })
            })
          };
        }
        return {
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null })
          })
        };
      });
      
      await repo.deleteCategory('1');
      expect(supabaseAdmin.from).toHaveBeenCalledWith('products');
      expect(supabaseAdmin.from).toHaveBeenCalledWith('categories');
    });

    it('should throw error if it has products', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ count: 1, error: null })
            })
          };
        }
        return {};
      });
      
      await expect(repo.deleteCategory('1')).rejects.toThrow('Cannot delete category because it contains active or inactive products.');
    });

    it('should throw error if counting products fails', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ count: null, error: new Error('db error') })
            })
          };
        }
        return {};
      });
      
      await expect(repo.deleteCategory('1')).rejects.toThrow('db error');
    });

    it('should throw error if deletion fails', async () => {
      (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ count: 0, error: null })
            })
          };
        }
        return {
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: new Error('db error') })
          })
        };
      });
      
      await expect(repo.deleteCategory('1')).rejects.toThrow('db error');
    });
  });
});
