import 'reflect-metadata';
import { SettingsController } from '../settings.controller';
import { SettingsService } from '../settings.service';
import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../../utils/response';
import { AppError } from '../../../utils/app-error';

jest.mock('../../../utils/response');

describe('SettingsController', () => {
  let controller: SettingsController;
  let service: jest.Mocked<SettingsService>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    service = {
      getSettings: jest.fn(),
      updateSetting: jest.fn(),
    } as any;
    controller = new SettingsController(service);

    req = { user: { id: 'user-id', role: 'admin', app_metadata: {}, user_metadata: {}, aud: '', created_at: '' } as any, params: {}, body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should call service and return success', async () => {
      const mockSettings = [{ key: 'k', value: 'v' }];
      service.getSettings.mockResolvedValue(mockSettings);

      await controller.getSettings(req as Request, res as Response, next);

      expect(service.getSettings).toHaveBeenCalled();
      expect(sendSuccess).toHaveBeenCalledWith(res, mockSettings, 'Settings retrieved successfully.');
    });

    it('should call next with error on failure', async () => {
      const err = new Error('Service Error');
      service.getSettings.mockRejectedValue(err);

      await controller.getSettings(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('updateSetting', () => {
    it('should call service and return success when authenticated', async () => {
      req.params = { key: 'theme' };
      req.body = { value: 'dark' };
      req.user = { id: 'admin1', role: 'admin', app_metadata: {}, user_metadata: {}, aud: '', created_at: '' } as any;
      
      const mockResult = { key: 'theme', value: 'dark' };
      service.updateSetting.mockResolvedValue(mockResult);

      await controller.updateSetting(req as Request, res as Response, next);

      expect(service.updateSetting).toHaveBeenCalledWith('theme', 'dark', 'admin1');
      expect(sendSuccess).toHaveBeenCalledWith(res, mockResult, 'Setting updated successfully.');
    });

    it('should throw 401 if user is not present', async () => {
      req.user = undefined;

      await controller.updateSetting(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const errorArg = (next as jest.Mock).mock.calls[0][0];
      expect(errorArg.message).toBe('Unauthorized');
      expect(errorArg.statusCode).toBe(401);
    });

    it('should call next with error if service fails', async () => {
      req.params = { key: 'theme' };
      req.body = { value: 'dark' };
      
      const err = new Error('Service Fail');
      service.updateSetting.mockRejectedValue(err);

      await controller.updateSetting(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });
});
