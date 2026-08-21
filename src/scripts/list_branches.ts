import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { supabaseAdmin } from '../config/supabase';

async function listBranches() {
  const { data, error } = await supabaseAdmin.from('branches').select('*');
  if (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
  
  console.log('--- ŞUBELER ---');
  console.table(data);
}
listBranches().then(() => process.exit(0));
