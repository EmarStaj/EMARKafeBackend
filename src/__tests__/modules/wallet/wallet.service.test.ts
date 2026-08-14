import { WalletService } from '../../../modules/wallet/wallet.service';
import { WalletRepository } from '../../../modules/wallet/wallet.repository';
import { CartRepository } from '../../../modules/cart/cart.repository';
import { NotificationService } from '../../../modules/notification/notification.service';

jest.mock('../../../modules/wallet/wallet.repository');
jest.mock('../../../modules/cart/cart.repository');
jest.mock('../../../modules/notification/notification.service');

const MockedWalletRepository = WalletRepository as jest.MockedClass<typeof WalletRepository>;
const MockedCartRepository = CartRepository as jest.MockedClass<typeof CartRepository>;
const MockedNotificationService = NotificationService as jest.MockedClass<typeof NotificationService>;

describe('WalletService', () => {
  let service: WalletService;
  let mockWalletRepo: jest.Mocked<WalletRepository>;
  let mockCartRepo: jest.Mocked<CartRepository>;
  let mockNotifService: jest.Mocked<NotificationService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWalletRepo = new MockedWalletRepository() as any;
    mockCartRepo = new MockedCartRepository() as any;
    mockNotifService = new MockedNotificationService({} as any) as any;

    service = new WalletService(mockWalletRepo, mockCartRepo, mockNotifService);
  });

  describe('topup', () => {
    it('should throw 400 when amount is 0 or negative', async () => {
      await expect(service.topup('user-1', 0, 'mock-token')).rejects.toMatchObject({
        statusCode: 400,
      });

      await expect(service.topup('user-1', -100, 'mock-token')).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('should throw 400 when amount exceeds maximum limit', async () => {
      await expect(service.topup('user-1', 15000, 'mock-token')).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('should top up balance and trigger push notification on valid amount', async () => {
      mockWalletRepo.topup = jest.fn().mockResolvedValue({ balance: 250 });

      const result = await service.topup('user-1', 100, 'mock-token');

      expect(result).toEqual({ balance: 250 });
      expect(mockWalletRepo.topup).toHaveBeenCalledWith('user-1', 100, 'mock-token');
      expect(mockNotifService.sendToUser).toHaveBeenCalledWith(
        'user-1',
        expect.stringContaining('Bakiye'),
        expect.stringContaining('100 TL')
      );
    });
  });

  describe('getBalanceAndTransactions', () => {
    it('should return balance and transaction list', async () => {
      const mockData = { balance: 150, transactions: [] };
      mockWalletRepo.getBalanceAndTransactions = jest.fn().mockResolvedValue(mockData);

      const result = await service.getBalanceAndTransactions('user-1', 'mock-token');

      expect(result).toEqual(mockData);
      expect(mockWalletRepo.getBalanceAndTransactions).toHaveBeenCalledWith('user-1', 'mock-token');
    });
  });
});
