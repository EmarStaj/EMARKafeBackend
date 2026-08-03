import { DeviceTokenRepository } from './device-token.repository';
import { AppError } from '../../utils/app-error';

export class DeviceTokenService {
  private deviceTokenRepository: DeviceTokenRepository;

  constructor() {
    this.deviceTokenRepository = new DeviceTokenRepository();
  }

  async saveDeviceToken(userId: string, fcmToken: string, platform: 'ios' | 'android') {
    try {
      return await this.deviceTokenRepository.saveDeviceToken({
        user_id: userId,
        fcm_token: fcmToken,
        platform
      });
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to register device token.', 400);
    }
  }
}
