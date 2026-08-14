import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../data/campaigns_data.dart' show Campaign;
import '../../data/menu_data.dart';
import '../../models/product.dart';
import '../../state/app_state.dart';
import '../../theme.dart';
import '../../utils/page_transitions.dart';
import '../../widgets/active_order_banner.dart';
import '../../widgets/branch_picker.dart';
import '../../widgets/campaign_detail_sheet.dart';
import '../../widgets/loyalty_card.dart';
import '../../widgets/product_card.dart';
import '../../widgets/product_detail_sheet.dart';
import '../login_screen.dart';

class HomeTab extends StatefulWidget {
  final VoidCallback onProfileTap;
  const HomeTab({super.key, required this.onProfileTap});

  @override
  State<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<HomeTab> {
  ProductCategory? _filter;
  final _promoController = PageController();
  int _promoPage = 0;

  @override
  void dispose() {
    _promoController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();

    return Column(
      children: [
        _DarkHeader(loggedIn: app.loggedIn, userName: app.userName, onProfileTap: widget.onProfileTap),
        _BranchBar(branch: app.currentBranch?.name ?? '', onTap: () => showBranchPicker(context)),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 110),
            children: [
              SizedBox(
                height: 128,
                child: PageView.builder(
                  controller: _promoController,
                  itemCount: app.campaignList.length,
                  onPageChanged: (i) => setState(() => _promoPage = i),
                  itemBuilder: (context, i) => Padding(
                    padding: const EdgeInsets.only(right: 4),
                    child: _PromoCard(campaign: app.campaignList[i]),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(app.campaignList.length, (i) {
                  final active = i == _promoPage;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 220),
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    width: active ? 16 : 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: active ? EmarColors.paprika : EmarColors.oatDark,
                      borderRadius: BorderRadius.circular(999),
                    ),
                  );
                }),
              ),
              if (app.activeOrder != null && !app.activeOrder!.pickedUp) ...[
                const SizedBox(height: 18),
                _Entrance(child: ActiveOrderBanner(order: app.activeOrder!)),
              ],
              const SizedBox(height: 18),
              _Entrance(
                delay: const Duration(milliseconds: 40),
                child: app.loggedIn
                    ? LoyaltyCard(progress: app.loyaltyProgress, freeCoffeesEarned: app.freeCoffeesEarned)
                    : _GuestLoyaltyBanner(
                        onTap: () => Navigator.of(context).push(softRoute(const LoginScreen())),
                      ),
              ),
              const SizedBox(height: 20),
              _Entrance(
                delay: const Duration(milliseconds: 80),
                child: SizedBox(
                  height: 36,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      _CatChip(icon: '⭐', label: 'Öne Çıkanlar', selected: _filter == null, onTap: () => setState(() => _filter = null)),
                      _CatChip(
                        icon: '☕',
                        label: ProductCategory.hotCoffee.label,
                        selected: _filter == ProductCategory.hotCoffee,
                        onTap: () => setState(() => _filter = ProductCategory.hotCoffee),
                      ),
                      _CatChip(
                        icon: '🧊',
                        label: ProductCategory.icedCoffee.label,
                        selected: _filter == ProductCategory.icedCoffee,
                        onTap: () => setState(() => _filter = ProductCategory.icedCoffee),
                      ),
                      _CatChip(
                        icon: '🍰',
                        label: ProductCategory.dessert.label,
                        selected: _filter == ProductCategory.dessert,
                        onTap: () => setState(() => _filter = ProductCategory.dessert),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 18),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 280),
                switchInCurve: Curves.easeOutCubic,
                switchOutCurve: Curves.easeInCubic,
                transitionBuilder: (child, anim) => FadeTransition(
                  opacity: anim,
                  child: SlideTransition(
                    position: Tween<Offset>(begin: const Offset(0, 0.03), end: Offset.zero).animate(anim),
                    child: child,
                  ),
                ),
                child: Column(
                  key: ValueKey(_filter),
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: _filter == null
                      ? [
                          _ProductRow(title: 'Öne Çıkanlar', category: ProductCategory.hotCoffee),
                          const SizedBox(height: 22),
                          _ProductRow(title: 'Soğuk Kahveler', category: ProductCategory.icedCoffee),
                          const SizedBox(height: 22),
                          _ProductRow(title: 'Tatlılar', category: ProductCategory.dessert),
                        ]
                      : [_ProductRow(title: _filter!.label, category: _filter!, wrap: true)],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _DarkHeader extends StatelessWidget {
  final bool loggedIn;
  final String userName;
  final VoidCallback onProfileTap;
  const _DarkHeader({required this.loggedIn, required this.userName, required this.onProfileTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: EmarColors.espresso,
      padding: EdgeInsets.fromLTRB(16, MediaQuery.of(context).padding.top + 10, 16, 14),
      child: Row(
        children: [
          const Icon(Icons.notifications_none_rounded, color: EmarColors.surface, size: 22),
          const Spacer(),
          Text(
            'EMAR Kafe',
            style: const TextStyle(
              fontFamily: 'Georgia',
              color: EmarColors.surface,
              fontSize: 19,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.3,
            ),
          ),
          const Spacer(),
          InkWell(
            borderRadius: BorderRadius.circular(999),
            onTap: onProfileTap,
            child: CircleAvatar(
              radius: 15,
              backgroundColor: EmarColors.surface.withValues(alpha: 0.14),
              child: loggedIn
                  ? Text(
                      userName.isNotEmpty ? userName[0].toUpperCase() : '?',
                      style: const TextStyle(color: EmarColors.surface, fontWeight: FontWeight.w700, fontSize: 12.5),
                    )
                  : const Icon(Icons.person_outline, color: EmarColors.surface, size: 17),
            ),
          ),
        ],
      ),
    );
  }
}

class _BranchBar extends StatelessWidget {
  final String branch;
  final VoidCallback onTap;
  const _BranchBar({required this.branch, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        color: EmarColors.moss,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Row(
          children: [
            const Icon(Icons.storefront_outlined, color: EmarColors.surface, size: 16),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                branch,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: EmarColors.surface, fontWeight: FontWeight.w700, fontSize: 12.5),
              ),
            ),
            const Icon(Icons.keyboard_arrow_down_rounded, color: EmarColors.surface, size: 18),
          ],
        ),
      ),
    );
  }
}

class _PromoCard extends StatelessWidget {
  final Campaign campaign;
  const _PromoCard({required this.campaign});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: () => showCampaignDetail(context, campaign),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: campaign.colors),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(color: EmarColors.surface.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(999)),
                    child: Text(campaign.badge, style: const TextStyle(color: EmarColors.surface, fontSize: 9.5, fontWeight: FontWeight.w800, letterSpacing: 0.4)),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    campaign.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: EmarColors.surface, fontWeight: FontWeight.w800, fontSize: 15.5, height: 1.15),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    campaign.subtitle,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: EmarColors.surface.withValues(alpha: 0.9), fontSize: 10.5),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Text(campaign.icon, style: const TextStyle(fontSize: 40)),
          ],
        ),
      ),
    );
  }
}

