import 'package:flutter/material.dart';

class Campaign {
  final String title;
  final String subtitle;
  final String details;
  final String badge;
  final String icon;
  final List<Color> colors;

  /// Veritabanından geldiyse dolu; yerel yedek kampanyalarda boş.
  final String? id;

  const Campaign({
    required this.title,
    required this.subtitle,
    required this.details,
    required this.badge,
    required this.icon,
    required this.colors,
    this.id,
  });

  factory Campaign.fromDb(Map<String, dynamic> row) => Campaign(
        id: row['id'] as String,
        title: row['title'] as String,
        subtitle: row['subtitle'] as String,
        details: row['details'] as String,
        badge: row['badge'] as String? ?? 'KAMPANYA',
        icon: row['icon'] as String? ?? '🎁',
        colors: [
          _parseHex(row['color_start'] as String?, const Color(0xFFE95949)),
          _parseHex(row['color_end'] as String?, const Color(0xFFC6473A)),
        ],
      );

  /// `#RRGGBB` ya da `#AARRGGBB` biçimini Color'a çevirir.
  static Color _parseHex(String? hex, Color fallback) {
    if (hex == null) return fallback;
    var value = hex.trim().replaceFirst('#', '');
    if (value.length == 6) value = 'FF$value';
    final parsed = int.tryParse(value, radix: 16);
    return parsed == null ? fallback : Color(parsed);
  }
}
