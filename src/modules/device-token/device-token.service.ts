import { injectable } from 'tsyringe';
import { DeviceTokenRepository } from './device-token.repository';
import { AppError } from '../../utils/app-error';

@injectable()
export class DeviceTokenService {
  private deviceTokenRepository: DeviceTokenRepository;

  constructor() {
    this.deviceTokenRepository = new DeviceTokenRepository();
  }

  async saveDeviceToken(userId: string, onesignal_id: string, platform: 'ios' | 'android') {
    try {
      return await this.deviceTokenRepository.saveDeviceToken({
        user_id: userId,
        onesignal_id,
        platform
      });
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to register device token.', 400);
    }
  }
}
