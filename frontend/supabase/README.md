# EMAR Kafe — Supabase Kurulumu

Asistan chatbot, model API anahtarını gizlemek için Supabase Edge Function
üzerinden çalışır:

```
Flutter uygulaması  ──(anon key)──▶  Edge Function  ──(GEMINI_API_KEY)──▶  Gemini API
```

Anahtar yalnızca Supabase tarafında `secret` olarak durur; tarayıcıya inmez.

## 1. Gemini API anahtarı al (ücretsiz)

[aistudio.google.com/apikey](https://aistudio.google.com/apikey) → **Create API key**.
Kredi kartı gerekmiyor, ücretsiz kotayla başlıyor.

## 2. Supabase projesi oluştur

[supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
Kurulduktan sonra **Project Settings → API** ekranından şu ikisini not al:

- **Project URL** → `https://xxxx.supabase.co`
- **anon public** key → `eyJ...`

## 3. Supabase CLI kur ve projeye bağlan

```bash
npm install -g supabase

supabase login
supabase link --project-ref xxxx   # Project URL'deki alt alan adı
```

## 4. Gemini anahtarını secret olarak kaydet

```bash
supabase secrets set GEMINI_API_KEY=buraya_gemini_anahtarin

# İsteğe bağlı — varsayılan gemini-2.0-flash
supabase secrets set GEMINI_MODEL=gemini-2.0-flash
```

## 5. Edge Function'ı deploy et

```bash
supabase functions deploy cafe-assistant
```

## 6. Uygulamayı bağla

```bash
flutter run -d web-server --web-port=8765 \
  --dart-define=SUPABASE_URL=https://xxxx.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=eyJ...
```

Bu iki değer istemci tarafında görünür olacak şekilde tasarlanmıştır —
gizlenmesi gereken tek şey `GEMINI_API_KEY`, o da 4. adımda sunucuda kalır.

## Sorun giderme

Fonksiyonun loglarını canlı izlemek için:

```bash
supabase functions logs cafe-assistant --tail
```

## Sıradaki adım

Menü şu an uygulamadan (`lib/data/menu_data.dart`) fonksiyona gönderiliyor.
Menü Supabase veritabanına taşındığında fonksiyon menüyü doğrudan tablodan
okuyabilir; o zaman istemcinin menü göndermesine gerek kalmaz.
