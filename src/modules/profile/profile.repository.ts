import { supabaseAdmin } from '../../config/supabase';

export class ProfileRepository {
  /**
   * Fetch user profile by ID. Bypasses RLS using Admin client.
   */
  async getProfile(userId: string, _token: string) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Upsert profile fields in the database. Bypasses RLS.
   */
  async updateProfile(userId: string, profileData: { full_name?: string; phone?: string; avatar_url?: string }, _token: string) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: userId, ...profileData })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
