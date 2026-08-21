import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { supabaseAdmin } from '../config/supabase';

async function listUsers() {
  const { data: list, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
  
  console.log(`Toplam Kullanıcı: ${list.users.length}`);
  for (const u of list.users) {
    console.log(`- [${u.id}] ${u.email}`);
  }
}
listUsers().then(() => process.exit(0));
