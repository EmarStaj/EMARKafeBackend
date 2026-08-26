import { SettingsRepository } from '../settings.repository';
import { supabaseAdmin } from '../../../config/supabase';

jest.mock('../../../config/supabase', () => { return { supabaseAdmin: { from: jest.fn(), auth: { admin: { deleteUser: jest.fn() } } } }; });

describe('SettingsRepository', () => {
  let repository: SettingsRepository;

  beforeEach(() => {
    repository = new SettingsRepository();
    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should return all settings successfully', async () => {
      const mockSettings = [{ key: 'app_name', value: 'EMARKafe' }];
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: mockSettings, error: null }),
      });

      const result = await repository.getSettings();
      expect(result).toEqual(mockSettings);
      expect(supabaseAdmin.from).toHaveBeenCalledWith('app_settings');
    });

    it('should throw error if db fails', async () => {
      const dbError = new Error('Database Error');
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: null, error: dbError }),
      });

      await expect(repository.getSettings()).rejects.toThrow('Database Error');
    });
  });

  describe('getSettingByKey', () => {
    it('should return single setting by key', async () => {
      const mockSetting = { key: 'app_name', value: 'EMARKafe' };
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: mockSetting, error: null }),
          }),
        }),
      });

      const result = await repository.getSettingByKey('app_name');
      expect(result).toEqual(mockSetting);
    });

    it('should throw error if db fails on getSettingByKey', async () => {
      const dbError = new Error('DB Error');
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: dbError }),
          }),
        }),
      });

      await expect(repository.getSettingByKey('app_name')).rejects.toThrow('DB Error');
    });
  });

  describe('updateSetting', () => {
    it('should upsert setting successfully', async () => {
      const mockUpdated = { key: 'theme', value: 'dark', updated_by: 'admin1', updated_at: '2026-08-26T00:00:00Z' };
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockUpdated, error: null }),
          }),
        }),
      });

      const result = await repository.updateSetting('theme', 'dark', 'admin1');
      expect(result).toEqual(mockUpdated);
    });

    it('should throw error if db fails on updateSetting', async () => {
      const dbError = new Error('DB Upsert Error');
      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: dbError }),
          }),
        }),
      });

      await expect(repository.updateSetting('theme', 'dark', 'admin1')).rejects.toThrow('DB Upsert Error');
    });
  });
});
