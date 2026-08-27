import { injectable } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess } from '../../utils/response';
import { AuditService } from '../audit/audit.service';
import { AuditActorType, AuditAction, AuditStatus, AuditEntityType } from '../audit/audit.constants';

@injectable()
export class AuthController {
  constructor(
    private authService: AuthService,
    private auditService: AuditService
  ) {}

  signUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, full_name, phone, birth_date } = req.body;
      const data = await this.authService.signUp(email, password, full_name, phone, birth_date);
      
      this.auditService.logEvent({
        userId: data.user?.id,
        actorType: AuditActorType.GUEST,
        action: AuditAction.REGISTER,
        status: AuditStatus.SUCCESS,
        entityType: AuditEntityType.USER,
        entityId: data.user?.id,
        details: { email },
        req
      });

      sendSuccess(res, data, 'Registration successful.', 201);
    } catch (error: any) {
      this.auditService.logEvent({
        actorType: AuditActorType.GUEST,
        action: AuditAction.REGISTER,
        status: AuditStatus.FAILURE,
        entityType: AuditEntityType.USER,
        details: { email: req.body.email, error: error.message },
        req
      });
      next(error);
    }
  };

  signIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const data = await this.authService.signIn(email, password);
      
      this.auditService.logEvent({
        userId: data.user.id,
        actorType: (data.user as any).role || AuditActorType.CUSTOMER,
        actorName: data.user.email,
        action: AuditAction.LOGIN,
        status: AuditStatus.SUCCESS,
        req
      });

      sendSuccess(res, data, 'Login successful.');
    } catch (error: any) {
      this.auditService.logEvent({
        actorType: AuditActorType.GUEST,
        action: AuditAction.LOGIN,
        status: AuditStatus.FAILURE,
        details: { email: req.body.email, error: error.message },
        req
      });
      next(error);
    }
  };

  signOut = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.token as string;
      await this.authService.signOut(token, req.user?.id);
      
      if (req.user) {
        this.auditService.logEvent({
          userId: req.user.id,
          actorType: (req.user as any).role || AuditActorType.CUSTOMER,
          actorName: req.user.email,
          action: AuditAction.LOGOUT,
          status: AuditStatus.SUCCESS,
          req
        });
      }

      sendSuccess(res, null, 'Logged out successfully.');
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // User is already attached by requireAuth middleware
      const role = req.profile?.role || 'customer';
      sendSuccess(res, { 
        user: { ...req.user, role },
        profile: req.profile 
      }, 'Current user retrieved successfully.');
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      await this.authService.forgotPassword(email);
      sendSuccess(res, null, 'If an account with this email exists, a password reset link has been sent.');
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.token as string;
      const { password } = req.body;
      await this.authService.resetPassword(token, password);
      sendSuccess(res, null, 'Password reset successfully.');
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refresh_token } = req.body;
      const data = await this.authService.refreshSession(refresh_token);
      sendSuccess(res, data, 'Session refreshed successfully.');
    } catch (error) {
      next(error);
    }
  };
}
