import { getSupabaseForUser } from '../../config/supabase';

export class ProfileRepository {
  /**
   * Fetch user profile by ID using user-bound Supabase client.
   */
  async getProfile(userId: string, token: string) {
    const supabaseClient = getSupabaseForUser(token);
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update profile fields in the database.
   */
  async updateProfile(userId: string, profileData: { full_name?: string; phone?: string; avatar_url?: string }, token: string) {
    const supabaseClient = getSupabaseForUser(token);
    const { data, error } = await supabaseClient
      .from('profiles')
      .update(profileData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
