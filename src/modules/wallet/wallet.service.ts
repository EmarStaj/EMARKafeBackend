import { WalletRepository } from './wallet.repository';
import { AppError, rethrowAsAppError } from '../../utils/app-error';
import jwt from 'jsonwebtoken';

const QR_SECRET = process.env.JWT_SECRET || 'super_secret_qr_key_change_in_prod';
const QR_EXPIRES_IN = '5m'; // QR code is valid for 5 minutes

export class WalletService {
  private walletRepository: WalletRepository;

  constructor() {
    this.walletRepository = new WalletRepository();
  }

  async getBalanceAndTransactions(userId: string, token: string) {
    try {
      return await this.walletRepository.getBalanceAndTransactions(userId, token);
    } catch (error) {
      rethrowAsAppError(error, 'Failed to retrieve wallet information.');
    }
  }

  async topup(userId: string, amount: number, token: string) {
    try {
      if (amount <= 0) {
        throw new AppError('Topup amount must be greater than zero.', 400);
      }
      return await this.walletRepository.topup(userId, amount, token);
    } catch (error) {
      rethrowAsAppError(error, 'Failed to top up balance.');
    }
  }

  /**
   * Generates a signed JWT token for the user to display as a QR code.
   * The barista will scan this to process checkout.
   */
  generateQrToken(userId: string) {
    try {
      const payload = {
        userId,
        action: 'checkout'
      };

      const qrToken = jwt.sign(payload, QR_SECRET, { expiresIn: QR_EXPIRES_IN });
      return { qr_token: qrToken, expires_in_minutes: 5 };
    } catch (error) {
      throw new AppError('Failed to generate QR token.', 500);
    }
  }

  /**
   * Verifies a scanned QR token and extracts the user ID.
   */
  verifyQrToken(qrToken: string): string {
    try {
      const decoded = jwt.verify(qrToken, QR_SECRET) as any;
      if (decoded.action !== 'checkout' || !decoded.userId) {
        throw new AppError('Invalid QR code action.', 400);
      }
      return decoded.userId;
    } catch (error) {
      throw new AppError('Invalid or expired QR code.', 400);
    }
  }
}
