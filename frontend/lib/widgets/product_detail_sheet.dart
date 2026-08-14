import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/menu_data.dart';
import '../models/product.dart';
import '../state/app_state.dart';
import '../theme.dart';
import 'pressable_scale.dart';

Future<void> showProductDetail(BuildContext context, Product product) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    barrierColor: Colors.black.withValues(alpha: 0.55),
    builder: (_) => _ProductDetailSheet(product: product),
  );
}

class _ProductDetailSheet extends StatelessWidget {
  final Product product;
  const _ProductDetailSheet({required this.product});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final pairs = product.pairsWith.map(productById).toList();
    final similar = similarTo(product);
    final myRating = app.ratings[product.id] ?? 0;
    final outOfStock = app.isOutOfStock(product.id);

    return DraggableScrollableSheet(
      initialChildSize: 0.72,
      minChildSize: 0.4,
      maxChildSize: 0.92,
      expand: false,
      builder: (context, scrollCtrl) {
        return Container(
          decoration: const BoxDecoration(
            color: EmarColors.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: ListView(
            controller: scrollCtrl,
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: EmarColors.espresso.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  Hero(
                    tag: 'product-icon-${product.id}',
                    child: Container(
                      width: 64,
                      height: 64,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        gradient: RadialGradient(
                          center: const Alignment(-0.4, -0.4),
                          colors: [EmarColors.gold, EmarColors.roast],
                        ),
                      ),
                      child: Text(product.icon, style: const TextStyle(fontSize: 30)),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(product.name, style: Theme.of(context).textTheme.titleLarge),
                        const SizedBox(height: 2),
                        Text(
                          '${product.category.label} · ${product.ratingCount} puanlama',
                          style: TextStyle(fontSize: 11.5, color: EmarColors.espresso.withValues(alpha: 0.55)),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Text(
                              '${product.price.toStringAsFixed(0)}₺',
                              style: const TextStyle(fontWeight: FontWeight.w800, color: EmarColors.paprika, fontSize: 16),
                            ),
                            if (outOfStock) ...[
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(color: EmarColors.paprikaDim.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(999)),
                                child: const Text('Şu an tükendi', style: TextStyle(color: EmarColors.paprikaDim, fontSize: 10.5, fontWeight: FontWeight.w700)),
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text('Bu ürünü puanla', style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: 6),
              _RatingSection(product: product, myRating: myRating),
              const SizedBox(height: 8),
              _PairRow(title: 'Yanında bunlar iyi gider', products: pairs),
              const SizedBox(height: 16),
              _PairRow(title: 'Bunları da sevebilirsin', products: similar),
              const SizedBox(height: 20),
              PressableScale(
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: outOfStock
                        ? null
                        : () async {
                            final warnings = await context.read<AppState>().addToCart(product.id);
                            if (context.mounted) {
                              Navigator.of(context).pop();
                              if (warnings.isNotEmpty) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('Dikkat: ${warnings.first}'), backgroundColor: EmarColors.paprika, duration: const Duration(seconds: 4)),
                                );
                              } else {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('${product.name} sepete eklendi')),
                                );
                              }
                            }
                          },
                    child: Text(outOfStock ? 'Şu An Tükendi' : 'Sepete Ekle · ${product.price.toStringAsFixed(0)}₺'),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _RatingSection extends StatelessWidget {
  final Product product;
  final double myRating;
  const _RatingSection({required this.product, required this.myRating});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final ordered = app.hasOrderedProduct(product.id);

    if (!ordered) {
      return Text(
        'Bu ürünü değerlendirmek için önce sipariş etmelisin.',
        style: TextStyle(fontSize: 12, color: EmarColors.espresso.withValues(alpha: 0.5)),
      );
    }

    final unlocked = app.canRateProduct(product.id);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: List.generate(5, (i) {
            final filled = i < myRating;
            return IconButton(
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 32),
              onPressed: unlocked ? () => context.read<AppState>().rateProduct(product.id, i + 1) : null,
              icon: Icon(
                filled ? Icons.star_rounded : Icons.star_border_rounded,
                color: unlocked ? EmarColors.gold : EmarColors.espresso.withValues(alpha: 0.25),
                size: 26,
              ),
            );
          }),
        ),
        if (!unlocked)
          Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Text(
              'Değerlendirme, siparişin hazır olmasından 5 dk sonra ya da bir sonraki girişinde açılacak.',
              style: TextStyle(fontSize: 11, color: EmarColors.espresso.withValues(alpha: 0.5)),
            ),
          ),
      ],
    );
  }
}

class _PairRow extends StatelessWidget {
  final String title;
  final List<Product> products;
  const _PairRow({required this.title, required this.products});

  @override
  Widget build(BuildContext context) {
    if (products.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title.toUpperCase(),
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.4,
            color: EmarColors.espresso.withValues(alpha: 0.55),
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 40,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: products.length,
            separatorBuilder: (_, _) => const SizedBox(width: 8),
            itemBuilder: (context, i) {
              final p = products[i];
              final out = context.watch<AppState>().isOutOfStock(p.id);
              return InkWell(
                borderRadius: BorderRadius.circular(20),
                onTap: out
                    ? null
                    : () async {
                        final warnings = await context.read<AppState>().addToCart(p.id);
                        if (context.mounted) {
                          if (warnings.isNotEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Dikkat: ${warnings.first}'), backgroundColor: EmarColors.paprika, duration: const Duration(seconds: 4)));
                          } else {
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${p.name} sepete eklendi')));
                          }
                        }
                      },
                child: Opacity(
                  opacity: out ? 0.45 : 1,
                  child: Container(
                    padding: const EdgeInsets.only(left: 4, right: 12),
                    decoration: BoxDecoration(
                      color: EmarColors.oatDark,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CircleAvatar(
                          radius: 14,
                          backgroundColor: EmarColors.moss,
                          child: Text(p.icon, style: const TextStyle(fontSize: 13)),
                        ),
                        const SizedBox(width: 7),
                        Text(p.name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
