import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess } from '../../utils/response';
import { auditService } from '../audit/audit.service';
import { AuditActorType, AuditAction, AuditStatus, AuditEntityType } from '../audit/audit.constants';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  signUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const data = await this.authService.signUp(email, password);
      
      auditService.logEvent({
        actorType: AuditActorType.GUEST,
        action: AuditAction.REGISTER,
        status: AuditStatus.SUCCESS,
        entityType: AuditEntityType.USER,
        details: { email },
        req
      });

      sendSuccess(res, data, 'Registration successful. Check your email for confirmation.', 201);
    } catch (error: any) {
      auditService.logEvent({
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
      
      auditService.logEvent({
        userId: data.user.id,
        actorType: (data.user as any).role || AuditActorType.CUSTOMER,
        actorName: data.user.email,
        action: AuditAction.LOGIN,
        status: AuditStatus.SUCCESS,
        req
      });

      sendSuccess(res, data, 'Login successful.');
    } catch (error: any) {
      auditService.logEvent({
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
        auditService.logEvent({
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
      sendSuccess(res, { user: req.user }, 'Current user retrieved successfully.');
    } catch (error) {
      next(error);
    }
  };
}
