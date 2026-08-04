# Kahve Zinciri Mobil Sipariş Uygulaması — Kapsamlı Proje Raporu

## 1. Proje Özeti

Coffy / Starbucks benzeri bir kahve zinciri için geliştirilen **self-servis mobil sipariş uygulaması**. Müşteri uygulama üzerinden şubeden sipariş verir, siparişi şubeye giderek kendisi teslim alır.

- **Eve teslimat** ve **masaya servis** kapsam dışıdır.
- **Backend:** Node.js (TypeScript)
- **Veritabanı:** Supabase
- **Ekip yapısı:** Backend ve Mobil olmak üzere iki ayrı ekip

---

## 2. Kullanıcı Rolleri ve Yetki Sınırları (RBAC)

Sistemde **4 rol** bulunur ve bir kullanıcı yalnızca **tek bir rolde** olabilir (roller birbirini dışlar).

| Rol | Yetkiler | Sınırlar |
|---|---|---|
| **Müşteri** | Kayıt/giriş, profil yönetimi, menü görüntüleme, sepet, sipariş verme, sipariş geçmişi, favoriler, ürün puanlama, sadakat takibi | Yönetimsel işlemlere erişemez (403 Forbidden) |
| **Barista** | Kendi şubesine ait siparişleri görüntüleme/durum güncelleme, ürün müsaitliğini işaretleme | Yalnızca **kendi şubesinin** stokunu yönetebilir; başka şubeye müdahale 403 döner |
| **Şube Yöneticisi** | Kendi şubesinin bilgilerini güncelleme (adres vb.), şube personeli/stok üzerinde geniş yetki | Şube **silme** gibi admin-only işlemler yasak (403 Forbidden) |
| **Sistem Yöneticisi (Admin)** | Kategori/şube/ürün/opsiyon tanımlama, kullanıcı-rol yönetimi, `app_settings` üzerinden merkezi kural yönetimi | — |

RBAC doğrulaması uçtan uca test edilmiştir: müşterinin admin işlemi denemesi, baristanın başka şube stokuna müdahale denemesi ve şube yöneticisinin şube silme denemesi başarıyla engellenmiştir (tümü 403 Forbidden).

---

## 3. Fonksiyonel Kapsam (Faz 1)

### Dahil Olan Özellikler
- Kayıt / giriş (RBAC ile korunan oturum yönetimi)
- Profil güncelleme
- Menü listeleme (kategori bazlı, şube bazlı müsaitlik kontrolü ile)
- Ürün özelleştirme (opsiyon grupları ve değerleri üzerinden)
- Sepet yönetimi (ekleme, görüntüleme, güncelleme)
- Sipariş verme / checkout
- Sipariş durumu takibi ve güncelleme (Barista tarafından)
- Şube bazlı stok/müsaitlik yönetimi ("tükendi" işaretleme)
- Sipariş geçmişi
- Favoriler (idempotent ekleme/çıkarma)
- Ürün puanlama (tekrarlı puanlama modeli)
- Sadakat sistemi (damga kartı modeli)
- Merkezi/değiştirilebilir sistem ayarları (`app_settings`)

### Kapsam Dışı (Faz 1)
- Ödeme entegrasyonu
- Push bildirimler
- Gelişmiş şube yönetimi / raporlama
- Kampanya ve kupon sistemi

---

## 4. İş Kuralları

- **Rol kısıtı:** Bir kullanıcı yalnızca bir rolde olabilir.
- **Ürün müsaitliği:** Şube bazlı yönetilir (`branch_products`); bir şubede tükenen ürün diğer şubeleri etkilemez. Müsaitlik durumu Barista tarafından işaretlenir.
- **Stok engeli:** Tükenmiş bir ürünle checkout denenirse sipariş oluşturulmadan `400 Bad Request` döner ("Product is currently out of stock at this branch").
- **Sadakat modeli:** İndirim değil, damga kartı (stamp card) mantığı — her tamamlanan sipariş damga sayacını artırır, hedefe ulaşınca ödül tanımlanır.
- **Puanlama modeli:** Kullanıcı aynı ürünü farklı siparişlerinde tekrar tekrar puanlayabilir; her puan ayrı ayrı sayaca ve ortalamaya eklenir (üzerine yazma değil). Doğrulanan örnek: 5★ + 3★ → ortalama 4, sayaç 2.
- **Puanlama süre sınırı:** Sabit kodlanmaz; `app_settings` üzerinden merkezi ve değiştirilebilir olarak yönetilir. Süre dolduğunda puanlama isteği `400 Bad Request` ile reddedilir.
- **Favoriler idempotency:** Aynı ürün favorilere tekrar eklenmeye çalışıldığında mükerrer kayıt oluşturulmaz; toplam favori sayısı değişmez.
- **Teslimat modeli:** Yalnızca self-servis (şubeden al).
- **Puanlama görünürlüğü:** Puan sayısı ve ortalaması tüm kullanıcılara açık.

---

## 5. Veritabanı Şeması (17 Tablo)

