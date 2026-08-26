import 'reflect-metadata';
import { DeviceTokenController } from '../device-token.controller';
import { DeviceTokenService } from '../device-token.service';
import { Request, Response } from 'express';

describe('DeviceTokenController', () => {
  let controller: DeviceTokenController;
  let service: jest.Mocked<DeviceTokenService>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    service = { saveDeviceToken: jest.fn() } as any;
    controller = new DeviceTokenController(service as any);
    req = { user: { id: 'u1' }, body: { onesignal_id: 'os1', platform: 'ios' } } as any;
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    next = jest.fn();
  });

  it('should register token successfully', async () => {
    service.saveDeviceToken.mockResolvedValue({ id: '1' } as any);
    await controller.registerToken(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('should throw Unauthorized if no user id', async () => {
    req.user = undefined;
    await controller.registerToken(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('should call next on service error', async () => {
    service.saveDeviceToken.mockRejectedValue(new Error('err'));
    await controller.registerToken(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
