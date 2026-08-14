-- EMAR Kafe — Test verisi temizliği + gerçek menü yüklemesi
--
-- ⚠️ BU DOSYA VERİ SİLER. Çalıştırmadan önce arkadaşınla teyit et.
--    Kontrol edildiği anda orders / order_items / carts / cart_items /
--    favorites / product_ratings / loyalty_* tablolarının hepsi boştu,
--    yani silinecek ürünlere bağlı gerçek veri yok. Yine de önce
--    Dashboard → Database → Backups'tan bir yedek almanı öneririm.
--
-- Bu dosya 0001_emar_schema_additions.sql'den SONRA çalıştırılmalı
-- (product_pairings tablosuna ihtiyaç duyuyor).

begin;

-- ---------------------------------------------------------------------------
-- 1. TEMİZLİK — otomatik test artıkları
--    Adı 'Auto ' ile başlayanlar ve tekrarlayan 'Premium Coffee' kategorileri.
--    Bağımlılık sırası: option_values -> options -> branch_products -> products
-- ---------------------------------------------------------------------------
delete from public.product_option_values
where option_id in (
  select po.id from public.product_options po
  join public.products p on p.id = po.product_id
  where p.name like 'Auto %'
);

delete from public.product_options
where product_id in (select id from public.products where name like 'Auto %');

delete from public.branch_products
where product_id in (select id from public.products where name like 'Auto %')
   or branch_id  in (select id from public.branches where name like 'Auto %');

delete from public.products where name like 'Auto %';

-- Şubeye atanmış profiller varsa önce bağı kopar, yoksa FK silmeyi engeller.
update public.profiles
set branch_id = null
where branch_id in (select id from public.branches where name like 'Auto %');

delete from public.branches where name like 'Auto %';

-- Ürünü kalmamış 'Premium Coffee' kategorileri
delete from public.categories
where name = 'Premium Coffee'
  and not exists (select 1 from public.products p where p.category_id = categories.id);


-- ---------------------------------------------------------------------------
-- 2. KATEGORİLER
-- ---------------------------------------------------------------------------
insert into public.categories (name, sort_order)
select v.name, v.sort_order
from (values
  ('Sıcak Kahve', 1),
  ('Soğuk Kahve', 2),
  ('Tatlı',       3)
) as v(name, sort_order)
where not exists (select 1 from public.categories c where c.name = v.name);

update public.categories set sort_order = 1 where name = 'Sıcak Kahve';
update public.categories set sort_order = 2 where name = 'Soğuk Kahve';
update public.categories set sort_order = 3 where name = 'Tatlı';


-- ---------------------------------------------------------------------------
-- 3. ŞUBELER — uygulamadaki 10 demo şube
--
--    'Talas Emar Kafe Şube' varsayılan olarak KORUNUYOR (toplam 11 şube).
--    O da test verisiyse ve tam olarak 10 demo şube istiyorsan, aşağıdaki
--    iki satırı yorumdan çıkar:
--
--    update public.profiles set branch_id = null
--      where branch_id in (select id from public.branches where name = 'Talas Emar Kafe Şube');
--    delete from public.branches where name = 'Talas Emar Kafe Şube';
-- ---------------------------------------------------------------------------
insert into public.branches (name)
select v.name
from (values
  ('İstanbul – Kadıköy'),
  ('Ankara – Çankaya'),
  ('İzmir – Alsancak'),
  ('Bursa – Nilüfer'),
  ('Antalya – Muratpaşa'),
  ('Adana – Seyhan'),
  ('Konya – Selçuklu'),
  ('Gaziantep – Şahinbey'),
  ('Kayseri – Melikgazi'),
  ('Trabzon – Ortahisar')
) as v(name)
where not exists (select 1 from public.branches b where b.name = v.name);


