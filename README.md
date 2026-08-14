# ☕ EMARKafe Backend API

**EMARKafe** — Kahve zinciri self-servis sipariş, cüzdan ve sadakat ekosistemi için geliştirilmiş kurumsal düzeyde Node.js / TypeScript RESTful Backend API'si.

![Node.js](https://img.shields.io/badge/Node.js-v20-green?style=flat-square&logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)
![Express](https://img.shields.io/badge/Express-4.x-black?style=flat-square&logo=express)
![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=flat-square&logo=supabase)
![Redis](https://img.shields.io/badge/Cache-Redis-DC382D?style=flat-square&logo=redis)
![OneSignal](https://img.shields.io/badge/Push-OneSignal-E53935?style=flat-square&logo=onesignal)
![Swagger](https://img.shields.io/badge/Documentation-Swagger%20UI-85EA2D?style=flat-square&logo=swagger)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?style=flat-square&logo=githubactions)

---

## 🌟 Temel Yetenekler & Özellikler

* **🔐 Güçlü Kimlik Doğrulama & Oturum:** Supabase Auth entegrasyonu, JWT token doğrulama ve Redis önbellek destekli kullanıcı profili çözümleme.
* **👥 4 Seviyeli Rol Tabanlı Yetkilendirme (RBAC):**
  * `customer`: Menü keşfi, sepet yönetimi, cüzdan yükleme & QR oluşturma, sipariş verme, sadakat puanı kazanma, ürün puanlama.
  * `barista`: Şube bazlı canlı sipariş akışı, sipariş durumu ilerletme (`preparing`, `ready`, `completed`), QR okuma ve şube ürün stoklarını açma/kapatma.
  * `branch_manager`: Şube siparişleri ve şube envanter yönetimi.
  * `admin`: Sistem ayarları yönetimi, kategori/ürün kataloğu yönetimi, denetim (audit) logları analizi.
* **💳 Cüzdan (Wallet) & QR Ödeme:** Bakiye sorgulama, güvenli bakiye yükleme (üst/alt sınır doğrulamalı), dinamik zaman kısıtlı QR ödeme token üretimi.
* **⚡ Atomik Finansal Sipariş (Checkout Saga):** PostgreSQL `deduct_balance` RPC fonksiyonu ile bakiye düşümü, şube stok kontrolü ve sipariş oluşturma işlemleri yarış koşullarına (race-condition) karşı korumalıdır.
* **🎁 Sadakat (Loyalty) Programı:** Sipariş başına kategori bazlı damga (stamp) biriktirme, eşik aşıldığında otomatik hediye kupon (`loyalty_rewards`) üretimi.
* **⭐ Ürün Puanlama (Rating):** Yalnızca teslim alınan siparişlerdeki ürünler için 1–5 yıldız değerlendirme ve sahte puanlama koruması.
* **🔔 OneSignal Bildirim Entegrasyonu:** Sipariş hazır olduğunda ve sadakat puanı kazanıldığında anlık mobil push bildirimleri.
* **🛡️ Kurumsal Güvenlik & Dayanıklılık:**
  * Helmet (güvenlik başlıkları), CORS whitelist, Zod ile tip güvenli girdi doğrulama.
  * IP bazlı global Rate Limiter (Brute-force ve DDoS koruması).
  * Redis kesintilerinde otomatik PostgreSQL fallback desteği.
* **📖 İnteraktif API Dokümantasyonu:** Swagger UI `/api-docs` üzerinden tüm şemalar ve canlı test arayüzü.

---

## 📡 API Endpoint Haritası

| Modül | Metot & Yol | Açıklama | Yetki / Rol |
| :--- | :--- | :--- | :--- |
| **Sistem** | `GET /health` | DB ve servis sağlık kontrolü | Public |
| **Dokümantasyon** | `GET /api-docs` | Swagger OpenAPI interaktif dokümanı | Public |
| **Auth** | `POST /api/auth/register` | Yeni müşteri kaydı | Public |
| | `POST /api/auth/login` | Kullanıcı girişi & JWT token alma | Public |
| | `GET /api/auth/me` | Aktif oturum ve profil bilgisi | 🔒 Bearer Auth |
| **Profil** | `GET /api/profile/me` | Kullanıcı profil detayları | 🔒 Bearer Auth |
| | `PUT /api/profile/me` | İsim ve doğum tarihi güncelleme | 🔒 Bearer Auth |
| | `PUT /api/profile/me/default-branch` | Varsayılan şube seçimi | 🔒 Bearer Auth |
| **Menü & Kategori** | `GET /api/menu` | Ürün listesi ve arama (`?search=`) | Public |
| | `GET /api/categories` | Kategori listesi (Redis önbellekli) | Public |
| | `GET /api/menu/options` | Ürün opsiyonları (boyut, süt, şurup vb.) | Public |
| **Şubeler & Stok** | `GET /api/branches` | Aktif şube listesi | Public |
| | `PUT /api/branches/:bId/products/:pId` | Şube ürün stok durumunu açma/kapama | 🔒 `barista`, `admin` |
| **Sepet (Cart)** | `GET /api/cart` | Aktif sepeti listeleme | 🔒 `customer` |
| | `POST /api/cart` | Sepete ürün ekleme | 🔒 `customer` |
| | `PUT /api/cart/:itemId` | Sepet ürün adedi güncelleme | 🔒 `customer` |
| | `DELETE /api/cart/:itemId` | Sepetten ürün çıkarma | 🔒 `customer` |
| | `DELETE /api/cart` | Sepeti tamamen temizleme | 🔒 `customer` |
| **Sipariş (Order)** | `POST /api/orders` | Sepetteki ürünlerle sipariş tamamlama | 🔒 `customer` |
| | `GET /api/orders` | Müşteri geçmiş siparişleri | 🔒 `customer` |
| | `GET /api/orders/branch` | Şube canlı sipariş kuyruğu | 🔒 `barista`, `branch_manager` |
| | `PUT /api/orders/:id/status` | Sipariş durumu güncelleme | 🔒 `barista`, `admin` |
| | `POST /api/orders/scan-qr` | Baristanın müşteri QR kodunu taraması | 🔒 `barista` |
| **Cüzdan (Wallet)** | `GET /api/wallet/balance` | Cüzdan bakiyesini getirme | 🔒 `customer` |
| | `POST /api/wallet/topup` | Güvenli bakiye yükleme | 🔒 `customer` |
| | `GET /api/wallet/qr` | Ödeme için dinamik QR token üretimi | 🔒 `customer` |
| **Sadakat (Loyalty)** | `GET /api/loyalty` | Sadakat puanı ve kazanılan ödüller | 🔒 `customer` |
| | `POST /api/loyalty/redeem` | Hediye kahve kuponu kullanma | 🔒 `customer` |
| **Puanlama (Rating)** | `POST /api/ratings` | Tamamlanan siparişteki ürünü puanlama | 🔒 `customer` |
| **Favoriler** | `GET /api/favorites` | Favori ürünleri listeleme | 🔒 `customer` |
| | `POST /api/favorites` | Favorilere ürün ekleme | 🔒 `customer` |
| | `DELETE /api/favorites/:productId` | Favorilerden ürün çıkarma | 🔒 `customer` |
| **Yönetim & Ayarlar** | `GET /api/settings` *(veya `/api/app-settings`)* | Uygulama konfigürasyonu | Public |
| | `PUT /api/settings/:key` | Sistem ayarı güncelleme (Bakım modu vb.) | 🔒 `admin` |
| | `GET /api/audit-logs` *(veya `/api/audit`)* | Denetim ve güvenlik logları | 🔒 `admin` |

---

## 🛠️ Kurulum & Yerel Geliştirme

### Gereksinimler
* **Node.js** v20.x veya üzeri
* **npm** v10.x veya üzeri
* **Supabase** Hesabı & Projesi
* **Redis** (Opsiyonel — Redis yoksa PostgreSQL otomatik devralır)

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/EmarStaj/EMARKafeBackend.git
cd EMARKafeBackend
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Ortam Değişkenlerini Tanımlayın
```bash
cp .env.example .env
```
`.env` dosyasını yapılandırın:
```env
PORT=5001
NODE_ENV=development

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

REDIS_URL=redis://localhost:6379

ONESIGNAL_APP_ID=your-onesignal-app-id
ONESIGNAL_REST_API_KEY=your-onesignal-rest-key

ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

### 4. Veritabanı Migrasyonları (Opsiyonel)
Veritabanı geliştirmeleri ve fonksiyonları `database/migrations/` dizinindedir:
* `database/migrations/supabase_database_hardening_patch.sql`
* `database/migrations/supabase_order_checkout_transaction.sql`
* `database/migrations/supabase_onesignal_migration.sql`

### 5. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```
API `http://localhost:5001` adresinde yayına başlayacaktır.  
Swagger arayüzüne `http://localhost:5001/api-docs` üzerinden erişebilirsiniz.

---

## 🧪 Testleri Çalıştırma

Backend projesinde kapsamlı birim (unit), entegrasyon ve tüm rolleri kapsayan E2E test süitleri yer almaktadır:

```bash
# Jest Birim ve Servis Testleri
npm test

# E2E Güvenlik ve Uç Nokta Testleri
npm run test:e2e

# Tüm Rolleri (Customer, Barista, Manager, Admin) ve Tüm Endpointleri Kapsayan E2E Matrisi
npx ts-node src/scripts/test_all_roles_and_endpoints.ts
```

---

## 🐳 Docker ile Çalıştırma

```bash
# Docker imajı oluşturma
docker build -t emarkafe-backend .

# Konteyneri başlatma
docker run -p 5001:5001 --env-file .env emarkafe-backend
```

---

## 🏗️ Dizin Yapısı

```
EMARKafe-backend/
├── database/
│   └── migrations/               # PostgreSQL / Supabase SQL migrasyonları
├── docs/                         # Proje analiz ve mimari dokümanları
├── src/
│   ├── __tests__/                # Jest test dosyaları
│   ├── config/                   # Logger, Supabase, Redis, Swagger konfigürasyonları
│   ├── middlewares/              # Auth, Role, Error, Rate-Limit ve Zod Validation
│   ├── modules/                  # Modüler iş katmanı (Controller, Service, Repository, Routes)
│   │   ├── audit/
│   │   ├── auth/
│   │   ├── branch/
│   │   ├── cart/
│   │   ├── category/
│   │   ├── device-token/
│   │   ├── favorites/
│   │   ├── loyalty/
│   │   ├── menu/
│   │   ├── notification/
│   │   ├── option/
│   │   ├── order/
│   │   ├── profile/
│   │   ├── rating/
│   │   ├── settings/
│   │   └── wallet/
│   ├── scripts/                  # E2E rol matris test çalıştırıcıları
│   ├── types/                    # TypeScript tip tanımlamaları
│   ├── utils/                    # AppError, Response ve Retry yardımcıları
│   ├── app.ts                    # Express uygulama yapılandırması
│   └── server.ts                 # Sunucu başlatıcı
├── .dockerignore
├── .env.example
├── .gitignore
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## 📄 Lisans

Bu proje **EMAR Kafe** ekibi için geliştirilmiştir. Tüm hakları saklıdır.
