import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../data/menu_data.dart';
import '../../models/product.dart';
import '../../services/api_service.dart';
import '../../state/app_state.dart';
import '../../theme.dart';
import '../../utils/page_transitions.dart';
import '../../widgets/pressable_scale.dart';
import '../login_screen.dart';
import 'qr_display_screen.dart';
import 'wallet_screen.dart';

class CartTab extends StatelessWidget {
  const CartTab({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final entries = app.cart.entries.toList()
      ..sort((a, b) => productById(a.key).name.compareTo(productById(b.key).name));
    final now = DateTime.now();
    final prep = app.prepMinutesFor(app.cart, now);
    final beforeSix = now.hour < 18;
    final coffeeQty = entries.where((e) => productById(e.key).isCoffee).fold(0, (s, e) => s + e.value);
    final dessertQty = entries
        .where((e) => productById(e.key).category == ProductCategory.dessert)
        .fold(0, (s, e) => s + e.value);

    return SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 14, 16, 6),
            child: Text('Sepetim', style: TextStyle(fontFamily: 'Georgia', fontSize: 24, fontWeight: FontWeight.w700, color: EmarColors.espresso)),
          ),
          if (entries.isEmpty)
            const Expanded(
              child: Center(
                child: Text('Sepetin boş — menüden bir şeyler seç ☕', style: TextStyle(color: EmarColors.espresso)),
              ),
            )
          else ...[
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
                itemCount: entries.length,
                separatorBuilder: (_, _) => const Divider(height: 1),
                itemBuilder: (context, i) {
                  final product = productById(entries[i].key);
                  final qty = entries[i].value;
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    child: Row(
                      children: [
                        Text(product.icon, style: const TextStyle(fontSize: 22)),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(product.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5)),
                        ),
                        IconButton(
                          icon: const Icon(Icons.remove_circle_outline, size: 20),
                          onPressed: () => context.read<AppState>().changeQty(product.id, -1),
                        ),
                        Text('$qty', style: const TextStyle(fontWeight: FontWeight.w700)),
                        IconButton(
                          icon: const Icon(Icons.add_circle_outline, size: 20),
                          onPressed: () => context.read<AppState>().changeQty(product.id, 1),
                        ),
                        SizedBox(
                          width: 56,
                          child: Text(
                            '${(product.price * qty).toStringAsFixed(0)}₺',
                            textAlign: TextAlign.right,
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 108),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: EmarColors.oatDark, borderRadius: BorderRadius.circular(12)),
                    child: Row(
                      children: [
                        const Text('⏱', style: TextStyle(fontSize: 20)),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('$prep dk', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                              const Text('tahmini hazırlanma süresi', style: TextStyle(fontSize: 10.5, color: EmarColors.espresso)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                    decoration: BoxDecoration(color: EmarColors.oatDark, borderRadius: BorderRadius.circular(10)),
                    child: Text(
                      'Sipariş saatin ${TimeOfDay.fromDateTime(now).format(context)} — '
                      "${beforeSix ? '18:00’den önce' : '18:00’den sonra'} olduğu için temel süre "
                      '${beforeSix ? "kahve 2 dk, tatlı 3 dk, ikisi birlikte 4 dk" : "kahve 3 dk, tatlı 5 dk, ikisi birlikte 6 dk"}. '
                      '${coffeeQty + dessertQty > 2 ? "Sepetinde $coffeeQty kahve, $dessertQty tatlı var; her fazladan 2 üründe barista için +1 dk ekleniyor." : ""}',
                      style: const TextStyle(fontSize: 10.5, color: EmarColors.espresso),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Cüzdan Bakiyesi', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: EmarColors.moss)),
                      Row(
                        children: [
                          Text('${app.walletBalance.toStringAsFixed(2)}₺', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: EmarColors.moss)),
                          const SizedBox(width: 8),
                          GestureDetector(
                            onTap: () => Navigator.of(context).push(softRoute(const WalletScreen())),
                            child: const Icon(Icons.account_balance_wallet, color: EmarColors.moss, size: 20),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Toplam', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                      Text('${app.cartTotal.toStringAsFixed(2)}₺', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17, color: EmarColors.paprika)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  PressableScale(
                    child: SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: EmarColors.espresso),
                        onPressed: app.isUpdatingCart ? null : () async {
                          if (!app.loggedIn) {
                            Navigator.of(context).push(softRoute(const LoginScreen()));
                            return;
                          }
                          if (app.walletBalance < app.cartTotal) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: const Text('Bakiyeniz yetersiz. Lütfen cüzdanınıza bakiye yükleyin.'),
                                action: SnackBarAction(
                                  label: 'Yükle',
                                  onPressed: () => Navigator.of(context).push(softRoute(const WalletScreen())),
                                ),
                              )
                            );
                            return;
                          }
                          try {
                            final token = await context.read<AppState>().generateWalletToken();
                            if (token != null && token.isNotEmpty && context.mounted) {
                              Navigator.of(context).push(softRoute(QRDisplayScreen(qrToken: token)));
                            }
                          } catch (e) {
                            if (context.mounted) {
                              if (e is ApiException && e.errors != null && e.errors!.isNotEmpty) {
                                String msg = 'Aşağıdaki ürünler seçtiğiniz şubede temin edilemiyor. Lütfen sepetinizden çıkartın veya şubenizi değiştirin:\n';
                                for (var err in e.errors!) {
                                  msg += '\n- ${err['message']}';
                                }
                                showDialog(
                                  context: context,
                                  builder: (c) => AlertDialog(
                                    title: const Text('Stok Uyarısı'),
                                    content: Text(msg),
                                    actions: [
                                      TextButton(onPressed: () => Navigator.pop(c), child: const Text('Tamam'))
                                    ],
                                  )
                                );
                              } else {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('Hata: ${e.toString().replaceAll('Exception: ', '')}')),
                                );
                              }
                            }
                          }
                        },
                        child: Text(
                          app.isUpdatingCart 
                            ? 'Güncelleniyor...' 
                            : (app.loggedIn ? 'Cüzdan İle Öde ve Onayla' : 'Sipariş İçin Giriş Yap')
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