-- ---------------------------------------------------------------------------
-- 4. ÜRÜNLER — 25 kahve + 10 tatlı
--    avg_rating / rating_count uygulamadaki demo değerleridir; gerçek
--    puanlamalar geldikçe product_ratings üzerinden güncellenmelidir.
-- ---------------------------------------------------------------------------
with incoming(name, category, price, rating, rating_count, icon) as (values
  -- Sıcak Kahveler
  ('Espresso',                'Sıcak Kahve',  75,  4.6, 312, '☕'),
  ('Doppio',                  'Sıcak Kahve',  85,  4.5, 158, '☕'),
  ('Americano',               'Sıcak Kahve',  90,  4.4, 401, '☕'),
  ('Filtre Kahve',            'Sıcak Kahve',  95,  4.6, 522, '☕'),
  ('Latte',                   'Sıcak Kahve', 120,  4.8, 887, '☕'),
  ('Cappuccino',              'Sıcak Kahve', 115,  4.7, 664, '☕'),
  ('Flat White',              'Sıcak Kahve', 120,  4.9, 512, '☕'),
  ('Cortado',                 'Sıcak Kahve', 110,  4.5, 203, '☕'),
  ('Mocha',                   'Sıcak Kahve', 130,  4.7, 445, '☕'),
  ('Karamel Machiato',        'Sıcak Kahve', 145,  4.8, 733, '☕'),
  ('Sıcak Çikolata',          'Sıcak Kahve', 110,  4.6, 288, '🍫'),
  ('Chai Latte',              'Sıcak Kahve', 115,  4.4, 176, '🍵'),
  ('Türk Kahvesi',            'Sıcak Kahve',  80,  4.7, 390, '☕'),
  -- Soğuk Kahveler
  ('Iced Americano',          'Soğuk Kahve', 100,  4.4, 267, '🧊'),
  ('Iced Latte',              'Soğuk Kahve', 130,  4.7, 604, '🧊'),
  ('Iced Mocha',              'Soğuk Kahve', 140,  4.6, 355, '🧊'),
  ('Iced Karamel Machiato',   'Soğuk Kahve', 150,  4.9, 812, '🧊'),
  ('Cold Brew',               'Soğuk Kahve', 125,  4.6, 298, '🧊'),
  ('Cold Brew Latte',         'Soğuk Kahve', 140,  4.7, 341, '🧊'),
  ('Frappuccino Karamel',     'Soğuk Kahve', 160,  4.8, 690, '🥤'),
  ('Frappuccino Çikolata',    'Soğuk Kahve', 160,  4.7, 583, '🥤'),
  ('Buzlu Filtre Kahve',      'Soğuk Kahve', 105,  4.3, 189, '🧊'),
  ('Iced Flat White',         'Soğuk Kahve', 135,  4.6, 244, '🧊'),
  ('Affogato',                'Soğuk Kahve', 145,  4.9, 421, '🍨'),
  ('Freddo Espresso',         'Soğuk Kahve', 115,  4.5, 167, '🧊'),
  -- Tatlılar
  ('New York Cheesecake',     'Tatlı',       165,  4.9, 742, '🍰'),
  ('Kruvasan',                'Tatlı',        90,  4.6, 512, '🥐'),
  ('Çikolatalı Kurabiye',     'Tatlı',        75,  4.8, 655, '🍪'),
  ('Brownie',                 'Tatlı',       110,  4.7, 388, '🍫'),
  ('Çikolatalı Muffin',       'Tatlı',        95,  4.5, 276, '🧁'),
  ('Tiramisu',                'Tatlı',       175,  4.9, 498, '🍰'),
  ('Sufle',                   'Tatlı',       150,  4.8, 321, '🍫'),
  ('Tarçınlı Rulo',           'Tatlı',       100,  4.6, 233, '🥮'),
  ('Limonlu Cheesecake',      'Tatlı',       170,  4.7, 287, '🍰'),
  ('Macaron (3''lü)',         'Tatlı',       120,  4.6, 199, '🍬')
)
insert into public.products (name, category_id, base_price, avg_rating, rating_count, icon)
select i.name, c.id, i.price, i.rating, i.rating_count, i.icon
from incoming i
join public.categories c on c.name = i.category
where not exists (select 1 from public.products p where p.name = i.name);

