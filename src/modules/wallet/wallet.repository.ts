import { getSupabaseForUser, supabaseAdmin } from '../../config/supabase';
import { AppError } from '../../utils/app-error';

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'topup' | 'payment';
  order_id: string | null;
  created_at: string;
}

export class WalletRepository {
  /**
   * Fetch current balance and recent transactions for the user
   */
  async getBalanceAndTransactions(userId: string, token?: string) {
    const supabase = token ? getSupabaseForUser(token) : supabaseAdmin;

    // Get balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', userId)
      .single();

    if (profileError) {
      throw new AppError('Failed to fetch balance.', 400);
    }

    // Get transactions
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (txError) {
      throw new AppError('Failed to fetch transactions.', 400);
    }

    return {
      balance: profile?.balance || 0,
      transactions: transactions as Transaction[]
    };
  }

  /**
   * Top up the user's balance
   */
  async topup(userId: string, amount: number, token?: string) {
    const supabase = token ? getSupabaseForUser(token) : supabaseAdmin;

    const { data, error } = await supabase.rpc('add_balance', {
      p_user_id: userId,
      p_amount: amount
    });

    if (error || !data) {
      throw new AppError('Failed to top up balance.', 400);
    }

    return true;
  }
}
