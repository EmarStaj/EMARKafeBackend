import 'reflect-metadata';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { AuditService } from '../../audit/audit.service';
import { Request, Response, NextFunction } from 'express';
import { AuditActorType, AuditAction, AuditStatus, AuditEntityType } from '../../audit/audit.constants';

describe('AuthController', () => {
  let authController: AuthController;
  let authServiceMock: jest.Mocked<AuthService>;
  let auditServiceMock: jest.Mocked<AuditService>;
  
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    authServiceMock = {
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      refreshSession: jest.fn(),
    } as any;

    auditServiceMock = {
      logEvent: jest.fn(),
    } as any;

    authController = new AuthController(authServiceMock, auditServiceMock);

    req = {
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe('signUp', () => {
    it('should sign up and return success', async () => {
      req.body = { email: 'test@test.com', password: 'pass', full_name: 'Test', phone: '123', birth_date: '2000-01-01' };
      authServiceMock.signUp.mockResolvedValue({ user: { id: 'test-id' } } as any);

      await authController.signUp(req as Request, res as Response, next);

      expect(authServiceMock.signUp).toHaveBeenCalledWith('test@test.com', 'pass', 'Test', '123', '2000-01-01');
      expect(auditServiceMock.logEvent).toHaveBeenCalledWith({
        userId: 'test-id',
        actorType: AuditActorType.GUEST,
        action: AuditAction.REGISTER,
        status: AuditStatus.SUCCESS,
        entityType: AuditEntityType.USER,
        entityId: 'test-id',
        details: { email: 'test@test.com' },
        req
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should call next on error during sign up', async () => {
      req.body = { email: 'test@test.com', password: 'pass' };
      const error = new Error('signup err');
      authServiceMock.signUp.mockRejectedValue(error);

      await authController.signUp(req as Request, res as Response, next);

      expect(auditServiceMock.logEvent).toHaveBeenCalledWith({
        actorType: AuditActorType.GUEST,
        action: AuditAction.REGISTER,
        status: AuditStatus.FAILURE,
        entityType: AuditEntityType.USER,
        details: { email: 'test@test.com', error: 'signup err' },
        req
      });
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('signIn', () => {
    it('should sign in and return success', async () => {
      req.body = { email: 'test@test.com', password: 'pass' };
      authServiceMock.signIn.mockResolvedValue({ user: { id: 'test-id', email: 'test@test.com', role: AuditActorType.CUSTOMER } } as any);

      await authController.signIn(req as Request, res as Response, next);

      expect(authServiceMock.signIn).toHaveBeenCalledWith('test@test.com', 'pass');
      expect(auditServiceMock.logEvent).toHaveBeenCalledWith({
        userId: 'test-id',
        actorType: AuditActorType.CUSTOMER,
        actorName: 'test@test.com',
        action: AuditAction.LOGIN,
        status: AuditStatus.SUCCESS,
        req
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should use CUSTOMER actor type if no role provided in user on signIn', async () => {
      req.body = { email: 'test@test.com', password: 'pass' };
      authServiceMock.signIn.mockResolvedValue({ user: { id: 'test-id', email: 'test@test.com' } } as any);

      await authController.signIn(req as Request, res as Response, next);

      expect(auditServiceMock.logEvent).toHaveBeenCalledWith(expect.objectContaining({
        actorType: AuditActorType.CUSTOMER
      }));
    });

    it('should call next on error during sign in', async () => {
      req.body = { email: 'test@test.com', password: 'pass' };
      const error = new Error('signin err');
      authServiceMock.signIn.mockRejectedValue(error);

      await authController.signIn(req as Request, res as Response, next);

      expect(auditServiceMock.logEvent).toHaveBeenCalledWith({
        actorType: AuditActorType.GUEST,
        action: AuditAction.LOGIN,
        status: AuditStatus.FAILURE,
        details: { email: 'test@test.com', error: 'signin err' },
        req
      });
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('signOut', () => {
    it('should sign out and return success if user provided', async () => {
      req.token = 'mock-token';
      req.user = { id: 'user-id', email: 'user@test.com' } as any;
      authServiceMock.signOut.mockResolvedValue(undefined);

      await authController.signOut(req as Request, res as Response, next);

      expect(authServiceMock.signOut).toHaveBeenCalledWith('mock-token', 'user-id');
      expect(auditServiceMock.logEvent).toHaveBeenCalledWith({
        userId: 'user-id',
        actorType: AuditActorType.CUSTOMER,
        actorName: 'user@test.com',
        action: AuditAction.LOGOUT,
        status: AuditStatus.SUCCESS,
        req
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should sign out and return success if no user provided', async () => {
      req.token = 'mock-token';
      authServiceMock.signOut.mockResolvedValue(undefined);

      await authController.signOut(req as Request, res as Response, next);

      expect(authServiceMock.signOut).toHaveBeenCalledWith('mock-token', undefined);
      expect(auditServiceMock.logEvent).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should call next on error during sign out', async () => {
      req.token = 'mock-token';
      const error = new Error('signout err');
      authServiceMock.signOut.mockRejectedValue(error);

      await authController.signOut(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getMe', () => {
    it('should return current user successfully', async () => {
      req.user = { id: 'test-id' } as any;
      req.profile = { role: 'admin' } as any;

      await authController.getMe(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: {
          user: { id: 'test-id', role: 'admin' },
          profile: { role: 'admin' }
        }
      }));
    });

    it('should default role to customer if not in profile', async () => {
      req.user = { id: 'test-id' } as any;
      req.profile = {} as any;

      await authController.getMe(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: {
          user: { id: 'test-id', role: 'customer' },
          profile: {}
        }
      }));
    });
  });

  describe('forgotPassword', () => {
    it('should call forgotPassword on service and return success', async () => {
      req.body = { email: 'test@test.com' };
      authServiceMock.forgotPassword.mockResolvedValue(undefined);

      await authController.forgotPassword(req as Request, res as Response, next);

      expect(authServiceMock.forgotPassword).toHaveBeenCalledWith('test@test.com');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should call next on error during forgotPassword', async () => {
      req.body = { email: 'test@test.com' };
      const error = new Error('err');
      authServiceMock.forgotPassword.mockRejectedValue(error);

      await authController.forgotPassword(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('resetPassword', () => {
    it('should call resetPassword on service and return success', async () => {
      req.token = 'mock-token';
      req.body = { password: 'newpass' };
      authServiceMock.resetPassword.mockResolvedValue(undefined);

      await authController.resetPassword(req as Request, res as Response, next);

      expect(authServiceMock.resetPassword).toHaveBeenCalledWith('mock-token', 'newpass');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should call next on error during resetPassword', async () => {
      req.token = 'mock-token';
      req.body = { password: 'newpass' };
      const error = new Error('err');
      authServiceMock.resetPassword.mockRejectedValue(error);

      await authController.resetPassword(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('refresh', () => {
    it('should call refreshSession on service and return success', async () => {
      req.body = { refresh_token: 'refresh' };
      authServiceMock.refreshSession.mockResolvedValue({ session: 'new' } as any);

      await authController.refresh(req as Request, res as Response, next);

      expect(authServiceMock.refreshSession).toHaveBeenCalledWith('refresh');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should call next on error during refresh', async () => {
      req.body = { refresh_token: 'refresh' };
      const error = new Error('err');
      authServiceMock.refreshSession.mockRejectedValue(error);

      await authController.refresh(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
