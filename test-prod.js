const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envPath = '/home/tuncay/Projects/EMARKafe/.env';
const dotenvContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
dotenvContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    env[key] = value;
  }
});

const API_URL = 'https://emarkafe.duckdns.org';
const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const password = 'testpassword123';
  const r = Math.floor(Math.random() * 100000);
  const custEmail = `prod_cust_${r}@test.com`;

  console.log(`--- PROD ORTAMI TESTİ (${API_URL}) ---`);

  // 1. Sağlık Kontrolü (Health Check)
  console.log('\n[API CHECK] Sağlık kontrolü yapılıyor...');
  try {
    const health = await (await fetch(`${API_URL}/health`)).text();
    console.log('Health:', health);
  } catch (e) {
    console.log('Health check failed:', e.message);
  }

  // 2. Müşteri Kaydı ve Girişi
  console.log('\n[1] Müşteri kaydı ve girişi yapılıyor...');
  await fetch(`${API_URL}/api/auth/register`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: custEmail, password }) });
  const loginCustRes = await fetch(`${API_URL}/api/auth/login`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: custEmail, password }) });
  const loginCust = await loginCustRes.json();
  
  if (!loginCust.data || !loginCust.data.session) {
    console.error('PROD Login failed:', loginCust);
    process.exit(1);
  }

  const custToken = loginCust.data.session.access_token;
  const custId = loginCust.data.user.id;
  console.log(`[BAŞARILI] Müşteri ID: ${custId}`);

  // 3. Müşteri Bakiye Sorgula
  console.log('\n[2] Bakiye sorgulanıyor (GET /api/wallet/balance)...');
  const balRes1 = await (await fetch(`${API_URL}/api/wallet/balance`, { headers:{ 'Authorization': `Bearer ${custToken}` }})).json();
  console.log(JSON.stringify(balRes1, null, 2));
  
  if (balRes1.status !== 'success') {
     console.log('Wallet endpoint doesn\'t seem to be live yet. Did Coolify finish deploying?');
     process.exit(0);
  }

  // 4. Bakiye Yükle (500 TL)
  console.log('\n[3] 500 TL Bakiye yükleniyor (POST /api/wallet/topup)...');
  const topupRes = await (await fetch(`${API_URL}/api/wallet/topup`, { method: 'POST', headers:{ 'Authorization': `Bearer ${custToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: 500 }) })).json();
  console.log(JSON.stringify(topupRes, null, 2));

  // 5. Sepete Ürün Ekle
  const { data: prods } = await supabaseAdmin.from('products').select('id, base_price').limit(1);
  const productId = prods[0].id;
  console.log(`\n[4] Sepete ürün ekleniyor (POST /api/cart)...`);
  const cartRes = await (await fetch(`${API_URL}/api/cart`, { method: 'POST', headers:{ 'Authorization': `Bearer ${custToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: productId, quantity: 1 }) })).json();
  console.log(JSON.stringify(cartRes, null, 2));

  // 6. QR Kodu Üret
  console.log('\n[5] QR kodu üretiliyor (GET /api/wallet/qr)...');
  const qrRes = await (await fetch(`${API_URL}/api/wallet/qr`, { headers:{ 'Authorization': `Bearer ${custToken}` }})).json();
  console.log(JSON.stringify(qrRes, null, 2));
  const qrToken = qrRes.data.qr_token;

  // 7. Barista Kaydı ve Girişi
  const bariEmail = `prod_bari_${r}@test.com`;
  console.log('\n[6] Barista kullanıcısı oluşturuluyor ve yetkilendiriliyor...');
  const { data: authData } = await supabaseAdmin.auth.admin.createUser({
    email: bariEmail,
    password: password,
    email_confirm: true
  });
  const bariId = authData.user.id;
  
  await new Promise(r => setTimeout(r, 2000)); // wait for trigger
  const { data: branches } = await supabaseAdmin.from('branches').select('id').limit(1);
  const branchId = branches[0].id;
  await supabaseAdmin.from('profiles').update({ role: 'barista', branch_id: branchId }).eq('id', bariId);

  const loginBariRes = await fetch(`${API_URL}/api/auth/login`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: bariEmail, password }) });
  const loginBari = await loginBariRes.json();
  const bariToken = loginBari.data.session.access_token;
  console.log(`[BAŞARILI] Barista ID: ${bariId}`);

  // 8. Barista QR Okutur
  console.log('\n[7] Barista müşteri QR kodunu okutuyor (POST /api/orders/scan-qr)...');
  const scanRes = await (await fetch(`${API_URL}/api/orders/scan-qr`, { method: 'POST', headers:{ 'Authorization': `Bearer ${bariToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ qr_token: qrToken }) })).json();
  console.log(JSON.stringify(scanRes, null, 2));

  // 9. Son Bakiye Sorgusu
  console.log('\n[8] Müşteri kalan bakiye sorgusu (GET /api/wallet/balance)...');
  const balRes3 = await (await fetch(`${API_URL}/api/wallet/balance`, { headers:{ 'Authorization': `Bearer ${custToken}` }})).json();
  console.log(JSON.stringify(balRes3, null, 2));

  process.exit(0);
}

run();
