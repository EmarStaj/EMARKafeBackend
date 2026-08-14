import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../state/app_state.dart';
import '../../theme.dart';
import '../../widgets/pressable_scale.dart';
import 'order_tracking_screen.dart';

class QRDisplayScreen extends StatelessWidget {
  final OrderRecord? order;
  final String? qrToken;
  const QRDisplayScreen({super.key, this.order, this.qrToken});

  @override
  Widget build(BuildContext context) {
    final token = qrToken ?? order?.shortId ?? '';
    final isWallet = qrToken != null;

    return Scaffold(
      appBar: AppBar(
        title: Text(isWallet ? 'Cüzdan ile Öde' : 'Siparişi Onayla (QR)'),
        backgroundColor: EmarColors.oat,
      ),
      backgroundColor: EmarColors.oat,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text(
                isWallet ? 'QR Kodu Okutun' : 'Siparişin Hazır!',
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: EmarColors.espresso),
              ),
              const SizedBox(height: 12),
              Text(
                isWallet 
                  ? 'Kasadaki baristaya bu QR kodu okutarak cüzdanınızdan ödeme yapabilirsiniz. (Kod 3 dakika geçerlidir)' 
                  : 'Lütfen bu QR kodu baristaya okutun. Siparişiniz okutulduktan sonra hazırlanmaya başlayacaktır.',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 16, color: EmarColors.moss),
              ),
              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: const [
                    BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))
                  ],
                ),
                child: QrImageView(
                  data: token,
                  version: QrVersions.auto,
                  size: 250.0,
                  dataModuleStyle: const QrDataModuleStyle(
                    dataModuleShape: QrDataModuleShape.square,
                    color: EmarColors.espresso,
                  ),
                  eyeStyle: const QrEyeStyle(
                    eyeShape: QrEyeShape.square,
                    color: EmarColors.espresso,
                  ),
                ),
              ),
              const SizedBox(height: 32),
              if (!isWallet)
                Text(
                  'Sipariş No: ${order?.shortId ?? ''}',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: EmarColors.espresso),
                ),
              const SizedBox(height: 8),
              SelectableText(
                '(Test) QR Token: $token',
                style: TextStyle(fontSize: 12, color: EmarColors.espresso.withValues(alpha: 0.6)),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              if (!isWallet && order != null)
                PressableScale(
                  child: SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: EmarColors.paprika),
                      onPressed: () {
                        Navigator.of(context).pushReplacement(
                          MaterialPageRoute(builder: (_) => OrderTrackingScreen(order: order!)),
                        );
                      },
                      child: const Text('Sipariş Takibine Git', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                    ),
                  ),
                ),
              if (isWallet)
                const Text(
                  'Onaylandığında siparişiniz ana sayfada belirecektir.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 14, color: EmarColors.moss),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
