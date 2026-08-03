import { supabaseAdmin } from '../../config/supabase';

export interface DeviceTokenInput {
  user_id: string;
  fcm_token: string;
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
        fcm_token: tokenData.fcm_token,
        platform: tokenData.platform
      }, { onConflict: 'user_id,fcm_token' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
