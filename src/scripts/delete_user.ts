import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { supabaseAdmin } from '../config/supabase';

async function delUser() {
  const { error } = await supabaseAdmin.auth.admin.deleteUser('877aff69-7c41-41d1-8adf-d776c9de5492');
  if (error) console.error('Hata:', error);
  else console.log('Silindi');
}
delUser().then(() => process.exit(0));
