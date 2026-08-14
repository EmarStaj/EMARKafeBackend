import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../state/app_state.dart';
import '../../theme.dart';
import '../../widgets/stock_manager_sheet.dart';

class _Staff {
  final String name;
  String shift; // '09-17' or '17-01'
  final int ordersToday;
  _Staff(this.name, this.shift, this.ordersToday);
}

class _ShiftRequest {
  final String staffName;
  final String currentShift;
  final String requestedShift;
  _ShiftRequest({required this.staffName, required this.currentShift, required this.requestedShift});
}

enum _RevenueRange { daily, weekly }

class ManagerScreen extends StatefulWidget {
  const ManagerScreen({super.key});

  @override
  State<ManagerScreen> createState() => _ManagerScreenState();
}

class _ManagerScreenState extends State<ManagerScreen> {
  final List<_Staff> _staff = [
    _Staff('Elif K.', '09-17', 34),
    _Staff('Mert A.', '17-01', 41),
    _Staff('Sude Y.', '09-17', 22),
    _Staff('Can T.', '17-01', 18),
  ];

  final List<_ShiftRequest> _shiftRequests = [
    _ShiftRequest(staffName: 'Sude Y.', currentShift: '09-17', requestedShift: '17-01'),
    _ShiftRequest(staffName: 'Can T.', currentShift: '17-01', requestedShift: '09-17'),
  ];

  _RevenueRange _range = _RevenueRange.daily;

  // Saat 09 - 24 arası göreli sipariş yoğunluğu (0-1)
  final List<double> _hourly = [0.30, 0.45, 0.88, 0.95, 0.40, 0.35, 0.55, 0.80, 0.92, 0.50, 0.28, 0.18];

  // Günlük ciro (son 7 gün) ve haftalık ciro (son 6 hafta) — mock ₺ verisi.
  final List<int> _dailyRevenue = [4200, 4800, 5100, 3900, 6200, 7400, 6800];
  final List<int> _weeklyRevenue = [28400, 31200, 29800, 33500, 36100, 38900];

