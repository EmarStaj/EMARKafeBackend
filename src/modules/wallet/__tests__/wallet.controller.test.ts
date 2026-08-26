import { WalletController } from '../wallet.controller';
import { WalletService } from '../wallet.service';
import { Request, Response, NextFunction } from 'express';

describe('WalletController', () => {
  let controller: WalletController;
  let mockWalletService: jest.Mocked<WalletService>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockWalletService = {
      getBalanceAndTransactions: jest.fn(),
      topup: jest.fn(),
      generateQrToken: jest.fn(),
      verifyQrToken: jest.fn(),
    } as unknown as jest.Mocked<WalletService>;

    controller = new WalletController(mockWalletService);

    mockReq = {
      user: { id: 'user1' } as any,
      token: 'token1'
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getBalanceAndTransactions', () => {
    it('should return balance and transactions on success', async () => {
      const mockData = { balance: 100, transactions: [] };
      mockWalletService.getBalanceAndTransactions.mockResolvedValue(mockData);

      await controller.getBalanceAndTransactions(mockReq as Request, mockRes as Response, mockNext);

      expect(mockWalletService.getBalanceAndTransactions).toHaveBeenCalledWith('user1', 'token1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockData
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next on error', async () => {
      const error = new Error('Service Error');
      mockWalletService.getBalanceAndTransactions.mockRejectedValue(error);

      await controller.getBalanceAndTransactions(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('topup', () => {
    it('should topup successfully', async () => {
      mockReq.body = { amount: 50 };
      mockWalletService.topup.mockResolvedValue(true);

      await controller.topup(mockReq as Request, mockRes as Response, mockNext);

      expect(mockWalletService.topup).toHaveBeenCalledWith('user1', 50, 'token1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Balance topped up successfully.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next on error', async () => {
      mockReq.body = { amount: 50 };
      const error = new Error('Service Error');
      mockWalletService.topup.mockRejectedValue(error);

      await controller.topup(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('generateQr', () => {
    it('should return QR token successfully', async () => {
      const mockData = { qr_token: 'token', expires_in_minutes: 10 };
      mockWalletService.generateQrToken.mockResolvedValue(mockData);

      await controller.generateQr(mockReq as Request, mockRes as Response, mockNext);

      expect(mockWalletService.generateQrToken).toHaveBeenCalledWith('user1', 'token1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockData
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next on error', async () => {
      const error = new Error('Service Error');
      mockWalletService.generateQrToken.mockRejectedValue(error);

      await controller.generateQr(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
