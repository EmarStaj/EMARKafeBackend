-- EMAR Kafe — Şema tamamlamaları
--
-- Mevcut şemada karşılığı olmayan uygulama özellikleri için eksik
-- tablo/sütunları ekler. Tamamı idempotent (tekrar çalıştırılabilir).
--
-- Politikalar, projedeki mevcut kalıbı izler: `get_user_role() = 'admin'`.
-- (Mevcut products politikasıyla birebir aynı ifade.)

begin;

-- ---------------------------------------------------------------------------
-- 1. Doğum tarihi (kayıt ekranında soruluyor, doğum günü sürprizi için)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists birth_date date;


-- ---------------------------------------------------------------------------
-- 1b. Ürün ikonu
--     Arayüz gerçek görsel yerine emoji kullanıyor. `image_url` gerçek
--     fotoğraflar için ayrı duruyor; bu sütun ona alternatif değil, yedeği.
-- ---------------------------------------------------------------------------
alter table public.products
  add column if not exists icon text not null default '☕';


-- ---------------------------------------------------------------------------
-- 2. Sipariş hazırlanma süresi
--    Kural (uygulama tarafında hesaplanıp yazılır):
--      18:00 öncesi -> kahve 2dk / tatlı 3dk / ikisi birlikte 4dk
--      18:00 sonrası -> kahve 3dk / tatlı 5dk / ikisi birlikte 6dk
--      her fazladan 2 üründe +1dk
--    ready_at üretilen sütundur; barista ekranı "hazır olması gerekenler"
--    sorgusunu bunun üzerinden yapabilir.
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists prep_minutes integer not null default 0
    check (prep_minutes >= 0);

alter table public.orders
  add column if not exists ready_at timestamptz
    generated always as (created_at + make_interval(mins => prep_minutes)) stored;


-- ---------------------------------------------------------------------------
-- 3. Sipariş kalemi notu ("az şekerli", "soya sütü" — barista görüyor)
--    Not, ürün bazında tutuluyor; barista ekranı sipariş içindeki notları
--    birleştirerek gösterebilir.
-- ---------------------------------------------------------------------------
alter table public.order_items
  add column if not exists note text;

alter table public.cart_items
  add column if not exists note text;


-- ---------------------------------------------------------------------------
-- 4. Ürün eşleştirmeleri — "Yanında bunlar iyi gider"
-- ---------------------------------------------------------------------------
create table if not exists public.product_pairings (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references public.products(id) on delete cascade,
  paired_product_id uuid not null references public.products(id) on delete cascade,
  sort_order        integer not null default 0,
  constraint product_pairings_unique unique (product_id, paired_product_id),
  constraint product_pairings_not_self check (product_id <> paired_product_id)
);

create index if not exists product_pairings_product_id_idx
  on public.product_pairings (product_id);

alter table public.product_pairings enable row level security;

drop policy if exists "Everyone can read product_pairings" on public.product_pairings;
create policy "Everyone can read product_pairings"
  on public.product_pairings for select
  using (true);

drop policy if exists "Admins can do everything on product_pairings" on public.product_pairings;
create policy "Admins can do everything on product_pairings"
  on public.product_pairings for all
  using (get_user_role() = 'admin');


-- ---------------------------------------------------------------------------
-- 5. Kampanyalar
-- ---------------------------------------------------------------------------
create table if not exists public.campaigns (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  subtitle    text not null,
  details     text not null,
  badge       text not null default 'YENİ',
  icon        text not null default '🎁',
  color_start text not null default '#E95949',
  color_end   text not null default '#C6473A',
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  starts_at   timestamptz,
  ends_at     timestamptz,
  created_at  timestamptz not null default now()
);

alter table public.campaigns enable row level security;

drop policy if exists "Everyone can read active campaigns" on public.campaigns;
create policy "Everyone can read active campaigns"
  on public.campaigns for select
  using (is_active);

drop policy if exists "Admins can do everything on campaigns" on public.campaigns;
create policy "Admins can do everything on campaigns"
  on public.campaigns for all
  using (get_user_role() = 'admin');


-- ---------------------------------------------------------------------------
-- 6. Sadakat eşiği
--    Uygulama "5 siparişte 1 kahve hediye" diyor; şemadaki varsayılan 4.
--    Aşağıdaki satır varsayılanı 5'e çeker. Kasten 4 seçildiyse bu bloğu
--    atlayın ve bunun yerine uygulamadaki metni 4'e göre güncelleyelim.
-- ---------------------------------------------------------------------------
alter table public.loyalty_progress
  alter column threshold set default 5;

commit;
