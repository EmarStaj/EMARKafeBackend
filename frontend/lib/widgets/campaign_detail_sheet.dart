import 'package:flutter/material.dart';

import '../data/campaigns_data.dart';
import '../theme.dart';
import 'pressable_scale.dart';

Future<void> showCampaignDetail(BuildContext context, Campaign campaign) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    barrierColor: Colors.black.withValues(alpha: 0.55),
    builder: (_) => _CampaignDetailSheet(campaign: campaign),
  );
}

class _CampaignDetailSheet extends StatelessWidget {
  final Campaign campaign;
  const _CampaignDetailSheet({required this.campaign});

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.58,
      minChildSize: 0.35,
      maxChildSize: 0.85,
      expand: false,
      builder: (context, scrollCtrl) {
        return Container(
          decoration: const BoxDecoration(
            color: EmarColors.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: ListView(
            controller: scrollCtrl,
            padding: EdgeInsets.zero,
            children: [
              Container(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
                decoration: BoxDecoration(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                  gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: campaign.colors),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 36,
                        height: 4,
                        decoration: BoxDecoration(color: EmarColors.surface.withValues(alpha: 0.4), borderRadius: BorderRadius.circular(3)),
                      ),
                    ),
                    const SizedBox(height: 18),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(color: EmarColors.surface.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(999)),
                                child: Text(campaign.badge, style: const TextStyle(color: EmarColors.surface, fontSize: 9.5, fontWeight: FontWeight.w800, letterSpacing: 0.4)),
                              ),
                              const SizedBox(height: 10),
                              Text(
                                campaign.title,
                                style: const TextStyle(color: EmarColors.surface, fontWeight: FontWeight.w800, fontSize: 19, height: 1.2),
                              ),
                            ],
                          ),
                        ),
                        Text(campaign.icon, style: const TextStyle(fontSize: 40)),
                      ],
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Kampanya Detayı',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.4, color: EmarColors.espresso.withValues(alpha: 0.55)),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      campaign.details,
                      style: const TextStyle(fontSize: 13.5, height: 1.55, color: EmarColors.espresso),
                    ),
                    const SizedBox(height: 24),
                    PressableScale(
                      child: SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () {
                            Navigator.of(context).pop();
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('"${campaign.title}" menüde otomatik uygulanır ☕')),
                            );
                          },
                          child: const Text('Anladım'),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
