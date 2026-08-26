import 'reflect-metadata';
import { StaffService } from '../staff.service';
import { StaffRepository } from '../staff.repository';
import { AuditService } from '../../audit/audit.service';
import { supabaseAdmin } from '../../../config/supabase';
import { profileCache } from '../../../config/profile-cache';

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
jest.mock('../../../config/profile-cache', () => ({
  profileCache: { invalidate: jest.fn() },
}));

describe('StaffService', () => {
  let service: StaffService;
  let staffRepo: jest.Mocked<StaffRepository>;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(() => {
    staffRepo = {
      findStaffMembers: jest.fn(),
      findStaffById: jest.fn(),
      updateStaffProfile: jest.fn(),
      verifyBranchExists: jest.fn(),
    } as any;
    auditService = {
      logEvent: jest.fn(),
    } as any;

    service = new StaffService(staffRepo, auditService);
    jest.clearAllMocks();
  });

  describe('createStaff', () => {
    it('should throw if branch manager creates non-barista', async () => {
      const creator = { role: 'branch_manager', branch_id: 'b1' } as any;
      await expect(service.createStaff(creator, { role: 'admin', email: 'e', password: 'p', full_name: 'n' })).rejects.toThrow('Branch managers can only create barista staff accounts.');
    });

    it('should throw if branch manager has no branch', async () => {
      const creator = { role: 'branch_manager', branch_id: null } as any;
      await expect(service.createStaff(creator, { role: 'barista', email: 'e', password: 'p', full_name: 'n' })).rejects.toThrow('Branch manager has no assigned branch.');
    });

    it('should allow branch manager to create barista and assign to same branch', async () => {
      const creator = { role: 'branch_manager', branch_id: 'b1', id: 'm1' } as any;
      staffRepo.verifyBranchExists.mockResolvedValue(true);
      staffRepo.updateStaffProfile.mockResolvedValue({ id: 'u1' } as any);
      
      const res = await service.createStaff(creator, { role: 'barista', email: 'e', password: 'p', full_name: 'n' });
      expect(res.id).toBe('u1');
      expect(staffRepo.updateStaffProfile).toHaveBeenCalledWith('mock-user-id', expect.objectContaining({ branch_id: 'b1' }));
    });

    it('should throw if unauthorized role', async () => {
      const creator = { role: 'customer' } as any;
      await expect(service.createStaff(creator, { role: 'barista', email: 'e', password: 'p', full_name: 'n' })).rejects.toThrow('Unauthorized: Only Admins and Branch Managers can create staff.');
    });

    it('should throw if role needs branch but branch_id is missing', async () => {
      const creator = { role: 'admin' } as any;
      await expect(service.createStaff(creator, { role: 'barista', email: 'e', password: 'p', full_name: 'n' })).rejects.toThrow('A valid branch_id is required for role "barista".');
    });

    it('should throw if branch does not exist', async () => {
      const creator = { role: 'admin' } as any;
      staffRepo.verifyBranchExists.mockResolvedValue(false);
      await expect(service.createStaff(creator, { role: 'barista', branch_id: 'b1', email: 'e', password: 'p', full_name: 'n' })).rejects.toThrow('Selected branch does not exist.');
    });

    it('should throw if auth creation fails', async () => {
      const creator = { role: 'admin' } as any;
      staffRepo.verifyBranchExists.mockResolvedValue(true);
      (supabaseAdmin.auth.admin.createUser as jest.Mock).mockResolvedValue({ data: null, error: { message: 'auth error' } });
      
      await expect(service.createStaff(creator, { role: 'barista', branch_id: 'b1', email: 'e', password: 'p', full_name: 'n' })).rejects.toThrow('auth error');
    });

    it('should create staff and log audit', async () => {
      const creator = { role: 'admin', id: 'u1' } as any;
      staffRepo.verifyBranchExists.mockResolvedValue(true);
      (supabaseAdmin.auth.admin.createUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'new-user' } }, error: null });
      staffRepo.updateStaffProfile.mockResolvedValue({ id: 'new-user' } as any);

      const res = await service.createStaff(creator, { role: 'barista', branch_id: 'b1', email: 'e', password: 'p', full_name: 'n' });
      
      expect(res).toEqual({ id: 'new-user' });
      expect(staffRepo.updateStaffProfile).toHaveBeenCalledWith('new-user', expect.any(Object));
      expect(auditService.logEvent).toHaveBeenCalled();
    });

    it('should rollback if profile update fails', async () => {
      const creator = { role: 'admin', id: 'u1' } as any;
      staffRepo.verifyBranchExists.mockResolvedValue(true);
      (supabaseAdmin.auth.admin.createUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'new-user' } }, error: null });
      staffRepo.updateStaffProfile.mockRejectedValue(new Error('profile err'));
      (supabaseAdmin.auth.admin.deleteUser as jest.Mock).mockResolvedValue({ error: null });

      await expect(service.createStaff(creator, { role: 'barista', branch_id: 'b1', email: 'e', password: 'p', full_name: 'n' })).rejects.toThrow('profile err');
      expect(supabaseAdmin.auth.admin.deleteUser).toHaveBeenCalledWith('new-user');
    });
  });

  describe('getStaffList', () => {
    it('should return list for branch_manager', async () => {
      const creator = { role: 'branch_manager', branch_id: 'b1' } as any;
      staffRepo.findStaffMembers.mockResolvedValue([{ id: '1' }] as any);
      const res = await service.getStaffList(creator);
      expect(res).toEqual([{ id: '1' }]);
      expect(staffRepo.findStaffMembers).toHaveBeenCalledWith('b1');
    });

    it('should return empty array if branch_manager has no branch', async () => {
      const creator = { role: 'branch_manager', branch_id: null } as any;
      const res = await service.getStaffList(creator);
      expect(res).toEqual([]);
    });

    it('should return list for admin', async () => {
      const creator = { role: 'admin' } as any;
      staffRepo.findStaffMembers.mockResolvedValue([{ id: '1' }] as any);
      const res = await service.getStaffList(creator, 'b2');
      expect(res).toEqual([{ id: '1' }]);
      expect(staffRepo.findStaffMembers).toHaveBeenCalledWith('b2');
    });

    it('should throw if unauthorized', async () => {
      const creator = { role: 'customer' } as any;
      await expect(service.getStaffList(creator)).rejects.toThrow('Unauthorized to view staff list.');
    });
  });

  describe('getStaffById', () => {
    it('should throw if not found', async () => {
      staffRepo.findStaffById.mockResolvedValue(null);
      await expect(service.getStaffById({ role: 'admin' } as any, '1')).rejects.toThrow('Staff member not found.');
    });

    it('should throw if branch_manager accesses other branch', async () => {
      staffRepo.findStaffById.mockResolvedValue({ branch_id: 'b2' } as any);
      await expect(service.getStaffById({ role: 'branch_manager', branch_id: 'b1' } as any, '1')).rejects.toThrow('Cannot view staff from another branch.');
    });

    it('should return staff', async () => {
      staffRepo.findStaffById.mockResolvedValue({ branch_id: 'b1' } as any);
      const res = await service.getStaffById({ role: 'admin' } as any, '1');
      expect(res).toEqual({ branch_id: 'b1' });
    });
  });

  describe('updateStaff', () => {
    it('should throw if not admin', async () => {
      await expect(service.updateStaff({ role: 'barista' } as any, '1', {})).rejects.toThrow('Only Admins can modify staff roles and assignments.');
    });

    it('should throw if branch does not exist', async () => {
      staffRepo.verifyBranchExists.mockResolvedValue(false);
      await expect(service.updateStaff({ role: 'admin' } as any, '1', { branch_id: 'b1' })).rejects.toThrow('Selected branch does not exist.');
    });

    it('should update and log', async () => {
      staffRepo.updateStaffProfile.mockResolvedValue({ id: '1' } as any);
      const res = await service.updateStaff({ role: 'admin', id: 'u1' } as any, '1', { role: 'admin' });
      
      expect(res).toEqual({ id: '1' });
      expect(profileCache.invalidate).toHaveBeenCalledWith('1');
      expect(auditService.logEvent).toHaveBeenCalled();
    });
  });

  describe('deleteStaff', () => {
    it('should throw if not admin', async () => {
      await expect(service.deleteStaff({ role: 'barista' } as any, '1')).rejects.toThrow('Only Admins can remove staff accounts.');
    });

    it('should throw if self delete', async () => {
      await expect(service.deleteStaff({ role: 'admin', id: '1' } as any, '1')).rejects.toThrow('Cannot delete your own admin account.');
    });

    it('should throw if auth delete fails', async () => {
      (supabaseAdmin.auth.admin.deleteUser as jest.Mock).mockResolvedValue({ error: { message: 'err' } });
      await expect(service.deleteStaff({ role: 'admin', id: '2' } as any, '1')).rejects.toThrow('err');
    });

    it('should delete and log', async () => {
      (supabaseAdmin.auth.admin.deleteUser as jest.Mock).mockResolvedValue({ error: null });
      await service.deleteStaff({ role: 'admin', id: '2' } as any, '1');
      
      expect(profileCache.invalidate).toHaveBeenCalledWith('1');
      expect(auditService.logEvent).toHaveBeenCalled();
    });
  });
});
