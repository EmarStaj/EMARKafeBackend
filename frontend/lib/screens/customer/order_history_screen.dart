import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../data/menu_data.dart';
import '../../state/app_state.dart';
import '../../theme.dart';
import '../../utils/page_transitions.dart';
import 'order_tracking_screen.dart';

class OrderHistoryScreen extends StatelessWidget {
  const OrderHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final orders = app.orderHistory;

    return Scaffold(
      appBar: AppBar(title: const Text('Geçmiş Siparişlerim')),
      body: SafeArea(
        child: orders.isEmpty
            ? Center(
                child: Text(
                  'Henüz bir siparişin yok ☕',
                  style: TextStyle(color: EmarColors.espresso.withValues(alpha: 0.55)),
                ),
              )
            : ListView.separated(
                padding: const EdgeInsets.all(20),
                itemCount: orders.length,
                separatorBuilder: (_, _) => const SizedBox(height: 12),
                itemBuilder: (context, i) => _OrderCard(order: orders[i]),
              ),
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  final OrderRecord order;
  const _OrderCard({required this.order});

  String _statusLabel(OrderRecord o) {
    if (o.pickedUp) return 'Teslim Alındı';
    return switch (o.computedStatus) {
      OrderStatus.created => 'Oluşturuldu',
      OrderStatus.received => 'Alındı',
      OrderStatus.preparing => 'Hazırlanıyor',
      OrderStatus.ready => 'Hazır',
      OrderStatus.completed => 'Tamamlandı',
      OrderStatus.cancelled => 'İptal',
    };
  }

  Color _statusColor(OrderRecord o) {
    if (o.pickedUp) return EmarColors.espresso.withValues(alpha: 0.45);
    return switch (o.computedStatus) {
      OrderStatus.created => EmarColors.espresso,
      OrderStatus.received => EmarColors.paprika,
      OrderStatus.preparing => EmarColors.moss,
      OrderStatus.ready => EmarColors.gold,
      OrderStatus.completed => EmarColors.moss,
      OrderStatus.cancelled => EmarColors.paprikaDim,
    };
  }

  static String _two(int n) => n.toString().padLeft(2, '0');

  String _formatDate(DateTime d) {
    return '${_two(d.day)}.${_two(d.month)}.${d.year} · ${_two(d.hour)}:${_two(d.minute)}';
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final live = !order.pickedUp && order.computedStatus != OrderStatus.ready;

    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: live ? () => Navigator.of(context).push(softRoute(OrderTrackingScreen(order: order))) : null,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: EmarColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: EmarColors.espresso.withValues(alpha: 0.06))),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(child: Text(order.shortId, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5))),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: _statusColor(order).withValues(alpha: 0.12), borderRadius: BorderRadius.circular(999)),
                  child: Text(_statusLabel(order), style: TextStyle(color: _statusColor(order), fontSize: 10.5, fontWeight: FontWeight.w700)),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text('${_formatDate(order.placedAt)} · ${order.branch}', style: TextStyle(fontSize: 11, color: EmarColors.espresso.withValues(alpha: 0.55))),
            const SizedBox(height: 10),
            ...order.items.entries.map((e) {
              final product = productById(e.key);
              final canRate = app.canRateProduct(product.id);
              final myRating = app.ratings[product.id];
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    Text(product.icon, style: const TextStyle(fontSize: 15)),
                    const SizedBox(width: 8),
                    Expanded(child: Text('${e.value}× ${product.name}', style: const TextStyle(fontSize: 12.5))),
                    if (myRating != null)
                      Text('★' * myRating.round(), style: const TextStyle(color: EmarColors.gold, fontSize: 11, fontWeight: FontWeight.w700))
                    else if (canRate)
                      GestureDetector(
                        onTap: () => _quickRate(context, product.id, product.name),
                        child: const Text('Değerlendir', style: TextStyle(color: EmarColors.moss, fontSize: 11.5, fontWeight: FontWeight.w700)),
                      )
                    else
                      Text('Yakında', style: TextStyle(color: EmarColors.espresso.withValues(alpha: 0.35), fontSize: 11)),
                  ],
                ),
              );
            }),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Toplam', style: TextStyle(fontSize: 11.5, color: EmarColors.espresso.withValues(alpha: 0.55))),
                Text('${order.total.toStringAsFixed(0)}₺', style: const TextStyle(fontWeight: FontWeight.w800, color: EmarColors.paprika, fontSize: 13.5)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _quickRate(BuildContext context, String productId, String productName) {
    showDialog<void>(
      context: context,
      builder: (dialogContext) {
        double stars = 5;
        return StatefulBuilder(
          builder: (context, setState) => AlertDialog(
            title: Text(productName),
            content: Row(
              mainAxisSize: MainAxisSize.min,
              children: List.generate(5, (i) {
                final filled = i < stars;
                return IconButton(
                  onPressed: () => setState(() => stars = (i + 1).toDouble()),
                  icon: Icon(filled ? Icons.star_rounded : Icons.star_border_rounded, color: EmarColors.gold, size: 28),
                );
              }),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('Vazgeç')),
              ElevatedButton(
                onPressed: () {
                  context.read<AppState>().rateProduct(productId, stars);
                  Navigator.pop(dialogContext);
                },
                child: const Text('Kaydet'),
              ),
            ],
          ),
        );
      },
    );
  }
}
