import { StaffRepository } from '../staff.repository';
import { supabaseAdmin } from '../../../config/supabase';

jest.mock('../../../config/supabase', () => {
  const buildQueryMock = (returnValue: any = { id: '1' }) => {
    const builder: any = {
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: returnValue, error: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: returnValue, error: null }),
    };
    return builder;
  };
  return {
    supabaseAdmin: {
      from: jest.fn(() => buildQueryMock()),
      rpc: jest.fn().mockResolvedValue({ data: true, error: null }),
      auth: {
        admin: {
          deleteUser: jest.fn().mockResolvedValue({ error: null }),
          createUser: jest.fn().mockResolvedValue({ data: { user: { id: 'mock-user-id' } }, error: null }),
        }
      }
    }
  };
});

describe('StaffRepository', () => {
  let repository: StaffRepository;

  beforeEach(() => {
    repository = new StaffRepository();
    jest.clearAllMocks();
  });

  describe('findStaffMembers', () => {
    it('should return staff members without branch filter', async () => {
      const mockStaff = [{ id: '1', role: 'admin' }];
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: mockStaff, error: null }),
          }),
        }),
      });

      const res = await repository.findStaffMembers();
      expect(res).toEqual(mockStaff);
    });

    it('should return staff members with branch filter', async () => {
      const mockStaff = [{ id: '1', role: 'barista', branch_id: 'b1' }];
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: mockStaff, error: null }),
            }),
          }),
        }),
      });

      const res = await repository.findStaffMembers('b1');
      expect(res).toEqual(mockStaff);
    });

    it('should return empty array if data is null', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      const res = await repository.findStaffMembers();
      expect(res).toEqual([]);
    });

    it('should throw on error', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: null, error: { message: 'db error' } }),
          }),
        }),
      });

      await expect(repository.findStaffMembers()).rejects.toThrow('db error');
    });
  });

  describe('findStaffById', () => {
    it('should return single staff member', async () => {
      const mockStaff = { id: '1', role: 'admin' };
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: mockStaff, error: null }),
          }),
        }),
      });

      const res = await repository.findStaffById('1');
      expect(res).toEqual(mockStaff);
    });

    it('should throw on error', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: { message: 'db error' } }),
          }),
        }),
      });

      await expect(repository.findStaffById('1')).rejects.toThrow('db error');
    });
  });

  describe('updateStaffProfile', () => {
    it('should update profile', async () => {
      const mockStaff = { id: '1', role: 'admin' };
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockStaff, error: null }),
            }),
          }),
        }),
      });

      const res = await repository.updateStaffProfile('1', { role: 'admin' });
      expect(res).toEqual(mockStaff);
    });

    it('should throw on error', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: { message: 'db error' } }),
            }),
          }),
        }),
      });

      await expect(repository.updateStaffProfile('1', { role: 'admin' })).rejects.toThrow('db error');
    });
  });

  describe('verifyBranchExists', () => {
    it('should return true if branch exists', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'b1' }, error: null }),
          }),
        }),
      });

      const res = await repository.verifyBranchExists('b1');
      expect(res).toBe(true);
    });

    it('should return false if branch does not exist', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      const res = await repository.verifyBranchExists('b1');
      expect(res).toBe(false);
    });

    it('should return false on error', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: { message: 'db error' } }),
          }),
        }),
      });

      const res = await repository.verifyBranchExists('b1');
      expect(res).toBe(false);
    });
  });
});