-- Mevcut 'Latte' satırının fiyatı 45'ti; menüyle hizala.
update public.products p
set base_price = 120, avg_rating = 4.8, rating_count = 887, icon = '☕'
where p.name = 'Latte' and p.base_price <> 120;


-- ---------------------------------------------------------------------------
-- 5. ŞUBE STOK DURUMU — her şubede her ürün başlangıçta mevcut
-- ---------------------------------------------------------------------------
insert into public.branch_products (branch_id, product_id, is_available)
select b.id, p.id, true
from public.branches b
cross join public.products p
where b.is_active
  and not exists (
    select 1 from public.branch_products bp
    where bp.branch_id = b.id and bp.product_id = p.id
  );


-- ---------------------------------------------------------------------------
-- 6. ÜRÜN EŞLEŞTİRMELERİ — "Yanında bunlar iyi gider"
-- ---------------------------------------------------------------------------
with pairs(product_name, paired_name, sort_order) as (values
  ('Espresso',              'Çikolatalı Kurabiye', 0), ('Espresso',              'Tiramisu',              1),
  ('Doppio',                'Çikolatalı Kurabiye', 0), ('Doppio',                'Tarçınlı Rulo',         1),
  ('Americano',             'Kruvasan',            0), ('Americano',             'Çikolatalı Muffin',     1),
  ('Filtre Kahve',          'Kruvasan',            0), ('Filtre Kahve',          'Limonlu Cheesecake',    1),
  ('Latte',                 'New York Cheesecake', 0), ('Latte',                 'Brownie',               1),
  ('Cappuccino',            'Kruvasan',            0), ('Cappuccino',            'Macaron (3''lü)',       1),
  ('Flat White',            'New York Cheesecake', 0), ('Flat White',            'Tiramisu',              1),
  ('Cortado',               'Brownie',             0), ('Cortado',               'Macaron (3''lü)',       1),
  ('Mocha',                 'New York Cheesecake', 0), ('Mocha',                 'Çikolatalı Kurabiye',   1),
  ('Karamel Machiato',      'New York Cheesecake', 0), ('Karamel Machiato',      'Kruvasan',              1),
  ('Sıcak Çikolata',        'Çikolatalı Kurabiye', 0), ('Sıcak Çikolata',        'Sufle',                 1),
  ('Chai Latte',            'Tarçınlı Rulo',       0), ('Chai Latte',            'Macaron (3''lü)',       1),
  ('Türk Kahvesi',          'Tiramisu',            0), ('Türk Kahvesi',          'Limonlu Cheesecake',    1),
  ('Iced Americano',        'Çikolatalı Muffin',   0), ('Iced Americano',        'Limonlu Cheesecake',    1),
  ('Iced Latte',            'New York Cheesecake', 0), ('Iced Latte',            'Brownie',               1),
  ('Iced Mocha',            'New York Cheesecake', 0), ('Iced Mocha',            'Çikolatalı Kurabiye',   1),
  ('Iced Karamel Machiato', 'Kruvasan',            0), ('Iced Karamel Machiato', 'Tiramisu',              1),
  ('Cold Brew',             'Çikolatalı Kurabiye', 0), ('Cold Brew',             'Tarçınlı Rulo',         1),
  ('Cold Brew Latte',       'Brownie',             0), ('Cold Brew Latte',       'Macaron (3''lü)',       1),
  ('Frappuccino Karamel',   'New York Cheesecake', 0), ('Frappuccino Karamel',   'Sufle',                 1),
  ('Frappuccino Çikolata',  'Çikolatalı Kurabiye', 0), ('Frappuccino Çikolata',  'Sufle',                 1),
  ('Buzlu Filtre Kahve',    'Çikolatalı Muffin',   0), ('Buzlu Filtre Kahve',    'Limonlu Cheesecake',    1),
  ('Iced Flat White',       'New York Cheesecake', 0), ('Iced Flat White',       'Tiramisu',              1),
  ('Affogato',              'Tiramisu',            0), ('Affogato',              'Tarçınlı Rulo',         1),
  ('Freddo Espresso',       'Kruvasan',            0), ('Freddo Espresso',       'Macaron (3''lü)',       1),
  ('New York Cheesecake',   'Latte',               0), ('New York Cheesecake',   'Iced Latte',            1),
  ('Kruvasan',              'Cappuccino',          0), ('Kruvasan',              'Karamel Machiato',      1),
  ('Çikolatalı Kurabiye',   'Espresso',            0), ('Çikolatalı Kurabiye',   'Iced Mocha',            1),
  ('Brownie',               'Latte',               0), ('Brownie',               'Iced Latte',            1),
  ('Çikolatalı Muffin',     'Americano',           0), ('Çikolatalı Muffin',     'Iced Americano',        1),
  ('Tiramisu',              'Türk Kahvesi',        0), ('Tiramisu',              'Affogato',              1),
  ('Sufle',                 'Sıcak Çikolata',      0), ('Sufle',                 'Frappuccino Karamel',   1),
  ('Tarçınlı Rulo',         'Doppio',              0), ('Tarçınlı Rulo',         'Cold Brew',             1),
  ('Limonlu Cheesecake',    'Filtre Kahve',        0), ('Limonlu Cheesecake',    'Iced Americano',        1),
  ('Macaron (3''lü)',       'Cappuccino',          0), ('Macaron (3''lü)',       'Freddo Espresso',       1)
)
insert into public.product_pairings (product_id, paired_product_id, sort_order)
select p1.id, p2.id, pr.sort_order
from pairs pr
join public.products p1 on p1.name = pr.product_name
join public.products p2 on p2.name = pr.paired_name
on conflict (product_id, paired_product_id) do nothing;


