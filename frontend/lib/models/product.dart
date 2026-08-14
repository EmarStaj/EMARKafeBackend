enum ProductCategory { hotCoffee, icedCoffee, dessert }

extension ProductCategoryLabel on ProductCategory {
  /// Arayüzde görünen ad — veritabanındaki `categories.name` ile birebir aynı.
  String get label => switch (this) {
        ProductCategory.hotCoffee => 'Sıcak Kahve',
        ProductCategory.icedCoffee => 'Soğuk Kahve',
        ProductCategory.dessert => 'Tatlı',
      };
}

/// Veritabanındaki kategori adını enum'a çevirir.
///
/// Not: Admin panelinden yeni bir kategori eklenirse burada karşılığı olmaz ve
/// `hotCoffee` sayılır. Kategori listesi genişleyecekse `categories` tablosuna
/// bir tür sütunu (ör. `kind: 'coffee' | 'dessert'`) eklemek gerekir.
ProductCategory productCategoryFromName(String name) => switch (name.trim()) {
      'Soğuk Kahve' => ProductCategory.icedCoffee,
      'Tatlı' => ProductCategory.dessert,
      _ => ProductCategory.hotCoffee,
    };

class Product {
  final String id;
  final String name;
  final ProductCategory category;
  final double price;
  final String icon;
  final double rating;
  final int ratingCount;

  /// Bu ürünle iyi giden ürünlerin id'leri ("Yanında bunlar iyi gider").
  final List<String> pairsWith;

  /// Veritabanı alanları. Yerel yedek menüde boş/varsayılan kalır.
  final String categoryId;
  final String? description;
  final bool isActive;
  final bool isLoyaltyEligible;

  const Product({
    required this.id,
    required this.name,
    required this.category,
    required this.price,
    required this.icon,
    required this.rating,
    required this.ratingCount,
    this.pairsWith = const [],
    this.categoryId = '',
    this.description,
    this.isActive = true,
    this.isLoyaltyEligible = true,
  });

  /// `products` satırından üretir. `categories(name)` join'i beklenir.
  factory Product.fromDb(Map<String, dynamic> row, {List<String> pairsWith = const []}) {
    final categoryName = (row['categories'] as Map<String, dynamic>?)?['name'] as String? ?? '';
    return Product(
      id: row['id'] as String,
      name: row['name'] as String,
      category: productCategoryFromName(categoryName),
      categoryId: row['category_id'] as String,
      price: (row['base_price'] as num).toDouble(),
      icon: row['icon'] as String? ?? '☕',
      rating: (row['avg_rating'] as num?)?.toDouble() ?? (row['rating'] as num?)?.toDouble() ?? 0.0,
      ratingCount: (row['rating_count'] as num?)?.toInt() ?? 0,
      description: row['description'] as String?,
      isActive: row['is_active'] as bool? ?? true,
      isLoyaltyEligible: row['is_loyalty_eligible'] as bool? ?? true,
      pairsWith: pairsWith,
    );
  }

  bool get isDessert => category == ProductCategory.dessert;

  /// Hazırlanma süresi kuralı tatlı/kahve ayrımına dayandığı için, tatlı
  /// olmayan her şey kahve sayılır.
  bool get isCoffee => !isDessert;
}
