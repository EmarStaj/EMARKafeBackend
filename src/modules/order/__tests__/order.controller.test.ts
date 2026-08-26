import { OrderController } from '../order.controller';
import { Request, Response } from 'express';

describe('OrderController', () => {
  let controller: OrderController;
  let mockOrderService: any;
  let mockAuditService: any;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockOrderService = {
      placeOrder: jest.fn(),
      scanQRAndCheckout: jest.fn(),
      getOrders: jest.fn(),
      getOrderById: jest.fn(),
      getBranchOrders: jest.fn(),
      updateOrderStatus: jest.fn(),
      cancelOrder: jest.fn(),
    };

    mockAuditService = {
      logEvent: jest.fn(),
    };

    controller = new OrderController(mockOrderService, mockAuditService);

    mockReq = {
      user: { id: 'user1', email: 'user@test.com' } as any,
      token: 'valid-token',
      body: {},
      params: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();
  });

  it('placeOrder success', async () => {
    mockReq.body = { branch_id: 'branch1' };
    mockOrderService.placeOrder.mockResolvedValue({ id: 'order1' });

    await controller.placeOrder(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ data: { id: 'order1' } }));
  });

  it('placeOrder failure', async () => {
    mockOrderService.placeOrder.mockRejectedValue(new Error('err'));

    await controller.placeOrder(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  it('scanQRAndCheckout success', async () => {
    mockReq.profile = { branch_id: 'branch1', role: 'barista' } as any;
    mockReq.body = { qr_token: 'qr1' };
    mockOrderService.scanQRAndCheckout.mockResolvedValue({ id: 'order1' });

    await controller.scanQRAndCheckout(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockAuditService.logEvent).toHaveBeenCalledWith(expect.objectContaining({
      action: 'QR_SCAN',
      status: 'SUCCESS',
    }));
  });

  it('scanQRAndCheckout failure - no branch', async () => {
    mockReq.profile = { role: 'barista' } as any;
    await controller.scanQRAndCheckout(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('scanQRAndCheckout failure - service throws', async () => {
    mockReq.profile = { branch_id: 'branch1', role: 'barista' } as any;
    mockReq.body = { qr_token: 'qr1' };
    mockOrderService.scanQRAndCheckout.mockRejectedValue(new Error('err'));

    await controller.scanQRAndCheckout(mockReq as Request, mockRes as Response, mockNext);

    expect(mockAuditService.logEvent).toHaveBeenCalledWith(expect.objectContaining({
      status: 'FAILURE',
    }));
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  it('getOrders success', async () => {
    mockOrderService.getOrders.mockResolvedValue([]);
    await controller.getOrders(mockReq as Request, mockRes as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('getOrders unauthorized - no user', async () => {
    mockReq.user = undefined;
    await controller.getOrders(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('getOrders unauthorized - no token', async () => {
    mockReq.token = undefined;
    await controller.getOrders(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
  
  it('getOrders failure', async () => {
    mockOrderService.getOrders.mockRejectedValue(new Error('err'));
    await controller.getOrders(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('getOrderById success', async () => {
    mockReq.params = { id: 'order1' };
    mockOrderService.getOrderById.mockResolvedValue({});
    await controller.getOrderById(mockReq as Request, mockRes as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('getOrderById unauthorized', async () => {
    mockReq.token = undefined;
    await controller.getOrderById(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('getOrderById failure', async () => {
    mockOrderService.getOrderById.mockRejectedValue(new Error('err'));
    await controller.getOrderById(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('getBranchOrders success', async () => {
    mockReq.profile = { branch_id: 'branch1' } as any;
    mockOrderService.getBranchOrders.mockResolvedValue([]);
    await controller.getBranchOrders(mockReq as Request, mockRes as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('getBranchOrders failure no profile', async () => {
    mockReq.profile = undefined;
    await controller.getBranchOrders(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
  
  it('getBranchOrders failure no branch', async () => {
    mockReq.profile = {} as any;
    await controller.getBranchOrders(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('getBranchOrders service throws', async () => {
    mockReq.profile = { branch_id: 'branch1' } as any;
    mockOrderService.getBranchOrders.mockRejectedValue(new Error('err'));
    await controller.getBranchOrders(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('updateOrderStatus success', async () => {
    mockReq.profile = { branch_id: 'branch1', role: 'barista' } as any;
    mockReq.params = { id: 'order1' };
    mockReq.body = { status: 'ready' };
    mockOrderService.updateOrderStatus.mockResolvedValue({});

    await controller.updateOrderStatus(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockAuditService.logEvent).toHaveBeenCalledWith(expect.objectContaining({ status: 'SUCCESS' }));
  });

  it('updateOrderStatus unauthorized', async () => {
    mockReq.profile = undefined;
    await controller.updateOrderStatus(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('updateOrderStatus failure', async () => {
    mockReq.profile = { branch_id: 'branch1', role: 'barista' } as any;
    mockOrderService.updateOrderStatus.mockRejectedValue(new Error('err'));

    await controller.updateOrderStatus(mockReq as Request, mockRes as Response, mockNext);

    expect(mockAuditService.logEvent).toHaveBeenCalledWith(expect.objectContaining({ status: 'FAILURE' }));
    expect(mockNext).toHaveBeenCalled();
  });

  it('cancelOrder success', async () => {
    mockReq.params = { id: 'order1' };
    mockOrderService.cancelOrder.mockResolvedValue({});

    await controller.cancelOrder(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockAuditService.logEvent).toHaveBeenCalledWith(expect.objectContaining({ status: 'SUCCESS' }));
  });

  it('cancelOrder unauthorized no user', async () => {
    mockReq.user = undefined;
    await controller.cancelOrder(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('cancelOrder unauthorized no token', async () => {
    mockReq.token = undefined;
    await controller.cancelOrder(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('cancelOrder failure', async () => {
    mockReq.params = { id: 'order1' };
    mockOrderService.cancelOrder.mockRejectedValue(new Error('err'));

    await controller.cancelOrder(mockReq as Request, mockRes as Response, mockNext);

    expect(mockAuditService.logEvent).toHaveBeenCalledWith(expect.objectContaining({ status: 'FAILURE' }));
    expect(mockNext).toHaveBeenCalled();
  });
});
