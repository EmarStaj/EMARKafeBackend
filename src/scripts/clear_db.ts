import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { supabaseAdmin } from '../config/supabase';

async function clearDatabase() {
  console.log('🗑️ Veritabanı temizliği başlıyor...');

  // Admin kullanıcısını bulalım ki onu silmeyelim.
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@emarkafe.com';
  console.log(`Korunacak admin hesabı: ${adminEmail}`);

  // 1. Önce siparişler vb. tabloları temizle (cascade yoksa diye manuel siliyoruz)
  const tablesToEmpty = [
    'audit_logs',
    'notifications',
    'device_tokens',
    'cart_items',
    'order_items',
    'orders',
    'ratings',
    'favorites',
    'loyalty_cards'
  ];

  for (const table of tablesToEmpty) {
    console.log(`Temizleniyor: ${table}`);
    const { error } = await supabaseAdmin.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
      console.log(`Tablo boşken veya hata: ${table} ->`, error.message);
    }
  }

  // 2. Auth.Users'dan admin hariç herkesi sil.
  const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    console.error('Auth kullanıcı listesi alınamadı:', listError);
    process.exit(1);
  }

  let deletedUsers = 0;
  for (const user of list.users) {
    if (user.email !== adminEmail) {
      console.log(`Siliniyor kullanıcı: ${user.email} (${user.id})`);
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      deletedUsers++;
    }
  }

  console.log(`✅ Toplam ${deletedUsers} kullanıcı silindi.`);
  console.log('🎉 Veritabanı temizliği tamamlandı (Ürünler, Kategoriler ve Şubeler korundu).');
}

clearDatabase().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
