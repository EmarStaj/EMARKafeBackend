process.env.JWT_SECRET = 'test-secret';
import { WalletService } from '../wallet.service';
import { WalletRepository } from '../wallet.repository';
import { CartRepository } from '../../cart/cart.repository';
import { NotificationService } from '../../notification/notification.service';
import { AppError } from '../../../utils/app-error';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

describe('WalletService', () => {
  let service: WalletService;
  let mockWalletRepo: jest.Mocked<WalletRepository>;
  let mockCartRepo: jest.Mocked<CartRepository>;
  let mockNotifService: jest.Mocked<NotificationService>;

  beforeEach(() => {
    mockWalletRepo = {
      getBalanceAndTransactions: jest.fn(),
      topup: jest.fn()
    } as unknown as jest.Mocked<WalletRepository>;

    mockCartRepo = {
      getCart: jest.fn()
    } as unknown as jest.Mocked<CartRepository>;

    mockNotifService = {
      sendToUser: jest.fn()
    } as unknown as jest.Mocked<NotificationService>;

    service = new WalletService(mockWalletRepo, mockCartRepo, mockNotifService);
    jest.clearAllMocks();
  });

  describe('getBalanceAndTransactions', () => {
    it('should return data from repository', async () => {
      const mockData = { balance: 100, transactions: [] };
      mockWalletRepo.getBalanceAndTransactions.mockResolvedValue(mockData);

      const result = await service.getBalanceAndTransactions('user1', 'token1');
      expect(result).toEqual(mockData);
      expect(mockWalletRepo.getBalanceAndTransactions).toHaveBeenCalledWith('user1', 'token1');
    });

    it('should throw AppError if repository fails', async () => {
      mockWalletRepo.getBalanceAndTransactions.mockRejectedValue(new Error('Repo error'));
      await expect(service.getBalanceAndTransactions('user1', 'token1')).rejects.toThrow(AppError);
    });
  });

  describe('topup', () => {
    it('should top up and send notification if valid amount', async () => {
      mockWalletRepo.topup.mockResolvedValue(true);

      const result = await service.topup('user1', 50, 'token1');

      expect(result).toBe(true);
      expect(mockWalletRepo.topup).toHaveBeenCalledWith('user1', 50, 'token1');
      expect(mockNotifService.sendToUser).toHaveBeenCalledWith(
        'user1',
        'Bakiye Yüklendi 💰',
        `Cüzdanınıza 50 TL başarıyla yüklendi. Keyifli alışverişler dileriz!`
      );
    });

    it('should throw error if amount <= 0', async () => {
      await expect(service.topup('user1', 0, 'token1')).rejects.toThrow(AppError);
      await expect(service.topup('user1', -10, 'token1')).rejects.toThrow('Topup amount must be between 1 and 10000.');
    });

    it('should throw error if amount > 10000', async () => {
      await expect(service.topup('user1', 10001, 'token1')).rejects.toThrow(AppError);
    });

    it('should rethrow repo errors as AppError', async () => {
      mockWalletRepo.topup.mockRejectedValue(new Error('DB Error'));
      await expect(service.topup('user1', 50, 'token1')).rejects.toThrow(AppError);
    });
  });

  describe('generateQrToken', () => {
    it('should generate QR token successfully', async () => {
      mockWalletRepo.getBalanceAndTransactions.mockResolvedValue({ balance: 200, transactions: [] });
      mockCartRepo.getCart.mockResolvedValue({ items: [{ unit_price: '50', quantity: 2 }] } as any);
      (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

      const result = await service.generateQrToken('user1', 'token1');

      expect(result).toEqual({ qr_token: 'mock-jwt-token', expires_in_minutes: 10 });
      expect(jwt.sign).toHaveBeenCalled();
    });

    it('should throw error if cart is empty', async () => {
      mockWalletRepo.getBalanceAndTransactions.mockResolvedValue({ balance: 200, transactions: [] });
      mockCartRepo.getCart.mockResolvedValue({ items: [] } as any);

      await expect(service.generateQrToken('user1', 'token1')).rejects.toThrow('Cannot generate QR. Your cart is empty.');
    });

    it('should throw error if balance is insufficient', async () => {
      mockWalletRepo.getBalanceAndTransactions.mockResolvedValue({ balance: 50, transactions: [] });
      mockCartRepo.getCart.mockResolvedValue({ items: [{ unit_price: '50', quantity: 2 }] } as any);

      await expect(service.generateQrToken('user1', 'token1')).rejects.toThrow(/Insufficient balance/);
    });

    it('should rethrow other errors as AppError', async () => {
      mockWalletRepo.getBalanceAndTransactions.mockRejectedValue(new Error('Repo error'));
      await expect(service.generateQrToken('user1', 'token1')).rejects.toThrow(AppError);
    });
  });

  describe('verifyQrToken', () => {
    it('should verify token and return user ID', () => {
      (jwt.verify as jest.Mock).mockReturnValue({ action: 'checkout', userId: 'user1', jti: 'nonce-1' });

      const result = service.verifyQrToken('valid-token');
      expect(result.userId).toBe('user1');
    });

    it('should throw if QR code is replayed with the same jti', () => {
      (jwt.verify as jest.Mock).mockReturnValue({ action: 'checkout', userId: 'user1', jti: 'nonce-replay' });

      // First use succeeds
      const result = service.verifyQrToken('valid-token-replay');
      expect(result.userId).toBe('user1');

      // Second use fails with replay error
      expect(() => service.verifyQrToken('valid-token-replay')).toThrow('QR code has already been used.');
    });

    it('should throw if action is not checkout', () => {
      (jwt.verify as jest.Mock).mockReturnValue({ action: 'other', userId: 'user1' });

      expect(() => service.verifyQrToken('invalid-token')).toThrow('Invalid QR code action.');
    });

    it('should throw if userId is missing', () => {
      (jwt.verify as jest.Mock).mockReturnValue({ action: 'checkout' });

      expect(() => service.verifyQrToken('invalid-token')).toThrow('Invalid QR code action.');
    });

    it('should throw if verify throws an error', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('Expired'); });

      expect(() => service.verifyQrToken('expired-token')).toThrow('Invalid or expired QR code.');
    });
  });
});
