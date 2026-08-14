import '../models/product.dart';
import 'campaigns_data.dart' show campaigns;
import 'catalog.dart';

// ---------------------------------------------------------------------------
// Canlı katalog erişimi
//
// Ekranlar bu isimleri kullanmaya devam eder; arkalarındaki veri Supabase
// yapılandırılmışsa veritabanından, değilse aşağıdaki yerel yedek menüden
// gelir. Katalog uygulama açılırken bir kez yüklenir (bkz. main.dart).
// ---------------------------------------------------------------------------

/// Görüntülenecek ürünler (canlı).
List<Product> get menuProducts => Catalog.instance.products;

/// Şube adları (canlı).
List<String> get branchCities =>
    Catalog.instance.branches.map((b) => b.name).toList();

Product productById(String id) => Catalog.instance.byId(id);

List<Product> similarTo(Product product, {int limit = 4}) =>
    Catalog.instance.similarTo(product, limit: limit);

// ---------------------------------------------------------------------------
// Yerel yedek veriler
// ---------------------------------------------------------------------------

/// Kampanyaların yerel yedeği (Catalog bunu başlangıç değeri olarak kullanır).
final seedCampaigns = campaigns;

/// EMAR Kafe yerel yedek menüsü: 25 kahve + 10 tatlı.
/// `pairsWith`, "yanında bunlar iyi gider" önerisinde kullanılan çapraz kategori eşleşmeleridir.
const List<Product> seedProducts = [
  // ---------------- Sıcak Kahveler ----------------
  Product(id: 'hc1', name: 'Espresso', category: ProductCategory.hotCoffee, price: 75, icon: '☕', rating: 4.6, ratingCount: 312, pairsWith: ['d3', 'd6']),
  Product(id: 'hc2', name: 'Doppio', category: ProductCategory.hotCoffee, price: 85, icon: '☕', rating: 4.5, ratingCount: 158, pairsWith: ['d3', 'd8']),
  Product(id: 'hc3', name: 'Americano', category: ProductCategory.hotCoffee, price: 90, icon: '☕', rating: 4.4, ratingCount: 401, pairsWith: ['d2', 'd5']),
  Product(id: 'hc4', name: 'Filtre Kahve', category: ProductCategory.hotCoffee, price: 95, icon: '☕', rating: 4.6, ratingCount: 522, pairsWith: ['d2', 'd9']),
  Product(id: 'hc5', name: 'Latte', category: ProductCategory.hotCoffee, price: 120, icon: '☕', rating: 4.8, ratingCount: 887, pairsWith: ['d1', 'd4']),
  Product(id: 'hc6', name: 'Cappuccino', category: ProductCategory.hotCoffee, price: 115, icon: '☕', rating: 4.7, ratingCount: 664, pairsWith: ['d2', 'd10']),
  Product(id: 'hc7', name: 'Flat White', category: ProductCategory.hotCoffee, price: 120, icon: '☕', rating: 4.9, ratingCount: 512, pairsWith: ['d1', 'd6']),
  Product(id: 'hc8', name: 'Cortado', category: ProductCategory.hotCoffee, price: 110, icon: '☕', rating: 4.5, ratingCount: 203, pairsWith: ['d4', 'd10']),
  Product(id: 'hc9', name: 'Mocha', category: ProductCategory.hotCoffee, price: 130, icon: '☕', rating: 4.7, ratingCount: 445, pairsWith: ['d1', 'd3']),
  Product(id: 'hc10', name: 'Karamel Machiato', category: ProductCategory.hotCoffee, price: 145, icon: '☕', rating: 4.8, ratingCount: 733, pairsWith: ['d1', 'd2']),
  Product(id: 'hc11', name: 'Sıcak Çikolata', category: ProductCategory.hotCoffee, price: 110, icon: '🍫', rating: 4.6, ratingCount: 288, pairsWith: ['d3', 'd7']),
  Product(id: 'hc12', name: 'Chai Latte', category: ProductCategory.hotCoffee, price: 115, icon: '🍵', rating: 4.4, ratingCount: 176, pairsWith: ['d8', 'd10']),
  Product(id: 'hc13', name: 'Türk Kahvesi', category: ProductCategory.hotCoffee, price: 80, icon: '☕', rating: 4.7, ratingCount: 390, pairsWith: ['d6', 'd9']),

  // ---------------- Soğuk Kahveler ----------------
  Product(id: 'ic1', name: 'Iced Americano', category: ProductCategory.icedCoffee, price: 100, icon: '🧊', rating: 4.4, ratingCount: 267, pairsWith: ['d5', 'd9']),
  Product(id: 'ic2', name: 'Iced Latte', category: ProductCategory.icedCoffee, price: 130, icon: '🧊', rating: 4.7, ratingCount: 604, pairsWith: ['d1', 'd4']),
  Product(id: 'ic3', name: 'Iced Mocha', category: ProductCategory.icedCoffee, price: 140, icon: '🧊', rating: 4.6, ratingCount: 355, pairsWith: ['d1', 'd3']),
  Product(id: 'ic4', name: 'Iced Karamel Machiato', category: ProductCategory.icedCoffee, price: 150, icon: '🧊', rating: 4.9, ratingCount: 812, pairsWith: ['d2', 'd6']),
  Product(id: 'ic5', name: 'Cold Brew', category: ProductCategory.icedCoffee, price: 125, icon: '🧊', rating: 4.6, ratingCount: 298, pairsWith: ['d3', 'd8']),
  Product(id: 'ic6', name: 'Cold Brew Latte', category: ProductCategory.icedCoffee, price: 140, icon: '🧊', rating: 4.7, ratingCount: 341, pairsWith: ['d4', 'd10']),
  Product(id: 'ic7', name: 'Frappuccino Karamel', category: ProductCategory.icedCoffee, price: 160, icon: '🥤', rating: 4.8, ratingCount: 690, pairsWith: ['d1', 'd7']),
  Product(id: 'ic8', name: 'Frappuccino Çikolata', category: ProductCategory.icedCoffee, price: 160, icon: '🥤', rating: 4.7, ratingCount: 583, pairsWith: ['d3', 'd7']),
  Product(id: 'ic9', name: 'Buzlu Filtre Kahve', category: ProductCategory.icedCoffee, price: 105, icon: '🧊', rating: 4.3, ratingCount: 189, pairsWith: ['d5', 'd9']),
  Product(id: 'ic10', name: 'Iced Flat White', category: ProductCategory.icedCoffee, price: 135, icon: '🧊', rating: 4.6, ratingCount: 244, pairsWith: ['d1', 'd6']),
  Product(id: 'ic11', name: 'Affogato', category: ProductCategory.icedCoffee, price: 145, icon: '🍨', rating: 4.9, ratingCount: 421, pairsWith: ['d6', 'd8']),
  Product(id: 'ic12', name: 'Freddo Espresso', category: ProductCategory.icedCoffee, price: 115, icon: '🧊', rating: 4.5, ratingCount: 167, pairsWith: ['d2', 'd10']),

  // ---------------- Tatlılar ----------------
  Product(id: 'd1', name: 'New York Cheesecake', category: ProductCategory.dessert, price: 165, icon: '🍰', rating: 4.9, ratingCount: 742, pairsWith: ['hc5', 'ic2']),
  Product(id: 'd2', name: 'Kruvasan', category: ProductCategory.dessert, price: 90, icon: '🥐', rating: 4.6, ratingCount: 512, pairsWith: ['hc6', 'hc10']),
  Product(id: 'd3', name: 'Çikolatalı Kurabiye', category: ProductCategory.dessert, price: 75, icon: '🍪', rating: 4.8, ratingCount: 655, pairsWith: ['hc1', 'ic3']),
  Product(id: 'd4', name: 'Brownie', category: ProductCategory.dessert, price: 110, icon: '🍫', rating: 4.7, ratingCount: 388, pairsWith: ['hc5', 'ic2']),
  Product(id: 'd5', name: 'Çikolatalı Muffin', category: ProductCategory.dessert, price: 95, icon: '🧁', rating: 4.5, ratingCount: 276, pairsWith: ['hc3', 'ic1']),
  Product(id: 'd6', name: 'Tiramisu', category: ProductCategory.dessert, price: 175, icon: '🍰', rating: 4.9, ratingCount: 498, pairsWith: ['hc13', 'ic11']),
  Product(id: 'd7', name: 'Sufle', category: ProductCategory.dessert, price: 150, icon: '🍫', rating: 4.8, ratingCount: 321, pairsWith: ['hc11', 'ic7']),
  Product(id: 'd8', name: 'Tarçınlı Rulo', category: ProductCategory.dessert, price: 100, icon: '🥮', rating: 4.6, ratingCount: 233, pairsWith: ['hc2', 'ic5']),
  Product(id: 'd9', name: 'Limonlu Cheesecake', category: ProductCategory.dessert, price: 170, icon: '🍰', rating: 4.7, ratingCount: 287, pairsWith: ['hc4', 'ic1']),
  Product(id: 'd10', name: 'Macaron (3\'lü)', category: ProductCategory.dessert, price: 120, icon: '🍬', rating: 4.6, ratingCount: 199, pairsWith: ['hc6', 'ic12']),
];

/// Şubelerin yerel yedeği (Catalog bunu başlangıç değeri olarak kullanır).
const List<String> seedBranchNames = [
  'İstanbul – Kadıköy',
  'Ankara – Çankaya',
  'İzmir – Alsancak',
  'Bursa – Nilüfer',
  'Antalya – Muratpaşa',
  'Adana – Seyhan',
  'Konya – Selçuklu',
  'Gaziantep – Şahinbey',
  'Kayseri – Melikgazi',
  'Trabzon – Ortahisar',
];
