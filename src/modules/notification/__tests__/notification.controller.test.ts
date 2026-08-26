import { NotificationController } from '../notification.controller';
import { Request, Response } from 'express';

describe('NotificationController', () => {
  let controller: NotificationController;
  let mockNotificationService: any;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockNotificationService = {
      broadcast: jest.fn(),
    };
    controller = new NotificationController(mockNotificationService);

    mockReq = {
      body: { title: 'T', message: 'M', data: {} }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  it('broadcast success', async () => {
    await controller.broadcast(mockReq as Request, mockRes as Response, mockNext);
    
    expect(mockNotificationService.broadcast).toHaveBeenCalledWith('T', 'M', {});
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Broadcast notification triggered successfully.' }));
  });

  it('broadcast error', async () => {
    const error = new Error('err');
    mockNotificationService.broadcast.mockImplementation(() => { throw error; });
    
    await controller.broadcast(mockReq as Request, mockRes as Response, mockNext);
    
    expect(mockNext).toHaveBeenCalledWith(error);
  });
});
