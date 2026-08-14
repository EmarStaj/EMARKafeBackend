import { injectable } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { StaffService } from './staff.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/app-error';

@injectable()
export class StaffController {
  constructor(private staffService: StaffService) {}

  /**
   * POST /api/staff
   * Create staff member (Admin / Branch Manager)
   */
  createStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const creator = req.profile;
      if (!creator) throw new AppError('Unauthorized', 401);

      const staff = await this.staffService.createStaff(creator, req.body, req);
      sendSuccess(res, staff, 'Staff account created successfully.', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/staff
   * List staff members
   */
  getStaffList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.profile;
      if (!user) throw new AppError('Unauthorized', 401);

      const branchId = req.query.branch_id as string | undefined;
      const staffList = await this.staffService.getStaffList(user, branchId);
      sendSuccess(res, staffList, 'Staff list retrieved successfully.');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/staff/:id
   * Get single staff member
   */
  getStaffById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.profile;
      if (!user) throw new AppError('Unauthorized', 401);

      const { id } = req.params;
      const staff = await this.staffService.getStaffById(user, id);
      sendSuccess(res, staff, 'Staff details retrieved successfully.');
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/staff/:id
   * Update staff member (Admin only)
   */
  updateStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUser = req.profile;
      if (!adminUser) throw new AppError('Unauthorized', 401);

      const { id } = req.params;
      const updated = await this.staffService.updateStaff(adminUser, id, req.body, req);
      sendSuccess(res, updated, 'Staff member updated successfully.');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/staff/:id
   * Delete staff member (Admin only)
   */
  deleteStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUser = req.profile;
      if (!adminUser) throw new AppError('Unauthorized', 401);

      const { id } = req.params;
      await this.staffService.deleteStaff(adminUser, id, req);
      sendSuccess(res, null, 'Staff member removed successfully.');
    } catch (error) {
      next(error);
    }
  };
}
