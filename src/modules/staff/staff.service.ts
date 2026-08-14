import { injectable } from 'tsyringe';
import { Request } from 'express';
import { StaffRepository, StaffUserRecord } from './staff.repository';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditActorType, AuditEntityType, AuditStatus } from '../audit/audit.constants';
import { supabaseAdmin } from '../../config/supabase';
import { AppError } from '../../utils/app-error';
import { UserProfile } from '../../types';
import { profileCache } from '../../config/profile-cache';

export interface CreateStaffDto {
  email: string;
  password: string;
  full_name: string;
  role: 'barista' | 'branch_manager' | 'admin';
  branch_id?: string;
  phone?: string;
}

export interface UpdateStaffDto {
  full_name?: string;
  role?: 'barista' | 'branch_manager' | 'admin';
  branch_id?: string | null;
  phone?: string;
}

@injectable()
export class StaffService {
  constructor(
    private staffRepository: StaffRepository,
    private auditService: AuditService
  ) {}

  /**
   * Create a new staff account (Method A - Direct creation by Admin or Branch Manager)
   */
  async createStaff(creator: UserProfile, data: CreateStaffDto, req?: Request): Promise<StaffUserRecord> {
    // 1. Role Authorization Checks
    if (creator.role === 'branch_manager') {
      if (data.role !== 'barista') {
        throw new AppError('Branch managers can only create barista staff accounts.', 403);
      }
      if (!creator.branch_id) {
        throw new AppError('Branch manager has no assigned branch.', 400);
      }
      // Force barista to creator's branch
      data.branch_id = creator.branch_id;
    } else if (creator.role !== 'admin') {
      throw new AppError('Unauthorized: Only Admins and Branch Managers can create staff.', 403);
    }

    // 2. Validate branch_id for branch-dependent roles
    if (['barista', 'branch_manager'].includes(data.role)) {
      if (!data.branch_id) {
        throw new AppError(`A valid branch_id is required for role "${data.role}".`, 400);
      }
      const branchExists = await this.staffRepository.verifyBranchExists(data.branch_id);
      if (!branchExists) {
        throw new AppError('Selected branch does not exist.', 404);
      }
    }

    // 3. Create Auth User in Supabase
    let userId: string;
    const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });

    if (authError || !newUser?.user) {
      throw new AppError(authError?.message || 'Failed to create staff auth account.', 400);
    }

    userId = newUser.user.id;

    // 4. Update Profile with assigned role and branch
    try {
      const updatedProfile = await this.staffRepository.updateStaffProfile(userId, {
        role: data.role,
        branch_id: data.branch_id || null,
        full_name: data.full_name,
        phone: data.phone,
      });

      // 5. Audit Log (fire-and-forget)
      this.auditService.logEvent({
        userId: creator.id,
        actorType: creator.role as AuditActorType,
        actorName: creator.full_name || creator.role,
        branchId: data.branch_id || creator.branch_id,
        action: AuditAction.STAFF_CREATE,
        status: AuditStatus.SUCCESS,
        entityType: AuditEntityType.USER,
        entityId: userId,
        details: {
          created_staff_email: data.email,
          assigned_role: data.role,
          branch_id: data.branch_id,
        },
        req,
      });

      return updatedProfile;
    } catch (err: any) {
      // Rollback auth user if profile update fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new AppError(err.message || 'Failed to setup staff profile.', 500);
    }
  }

  /**
   * List staff members
   */
  async getStaffList(requester: UserProfile, branchIdFilter?: string): Promise<StaffUserRecord[]> {
    if (requester.role === 'branch_manager') {
      if (!requester.branch_id) return [];
      return await this.staffRepository.findStaffMembers(requester.branch_id);
    }

    if (requester.role === 'admin') {
      return await this.staffRepository.findStaffMembers(branchIdFilter);
    }

    throw new AppError('Unauthorized to view staff list.', 403);
  }

  /**
   * Get single staff member details
   */
  async getStaffById(requester: UserProfile, id: string): Promise<StaffUserRecord> {
    const staff = await this.staffRepository.findStaffById(id);
    if (!staff) {
      throw new AppError('Staff member not found.', 404);
    }

    if (requester.role === 'branch_manager' && staff.branch_id !== requester.branch_id) {
      throw new AppError('Cannot view staff from another branch.', 403);
    }

    return staff;
  }

  /**
   * Update staff member role, branch, or details (Admin only)
   */
  async updateStaff(adminUser: UserProfile, id: string, data: UpdateStaffDto, req?: Request): Promise<StaffUserRecord> {
    if (adminUser.role !== 'admin') {
      throw new AppError('Only Admins can modify staff roles and assignments.', 403);
    }

    if (data.branch_id) {
      const branchExists = await this.staffRepository.verifyBranchExists(data.branch_id);
      if (!branchExists) {
        throw new AppError('Selected branch does not exist.', 404);
      }
    }

    const updated = await this.staffRepository.updateStaffProfile(id, data);
    await profileCache.invalidate(id);

    this.auditService.logEvent({
      userId: adminUser.id,
      actorType: AuditActorType.ADMIN,
      actorName: adminUser.full_name || 'Admin',
      branchId: data.branch_id || null,
      action: AuditAction.STAFF_UPDATE,
      status: AuditStatus.SUCCESS,
      entityType: AuditEntityType.USER,
      entityId: id,
      details: data,
      req,
    });

    return updated;
  }

  /**
   * Delete staff member (Admin only)
   */
  async deleteStaff(adminUser: UserProfile, id: string, req?: Request): Promise<void> {
    if (adminUser.role !== 'admin') {
      throw new AppError('Only Admins can remove staff accounts.', 403);
    }

    if (adminUser.id === id) {
      throw new AppError('Cannot delete your own admin account.', 400);
    }

    // Delete Auth User (Supabase cascading deletes or disables)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) {
      throw new AppError(error.message, 400);
    }

    await profileCache.invalidate(id);

    this.auditService.logEvent({
      userId: adminUser.id,
      actorType: AuditActorType.ADMIN,
      actorName: adminUser.full_name || 'Admin',
      action: AuditAction.STAFF_DELETE,
      status: AuditStatus.SUCCESS,
      entityType: AuditEntityType.USER,
      entityId: id,
      req,
    });
  }
}
