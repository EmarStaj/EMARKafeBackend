import 'reflect-metadata';
import { SettingsService } from '../../../modules/settings/settings.service';
import { SettingsRepository } from '../../../modules/settings/settings.repository';

describe('SettingsService Unit Tests', () => {
  let settingsService: SettingsService;
  let mockSettingsRepository: jest.Mocked<SettingsRepository>;

  beforeEach(() => {
    mockSettingsRepository = {
      getSettings: jest.fn(),
      getSettingByKey: jest.fn(),
      updateSetting: jest.fn(),
    } as any;

    settingsService = new SettingsService(mockSettingsRepository);
  });

  it('getSettings should return list of settings', async () => {
    const mockList = [{ key: 'app_name', value: 'EMAR Kafe' }];
    mockSettingsRepository.getSettings.mockResolvedValue(mockList as any);

    const res = await settingsService.getSettings();
    expect(res).toEqual(mockList);
  });

  it('updateSetting should update and return new setting', async () => {
    const updated = { key: 'tax_rate', value: 0.18, updated_by: 'admin-1' };
    mockSettingsRepository.updateSetting.mockResolvedValue(updated as any);

    const res = await settingsService.updateSetting('tax_rate', 0.18, 'admin-1');
    expect(res).toEqual(updated);
    expect(mockSettingsRepository.updateSetting).toHaveBeenCalledWith('tax_rate', 0.18, 'admin-1');
  });

  it('should wrap repository error in AppError', async () => {
    mockSettingsRepository.getSettings.mockRejectedValue(new Error('DB connection failed'));

    await expect(settingsService.getSettings()).rejects.toThrow('DB connection failed');
  });
});
