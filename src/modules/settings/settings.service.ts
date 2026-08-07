import { injectable } from 'tsyringe';
import { SettingsRepository } from './settings.repository';
import { AppError } from '../../utils/app-error';

@injectable()
export class SettingsService {
  private settingsRepository: SettingsRepository;

  constructor() {
    this.settingsRepository = new SettingsRepository();
  }

  async getSettings() {
    try {
      return await this.settingsRepository.getSettings();
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to retrieve app settings.', 400);
    }
  }

  async updateSetting(key: string, value: any, updatedBy: string) {
    try {
      return await this.settingsRepository.updateSetting(key, value, updatedBy);
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to update app setting.', 400);
    }
  }
}
