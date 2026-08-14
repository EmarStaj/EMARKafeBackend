import 'package:flutter/material.dart';

import '../theme.dart';

/// Coffy tarzı beyaz ödül kartı: başlık + "Detaylar" bağlantısı,
/// yatay ilerleme çubuğu ve kazanılan bedava içecek rozeti.
class LoyaltyCard extends StatelessWidget {
  final int progress; // 0..4
  final int freeCoffeesEarned;
  const LoyaltyCard({super.key, required this.progress, required this.freeCoffeesEarned});

  @override
  Widget build(BuildContext context) {
    final remaining = 5 - progress;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: EmarColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: EmarColors.espresso.withValues(alpha: 0.06)),
        boxShadow: [BoxShadow(color: EmarColors.espresso.withValues(alpha: 0.06), blurRadius: 14, offset: const Offset(0, 6))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Expanded(
                child: Text(
                  '5 Siparişte 1 Kahve Hediye!',
                  style: TextStyle(color: EmarColors.espresso, fontWeight: FontWeight.w700, fontSize: 13.5),
                ),
              ),
              InkWell(
                onTap: () => ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Her 5. siparişinde dilediğin kahve bizden ☕')),
                ),
                child: const Padding(
                  padding: EdgeInsets.only(left: 8),
                  child: Text(
                    'Detaylar →',
                    style: TextStyle(color: EmarColors.moss, fontWeight: FontWeight.w700, fontSize: 11.5),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    return Stack(
                      children: [
                        Container(
                          height: 8,
                          decoration: BoxDecoration(color: EmarColors.oatDark, borderRadius: BorderRadius.circular(999)),
                        ),
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 480),
                          curve: Curves.easeOutCubic,
                          height: 8,
                          width: constraints.maxWidth * (progress / 5).clamp(0.0, 1.0),
                          decoration: BoxDecoration(color: EmarColors.moss, borderRadius: BorderRadius.circular(999)),
                        ),
                      ],
                    );
                  },
                ),
              ),
              const SizedBox(width: 10),
              Text(
                '$progress/5',
                style: const TextStyle(color: EmarColors.espresso, fontWeight: FontWeight.w800, fontSize: 13),
              ),
            ],
          ),
          const SizedBox(height: 10),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 260),
            transitionBuilder: (child, anim) => FadeTransition(
              opacity: anim,
              child: SizeTransition(sizeFactor: anim, axisAlignment: -1, child: child),
            ),
            child: freeCoffeesEarned > 0
                ? Container(
                    key: const ValueKey('pill'),
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(color: EmarColors.moss, borderRadius: BorderRadius.circular(999)),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.local_cafe, size: 14, color: EmarColors.surface),
                        const SizedBox(width: 6),
                        Text(
                          '$freeCoffeesEarned Bedava İçecek Kullanılabilir',
                          style: const TextStyle(color: EmarColors.surface, fontSize: 11.5, fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                  )
                : Text(
                    key: const ValueKey('remaining'),
                    '$remaining sipariş sonra 1 kahve hediyemiz var ☕',
                    style: TextStyle(color: EmarColors.espresso.withValues(alpha: 0.6), fontSize: 11.5),
                  ),
          ),
        ],
      ),
    );
  }
}
