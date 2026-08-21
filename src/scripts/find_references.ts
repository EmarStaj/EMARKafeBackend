import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { supabaseAdmin } from '../config/supabase';

async function run() {
  const userId = '877aff69-7c41-41d1-8adf-d776c9de5492';
  console.log('Referans aranıyor:', userId);
  
  const tables = [
    { name: 'branch_products', columns: ['updated_by'] },
    { name: 'orders', columns: ['customer_id', 'staff_id'] },
    { name: 'audit_logs', columns: ['user_id', 'entity_id'] },
    { name: 'ratings', columns: ['customer_id'] },
    { name: 'favorites', columns: ['customer_id'] },
    { name: 'device_tokens', columns: ['user_id'] },
  ];

  for (const t of tables) {
    for (const col of t.columns) {
      const { data, error } = await supabaseAdmin.from(t.name).select('*').eq(col, userId);
      if (data && data.length > 0) {
        console.log(`Tablo: ${t.name}, Kolon: ${col}, Adet: ${data.length}`);
        
        // Fix it! Set to null or delete
        if (t.name === 'branch_products') {
          console.log(`Setting ${col} to null in ${t.name}`);
          await supabaseAdmin.from(t.name).update({ [col]: null }).eq(col, userId);
        } else {
          console.log(`Deleting rows in ${t.name} where ${col}=${userId}`);
          await supabaseAdmin.from(t.name).delete().eq(col, userId);
        }
      } else if (error) {
        console.log(`Hata ${t.name}:`, error.message);
      }
    }
  }
  
  console.log('Referans temizliği denendi, silmeyi tekrar deneyelim...');
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) console.error('Hata:', error);
  else console.log('Silindi');
}
run().then(() => process.exit(0));
