# ☕ EMARKafe Backend

**EMARKafe** — Kahve zinciri için self-servis mobil sipariş uygulamasının backend API'si.

![Node.js](https://img.shields.io/badge/Node.js-v20-green) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue) ![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E) ![Express](https://img.shields.io/badge/Framework-Express-000000)

---

## 🚀 Özellikler

- **JWT tabanlı kimlik doğrulama** (Supabase Auth)
- **4 Rol RBAC**: Müşteri · Barista · Şube Yöneticisi · Admin
- **Menü & Sepet & Sipariş** yönetimi
- **Şube bazlı stok kontrolü** (gerçek zamanlı müsaitlik)
- **Sadakat sistemi** (damga kartı modeli)
- **Ürün puanlama** (tekrarlı puanlama modeli)
- **Merkezi ayar yönetimi** (`app_settings`)
- **Swagger UI** (`/api-docs`)
- **Rate Limiting** (brute-force koruması)
- **Yapılandırılmış Loglama** (winston)

---

## 🛠️ Kurulum

### Gereksinimler
- Node.js v20+
- npm v10+
- Supabase hesabı

### 1. Repo'yu klonla

```bash
git clone https://github.com/tuncaycelikkanat/EMARKafe.git
cd EMARKafe
```

### 2. Bağımlılıkları yükle

```bash
npm install
```

### 3. Ortam değişkenlerini ayarla

```bash
cp .env.example .env
```

`.env` dosyasını düzenle:

```env
PORT=5001
NODE_ENV=development

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Production'da zorunlu (virgülle ayrılmış)
ALLOWED_ORIGINS=https://app.emarkafe.com
```

### 4. Geliştirme sunucusunu başlat

```bash
npm run dev
```

Sunucu `http://localhost:5001` adresinde çalışır.

---

## 📡 API Endpointleri

| Prefix | Modül | Auth |
|---|---|---|
| `GET /health` | Sağlık kontrolü (DB ping dahil) | — |
| `/api/auth` | Kimlik doğrulama | — / 🔒 |
| `/api/menu` | Ürün menüsü | — / 🔒 Admin |
| `/api/categories` | Kategoriler | — / 🔒 Admin |
| `/api/branches` | Şubeler | — / 🔒 |
| `/api/cart` | Sepet | 🔒 Müşteri |
| `/api/orders` | Siparişler | 🔒 |
| `/api/favorites` | Favoriler | 🔒 Müşteri |
| `/api/loyalty` | Sadakat sistemi | 🔒 Müşteri |
| `/api/options` | Ürün opsiyonları | — / 🔒 Admin |
| `/api/settings` | Sistem ayarları | 🔒 Admin |
| `/api/device-tokens` | Push token'ları | 🔒 |
| `/api/products/:id/ratings` | Ürün puanlama | 🔒 Müşteri |
| `/api-docs` | Swagger UI | — |

---

## 🏗️ Mimari

```
src/
├── app.ts                    # Express app (middleware, route mount)
├── server.ts                 # HTTP server başlatma
├── config/
│   ├── supabase.ts           # Supabase client'ları (anon + admin)
│   ├── logger.ts             # Winston logger yapılandırması
│   └── swagger.json          # OpenAPI spesifikasyonu
├── middlewares/
│   ├── auth.middleware.ts    # JWT doğrulama + profil yükleme
│   ├── role.middleware.ts    # RBAC yetki kontrolü
│   ├── validate.middleware.ts# Zod şema doğrulama
│   ├── error.middleware.ts   # Global hata yakalayıcı
│   └── rate-limit.middleware.ts # Rate limiter (global + auth)
├── modules/
│   ├── auth/                 # Kayıt · Giriş · Çıkış
│   ├── profile/              # Profil güncelleme
│   ├── menu/                 # Ürün CRUD
│   ├── category/             # Kategori CRUD
│   ├── branch/               # Şube yönetimi + stok
│   ├── cart/                 # Sepet yönetimi
│   ├── order/                # Sipariş akışı
│   ├── favorites/            # Favori ürünler
│   ├── loyalty/              # Damga kartı sistemi
│   ├── rating/               # Ürün puanlama
│   ├── option/               # Ürün opsiyonları
│   ├── settings/             # Merkezi ayarlar
│   └── device-token/         # Push bildirim token'ları
├── utils/
│   ├── app-error.ts          # AppError sınıfı + rethrowAsAppError
│   └── response.ts           # sendSuccess / sendError
└── types/
    └── index.d.ts            # Express Request tip genişletmeleri
```

Her modül `routes → controller → service → repository` katmanlarından oluşur.

---

## 🔒 Güvenlik

- **Rate Limiting**: Global (100 req/15dk), Auth endpoint'leri (10 req/15dk)
- **CORS**: Development'da açık; production'da `ALLOWED_ORIGINS` env değişkeninden beyaz liste
- **Helmet**: HTTP güvenlik header'ları
- **Zod**: Tüm giriş endpoint'lerinde şema doğrulama
- **RBAC**: Her endpoint'te rol bazlı yetki kontrolü

---

## 📜 Scriptler

| Komut | Açıklama |
|---|---|
| `npm run dev` | TypeScript hot-reload ile geliştirme sunucusu |
| `npm run build` | Üretim için TypeScript derle (`dist/`) |
| `npm start` | Derlenmiş uygulamayı çalıştır |

---

## 📚 Dökümantasyon

- **Swagger UI**: `http://localhost:5001/api-docs`
- **Proje Raporu**: [`docs/proje-raporu.md`](docs/proje-raporu.md)
