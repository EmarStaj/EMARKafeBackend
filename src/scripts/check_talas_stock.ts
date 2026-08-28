import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { supabaseAdmin } from '../config/supabase';

async function checkStock() {
  // 1. Get branches
  const { data: branches, error: bErr } = await supabaseAdmin.from('branches').select('*');
  if (bErr) {
    console.error('Branches error:', bErr);
    return;
  }
  console.log('--- TÜM ŞUBELER ---');
  console.table(branches?.map((b: any) => ({ id: b.id, name: b.name })));

  const talasBranch = branches?.find((b: any) => b.name.toLowerCase().includes('talas'));
  if (!talasBranch) {
    console.log('Talas şubesi bulunamadı!');
    return;
  }
  console.log(`\n=============================================`);
  console.log(`HEDEF ŞUBE: ${talasBranch.name} (ID: ${talasBranch.id})`);
  console.log(`=============================================\n`);

  // 2. Get all products
  const { data: products, error: pErr } = await supabaseAdmin
    .from('products')
    .select('id, name, base_price, is_active, category_id, categories(name)')
    .order('name');
  if (pErr) {
    console.error('Products error:', pErr);
    return;
  }

  // 3. Get branch_products for Talas
  const { data: branchProducts, error: bpErr } = await supabaseAdmin
    .from('branch_products')
    .select('*')
    .eq('branch_id', talasBranch.id);
  if (bpErr) {
    console.error('Branch products error:', bpErr);
    return;
  }

  console.log(`Veritabanındaki Toplam Ürün Sayısı: ${products?.length || 0}`);
  console.log(`Talas İçin 'branch_products' Kayıt Sayısı: ${branchProducts?.length || 0}\n`);

  const stockMap = new Map<string, any>();
  branchProducts?.forEach((bp: any) => {
    stockMap.set(bp.product_id, bp);
  });

  const availableInTalas: any[] = [];
  const unavailableInTalas: any[] = [];
  const noRecordInTalas: any[] = [];

  products?.forEach((p: any) => {
    const bp = stockMap.get(p.id);
    const catName = p.categories ? (p.categories as any).name : 'Kategorisiz';
    if (!bp) {
      noRecordInTalas.push({ id: p.id, name: p.name, category: catName, price: p.base_price });
    } else if (bp.is_available === false) {
      unavailableInTalas.push({ id: p.id, name: p.name, category: catName, is_available: false, updated_at: bp.updated_at });
    } else {
      availableInTalas.push({ id: p.id, name: p.name, category: catName, is_available: true });
    }
  });

  console.log(`\n🔴 TALAS ŞUBESİNDE TÜKENMİŞ / KAPATILMIŞ (is_available = false) ÜRÜNLER (${unavailableInTalas.length}):`);
  console.log('--------------------------------------------------------------------------------');
  if (unavailableInTalas.length > 0) {
    console.table(unavailableInTalas);
  } else {
    console.log('Talas için is_available = false olarak kaydedilmiş ürün bulunmuyor.');
  }

  console.log(`\n⚪ TALAS İÇİN branch_products TABLOSUNDA HİÇ KAYDI OLMAYAN ÜRÜNLER (${noRecordInTalas.length}):`);
  console.log('--------------------------------------------------------------------------------');
  if (noRecordInTalas.length > 0) {
    console.table(noRecordInTalas);
  } else {
    console.log('Tüm ürünlerin branch_products kaydı mevcut.');
  }

  console.log(`\n🟢 TALAS ŞUBESİNDE AKTİF VE MEVCUT (is_available = true) ÜRÜNLER (${availableInTalas.length}):`);
  console.log('--------------------------------------------------------------------------------');
  console.table(availableInTalas);
}

checkStock().then(() => process.exit(0)).catch((e: any) => { console.error(e); process.exit(1); });
