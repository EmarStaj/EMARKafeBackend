import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { supabaseAdmin } from '../config/supabase';
import app from '../app';
import request from 'supertest';

interface TestUser {
  email: string;
  password: string;
  role: string;
  token: string;
  id: string;
}

interface TestReportResult {
  category: string;
  role: string;
  endpoint: string;
  scenario: string;
  expectedStatus: number | number[];
  actualStatus: number;
  passed: boolean;
  notes?: string;
}

const results: TestReportResult[] = [];

function recordResult(
  category: string,
  role: string,
  endpoint: string,
  scenario: string,
  expectedStatus: number | number[],
  actualStatus: number,
  notes?: string
) {
  const isPassed = Array.isArray(expectedStatus)
    ? expectedStatus.includes(actualStatus)
    : expectedStatus === actualStatus;

  results.push({
    category,
    role,
    endpoint,
    scenario,
    expectedStatus,
    actualStatus,
    passed: isPassed,
    notes,
  });

  const mark = isPassed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${mark}] [${role.toUpperCase()}] ${endpoint} | ${scenario} (Expected: ${expectedStatus}, Got: ${actualStatus})`);
}

async function createOrGetTestUser(role: string, index: number = 1): Promise<TestUser> {
  const email = `test_${role}_${index}@emarkafe.test`;
  const password = 'Password123!';

  let userId: string | undefined;

  const { data: list } = await supabaseAdmin.auth.admin.listUsers();
  const existing = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (existing) {
    userId = existing.id;
    await supabaseAdmin.auth.admin.updateUserById(userId, { password });
  } else {
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: `Test ${role} ${index}` },
    });
    if (createErr) {
      throw createErr;
    }
    userId = newUser.user.id;
  }

  if (!userId) throw new Error(`Could not create/find user ${email}`);

  // Update profile
  await supabaseAdmin.from('profiles').update({
    full_name: `Test ${role} ${index}`,
    role: role,
    phone: `555123456${index}`,
    birth_date: '1995-05-15',
  }).eq('id', userId);

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  const token = loginRes.body?.data?.session?.access_token || loginRes.body?.data?.token;
  if (!token) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(loginRes.body)}`);
  }

  return {
    email,
    password,
    role,
    token,
    id: userId,
  };
}

