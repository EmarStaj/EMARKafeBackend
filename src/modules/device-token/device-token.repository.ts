import { supabaseAdmin } from '../../config/supabase';

export interface DeviceTokenInput {
  user_id: string;
  onesignal_id: string;
  platform: 'ios' | 'android';
}

export class DeviceTokenRepository {
  /**
   * Upsert a device token mapping to avoid duplicates.
   */
  async saveDeviceToken(tokenData: DeviceTokenInput) {
    const { data, error } = await supabaseAdmin
      .from('device_tokens')
      .upsert({
        user_id: tokenData.user_id,
        onesignal_id: tokenData.onesignal_id,
        platform: tokenData.platform
      }, { onConflict: 'user_id,onesignal_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all tokens for a user.
   */
  async getTokensByUserId(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('device_tokens')
      .select('onesignal_id, platform')
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  }
}
