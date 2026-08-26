import { WalletRepository } from '../wallet.repository';
import { getSupabaseForUser } from '../../../config/supabase';
import { AppError } from '../../../utils/app-error';

jest.mock('../../../config/supabase', () => ({
  getSupabaseForUser: jest.fn()
}));

const createMockBuilder = (resolvedData: any, resolvedError: any = null) => {
  const builder: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: resolvedData, error: resolvedError }),
    maybeSingle: jest.fn().mockResolvedValue({ data: resolvedData, error: resolvedError })
  };
  builder.then = undefined;
  return builder;
};

describe('WalletRepository', () => {
  let repository: WalletRepository;
  let mockSupabase: any;

  beforeEach(() => {
    repository = new WalletRepository();
    
    mockSupabase = {
      from: jest.fn(),
      rpc: jest.fn()
    };
    (getSupabaseForUser as jest.Mock).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getBalanceAndTransactions', () => {
    it('should return balance and transactions successfully', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return createMockBuilder({ balance: 100 });
        }
        if (table === 'transactions') {
           const builder = createMockBuilder(null);
           builder.limit = jest.fn().mockResolvedValue({ data: [{ id: 'tx1' }], error: null });
           return builder;
        }
      });

      const result = await repository.getBalanceAndTransactions('user1', 'token1');

      expect(result).toEqual({
        balance: 100,
        transactions: [{ id: 'tx1' }]
      });
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabase.from).toHaveBeenCalledWith('transactions');
    });

    it('should default balance to 0 if profile balance is undefined', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return createMockBuilder({});
        }
        if (table === 'transactions') {
           const builder = createMockBuilder(null);
           builder.limit = jest.fn().mockResolvedValue({ data: [], error: null });
           return builder;
        }
      });

      const result = await repository.getBalanceAndTransactions('user1', 'token1');

      expect(result.balance).toBe(0);
    });

    it('should throw AppError if profile fetch fails', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return createMockBuilder(null, new Error('Profile error'));
        }
      });

      await expect(repository.getBalanceAndTransactions('user1', 'token1')).rejects.toThrow(AppError);
      await expect(repository.getBalanceAndTransactions('user1', 'token1')).rejects.toThrow('Failed to fetch balance.');
    });

    it('should throw AppError if transactions fetch fails', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return createMockBuilder({ balance: 100 });
        }
        if (table === 'transactions') {
           const builder = createMockBuilder(null);
           builder.limit = jest.fn().mockResolvedValue({ data: null, error: new Error('Tx error') });
           return builder;
        }
      });

      await expect(repository.getBalanceAndTransactions('user1', 'token1')).rejects.toThrow(AppError);
      await expect(repository.getBalanceAndTransactions('user1', 'token1')).rejects.toThrow('Failed to fetch transactions.');
    });
  });

  describe('topup', () => {
    it('should call rpc add_balance and return true on success', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: true, error: null });

      const result = await repository.topup('user1', 50, 'token1');

      expect(result).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('add_balance', { p_user_id: 'user1', p_amount: 50 });
    });

    it('should throw AppError if rpc returns an error', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: new Error('RPC Error') });

      await expect(repository.topup('user1', 50, 'token1')).rejects.toThrow(AppError);
      await expect(repository.topup('user1', 50, 'token1')).rejects.toThrow('Failed to top up balance.');
    });

    it('should throw AppError if rpc returns no data', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      await expect(repository.topup('user1', 50, 'token1')).rejects.toThrow(AppError);
    });
  });
});
