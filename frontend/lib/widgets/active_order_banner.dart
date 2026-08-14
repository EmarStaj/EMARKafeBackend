import 'dart:async';

import 'package:flutter/material.dart';

import '../state/app_state.dart';
import '../theme.dart';
import '../utils/page_transitions.dart';
import '../screens/customer/order_tracking_screen.dart';
import '../screens/customer/qr_display_screen.dart';

/// Ana ekranda gösterilen, aktif siparişin canlı geri sayımını taşıyan banner.
/// Takip ekranından çıkılsa bile burada görünmeye devam eder.
class ActiveOrderBanner extends StatefulWidget {
  final OrderRecord order;
  const ActiveOrderBanner({super.key, required this.order});

  @override
  State<ActiveOrderBanner> createState() => _ActiveOrderBannerState();
}

class _ActiveOrderBannerState extends State<ActiveOrderBanner> {
  Timer? _ticker;

  @override
  void initState() {
    super.initState();
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  String _format(int seconds) {
    final m = (seconds ~/ 60).toString().padLeft(2, '0');
    final s = (seconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    final order = widget.order;
    final ready = order.computedStatus == OrderStatus.ready;
    final pendingQR = order.isPendingQR;

    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: () => Navigator.of(context).push(softRoute(pendingQR ? QRDisplayScreen(order: order) : OrderTrackingScreen(order: order))),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: EmarColors.espresso,
          borderRadius: BorderRadius.circular(18),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: EmarColors.surface.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(14)),
              child: Text(pendingQR ? '📱' : (ready ? '🎉' : '⏱'), style: const TextStyle(fontSize: 20)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    pendingQR ? 'QR Kodunuz hazır' : (ready ? 'Siparişin hazır!' : 'Siparişin ${order.shortId} hazırlanıyor'),
                    style: const TextStyle(color: EmarColors.surface, fontWeight: FontWeight.w700, fontSize: 13),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    pendingQR ? 'Baristaya okutmak için tıklayın' : (ready ? 'Şubeden teslim alabilirsin' : '${_format(order.remainingSeconds)} kaldı — takip et'),
                    style: TextStyle(color: EmarColors.surface.withValues(alpha: 0.75), fontSize: 11.5),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: EmarColors.surface, size: 20),
          ],
        ),
      ),
    );
  }
}
