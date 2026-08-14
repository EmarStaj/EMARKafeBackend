import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { supabaseAdmin } from '../config/supabase';

async function seedAdmin() {
  console.log('🚀 EMAR Kafe Bootstrap Admin Seed Başlatılıyor...');

  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@emarkafe.com';
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'Admin12345!';
  const adminFullName = process.env.BOOTSTRAP_ADMIN_NAME || 'Sistem Yöneticisi (Super Admin)';
  const adminPhone = process.env.BOOTSTRAP_ADMIN_PHONE || '5550000000';

  console.log(`📧 Hedef Admin E-posta: ${adminEmail}`);

  // 1. Check if user already exists
  const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    console.error('❌ Supabase Auth kullanıcı listesi alınamadı:', listError);
    process.exit(1);
  }

  const existingUser = list.users.find(u => u.email?.toLowerCase() === adminEmail.toLowerCase());
  let userId: string;

  if (existingUser) {
    console.log(`ℹ️ Admin kullanıcısı zaten mevcut (ID: ${existingUser.id}). Şifre ve rol güncelleniyor...`);
    userId = existingUser.id;

    // Update password if needed
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: adminPassword,
      email_confirm: true,
      user_metadata: { full_name: adminFullName },
    });
    if (updateErr) {
      console.error('❌ Admin şifre güncelleme hatası:', updateErr);
      process.exit(1);
    }
  } else {
    console.log('➕ Yeni Admin hesabı oluşturuluyor...');
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { full_name: adminFullName },
    });

    if (createErr || !newUser?.user) {
      console.error('❌ Admin oluşturma hatası:', createErr);
      process.exit(1);
    }
    userId = newUser.user.id;
  }

  // 2. Ensure profile role is 'admin'
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from('profiles')
    .update({
      role: 'admin',
      full_name: adminFullName,
      phone: adminPhone,
    })
    .eq('id', userId)
    .select('id, full_name, role, branch_id')
    .single();

  if (profileErr) {
    console.error('❌ Profil tablosu admin güncelleme hatası:', profileErr);
    process.exit(1);
  }

  console.log('========================================================================');
  console.log('✅ SÜPER ADMİN HESABI BAŞARIYLA HAZIRLANDI!');
  console.log(`👤 Ad Soyad : ${profile.full_name}`);
  console.log(`🔑 Rol      : ${profile.role}`);
  console.log(`📧 E-posta  : ${adminEmail}`);
  console.log(`🔒 Şifre    : ${adminPassword}`);
  console.log('========================================================================');
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal seed error:', err);
    process.exit(1);
  });
