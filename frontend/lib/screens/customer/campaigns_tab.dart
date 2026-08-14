import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../state/app_state.dart';
import '../../theme.dart';
import '../../widgets/campaign_detail_sheet.dart';

class CampaignsTab extends StatefulWidget {
  const CampaignsTab({super.key});

  @override
  State<CampaignsTab> createState() => _CampaignsTabState();
}

class _CampaignsTabState extends State<CampaignsTab> {
  final _codeCtrl = TextEditingController();

  @override
  void dispose() {
    _codeCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final campaigns = context.watch<AppState>().campaignList;
    return Column(
      children: [
        Container(
          width: double.infinity,
          color: EmarColors.espresso,
          padding: EdgeInsets.fromLTRB(20, MediaQuery.of(context).padding.top + 14, 20, 18),
          child: const Text(
            'Kampanyalar',
            style: TextStyle(color: EmarColors.surface, fontFamily: 'Georgia', fontSize: 20, fontWeight: FontWeight.w700),
          ),
        ),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 110),
            children: [
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _codeCtrl,
                      decoration: const InputDecoration(hintText: 'Promosyon Kodu Girin'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: EmarColors.moss, padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16)),
                    onPressed: () {
                      if (_codeCtrl.text.trim().isEmpty) return;
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('"${_codeCtrl.text.trim()}" kodu kontrol ediliyor...')),
                      );
                    },
                    child: const Text('Kaydet'),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Text(
                'Devam Eden Kampanyalar (${campaigns.length})',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 12),
              ...campaigns.map((c) => Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(18),
                      onTap: () => showCampaignDetail(context, c),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: double.infinity,
                            height: 108,
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(18),
                              gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: c.colors),
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
                                        child: Text(c.badge, style: const TextStyle(color: EmarColors.surface, fontSize: 9.5, fontWeight: FontWeight.w800)),
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        c.title,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(color: EmarColors.surface, fontWeight: FontWeight.w800, fontSize: 15),
                                      ),
                                    ],
                                  ),
                                ),
                                Text(c.icon, style: const TextStyle(fontSize: 34)),
                              ],
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  c.subtitle,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12.5, color: EmarColors.espresso.withValues(alpha: 0.75)),
                                ),
                              ),
                              const SizedBox(width: 6),
                              const Icon(Icons.chevron_right, size: 18, color: EmarColors.espresso),
                            ],
                          ),
                        ],
                      ),
                    ),
                  )),
            ],
          ),
        ),
      ],
    );
  }
}