| Tablo | Amaç |
|---|---|
| profiles | Kullanıcı profili ve rol bilgisi |
| branches | Şube bilgileri |
| categories | Ürün kategorileri |
| products | Ürünler |
| product_options | Ürün özelleştirme seçenek grupları (örn. boy, süt tipi) |
| product_option_values | Seçeneklere ait değerler |
| branch_products | Şubeye özel ürün/müsaitlik bilgisi |
| carts | Kullanıcı sepetleri |
| cart_items | Sepet içerikleri |
| orders | Siparişler |
| order_items | Sipariş kalemleri |
| favorites | Favori ürünler |
| product_ratings | Ürün puanlamaları |
| loyalty_progress | Kullanıcı sadakat/damga ilerlemesi |
| loyalty_rewards | Sadakat ödülleri |
| device_tokens | Bildirim için cihaz token'ları (ileriye dönük) |
| app_settings | Merkezi/değiştirilebilir sistem ayarları |

---

## 6. Kullanım Senaryoları (Use Cases)

| ID | Senaryo | Aktör |
|---|---|---|
| UC-01 | Müşteri Kaydı | Müşteri |
| UC-02 | Giriş Yapma | Tüm roller |
| UC-03 | Menü Listeleme | Müşteri |
| UC-04 | Ürün Özelleştirme ve Sepete Ekleme | Müşteri |
| UC-05 | Sepeti Görüntüleme / Güncelleme | Müşteri |
| UC-06 | Sipariş Verme (Checkout) | Müşteri |
| UC-07 | Sipariş Durumu Güncelleme | Barista |
| UC-08 | Ürün Müsaitliğini İşaretleme | Barista |
| UC-09 | Sipariş Geçmişini Görüntüleme | Müşteri |
| UC-10 | Favorilere Ekleme / Çıkarma | Müşteri |
| UC-11 | Ürün Puanlama | Müşteri |
| UC-12 | Sadakat (Damga Kartı) İlerlemesi | Müşteri |
| UC-13 | Sistem Ayarlarını Değiştirme | Admin |
| UC-14 | Yeni Ürün/Kategori Tanımlama | Admin |
| UC-15 | Şube Bazlı Ürün Aktifleştirme | Şube Yöneticisi / Admin |

*(Her senaryonun girdi/çıktı detayları ayrı bir dokümanda mevcuttur.)*

---

## 7. Uçtan Uca (E2E) Doğrulama Sonuçları

Backend üzerinde gerçekleştirilen otomatik E2E test akışı ile aşağıdaki maddeler doğrulanmıştır:

1. **Kayıt & Giriş:** Müşteri kaydı ve giriş `201`/başarılı şekilde çalışıyor (UC-01, UC-02).
2. **Profil Güncelleme:** `200 OK`.
3. **RBAC Bloklaması:** Müşterinin admin işlemi denemesi `403 Forbidden` ile engellendi.
4. **Rol Yükseltme/Düşürme:** Müşteri geçici olarak Admin yapılarak kategori, şube, ürün, opsiyon grubu ve değeri oluşturuldu (UC-14), ardından tekrar Müşteri rolüne döndürüldü.
5. **Sepet İşlemleri:** Sepete ekleme (`201`) ve sepeti görüntüleme (`200`) doğrulandı (UC-04, UC-05).
6. **Sipariş Verme:** Checkout `201 Created` ile başarılı (UC-06).
7. **Sipariş Durumu:** Barista tarafından sipariş durumu "COMPLETED" olarak güncellendi (UC-02, UC-07).
8. **Sadakat İlerlemesi:** Damga sayacı doğru şekilde 2/4 olarak izlendi (UC-12).
9. **Stok Kontrolü:** Ürün "tükendi" işaretlendiğinde checkout denemesi `400 Bad Request` ile reddedildi; restock sonrası sipariş tekrar `201 Created` ile başarılı oldu (UC-03, UC-06, UC-08, UC-15).
10. **4 Rolün Kapsam Testleri:**
    - Müşterinin ürün oluşturma denemesi → `403 Forbidden`
    - Baristanın başka şubenin stokunu yönetme denemesi → `403 Forbidden`
    - Şube Yöneticisinin kendi şube adresini güncellemesi → `200 OK`
    - Şube Yöneticisinin şube silme denemesi (admin-only) → `403 Forbidden`
11. **Tekrarlı Puanlama & Süre Sınırı:** İki farklı siparişte 5★ ve 3★ puanlama sonrası ortalama 4, sayaç 2 olarak güncellendi (UC-11); `app_settings` üzerinden yönetilen süre sınırı dolduğunda yeni puanlama `400 Bad Request` ile reddedildi (UC-13).
12. **Sipariş Geçmişi & Favoriler:** Sipariş geçmişi doğru listelendi (UC-09); favorilere ekleme idempotent çalıştı — tekrar ekleme denemesinde mükerrer kayıt oluşmadı, toplam favori sayısı sabit kaldı (UC-10).

**Sonuç:** Tüm E2E API doğrulamaları başarıyla tamamlandı.

### Not Edilen Küçük Bulgu — ✅ Çözüldü
Favorilere tekrar ekleme isteğinde (idempotent senaryo) API `201 Created` dönüyordu; işlevsel olarak mükerrer kayıt oluşmasa da HTTP semantiği açısından "zaten var" durumunda `200 OK` dönmesi daha doğruydu. **Bu davranış düzeltildi:** Yeni kayıt oluşturmada `201 Created`, idempotent tekrar eklemede `200 OK` döndürülmektedir.

---

## 8. Sonraki Fazlarda Değerlendirilebilecekler

- Ödeme entegrasyonu
- Push bildirimler (`device_tokens` altyapısı hazır)
- Gelişmiş şube yönetimi / raporlama
- Kampanya ve kupon sistemi