  void _respondToRequest(_ShiftRequest r, bool approve) {
    setState(() {
      if (approve) {
        final staff = _staff.firstWhere((s) => s.name == r.staffName);
        staff.shift = r.requestedShift;
      }
      _shiftRequests.remove(r);
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(approve ? '${r.staffName} için vardiya değişikliği onaylandı' : '${r.staffName} için talep reddedildi')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final revenueData = _range == _RevenueRange.daily ? _dailyRevenue : _weeklyRevenue;
    final revenueLabels = _range == _RevenueRange.daily
        ? const ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
        : const ['-5h', '-4h', '-3h', '-2h', '-1h', 'Bu h.'];
    final maxRevenue = revenueData.reduce((a, b) => a > b ? a : b);
    final totalRevenue = revenueData.fold(0, (a, b) => a + b);
    final rankedStaff = List.of(_staff)..sort((a, b) => b.ordersToday.compareTo(a.ordersToday));
    final maxOrders = rankedStaff.isEmpty ? 1 : rankedStaff.first.ordersToday;

    return Scaffold(
      appBar: AppBar(
        title: Text('Yönetici – ${app.currentBranch?.name ?? ''}'),
        actions: [
          IconButton(
            tooltip: 'Stok Yönetimi',
            icon: const Icon(Icons.inventory_2_outlined),
            onPressed: () => showStockManager(context),
          ),
          IconButton(icon: const Icon(Icons.logout), onPressed: () => context.read<AppState>().logout()),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text('Bugün Mesaide', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 17)),
            const SizedBox(height: 10),
            ..._staff.map((s) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(s.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5)),
                      Row(
                        children: ['09-17', '17-01'].map((shift) {
                          final on = s.shift == shift;
                          return Padding(
                            padding: const EdgeInsets.only(left: 6),
                            child: ChoiceChip(
                              label: Text(shift),
                              selected: on,
                              onSelected: (_) => setState(() => s.shift = shift),
                              selectedColor: EmarColors.gold,
                              labelStyle: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: on ? EmarColors.espresso : EmarColors.espresso.withValues(alpha: 0.6),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                )),

            if (_shiftRequests.isNotEmpty) ...[
              const SizedBox(height: 22),
              Text('Vardiya Değişikliği Talepleri', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 17)),
              const SizedBox(height: 10),
              ..._shiftRequests.map((r) => Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    decoration: BoxDecoration(color: EmarColors.oatDark, borderRadius: BorderRadius.circular(12)),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(r.staffName, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5)),
                              Text('${r.currentShift} → ${r.requestedShift}', style: TextStyle(fontSize: 11, color: EmarColors.espresso.withValues(alpha: 0.6))),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, size: 18),
                          color: EmarColors.paprikaDim,
                          onPressed: () => _respondToRequest(r, false),
                        ),
                        IconButton(
                          icon: const Icon(Icons.check, size: 18),
                          color: EmarColors.moss,
                          onPressed: () => _respondToRequest(r, true),
                        ),
                      ],
                    ),
                  )),
            ],

            const SizedBox(height: 22),
            Text('Personel Performansı', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 17)),
            const SizedBox(height: 4),
            Text('Bugün hazırlanan sipariş sayısına göre', style: TextStyle(fontSize: 11.5, color: EmarColors.espresso.withValues(alpha: 0.55))),
            const SizedBox(height: 12),
            ...rankedStaff.map((s) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Row(
                    children: [
                      SizedBox(width: 56, child: Text(s.name, style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600))),
                      Expanded(
                        child: LayoutBuilder(
                          builder: (context, constraints) => Stack(
                            children: [
                              Container(height: 14, decoration: BoxDecoration(color: EmarColors.oatDark, borderRadius: BorderRadius.circular(7))),
                              AnimatedContainer(
                                duration: const Duration(milliseconds: 420),
                                height: 14,
                                width: constraints.maxWidth * (s.ordersToday / maxOrders),
                                decoration: BoxDecoration(color: EmarColors.moss, borderRadius: BorderRadius.circular(7)),
                              ),
                            ],
                          ),
                        ),
                      ),
                      SizedBox(width: 28, child: Text('${s.ordersToday}', textAlign: TextAlign.right, style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700))),
                    ],
                  ),
                )),

            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Ciro', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 17)),
                SegmentedButton<_RevenueRange>(
                  segments: const [
                    ButtonSegment(value: _RevenueRange.daily, label: Text('Günlük', style: TextStyle(fontSize: 11.5))),
                    ButtonSegment(value: _RevenueRange.weekly, label: Text('Haftalık', style: TextStyle(fontSize: 11.5))),
                  ],
                  selected: {_range},
                  onSelectionChanged: (s) => setState(() => _range = s.first),
                  style: SegmentedButton.styleFrom(
                    selectedBackgroundColor: EmarColors.espresso,
                    selectedForegroundColor: EmarColors.surface,
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              '${_range == _RevenueRange.daily ? "Son 7 gün" : "Son 6 hafta"} toplam: $totalRevenue₺',
              style: TextStyle(fontSize: 11.5, color: EmarColors.espresso.withValues(alpha: 0.55)),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 120,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: revenueData.map((v) {
                  final peak = v == maxRevenue;
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: AnimatedFractionallySizedBox(
                        duration: const Duration(milliseconds: 420),
                        heightFactor: v / maxRevenue,
                        alignment: Alignment.bottomCenter,
                        child: Container(
                          decoration: BoxDecoration(
                            color: peak ? EmarColors.paprika : EmarColors.oatDark,
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(5)),
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 6),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: revenueLabels.map((t) => Text(t, style: TextStyle(fontSize: 10.5, color: EmarColors.espresso.withValues(alpha: 0.55)))).toList(),
            ),

            const SizedBox(height: 24),
            Text('Bugünün Saatlik Sipariş Yoğunluğu', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 17)),
            const SizedBox(height: 12),
            SizedBox(
              height: 140,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: _hourly.map((v) {
                  final peak = v >= 0.8;
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 3),
                      child: FractionallySizedBox(
                        heightFactor: v,
                        alignment: Alignment.bottomCenter,
                        child: Container(
                          decoration: BoxDecoration(
                            color: peak ? EmarColors.paprika : EmarColors.oatDark,
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(5)),
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 6),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: ['09', '12', '15', '18', '21', '24']
                  .map((t) => Text(t, style: TextStyle(fontSize: 10.5, color: EmarColors.espresso.withValues(alpha: 0.55))))
                  .toList(),
            ),
          ],
        ),
      ),
    );
  }
}

/// [AnimatedFractionallySizedBox] Flutter'da hazır olmadığı için basit bir
/// implicit animasyon sarmalayıcısı: yükseklik oranı değiştiğinde yumuşak geçiş yapar.
class AnimatedFractionallySizedBox extends ImplicitlyAnimatedWidget {
  final double heightFactor;
  final Alignment alignment;
  final Widget child;
  const AnimatedFractionallySizedBox({
    super.key,
    required this.heightFactor,
    required this.alignment,
    required this.child,
    required super.duration,
  });

  @override
  ImplicitlyAnimatedWidgetState<AnimatedFractionallySizedBox> createState() => _AnimatedFractionallySizedBoxState();
}

class _AnimatedFractionallySizedBoxState extends ImplicitlyAnimatedWidgetState<AnimatedFractionallySizedBox> {
  Tween<double>? _factor;

  @override
  void forEachTween(TweenVisitor<dynamic> visitor) {
    _factor = visitor(_factor, widget.heightFactor, (v) => Tween<double>(begin: v as double)) as Tween<double>?;
  }

  @override
  Widget build(BuildContext context) {
    final value = _factor?.evaluate(animation) ?? widget.heightFactor;
    return FractionallySizedBox(heightFactor: value, alignment: widget.alignment, child: widget.child);
  }
}
