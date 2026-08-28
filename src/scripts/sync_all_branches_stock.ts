import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { supabaseAdmin } from '../config/supabase';

async function syncAllBranches() {
  console.log('🔄 Şube ve Ürün Stok Senkronizasyonu Başlatılıyor...\n');

  // 1. Fetch all active branches
  const { data: branches, error: bErr } = await supabaseAdmin
    .from('branches')
    .select('id, name')
    .eq('is_active', true);
  if (bErr) {
    console.error('Branches fetch error:', bErr);
    return;
  }

  // 2. Fetch all active products
  const { data: products, error: pErr } = await supabaseAdmin
    .from('products')
    .select('id, name')
    .eq('is_active', true);
  if (pErr) {
    console.error('Products fetch error:', pErr);
    return;
  }

  console.log(`📌 Toplam Aktif Şube: ${branches?.length || 0}`);
  console.log(`📌 Toplam Aktif Ürün: ${products?.length || 0}\n`);

  // 3. Fetch all existing branch_products records
  const { data: existingBp, error: bpErr } = await supabaseAdmin
    .from('branch_products')
    .select('branch_id, product_id, is_available');
  if (bpErr) {
    console.error('Existing branch_products fetch error:', bpErr);
    return;
  }

  const existingMap = new Set<string>();
  existingBp?.forEach((bp: any) => {
    existingMap.add(`${bp.branch_id}_${bp.product_id}`);
  });

  console.log(`📌 Mevcut branch_products Satır Sayısı: ${existingBp?.length || 0}`);

  const toInsert: any[] = [];

  branches?.forEach((branch: any) => {
    products?.forEach((product: any) => {
      const key = `${branch.id}_${product.id}`;
      if (!existingMap.has(key)) {
        toInsert.push({
          branch_id: branch.id,
          product_id: product.id,
          is_available: true,
          updated_at: new Date().toISOString()
        });
      }
    });
  });

  console.log(`📌 Eklenecek Eksik Kayıt Sayısı: ${toInsert.length}\n`);

  if (toInsert.length > 0) {
    // Insert in batches of 50
    const chunkSize = 50;
    for (let i = 0; i < toInsert.length; i += chunkSize) {
      const chunk = toInsert.slice(i, i + chunkSize);
      const { error: insErr } = await supabaseAdmin
        .from('branch_products')
        .insert(chunk);
      if (insErr) {
        console.error(`Batch ${i / chunkSize + 1} hatası:`, insErr);
      } else {
        console.log(`✅ Batch ${Math.floor(i / chunkSize) + 1} (${chunk.length} kayıt) eklendi.`);
      }
    }
  } else {
    console.log('Tüm şubeler ve ürünler zaten tam eşleşmiş durumda!');
  }

  console.log('\n🎉 Senkronizasyon Tamamlandı!');
}

syncAllBranches().then(() => process.exit(0)).catch((e: any) => { console.error(e); process.exit(1); });
