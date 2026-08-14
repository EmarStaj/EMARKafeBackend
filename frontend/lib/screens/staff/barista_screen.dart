import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../data/menu_data.dart';
import '../../state/app_state.dart';
import '../../theme.dart';
import '../../widgets/stock_manager_sheet.dart';
import 'qr_scanner_screen.dart';

class BaristaScreen extends StatefulWidget {
  const BaristaScreen({super.key});

  @override
  State<BaristaScreen> createState() => _BaristaScreenState();
}

class _BaristaScreenState extends State<BaristaScreen> {
  int _completedToday = 3;

  void _advance(OrderRecord o, AppState app) {
    if (o.manualStatus == OrderStatus.preparing) {
      _completedToday++;
    }
    app.advanceOrderStatus(o);
  }

  String _formatItems(Map<String, int> items) {
    return items.entries.map((e) {
      final p = productById(e.key);
      return '${e.value} ${p.name}';
    }).join(', ');
  }

  String _shortName(String name) {
    final parts = name.trim().split(' ');
    if (parts.length < 2) return name;
    return '${parts.first} ${parts.last[0]}.';
  }

  Widget _column(String title, OrderStatus status, List<OrderRecord> orders, AppState app) {
    final items = orders.where((o) {
      final s = o.manualStatus;
      return s == status;
    }).toList();
    
    return Container(
      width: 210,
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(color: EmarColors.oatDark, borderRadius: BorderRadius.circular(14)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('${title.toUpperCase()}  ·  ${items.length}',
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: .3, color: EmarColors.espresso)),
              if (status == OrderStatus.received && items.isNotEmpty) ...[
                const SizedBox(width: 6),
                _PulseDot(color: _colColor(status)),
              ],
            ],
          ),
          const SizedBox(height: 8),
          ...items.map((o) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: EmarColors.surface,
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [
                    BoxShadow(
                      color: EmarColors.espresso.withOpacity(0.03),
                      blurRadius: 4,
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(o.shortId, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5)),
                        Row(
                          children: [
                            CircleAvatar(
                              radius: 9,
                              backgroundColor: _colColor(status).withOpacity(0.15),
                              child: Text(
                                o.customerName.isNotEmpty ? o.customerName[0].toUpperCase() : '?',
                                style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w800, color: _colColor(status)),
                              ),
                            ),
                            const SizedBox(width: 5),
                            Text(_shortName(o.customerName), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: EmarColors.espresso)),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 5),
                    Text(_formatItems(o.items), style: const TextStyle(fontSize: 11, color: EmarColors.espresso)),
                    if (status != OrderStatus.ready) ...[
                      const SizedBox(height: 6),
                      SizedBox(
                        width: double.infinity,
                        child: TextButton(
                          style: TextButton.styleFrom(
                            backgroundColor: EmarColors.moss,
                            foregroundColor: EmarColors.surface,
                            padding: const EdgeInsets.symmetric(vertical: 6),
                            minimumSize: Size.zero,
                          ),
                          onPressed: () => _advance(o, app),
                          child: Text(status == OrderStatus.received ? 'Onayla' : 'Hazır İşaretle', style: const TextStyle(fontSize: 10.5)),
                        ),
                      ),
                    ],
                  ],
                ),
              )),
        ],
      ),
    );
  }

  Color _colColor(OrderStatus c) => switch (c) {
        OrderStatus.created => EmarColors.espresso,
        OrderStatus.received => EmarColors.paprika,
        OrderStatus.preparing => EmarColors.moss,
        OrderStatus.ready => EmarColors.gold,
        OrderStatus.completed => EmarColors.moss,
        OrderStatus.cancelled => EmarColors.paprikaDim,
      };

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    return Scaffold(
      appBar: AppBar(
        title: Text('Barista – ${app.currentBranch?.name ?? ''}'),
        actions: [
          IconButton(
            tooltip: 'QR Okut',
            icon: const Icon(Icons.qr_code_scanner),
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const QRScannerScreen())),
          ),
          IconButton(
            tooltip: 'Stok Yönetimi',
            icon: const Icon(Icons.inventory_2_outlined),
            onPressed: () => showStockManager(context),
          ),
          IconButton(icon: const Icon(Icons.logout), onPressed: () => app.logout()),
        ],
      ),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(color: EmarColors.oatDark, borderRadius: BorderRadius.circular(999)),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.local_cafe, size: 14, color: EmarColors.moss),
                    const SizedBox(width: 6),
                    Text('Bugün Tamamlanan: $_completedToday', style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: EmarColors.espresso)),
                  ],
                ),
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.all(16),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _column('Yeni', OrderStatus.received, app.activeBaristaOrders, app),
                    _column('Hazırlanıyor', OrderStatus.preparing, app.activeBaristaOrders, app),
                    _column('Hazır', OrderStatus.ready, app.activeBaristaOrders, app),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PulseDot extends StatefulWidget {
  final Color color;
  const _PulseDot({required this.color});

  @override
  State<_PulseDot> createState() => _PulseDotState();
}

class _PulseDotState extends State<_PulseDot> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 850))..repeat(reverse: true);

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (context, _) => Container(
        width: 7,
        height: 7,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: widget.color,
          boxShadow: [BoxShadow(color: widget.color.withOpacity(0.5 * _ctrl.value), blurRadius: 6 * _ctrl.value, spreadRadius: 1.5 * _ctrl.value)],
        ),
      ),
    );
  }
}
