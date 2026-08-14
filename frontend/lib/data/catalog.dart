import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../models/branch.dart';
import '../models/campaign.dart';
import '../models/product.dart';
import 'menu_data.dart' as seed;

class Catalog {
  Catalog._();
  static final Catalog instance = Catalog._();

  List<Product> _products = List.of(seed.seedProducts);
  List<Branch> _branches = seed.seedBranchNames.map((n) => Branch(id: n, name: n)).toList();
  List<Campaign> _campaigns = List.of(seed.seedCampaigns);

  bool isRemote = false;

  List<Product> get products => List.unmodifiable(_products);
  List<Branch> get branches => List.unmodifiable(_branches);
  List<Campaign> get campaigns => List.unmodifiable(_campaigns);

  late Map<String, Product> _byId = {for (final p in _products) p.id: p};

  Product byId(String id) =>
      _byId[id] ??
      Product(
        id: id,
        name: 'Bilinmeyen ürün',
        category: ProductCategory.hotCoffee,
        price: 0,
        icon: '❓',
        rating: 0,
        ratingCount: 0,
      );

  List<Product> similarTo(Product product, {int limit = 4}) {
    final sameCategory = _products
        .where((p) => p.category == product.category && p.id != product.id)
        .toList()
      ..sort((a, b) => b.rating.compareTo(a.rating));
    return sameCategory.take(limit).toList();
  }

  Future<bool> load() async {
    try {
      final res = await http.get(Uri.parse('https://emarkafe.duckdns.org/api/menu'));
      if (res.statusCode == 200) {
        final body = utf8.decode(res.bodyBytes);
        final json = jsonDecode(body);
        if (json is Map && json.containsKey('data')) {
          final list = json['data'] as List;
          if (list.isNotEmpty) {
            _products = list.map((p) => Product.fromDb(p as Map<String, dynamic>)).toList();
            _byId = {for (final p in _products) p.id: p};
          }
        }
      }

      final branchRes = await http.get(Uri.parse('https://emarkafe.duckdns.org/api/branches'));
      if (branchRes.statusCode == 200) {
        final branchBody = utf8.decode(branchRes.bodyBytes);
        final json = jsonDecode(branchBody);
        if (json is Map && json.containsKey('data')) {
           final list = json['data'] as List;
           if (list.isNotEmpty) {
             _branches = list.map((b) => Branch(id: b['id'], name: b['name'])).toList();
           }
        }
      }

      // We return false to indicate we are using local seed until parsing is fully built.
      return false;
    } catch (e, stack) {
      debugPrint('Katalog yüklenemedi: $e');
      return false;
    }
  }
}
