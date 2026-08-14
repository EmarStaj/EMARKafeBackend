import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/menu_data.dart';
import '../models/product.dart';
import '../state/app_state.dart';
import '../theme.dart';

/// Barista ve Şube Yöneticisi tarafından kullanılan, ürünleri "tükendi"
/// olarak işaretleyip menüden geçici olarak kaldırmayı sağlayan paylaşımlı ekran.
Future<void> showStockManager(BuildContext context) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: EmarColors.surface,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(22))),
    builder: (_) => const _StockManagerSheet(),
  );
}

class _StockManagerSheet extends StatelessWidget {
  const _StockManagerSheet();

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.75,
      minChildSize: 0.4,
      maxChildSize: 0.92,
      expand: false,
      builder: (context, scrollCtrl) {
        final app = context.watch<AppState>();
        return Column(
          children: [
            const SizedBox(height: 12),
            Container(width: 36, height: 4, decoration: BoxDecoration(color: EmarColors.espresso.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(3))),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 6),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Stok Yönetimi', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 18)),
                        Text(
                          'Tükenen ürünü kapat, menüde "Tükendi" olarak görünsün.',
                          style: TextStyle(fontSize: 11.5, color: EmarColors.espresso.withValues(alpha: 0.55)),
                        ),
                      ],
                    ),
                  ),
                  if (app.outOfStock.isNotEmpty)
                    Text('${app.outOfStock.length} tükendi', style: const TextStyle(fontSize: 11.5, color: EmarColors.paprikaDim, fontWeight: FontWeight.w700)),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: ListView(
                controller: scrollCtrl,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                children: ProductCategory.values.map((cat) {
                  final items = menuProducts.where((p) => p.category == cat).toList();
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(top: 14, bottom: 4),
                        child: Text(cat.label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5, color: EmarColors.espresso)),
                      ),
                      ...items.map((p) {
                        final out = app.isOutOfStock(p.id);
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 2),
                          child: Row(
                            children: [
                              Text(p.icon, style: TextStyle(fontSize: 16, color: out ? EmarColors.espresso.withValues(alpha: 0.3) : null)),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  p.name,
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: out ? EmarColors.espresso.withValues(alpha: 0.4) : EmarColors.espresso,
                                    decoration: out ? TextDecoration.lineThrough : null,
                                  ),
                                ),
                              ),
                              if (out)
                                const Padding(
                                  padding: EdgeInsets.only(right: 8),
                                  child: Text('Tükendi', style: TextStyle(fontSize: 10, color: EmarColors.paprikaDim, fontWeight: FontWeight.w700)),
                                ),
                              Switch(
                                value: !out,
                                activeThumbColor: EmarColors.moss,
                                onChanged: (_) => context.read<AppState>().toggleStock(p.id),
                              ),
                            ],
                          ),
                        );
                      }),
                    ],
                  );
                }).toList(),
              ),
            ),
          ],
        );
      },
    );
  }
}
