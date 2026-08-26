import { OptionController } from '../option.controller';
import { Request, Response } from 'express';

describe('OptionController', () => {
  let controller: OptionController;
  let mockOptionService: any;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockOptionService = {
      getProductOptions: jest.fn(),
      createOption: jest.fn(),
      createOptionValue: jest.fn(),
      deleteOption: jest.fn(),
      deleteOptionValue: jest.fn(),
    };
    controller = new OptionController(mockOptionService);
    
    mockReq = {
      params: {},
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  it('getProductOptions success', async () => {
    mockReq.params = { productId: 'p1' };
    mockOptionService.getProductOptions.mockResolvedValue([]);
    await controller.getProductOptions(mockReq as Request, mockRes as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });
  
  it('getProductOptions error', async () => {
    mockReq.params = { productId: 'p1' };
    mockOptionService.getProductOptions.mockRejectedValue(new Error('err'));
    await controller.getProductOptions(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('createOption success', async () => {
    mockReq.params = { productId: 'p1' };
    mockReq.body = { name: 'n1', is_required: true, is_multi_select: false };
    mockOptionService.createOption.mockResolvedValue({ id: 'o1' });
    await controller.createOption(mockReq as Request, mockRes as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(201);
  });

  it('createOption error', async () => {
    mockOptionService.createOption.mockRejectedValue(new Error('err'));
    await controller.createOption(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('createOptionValue success', async () => {
    mockReq.params = { optionId: 'o1' };
    mockReq.body = { label: 'l1', price_delta: 10 };
    mockOptionService.createOptionValue.mockResolvedValue({ id: 'v1' });
    await controller.createOptionValue(mockReq as Request, mockRes as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(201);
  });

  it('createOptionValue error', async () => {
    mockOptionService.createOptionValue.mockRejectedValue(new Error('err'));
    await controller.createOptionValue(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('deleteOption success', async () => {
    mockReq.params = { id: 'o1' };
    mockOptionService.deleteOption.mockResolvedValue(null);
    await controller.deleteOption(mockReq as Request, mockRes as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('deleteOption error', async () => {
    mockOptionService.deleteOption.mockRejectedValue(new Error('err'));
    await controller.deleteOption(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('deleteOptionValue success', async () => {
    mockReq.params = { id: 'v1' };
    mockOptionService.deleteOptionValue.mockResolvedValue(null);
    await controller.deleteOptionValue(mockReq as Request, mockRes as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('deleteOptionValue error', async () => {
    mockOptionService.deleteOptionValue.mockRejectedValue(new Error('err'));
    await controller.deleteOptionValue(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
});
