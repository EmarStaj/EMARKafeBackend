import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess } from '../../utils/response';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  signUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const data = await this.authService.signUp(email, password);
      sendSuccess(res, data, 'Registration successful. Check your email for confirmation.', 201);
    } catch (error) {
      next(error);
    }
  };

  signIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const data = await this.authService.signIn(email, password);
      sendSuccess(res, data, 'Login successful.');
    } catch (error) {
      next(error);
    }
  };

  signOut = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.token as string;
      await this.authService.signOut(token, req.user?.id);
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
