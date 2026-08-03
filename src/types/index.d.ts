import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  role: 'customer' | 'barista' | 'branch_manager' | 'admin';
  branch_id?: string;
  created_at: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
      token?: string;
      profile?: UserProfile;
    }
  }
}
