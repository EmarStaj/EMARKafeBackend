import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../data/menu_data.dart';
import '../../state/app_state.dart';
import '../../theme.dart';
import '../../utils/page_transitions.dart';
import '../../utils/turkish_date.dart';
import '../../widgets/loyalty_card.dart';
import '../../widgets/pressable_scale.dart';
import '../login_screen.dart';
import 'order_history_screen.dart';
import 'wallet_screen.dart';

class ProfileTab extends StatelessWidget {
  const ProfileTab({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    if (!app.loggedIn) return const _GuestProfile();

    final rated = app.ratings.entries.toList();

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 110),
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: EmarColors.moss,
                child: Text(
                  app.userName.isNotEmpty ? app.userName[0].toUpperCase() : '?',
                  style: const TextStyle(fontFamily: 'Georgia', fontSize: 22, color: EmarColors.surface),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(app.userName, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 17)),
                    Text(app.userEmail, style: TextStyle(fontSize: 12, color: EmarColors.espresso.withValues(alpha: 0.55))),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          _ProfileLine(
            label: '🎂 Doğum Tarihi',
            value: app.birthday == null ? '—' : formatTurkishDate(app.birthday!),
          ),
          _ProfileLine(label: '📍 Şube', value: app.currentBranch?.name ?? ''),
          _ProfileLine(label: 'Rol', value: app.role.label),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _StatBox(n: '${app.orderHistory.length}', l: 'Toplam Sipariş')),
              const SizedBox(width: 10),
              Expanded(child: _StatBox(n: '${app.freeCoffeesEarned}', l: 'Hediye Kahve')),
            ],
          ),
          const SizedBox(height: 16),
          InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: () => Navigator.of(context).push(softRoute(const WalletScreen())),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(color: EmarColors.oatDark, borderRadius: BorderRadius.circular(12)),
              child: Row(
                children: [
                  const Icon(Icons.account_balance_wallet_outlined, size: 18, color: EmarColors.espresso),
                  const SizedBox(width: 10),
                  const Expanded(child: Text('Cüzdanım', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13))),
                  Text('${app.walletBalance.toStringAsFixed(2)}₺', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: EmarColors.paprika)),
                  const SizedBox(width: 4),
                  const Icon(Icons.chevron_right, size: 18, color: EmarColors.espresso),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: () => Navigator.of(context).push(softRoute(const OrderHistoryScreen())),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(color: EmarColors.oatDark, borderRadius: BorderRadius.circular(12)),
              child: Row(
                children: [
                  const Icon(Icons.receipt_long_outlined, size: 18, color: EmarColors.espresso),
                  const SizedBox(width: 10),
                  const Expanded(child: Text('Geçmiş Siparişlerim', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13))),
                  Text('${app.orderHistory.length}', style: TextStyle(fontSize: 12, color: EmarColors.espresso.withValues(alpha: 0.55))),
                  const SizedBox(width: 4),
                  const Icon(Icons.chevron_right, size: 18, color: EmarColors.espresso),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          LoyaltyCard(progress: app.loyaltyProgress, freeCoffeesEarned: app.freeCoffeesEarned),
          const SizedBox(height: 20),
          Text('Puanladığın Ürünler', style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 6),
          if (rated.isEmpty)
            Text('Henüz puanlama yapmadın.', style: TextStyle(fontSize: 12.5, color: EmarColors.espresso.withValues(alpha: 0.55)))
          else
            ...rated.map((e) {
              final product = productById(e.key);
              final stars = e.value.round();
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Row(
                  children: [
                    Text(product.icon, style: const TextStyle(fontSize: 16)),
                    const SizedBox(width: 10),
                    Expanded(child: Text(product.name, style: const TextStyle(fontSize: 13))),
                    Text('★' * stars, style: const TextStyle(color: EmarColors.gold, fontWeight: FontWeight.w700)),
                  ],
                ),
              );
            }),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () => context.read<AppState>().logout(),
              child: const Text('Çıkış Yap'),
            ),
          ),
        ],
      ),
    );
  }
}

class _GuestProfile extends StatelessWidget {
  const _GuestProfile();

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(28, 0, 28, 110),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: 1),
              duration: const Duration(milliseconds: 420),
              curve: Curves.easeOutBack,
              builder: (context, t, child) => Transform.scale(scale: t, child: child),
              child: Container(
                width: 84,
                height: 84,
                decoration: const BoxDecoration(color: EmarColors.oatDark, shape: BoxShape.circle),
                child: const Icon(Icons.person_outline, size: 40, color: EmarColors.espresso),
              ),
            ),
            const SizedBox(height: 20),
            Text('Henüz giriş yapmadın', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 18)),
            const SizedBox(height: 8),
            Text(
              'Sipariş verebilmek, kahve puanlarını takip edebilmek ve ödül kazanmak için hesabına giriş yap.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: EmarColors.espresso.withValues(alpha: 0.6), height: 1.5),
            ),
            const SizedBox(height: 24),
            PressableScale(
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.of(context).push(softRoute(const LoginScreen())),
                  child: const Text('Giriş Yap / Kayıt Ol'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileLine extends StatelessWidget {
  final String label;
  final String value;
  const _ProfileLine({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 9),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 12.5, color: EmarColors.espresso.withValues(alpha: 0.6))),
          Text(value, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

class _StatBox extends StatelessWidget {
  final String n;
  final String l;
  const _StatBox({required this.n, required this.l});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(color: EmarColors.oatDark, borderRadius: BorderRadius.circular(12)),
      child: Column(
        children: [
          Text(n, style: const TextStyle(fontFamily: 'Georgia', fontSize: 20, fontWeight: FontWeight.w700)),
          Text(l, style: TextStyle(fontSize: 10.5, color: EmarColors.espresso.withValues(alpha: 0.6))),
        ],
      ),
    );
  }
}
