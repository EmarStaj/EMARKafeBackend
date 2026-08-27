import { injectable } from 'tsyringe';
import crypto from 'crypto';
import { WalletRepository } from './wallet.repository';
import { CartRepository } from '../cart/cart.repository';
import { AppError, rethrowAsAppError } from '../../utils/app-error';
import jwt from 'jsonwebtoken';
import { redis } from '../../config/redis';
import { NotificationService } from '../notification/notification.service';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined.');
}
const QR_SECRET = process.env.JWT_SECRET;
const QR_EXPIRES_IN = '10m'; // QR code is valid for 10 minutes

// Used JTI tokens map to prevent QR replay attacks
const usedQrNonces = new Map<string, number>();

function isJtiUsed(jti: string): boolean {
  const expiresAt = usedQrNonces.get(jti);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    usedQrNonces.delete(jti);
    return false;
  }
  return true;
}

function markJtiUsed(jti: string, ttlSeconds = 600): void {
  usedQrNonces.set(jti, Date.now() + ttlSeconds * 1000);
}

@injectable()
export class WalletService {
  constructor(
    private walletRepository: WalletRepository,
    private cartRepository: CartRepository,
    private notificationService: NotificationService
  ) {}

  async getBalanceAndTransactions(userId: string, token: string) {
    try {
      return await this.walletRepository.getBalanceAndTransactions(userId, token);
    } catch (error) {
      rethrowAsAppError(error, 'Failed to retrieve wallet information.');
    }
  }

  async topup(userId: string, amount: number, token: string) {
    try {
      if (amount <= 0 || amount > 10000) {
        throw new AppError('Topup amount must be between 1 and 10000.', 400);
      }
      const topupResult = await this.walletRepository.topup(userId, amount, token);
      
      this.notificationService.sendToUser(
        userId,
        'Bakiye Yüklendi 💰',
        `Cüzdanınıza ${amount} TL başarıyla yüklendi. Keyifli alışverişler dileriz!`
      );
      
      return topupResult;
    } catch (error) {
      rethrowAsAppError(error, 'Failed to top up balance.');
    }
  }

  /**
   * Generates a signed JWT token for the user to display as a QR code.
   * Includes a unique JTI nonce to prevent replay attacks.
   */
  async generateQrToken(userId: string, token: string) {
    try {
      // 1. Fetch current balance
      const { balance } = await this.walletRepository.getBalanceAndTransactions(userId, token);

      // 2. Fetch cart and calculate total
      const cartData = await this.cartRepository.getCart(userId, token);
      if (!cartData.items || cartData.items.length === 0) {
        throw new AppError('Cannot generate QR. Your cart is empty.', 400);
      }

      let cartTotal = 0;
      for (const item of cartData.items) {
        cartTotal += Number(item.unit_price) * item.quantity;
      }

      // 3. Verify balance is sufficient
      if (balance < cartTotal) {
        throw new AppError(`Insufficient balance. Your cart total is ${cartTotal} TL, but your balance is ${balance} TL.`, 400);
      }

      // 4. Generate Token with unique nonce (JTI)
      const jti = crypto.randomUUID();
      const payload = {
        userId,
        action: 'checkout',
      };

      const qrToken = jwt.sign(payload, QR_SECRET, { expiresIn: QR_EXPIRES_IN, jwtid: jti });
      return { qr_token: qrToken, expires_in_minutes: 10 };
    } catch (error) {
      rethrowAsAppError(error, 'Failed to generate QR token.');
    }
  }

  /**
   * Verifies a scanned QR token, enforces single-use replay protection via JTI, and extracts user ID.
   */
  verifyQrToken(qrToken: string): string {
    try {
      const decoded = jwt.verify(qrToken, QR_SECRET) as any;
      if (decoded.action !== 'checkout' || !decoded.userId) {
        throw new AppError('Invalid QR code action.', 400);
      }

      const jti = decoded.jti || decoded.jwtid;
      if (jti && isJtiUsed(jti)) {
        throw new AppError('QR code has already been used.', 400);
      }

      if (jti) {
        markJtiUsed(jti, 600);
        if (redis.status === 'ready') {
          redis.setex(`qr:used:${jti}`, 600, '1').catch(() => {});
        }
      }

      return decoded.userId;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Invalid or expired QR code.', 400);
    }
  }
}
