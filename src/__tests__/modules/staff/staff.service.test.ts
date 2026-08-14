import { StaffService } from '../../../modules/staff/staff.service';
import { StaffRepository } from '../../../modules/staff/staff.repository';
import { AuditService } from '../../../modules/audit/audit.service';
import { supabaseAdmin } from '../../../config/supabase';

jest.mock('../../../modules/staff/staff.repository');
jest.mock('../../../modules/audit/audit.service');
jest.mock('../../../config/supabase');

const MockedStaffRepository = StaffRepository as jest.MockedClass<typeof StaffRepository>;
const MockedAuditService = AuditService as jest.MockedClass<typeof AuditService>;

describe('StaffService (Method A - RBAC)', () => {
  let service: StaffService;
  let mockStaffRepo: jest.Mocked<StaffRepository>;
  let mockAuditService: jest.Mocked<AuditService>;

  const mockAdminUser: any = {
    id: 'admin-1',
    role: 'admin',
    full_name: 'Super Admin',
  };

  const mockManagerUser: any = {
    id: 'mgr-1',
    role: 'branch_manager',
    full_name: 'Kadikoy Manager',
    branch_id: 'branch-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockStaffRepo = new MockedStaffRepository() as any;
    mockAuditService = new MockedAuditService() as any;
    service = new StaffService(mockStaffRepo, mockAuditService);
  });

  describe('createStaff', () => {
    it('Admin should be able to create a barista with valid branch', async () => {
      mockStaffRepo.verifyBranchExists = jest.fn().mockResolvedValue(true);
      (supabaseAdmin.auth.admin.createUser as jest.Mock) = jest.fn().mockResolvedValue({
        data: { user: { id: 'new-staff-1' } },
        error: null,
      });

      const mockProfile: any = {
        id: 'new-staff-1',
        full_name: 'Yeni Barista',
        role: 'barista',
        branch_id: 'branch-1',
      };
      mockStaffRepo.updateStaffProfile = jest.fn().mockResolvedValue(mockProfile);

      const result = await service.createStaff(mockAdminUser, {
        email: 'barista@kafe.com',
        password: 'Password123!',
        full_name: 'Yeni Barista',
        role: 'barista',
        branch_id: 'branch-1',
      });

      expect(result).toEqual(mockProfile);
      expect(mockStaffRepo.verifyBranchExists).toHaveBeenCalledWith('branch-1');
      expect(mockStaffRepo.updateStaffProfile).toHaveBeenCalled();
      expect(mockAuditService.logEvent).toHaveBeenCalled();
    });

    it('Branch Manager should ONLY be able to create baristas for their own branch', async () => {
      mockStaffRepo.verifyBranchExists = jest.fn().mockResolvedValue(true);
      (supabaseAdmin.auth.admin.createUser as jest.Mock) = jest.fn().mockResolvedValue({
        data: { user: { id: 'new-barista-2' } },
        error: null,
      });

      const mockProfile: any = {
        id: 'new-barista-2',
        full_name: 'Şube Baristası',
        role: 'barista',
        branch_id: 'branch-1',
      };
      mockStaffRepo.updateStaffProfile = jest.fn().mockResolvedValue(mockProfile);

      const result = await service.createStaff(mockManagerUser, {
        email: 'sube.barista@kafe.com',
        password: 'Password123!',
        full_name: 'Şube Baristası',
        role: 'barista',
      });

      expect(result.branch_id).toBe('branch-1');
    });

    it('Branch Manager attempting to create an Admin should throw 403 Forbidden', async () => {
      await expect(
        service.createStaff(mockManagerUser, {
          email: 'hacker.admin@kafe.com',
          password: 'Password123!',
          full_name: 'Hacker',
          role: 'admin',
        })
      ).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it('Customer attempting to create staff should throw 403 Forbidden', async () => {
      const customerUser: any = { id: 'cust-1', role: 'customer' };
      await expect(
        service.createStaff(customerUser, {
          email: 'any@kafe.com',
          password: 'Password123!',
          full_name: 'Any',
          role: 'barista',
          branch_id: 'branch-1',
        })
      ).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });

  describe('updateStaff', () => {
    it('Admin can update staff role and branch', async () => {
      mockStaffRepo.verifyBranchExists = jest.fn().mockResolvedValue(true);
      mockStaffRepo.updateStaffProfile = jest.fn().mockResolvedValue({
        id: 'staff-1',
        role: 'branch_manager',
        branch_id: 'branch-2',
      } as any);

      const result = await service.updateStaff(mockAdminUser, 'staff-1', {
        role: 'branch_manager',
        branch_id: 'branch-2',
      });

      expect(result.role).toBe('branch_manager');
      expect(mockAuditService.logEvent).toHaveBeenCalled();
    });

    it('Non-admin user cannot update staff (403)', async () => {
      await expect(
        service.updateStaff(mockManagerUser, 'staff-1', { role: 'admin' })
      ).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });
});
