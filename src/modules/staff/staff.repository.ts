import { injectable } from 'tsyringe';
import { supabaseAdmin } from '../../config/supabase';
import { AppError } from '../../utils/app-error';

export interface StaffUserRecord {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  branch_id: string | null;
  created_at: string;
  birth_date: string | null;
  branches?: {
    id: string;
    name: string;
  } | null;
}

@injectable()
export class StaffRepository {
  /**
   * List staff members (barista, branch_manager, admin)
   */
  async findStaffMembers(branchId?: string): Promise<StaffUserRecord[]> {
    let query = supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone, role, branch_id, created_at, birth_date, branches(id, name)')
      .in('role', ['barista', 'branch_manager', 'admin'])
      .order('created_at', { ascending: false });

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;
    if (error) {
      throw new AppError(error.message, 400);
    }

    return (data as any) || [];
  }

  /**
   * Find single staff member by ID
   */
  async findStaffById(id: string): Promise<StaffUserRecord | null> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone, role, branch_id, created_at, birth_date, branches(id, name)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new AppError(error.message, 400);
    }

    return data as any;
  }

  /**
   * Update staff profile fields (role, branch_id, full_name, phone)
   */
  async updateStaffProfile(
    id: string,
    updates: {
      role?: string;
      branch_id?: string | null;
      full_name?: string;
      phone?: string;
    }
  ): Promise<StaffUserRecord> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select('id, full_name, phone, role, branch_id, created_at, birth_date, branches(id, name)')
      .single();

    if (error) {
      throw new AppError(error.message, 400);
    }

    return data as any;
  }

  /**
   * Check if a branch exists
   */
  async verifyBranchExists(branchId: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('branches')
      .select('id')
      .eq('id', branchId)
      .maybeSingle();

    if (error || !data) return false;
    return true;
  }
}