-- ---------------------------------------------------------------------------
-- 7. KAMPANYALAR (0001 migration'ı gerektirir)
-- ---------------------------------------------------------------------------
insert into public.campaigns (title, subtitle, details, badge, icon, color_start, color_end, sort_order)
select v.*
from (values
  ('5 Siparişte 1 Kahve Hediye!',
   'Her 5. siparişinde dilediğin kahve bizden.',
   'Sadakat programına otomatik dahilsin. Verdiğin her sipariş sayaca eklenir; 5. siparişini tamamladığında dilediğin kahveyi ücretsiz alırsın.',
   'SADAKAT', '☕', '#E95949', '#C6473A', 0),
  ('İlk Siparişine Özel %20 İndirim',
   'EMAR Kafe''ye ilk siparişinde geçerli.',
   'Hesabını oluşturduktan sonra vereceğin ilk siparişte sepet toplamının tamamına %20 indirim uygulanır.',
   'YENİ ÜYE', '🎉', '#439BD6', '#364D63', 1),
  ('Öğleden Sonra Molası',
   '14:00-17:00 arası tatlı + kahve alımlarında %15 indirim.',
   'Hafta içi her gün 14:00-17:00 arasında sepetinde en az bir kahve ve bir tatlı olduğunda toplam tutara %15 indirim uygulanır.',
   'GÜNLÜK', '🍰', '#52A7E0', '#439BD6', 2),
  ('Hafta Sonu Çiftler Kampanyası',
   'Cumartesi ve Pazar 2. içecekte %50 indirim.',
   'Cumartesi ve Pazar günleri sepetine ikinci bir içecek eklediğinde, sepetteki en düşük fiyatlı içeceğe %50 indirim yansır.',
   'HAFTA SONU', '🥤', '#364D63', '#25384A', 3)
) as v(title, subtitle, details, badge, icon, color_start, color_end, sort_order)
where not exists (select 1 from public.campaigns c where c.title = v.title);

commit;


-- ---------------------------------------------------------------------------
-- DOĞRULAMA — commit sonrası ayrıca çalıştır
-- ---------------------------------------------------------------------------
-- select c.name, count(*) from public.products p
--   join public.categories c on c.id = p.category_id group by 1 order by 1;
--   -- beklenen: Sıcak Kahve 13, Soğuk Kahve 12, Tatlı 10
-- select count(*) from public.branches;          -- beklenen: 11
-- select count(*) from public.product_pairings;  -- beklenen: 70
-- select count(*) from public.campaigns;         -- beklenen: 4
