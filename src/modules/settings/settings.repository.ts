import { supabaseAdmin } from '../../config/supabase';

export class SettingsRepository {
  /**
   * Fetch all app settings.
   */
  async getSettings() {
    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .select('*');

    if (error) throw error;
    return data;
  }

  /**
   * Fetch a single setting by key.
   */
  async getSettingByKey(key: string) {
    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .select('*')
      .eq('key', key)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Update or insert setting key-value pair. Admin only.
   */
  async updateSetting(key: string, value: any, updatedBy: string) {
    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .upsert({
        key,
        value,
        updated_by: updatedBy,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
