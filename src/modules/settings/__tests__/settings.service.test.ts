import 'reflect-metadata';
import { SettingsService } from '../settings.service';
import { SettingsRepository } from '../settings.repository';
import { AppError } from '../../../utils/app-error';

describe('SettingsService', () => {
  let service: SettingsService;
  let repository: jest.Mocked<SettingsRepository>;

  beforeEach(() => {
    repository = {
      getSettings: jest.fn(),
      getSettingByKey: jest.fn(),
      updateSetting: jest.fn(),
    } as any;
    service = new SettingsService(repository);
  });

  describe('getSettings', () => {
    it('should return settings', async () => {
      repository.getSettings.mockResolvedValue([{ key: 'k', value: 'v' }]);
      const result = await service.getSettings();
      expect(result).toEqual([{ key: 'k', value: 'v' }]);
    });

    it('should throw AppError on repository error', async () => {
      repository.getSettings.mockRejectedValue(new Error('Repo Error'));
      await expect(service.getSettings()).rejects.toThrow(AppError);
      await expect(service.getSettings()).rejects.toThrow('Repo Error');
    });
    
    it('should throw AppError with default message on unknown error', async () => {
      repository.getSettings.mockRejectedValue({});
      await expect(service.getSettings()).rejects.toThrow('Failed to retrieve app settings.');
    });
  });

  describe('updateSetting', () => {
    it('should update setting', async () => {
      const mockResult = { key: 'k', value: 'v', updated_by: 'uid' };
      repository.updateSetting.mockResolvedValue(mockResult);
      
      const result = await service.updateSetting('k', 'v', 'uid');
      expect(result).toEqual(mockResult);
      expect(repository.updateSetting).toHaveBeenCalledWith('k', 'v', 'uid');
    });

    it('should throw AppError on repository error', async () => {
      repository.updateSetting.mockRejectedValue(new Error('Update Error'));
      await expect(service.updateSetting('k', 'v', 'uid')).rejects.toThrow(AppError);
      await expect(service.updateSetting('k', 'v', 'uid')).rejects.toThrow('Update Error');
    });
    
    it('should throw AppError with default message on unknown error', async () => {
      repository.updateSetting.mockRejectedValue({});
      await expect(service.updateSetting('k', 'v', 'uid')).rejects.toThrow('Failed to update app setting.');
    });
  });
});