async function runExhaustiveMatrix() {
  console.log('========================================================================');
  console.log('🚀 EMAR KAFE — KAPSAMLI TÜM ROLLER VE ENDPOINTLER E2E TEST SÜİTİ BAŞLATILIYOR');
  console.log('========================================================================\n');

  // 1. Setup Test Users
  console.log('👤 Test hesapları oluşturuluyor ve token alınıyor...');
  const customer = await createOrGetTestUser('customer', 1);
  const barista = await createOrGetTestUser('barista', 1);
  const manager = await createOrGetTestUser('manager', 1);
  const admin = await createOrGetTestUser('admin', 1);

  // Get a sample product and branch from DB
  const { data: branches } = await supabaseAdmin.from('branches').select('*').limit(2);
  const testBranch = branches && branches.length > 0 ? branches[0] : null;
  const testBranchId = testBranch?.id || '00000000-0000-0000-0000-000000000001';

  const { data: products } = await supabaseAdmin.from('products').select('*').eq('is_active', true).limit(5);
  const testProduct = products && products.length > 0 ? products[0] : null;
  const testProductId = testProduct?.id || '00000000-0000-0000-0000-000000000002';

  // Set default branch for users
  if (testBranchId) {
    await supabaseAdmin.from('profiles').update({ branch_id: testBranchId }).eq('id', customer.id);
    await supabaseAdmin.from('profiles').update({ branch_id: testBranchId }).eq('id', barista.id);
    await supabaseAdmin.from('profiles').update({ branch_id: testBranchId }).eq('id', manager.id);
  }

  console.log('✅ Test kullanıcıları ve ortam hazırlandı.\n');

  // -------------------------------------------------------------------------
  // MODÜL 1: AUTH & PROFILE
  // -------------------------------------------------------------------------
  console.log('--- [1. AUTH & PROFILE MODÜLÜ TESTLERİ] ---');

  // Login normal
  let res = await request(app).post('/api/auth/login').send({ email: customer.email, password: customer.password });
  recordResult('Auth', 'Public', 'POST /api/auth/login', 'Geçerli kimlik bilgileri ile giriş', 200, res.status);

  // Login wrong password
  res = await request(app).post('/api/auth/login').send({ email: customer.email, password: 'WrongPassword!' });
  recordResult('Auth', 'Public', 'POST /api/auth/login', 'Hatalı şifre ile giriş denemesi', [400, 401], res.status);

  // Login missing fields
  res = await request(app).post('/api/auth/login').send({ email: customer.email });
  recordResult('Auth', 'Public', 'POST /api/auth/login', 'Eksik şifre alanı ile istek', 400, res.status);

  // Get Me (Customer)
  res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${customer.token}`);
  recordResult('Auth', 'Customer', 'GET /api/auth/me', 'Kendi oturum bilgilerini sorgulama', 200, res.status);

  // Get Me without Token
  res = await request(app).get('/api/auth/me');
  recordResult('Auth', 'Anonymous', 'GET /api/auth/me', 'Tokensiz korumalı endpoint erişimi', 401, res.status);

  // Get Profile
  res = await request(app).get('/api/profile/me').set('Authorization', `Bearer ${customer.token}`);
  recordResult('Profile', 'Customer', 'GET /api/profile/me', 'Kendi profil bilgilerini getirme', 200, res.status);

  // Update Profile - Valid
  res = await request(app)
    .put('/api/profile/me')
    .set('Authorization', `Bearer ${customer.token}`)
    .send({ full_name: 'Customer Updated Name', birth_date: '1996-06-20' });
  recordResult('Profile', 'Customer', 'PUT /api/profile/me', 'Profil güncelleme (İsim ve Doğum Tarihi)', 200, res.status);

  // Update Profile - Disallowed Fields (Role tampering)
  res = await request(app)
    .put('/api/profile/me')
    .set('Authorization', `Bearer ${customer.token}`)
    .send({ role: 'admin' });
  recordResult('Profile', 'Customer', 'PUT /api/profile/me', 'Yetkisiz rol yükseltme (Privilege Escalation)', [400, 200], res.status, 'Schema role alanını reddetmeli veya yok saymalı');

  // Set Default Branch
  res = await request(app)
    .put('/api/profile/me/default-branch')
    .set('Authorization', `Bearer ${customer.token}`)
    .send({ branch_id: testBranchId });
  recordResult('Profile', 'Customer', 'PUT /api/profile/me/default-branch', 'Varsayılan şube belirleme', 200, res.status);

  // Set Default Branch - Invalid UUID
  res = await request(app)
    .put('/api/profile/me/default-branch')
    .set('Authorization', `Bearer ${customer.token}`)
    .send({ branch_id: 'invalid-uuid-123' });
  recordResult('Profile', 'Customer', 'PUT /api/profile/me/default-branch', 'Geçersiz UUID ile şube belirleme', 400, res.status);

  // -------------------------------------------------------------------------
  // MODÜL 2: WALLET (CÜZDAN)
  // -------------------------------------------------------------------------
  console.log('\n--- [2. WALLET (CÜZDAN) MODÜLÜ TESTLERİ] ---');

  // Get Balance
  res = await request(app).get('/api/wallet/balance').set('Authorization', `Bearer ${customer.token}`);
  recordResult('Wallet', 'Customer', 'GET /api/wallet/balance', 'Cüzdan bakiyesini sorgulama', 200, res.status);

  // Topup - Valid Amount
  res = await request(app)
    .post('/api/wallet/topup')
    .set('Authorization', `Bearer ${customer.token}`)
    .send({ amount: 500 });
  recordResult('Wallet', 'Customer', 'POST /api/wallet/topup', 'Pozitif geçerli bakiye yükleme (500 TL)', 200, res.status);

  // Topup - Zero Amount (Edge Case)
  res = await request(app)
    .post('/api/wallet/topup')
    .set('Authorization', `Bearer ${customer.token}`)
    .send({ amount: 0 });
  recordResult('Wallet', 'Customer', 'POST /api/wallet/topup', 'Sıfır TL yükleme denemesi', 400, res.status);

  // Topup - Negative Amount (Security Boundary)
  res = await request(app)
    .post('/api/wallet/topup')
    .set('Authorization', `Bearer ${customer.token}`)
    .send({ amount: -150 });
  recordResult('Wallet', 'Customer', 'POST /api/wallet/topup', 'Negatif tutar ile para çekme/açık arama', 400, res.status);

  // Topup - Extremely High Amount (Limit Check)
  res = await request(app)
    .post('/api/wallet/topup')
    .set('Authorization', `Bearer ${customer.token}`)
    .send({ amount: 999999999 });
  recordResult('Wallet', 'Customer', 'POST /api/wallet/topup', 'Maksimum işlem limitini aşan yükleme (>50.000 TL)', 400, res.status);

  // Get Wallet QR Token
  res = await request(app).get('/api/wallet/qr').set('Authorization', `Bearer ${customer.token}`);
  recordResult('Wallet', 'Customer', 'GET /api/wallet/qr', 'Ödeme için dinamik cüzdan QR token üretme', 200, res.status);

  // -------------------------------------------------------------------------
  // MODÜL 3: CATALOG, MENU & CATEGORIES
  // -------------------------------------------------------------------------
  console.log('\n--- [3. MENU, CATEGORIES & BRANCHES TESTLERİ] ---');

  // Get Menu (Public)
  res = await request(app).get('/api/menu');
  recordResult('Menu', 'Public', 'GET /api/menu', 'Genel menü listeleme', 200, res.status);

  // Get Menu with Search
  res = await request(app).get('/api/menu?search=Kahve');
  recordResult('Menu', 'Public', 'GET /api/menu?search=Kahve', 'Menüde anahtar kelime araması', 200, res.status);

  // Get Categories (Public)
  res = await request(app).get('/api/categories');
  recordResult('Category', 'Public', 'GET /api/categories', 'Kategorileri listeleme (Redis Cache)', 200, res.status);

  // Get Branches (Public)
  res = await request(app).get('/api/branches');
  recordResult('Branch', 'Public', 'GET /api/branches', 'Şube listesini getirme', 200, res.status);

  // -------------------------------------------------------------------------
  // MODÜL 4: CART (SEPET İŞLEMLERİ)
  // -------------------------------------------------------------------------
  console.log('\n--- [4. CART (SEPET) MODÜLÜ TESTLERİ] ---');

  // Clear Cart first
  await request(app).delete('/api/cart').set('Authorization', `Bearer ${customer.token}`);

  // Get Empty Cart
  res = await request(app).get('/api/cart').set('Authorization', `Bearer ${customer.token}`);
  recordResult('Cart', 'Customer', 'GET /api/cart', 'Boş sepeti sorgulama', 200, res.status);

  // Add Item to Cart (Valid)
  res = await request(app)
    .post('/api/cart')
    .set('Authorization', `Bearer ${customer.token}`)
    .send({ product_id: testProductId, quantity: 2 });
  recordResult('Cart', 'Customer', 'POST /api/cart', 'Sepete ürün ekleme (2 Adet)', [200, 201], res.status);

  // Add Item - Invalid Quantity (0)
  res = await request(app)
    .post('/api/cart')
    .set('Authorization', `Bearer ${customer.token}`)
    .send({ product_id: testProductId, quantity: 0 });
  recordResult('Cart', 'Customer', 'POST /api/cart', 'Sepete 0 adet ekleme', 400, res.status);

  // Add Item - Non-existent Product UUID
  res = await request(app)
    .post('/api/cart')
    .set('Authorization', `Bearer ${customer.token}`)
    .send({ product_id: '00000000-0000-0000-0000-000000000000', quantity: 1 });
  recordResult('Cart', 'Customer', 'POST /api/cart', 'Var olmayan ürün ID ile sepete ekleme', [400, 404], res.status);

  // -------------------------------------------------------------------------
  // MODÜL 5: ORDER CHECKOUT & STATUS LIFECYCLE
  // -------------------------------------------------------------------------
  console.log('\n--- [5. ORDER & STATUS LIFECYCLE TESTLERİ] ---');

  // Ensure test product is available in test branch
  if (testBranchId && testProductId) {
    const { data: existingBP } = await supabaseAdmin
      .from('branch_products')
      .select('id')
      .eq('branch_id', testBranchId)
      .eq('product_id', testProductId)
      .maybeSingle();

    if (existingBP) {
      await supabaseAdmin.from('branch_products').update({ is_available: true }).eq('id', existingBP.id);
    } else {
      await supabaseAdmin.from('branch_products').insert({
        branch_id: testBranchId,
        product_id: testProductId,
        is_available: true,
      });
    }
  }

  // Place Order (Customer)
  res = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${customer.token}`)
    .send({ branch_id: testBranchId });
  if (res.status !== 201) {
    console.log('❌ Place order error details:', JSON.stringify(res.body));
  }
  recordResult('Order', 'Customer', 'POST /api/orders', 'Sepetteki ürünlerle sipariş oluşturma (Checkout)', 201, res.status);

  const placedOrder = res.body?.data;
  const orderId = placedOrder?.id;

  // Place Order with Empty Cart (Edge Case)
  res = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${customer.token}`)
    .send({ branch_id: testBranchId });
  recordResult('Order', 'Customer', 'POST /api/orders', 'Boş sepetle sipariş vermeye çalışma', 400, res.status);

  // Get My Orders (Customer)
  res = await request(app).get('/api/orders').set('Authorization', `Bearer ${customer.token}`);
  recordResult('Order', 'Customer', 'GET /api/orders', 'Müşterinin kendi geçmiş siparişlerini sorgulaması', 200, res.status);

  // Barista views branch orders
  res = await request(app).get('/api/orders/branch').set('Authorization', `Bearer ${barista.token}`);
  recordResult('Order', 'Barista', 'GET /api/orders/branch', 'Baristanın şube sipariş kuyruğunu görmesi', 200, res.status);

  if (orderId) {
    // Barista updates status -> preparing
    res = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${barista.token}`)
      .send({ status: 'preparing' });
    recordResult('Order', 'Barista', `PUT /api/orders/:id/status`, 'Sipariş durumunu "preparing" yapma', 200, res.status);

    // Barista updates status -> ready
    res = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${barista.token}`)
      .send({ status: 'ready' });
    recordResult('Order', 'Barista', `PUT /api/orders/:id/status`, 'Sipariş durumunu "ready" yapma', 200, res.status);

    // Barista updates status -> completed
    res = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${barista.token}`)
      .send({ status: 'completed' });
    recordResult('Order', 'Barista', `PUT /api/orders/:id/status`, 'Sipariş durumunu "completed" yapma', 200, res.status);

    // Customer attempts to modify order status directly (Security Boundary)
    res = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ status: 'cancelled' });
    recordResult('Order', 'Customer', `PUT /api/orders/:id/status`, 'Müşterinin sipariş durumunu değiştirmeye çalışması (Yetki Testi)', 403, res.status);
  }

  // -------------------------------------------------------------------------
  // MODÜL 6: RATINGS (DEĞERLENDİRME & PUANLAMA)
  // -------------------------------------------------------------------------
  console.log('\n--- [6. RATINGS MODÜLÜ TESTLERİ] ---');

  if (orderId && testProductId) {
    // Rate product after completed order
    res = await request(app)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ product_id: testProductId, order_id: orderId, rating: 5 });
    recordResult('Ratings', 'Customer', 'POST /api/ratings', 'Teslim alınan siparişteki ürünü puanlama (5 Yıldız)', [200, 201], res.status);

    // Rate again with invalid score (0 or 6)
    res = await request(app)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ product_id: testProductId, order_id: orderId, rating: 6 });
    recordResult('Ratings', 'Customer', 'POST /api/ratings', 'Geçersiz puan değeri gönderme (6 Yıldız)', 400, res.status);

    // Rate product never ordered by user (Security Boundary)
    res = await request(app)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ product_id: testProductId, order_id: '00000000-0000-0000-0000-000000000099', rating: 4 });
    recordResult('Ratings', 'Customer', 'POST /api/ratings', 'Satın alınmamış sahte sipariş ID ile puanlama', [400, 403, 404], res.status);
  }

  // -------------------------------------------------------------------------
  // MODÜL 7: LOYALTY (SADAKAT PROGRAMI)
  // -------------------------------------------------------------------------
  console.log('\n--- [7. LOYALTY (SADAKAT) MODÜLÜ TESTLERİ] ---');

  // Query Loyalty Progress (Customer)
  res = await request(app).get('/api/loyalty').set('Authorization', `Bearer ${customer.token}`);
  recordResult('Loyalty', 'Customer', 'GET /api/loyalty', 'Sadakat puanı ve kazanılan hediye durumunu getirme', 200, res.status);

  // Redeem without valid reward (Edge Case)
  res = await request(app)
    .post('/api/loyalty/redeem')
    .set('Authorization', `Bearer ${customer.token}`)
    .send({ reward_id: '00000000-0000-0000-0000-000000000000', branch_id: testBranchId });
  recordResult('Loyalty', 'Customer', 'POST /api/loyalty/redeem', 'Geçersiz/Kazanılmamış hediye kahveyi kullanma', [400, 404], res.status);

  // -------------------------------------------------------------------------
  // MODÜL 8: FAVORITES (FAVORİLER)
  // -------------------------------------------------------------------------
  console.log('\n--- [8. FAVORITES MODÜLÜ TESTLERİ] ---');

  // Add Favorite
  res = await request(app)
    .post('/api/favorites')
    .set('Authorization', `Bearer ${customer.token}`)
    .send({ product_id: testProductId });
  recordResult('Favorites', 'Customer', 'POST /api/favorites', 'Ürünü favorilere ekleme', [200, 201], res.status);

  // Get Favorites
  res = await request(app).get('/api/favorites').set('Authorization', `Bearer ${customer.token}`);
  recordResult('Favorites', 'Customer', 'GET /api/favorites', 'Favori listesini getirme', 200, res.status);

  // Remove Favorite
  res = await request(app)
    .delete(`/api/favorites/${testProductId}`)
    .set('Authorization', `Bearer ${customer.token}`);
  recordResult('Favorites', 'Customer', `DELETE /api/favorites/:id`, 'Ürünü favorilerden çıkarma', [200, 204], res.status);

  // -------------------------------------------------------------------------
  // MODÜL 9: ROLE BASED ACCESS CONTROL (RBAC & SECURITY BOUNDARIES)
  // -------------------------------------------------------------------------
  console.log('\n--- [9. GÜVENLİK, RBAC & YETKİ SINIRLARI TESTLERİ] ---');

  // Customer tries to view Audit logs (403 expected)
  res = await request(app).get('/api/audit').set('Authorization', `Bearer ${customer.token}`);
  recordResult('RBAC Security', 'Customer', 'GET /api/audit', 'Müşteri audit loglarına erişim denemesi', 403, res.status);

  // Customer tries to update App Settings (403 expected)
  res = await request(app)
    .put('/api/settings/maintenance_mode')
    .set('Authorization', `Bearer ${customer.token}`)
    .send({ value: true });
  recordResult('RBAC Security', 'Customer', 'PUT /api/settings/:key', 'Müşteri sistem ayarlarını değiştirme denemesi', 403, res.status);

  // Barista updates branch product availability (200 expected)
  res = await request(app)
    .put(`/api/branches/${testBranchId}/products/${testProductId}`)
    .set('Authorization', `Bearer ${barista.token}`)
    .send({ is_available: false });
  recordResult('RBAC Security', 'Barista', 'PUT /api/branches/:bId/products/:pId', 'Baristanın ürün stoğunu kapatması (Tükendi)', 200, res.status);

  // Customer tries to toggle branch product availability (403 expected)
  res = await request(app)
    .put(`/api/branches/${testBranchId}/products/${testProductId}`)
    .set('Authorization', `Bearer ${customer.token}`)
    .send({ is_available: true });
  recordResult('RBAC Security', 'Customer', 'PUT /api/branches/:bId/products/:pId', 'Müşterinin ürün stoğunu değiştirmeye çalışması', 403, res.status);

  // Admin views Audit Logs (200 expected)
  res = await request(app).get('/api/audit').set('Authorization', `Bearer ${admin.token}`);
  recordResult('RBAC Security', 'Admin', 'GET /api/audit', 'Admin yetkisiyle Audit loglarını listeleme', 200, res.status);

  // Admin views App Settings (200 expected)
  res = await request(app).get('/api/app-settings').set('Authorization', `Bearer ${admin.token}`);
  recordResult('RBAC Security', 'Admin', 'GET /api/app-settings', 'Admin yetkisiyle sistem ayarlarını getirme', 200, res.status);

  console.log('\n========================================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  console.log(`🏁 TEST SONUCU: TOPLAM ${total} TESTTEN ${passed} BAŞARILI, ${failed} BAŞARISIZ`);
  console.log('========================================================================');

  return { total, passed, failed, results };
}

runExhaustiveMatrix()
  .then(({ failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  })
  .catch((err) => {
    console.error('Fatal error during test suite:', err);
    process.exit(1);
  });