class _Entrance extends StatelessWidget {
  final Widget child;
  final Duration delay;
  const _Entrance({required this.child, this.delay = Duration.zero});

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: const Duration(milliseconds: 380) + delay,
      curve: Curves.easeOutCubic,
      builder: (context, t, child) {
        return Opacity(
          opacity: t,
          child: Transform.translate(offset: Offset(0, (1 - t) * 12), child: child),
        );
      },
      child: child,
    );
  }
}

class _GuestLoyaltyBanner extends StatelessWidget {
  final VoidCallback onTap;
  const _GuestLoyaltyBanner({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [EmarColors.moss, EmarColors.paprika],
          ),
        ),
        child: Row(
          children: [
            const Icon(Icons.local_cafe, color: EmarColors.surface),
            const SizedBox(width: 12),
            const Expanded(
              child: Text(
                'Kahve biriktirmeye başlamak için giriş yap',
                style: TextStyle(color: EmarColors.surface, fontWeight: FontWeight.w700, fontSize: 12.5),
              ),
            ),
            const Icon(Icons.arrow_forward_rounded, color: EmarColors.surface, size: 18),
          ],
        ),
      ),
    );
  }
}

class _CatChip extends StatelessWidget {
  final String icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _CatChip({required this.icon, required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        avatar: selected ? null : Text(icon, style: const TextStyle(fontSize: 13)),
        label: Text(label),
        selected: selected,
        onSelected: (_) => onTap(),
        selectedColor: EmarColors.espresso,
        labelStyle: TextStyle(
          color: selected ? EmarColors.oat : EmarColors.espresso,
          fontWeight: FontWeight.w700,
          fontSize: 12.5,
        ),
      ),
    );
  }
}

class _ProductRow extends StatelessWidget {
  final String title;
  final ProductCategory category;
  final bool wrap;
  const _ProductRow({required this.title, required this.category, this.wrap = false});

  @override
  Widget build(BuildContext context) {
    final products = menuProducts.where((p) => p.category == category).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
        const SizedBox(height: 10),
        if (wrap)
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: products
                .map((p) => ProductCard(product: p, onTap: () => showProductDetail(context, p)))
                .toList(),
          )
        else
          SizedBox(
            height: 158,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              itemCount: products.length,
              separatorBuilder: (_, _) => const SizedBox(width: 10),
              itemBuilder: (context, i) {
                final p = products[i];
                return ProductCard(product: p, onTap: () => showProductDetail(context, p));
              },
            ),
          ),
      ],
    );
  }
}
