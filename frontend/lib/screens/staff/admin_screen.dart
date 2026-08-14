import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../data/campaigns_data.dart';
import '../../data/menu_data.dart';
import '../../models/product.dart';
import '../../state/app_state.dart';
import '../../theme.dart';
import '../../models/branch.dart';

int _orderCountFor(Branch branch) => 20 + (branch.id.hashCode.abs() % 80);

class _MockCustomer {
  final String name;
  final String email;
  final int orders;
  bool suspended;
  _MockCustomer({required this.name, required this.email, required this.orders, this.suspended = false});
}

class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  final List<_MockCustomer> _customers = [
    _MockCustomer(name: 'Bora Gök', email: 'boragok356@gmail.com', orders: 27),
    _MockCustomer(name: 'Ayşe Yıldız', email: 'ayse.yildiz@mail.com', orders: 14),
    _MockCustomer(name: 'Mert Aydın', email: 'mert.aydin@mail.com', orders: 41),
    _MockCustomer(name: 'Sude Kaya', email: 'sude.kaya@mail.com', orders: 6),
    _MockCustomer(name: 'Can Turan', email: 'can.turan@mail.com', orders: 19, suspended: true),
  ];

  final _newBranchCtrl = TextEditingController();
  String _orderBranchFilter = 'Tümü';

  static const _campaignColorPool = [
    [EmarColors.paprika, EmarColors.paprikaDim],
    [EmarColors.moss, EmarColors.espresso],
    [EmarColors.gold, EmarColors.moss],
    [EmarColors.espresso, EmarColors.roast],
  ];
  int _colorPoolIndex = 0;

  @override
  void dispose() {
    _newBranchCtrl.dispose();
    super.dispose();
  }

  void _addBranch(AppState app) {
    final name = _newBranchCtrl.text.trim();
    if (name.isEmpty) return;
    // app.addBranch(name);
    _newBranchCtrl.clear();
    setState(() {});
  }

  Future<void> _openAddCampaignDialog(AppState app) async {
    final titleCtrl = TextEditingController();
    final subtitleCtrl = TextEditingController();
    final detailsCtrl = TextEditingController();
    final badgeCtrl = TextEditingController(text: 'YENİ');
    String? error;
    await showDialog<void>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (dialogContext, setDialogState) => AlertDialog(
          title: const Text('Yeni Kampanya'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: 'Başlık')),
                const SizedBox(height: 10),
                TextField(controller: subtitleCtrl, decoration: const InputDecoration(labelText: 'Kısa açıklama (kartlarda görünür)')),
                const SizedBox(height: 10),
                TextField(
                  controller: detailsCtrl,
                  maxLines: 3,
                  decoration: const InputDecoration(labelText: 'Detay metni (dokununca açılır — boş bırakılırsa kısa açıklamadan üretilir)'),
                ),
                const SizedBox(height: 10),
                TextField(controller: badgeCtrl, decoration: const InputDecoration(labelText: 'Rozet (ör. YENİ)')),
                if (error != null) ...[
                  const SizedBox(height: 8),
                  Text(error!, style: const TextStyle(color: EmarColors.paprikaDim, fontSize: 12.5, fontWeight: FontWeight.w600)),
                ],
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('Vazgeç')),
            ElevatedButton(
              onPressed: () {
                final title = titleCtrl.text.trim();
                final subtitle = subtitleCtrl.text.trim();
                if (title.isEmpty || subtitle.isEmpty) {
                  setDialogState(() => error = 'Başlık ve kısa açıklama zorunlu.');
                  return;
                }
                final colors = _campaignColorPool[_colorPoolIndex % _campaignColorPool.length];
                _colorPoolIndex++;
                app.addCampaign(Campaign(
                  title: title,
                  subtitle: subtitle,
                  details: detailsCtrl.text.trim().isEmpty ? '$subtitle Detaylar için şubene sorabilirsin.' : detailsCtrl.text.trim(),
                  badge: badgeCtrl.text.trim().isEmpty ? 'YENİ' : badgeCtrl.text.trim().toUpperCase(),
                  icon: '🎁',
                  colors: colors,
                ));
                Navigator.pop(dialogContext);
              },
              child: const Text('Ekle'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final hotCount = menuProducts.where((p) => p.category == ProductCategory.hotCoffee).length;
    final icedCount = menuProducts.where((p) => p.category == ProductCategory.icedCoffee).length;
    final dessertCount = menuProducts.where((p) => p.category == ProductCategory.dessert).length;

    final ranked = List.of(app.branches)..sort((a, b) => _orderCountFor(b).compareTo(_orderCountFor(a)));
    final maxCount = ranked.isEmpty ? 1 : _orderCountFor(ranked.first);
    final totalOrders = app.branches.fold(0, (sum, b) => sum + _orderCountFor(b));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin · Genel Bakış'),
        actions: [IconButton(icon: const Icon(Icons.logout), onPressed: () => context.read<AppState>().logout())],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 1.8,
              children: [
                _StatTile(n: '${app.branches.length}', l: 'Aktif Şube'),
                _StatTile(n: '$totalOrders', l: 'Bugünkü Sipariş'),
                _StatTile(n: '58', l: 'Aktif Personel'),
                _StatTile(n: '${hotCount + icedCount}+$dessertCount', l: 'Kahve + Tatlı'),
              ],
            ),

            const SizedBox(height: 26),
            Text('Şubeler Arası Karşılaştırma', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 17)),
            const SizedBox(height: 4),
            Text(
              'Bugünkü sipariş sayısına göre sıralı',
              style: TextStyle(fontSize: 11.5, color: EmarColors.espresso.withValues(alpha: 0.55)),
            ),
            const SizedBox(height: 12),
            ...List.generate(ranked.length, (i) {
              final branch = ranked[i];
              final count = _orderCountFor(branch);
              final isTop = i == 0;
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  children: [
                    SizedBox(
                      width: 108,
                      child: Row(
                        children: [
                          if (isTop) const Padding(padding: EdgeInsets.only(right: 4), child: Text('🏆', style: TextStyle(fontSize: 12))),
                          Expanded(
                            child: Text(branch.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600)),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: LayoutBuilder(
                        builder: (context, constraints) => Stack(
                          children: [
                            Container(height: 16, decoration: BoxDecoration(color: EmarColors.oatDark, borderRadius: BorderRadius.circular(8))),
                            AnimatedContainer(
                              duration: const Duration(milliseconds: 420),
                              curve: Curves.easeOutCubic,
                              height: 16,
                              width: constraints.maxWidth * (count / maxCount),
                              decoration: BoxDecoration(
                                color: isTop ? EmarColors.paprika : EmarColors.moss,
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    SizedBox(
                      width: 36,
                      child: Text('$count', textAlign: TextAlign.right, style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700)),
                    ),
                  ],
                ),
              );
            }),

            const SizedBox(height: 26),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Şube Siparişleri', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 17)),
                Text('${app.orderHistory.length} sipariş', style: TextStyle(fontSize: 11.5, color: EmarColors.espresso.withValues(alpha: 0.5))),
              ],
            ),
            const SizedBox(height: 10),
            SizedBox(
              height: 34,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: ['Tümü', ...app.branches.map((b) => b.name)].map((b) {
                  final selected = b == _orderBranchFilter;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(b, style: const TextStyle(fontSize: 11.5)),
                      selected: selected,
                      onSelected: (_) => setState(() => _orderBranchFilter = b),
                      selectedColor: EmarColors.espresso,
                      labelStyle: TextStyle(color: selected ? EmarColors.oat : EmarColors.espresso, fontWeight: FontWeight.w700),
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 10),
            Builder(builder: (context) {
              final filtered = app.orderHistory.where((o) => _orderBranchFilter == 'Tümü' || o.branch == _orderBranchFilter).toList();
              if (filtered.isEmpty) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  child: Text(
                    'Bu şubede henüz gerçek sipariş yok (demo oturumunda sadece bu cihazdan verilen siparişler görünür).',
                    style: TextStyle(fontSize: 11.5, color: EmarColors.espresso.withValues(alpha: 0.5)),
                  ),
                );
              }
              return Column(
                children: filtered.map((o) {
                  final ready = o.computedStatus == OrderStatus.ready;
                  final statusLabel = o.pickedUp ? 'Teslim Alındı' : (ready ? 'Hazır' : (o.computedStatus == OrderStatus.preparing ? 'Hazırlanıyor' : 'Alındı'));
                  final statusColor = o.pickedUp ? EmarColors.espresso.withValues(alpha: 0.4) : (ready ? EmarColors.moss : EmarColors.paprika);
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    decoration: BoxDecoration(color: EmarColors.oatDark, borderRadius: BorderRadius.circular(12)),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(o.id, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5)),
                                  const SizedBox(width: 6),
                                  Text('· ${o.customerName}', style: TextStyle(fontSize: 11, color: EmarColors.espresso.withValues(alpha: 0.6))),
                                ],
                              ),
                              Text('${o.branch} · ${o.total.toStringAsFixed(0)}₺', style: TextStyle(fontSize: 10.5, color: EmarColors.espresso.withValues(alpha: 0.55))),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(999)),
                          child: Text(statusLabel, style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.w700)),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              );
            }),

            const SizedBox(height: 26),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Şubeler', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 17)),
                Text('${app.branches.length} şube', style: TextStyle(fontSize: 11.5, color: EmarColors.espresso.withValues(alpha: 0.5))),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _newBranchCtrl,
                    decoration: const InputDecoration(hintText: 'Yeni şube adı (ör. Samsun – İlkadım)'),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  style: IconButton.styleFrom(backgroundColor: EmarColors.espresso),
                  onPressed: () => _addBranch(app),
                  icon: const Icon(Icons.add, color: EmarColors.surface),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ...app.branches.map((b) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    children: [
                      Container(width: 7, height: 7, decoration: const BoxDecoration(color: EmarColors.moss, shape: BoxShape.circle)),
                      const SizedBox(width: 8),
                      Expanded(child: Text(b.name, style: const TextStyle(fontSize: 13))),
                      Text('${_orderCountFor(b)} sipariş', style: TextStyle(fontSize: 12, color: EmarColors.espresso.withValues(alpha: 0.6))),
                      IconButton(
                        icon: const Icon(Icons.close, size: 16),
                        color: EmarColors.espresso.withValues(alpha: 0.4),
                        onPressed: () { /* app.removeBranch(b); */ },
                      ),
                    ],
                  ),
                )),

            const SizedBox(height: 22),
            Text('Menü Yönetimi', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 17)),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                Chip(label: Text('☕ ${hotCount + icedCount} Kahve')),
                Chip(label: Text('🍰 $dessertCount Tatlı')),
                ActionChip(
                  label: const Text('+ Yeni Ürün'),
                  backgroundColor: EmarColors.paprika,
                  labelStyle: const TextStyle(color: EmarColors.surface, fontWeight: FontWeight.w700),
                  onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Menü düzenleme — sıradaki adım')),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 26),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Kampanya Yönetimi', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 17)),
                TextButton.icon(
                  onPressed: () => _openAddCampaignDialog(app),
                  icon: const Icon(Icons.add, size: 16),
                  label: const Text('Yeni Kampanya'),
                ),
              ],
            ),
            const SizedBox(height: 6),
            ...app.campaignList.map((c) => Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(color: EmarColors.oatDark, borderRadius: BorderRadius.circular(12)),
                  child: Row(
                    children: [
                      Text(c.icon, style: const TextStyle(fontSize: 18)),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(c.title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5)),
                            Text(c.subtitle, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 10.5, color: EmarColors.espresso.withValues(alpha: 0.6))),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete_outline, size: 18),
                        color: EmarColors.paprikaDim,
                        onPressed: () => app.removeCampaign(c),
                      ),
                    ],
                  ),
                )),

            const SizedBox(height: 26),
            Text('Müşteri Yönetimi', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 17)),
            const SizedBox(height: 4),
            Text(
              'Hesapları görüntüle, gerekirse askıya al',
              style: TextStyle(fontSize: 11.5, color: EmarColors.espresso.withValues(alpha: 0.55)),
            ),
            const SizedBox(height: 10),
            ...(_customers.map((cust) => Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: cust.suspended ? EmarColors.oatDark.withValues(alpha: 0.5) : EmarColors.oatDark,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 15,
                        backgroundColor: cust.suspended ? EmarColors.espresso.withValues(alpha: 0.25) : EmarColors.moss,
                        child: Text(cust.name[0].toUpperCase(), style: const TextStyle(color: EmarColors.surface, fontSize: 12, fontWeight: FontWeight.w700)),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              cust.name,
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 12.5,
                                color: cust.suspended ? EmarColors.espresso.withValues(alpha: 0.5) : EmarColors.espresso,
                                decoration: cust.suspended ? TextDecoration.lineThrough : null,
                              ),
                            ),
                            Text('${cust.email} · ${cust.orders} sipariş', style: TextStyle(fontSize: 10.5, color: EmarColors.espresso.withValues(alpha: 0.55))),
                          ],
                        ),
                      ),
                      TextButton(
                        onPressed: () => setState(() => cust.suspended = !cust.suspended),
                        style: TextButton.styleFrom(foregroundColor: cust.suspended ? EmarColors.moss : EmarColors.paprikaDim),
                        child: Text(cust.suspended ? 'Aktif Et' : 'Askıya Al', style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700)),
                      ),
                    ],
                  ),
                ))),
          ],
        ),
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  final String n;
  final String l;
  const _StatTile({required this.n, required this.l});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: EmarColors.oatDark, borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(n, style: const TextStyle(fontFamily: 'Georgia', fontSize: 19, fontWeight: FontWeight.w700)),
          Text(l, style: TextStyle(fontSize: 10.5, color: EmarColors.espresso.withValues(alpha: 0.6))),
        ],
      ),
    );
  }
}
