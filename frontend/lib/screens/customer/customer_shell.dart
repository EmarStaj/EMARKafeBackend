import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../state/app_state.dart';
import '../../theme.dart';
import '../../utils/page_transitions.dart';
import '../../widgets/pressable_scale.dart';
import 'campaigns_tab.dart';
import 'cart_tab.dart';
import 'chat_assistant_screen.dart';
import 'home_tab.dart';
import 'profile_tab.dart';

class CustomerShell extends StatefulWidget {
  const CustomerShell({super.key});

  @override
  State<CustomerShell> createState() => _CustomerShellState();
}

class _CustomerShellState extends State<CustomerShell> {
  int _index = 0;

  void _goTo(int i) => setState(() => _index = i);

  @override
  Widget build(BuildContext context) {
    final cartCount = context.watch<AppState>().cartCount;

    return Scaffold(
      extendBody: true,
      backgroundColor: EmarColors.oat,
      body: IndexedStack(
        index: _index,
        children: [
          HomeTab(onProfileTap: () => _goTo(3)),
          const CartTab(),
          const CampaignsTab(),
          const ProfileTab(),
        ],
      ),
      bottomNavigationBar: _DarkNavBar(index: _index, cartCount: cartCount, onChanged: _goTo),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(bottom: 78),
        child: PressableScale(
          child: FloatingActionButton(
            backgroundColor: EmarColors.paprika,
            onPressed: () => Navigator.of(context).push(softRoute(const ChatAssistantScreen())),
            child: const Text('☕', style: TextStyle(fontSize: 22)),
          ),
        ),
      ),
    );
  }
}

class _DarkNavBar extends StatelessWidget {
  final int index;
  final int cartCount;
  final ValueChanged<int> onChanged;
  const _DarkNavBar({required this.index, required this.cartCount, required this.onChanged});

  static const _items = [
    (icon: Icons.home_outlined, active: Icons.home_rounded, label: 'Anasayfa'),
    (icon: Icons.shopping_bag_outlined, active: Icons.shopping_bag, label: 'Sepetim'),
    (icon: Icons.card_giftcard_outlined, active: Icons.card_giftcard, label: 'Kampanyalar'),
    (icon: Icons.person_outline, active: Icons.person, label: 'Hesabım'),
  ];

  @override
  Widget build(BuildContext context) {
    return Material(
      color: EmarColors.espresso,
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 62,
          child: Row(
            children: List.generate(_items.length, (i) {
              final item = _items[i];
              final selected = i == index;
              final color = selected ? EmarColors.moss : EmarColors.surface.withValues(alpha: 0.55);
              return Expanded(
                child: InkWell(
                  onTap: () => onChanged(i),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Stack(
                        clipBehavior: Clip.none,
                        children: [
                          AnimatedSwitcher(
                            duration: const Duration(milliseconds: 200),
                            transitionBuilder: (child, anim) => ScaleTransition(scale: anim, child: child),
                            child: Icon(
                              selected ? item.active : item.icon,
                              key: ValueKey(selected),
                              color: color,
                              size: 22,
                            ),
                          ),
                          if (i == 1 && cartCount > 0)
                            Positioned(
                              right: -8,
                              top: -4,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                decoration: BoxDecoration(color: EmarColors.moss, borderRadius: BorderRadius.circular(999)),
                                child: Text(
                                  '$cartCount',
                                  style: const TextStyle(color: EmarColors.surface, fontSize: 9, fontWeight: FontWeight.w700),
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      AnimatedDefaultTextStyle(
                        duration: const Duration(milliseconds: 200),
                        style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w700, color: color),
                        child: Text(item.label),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}
