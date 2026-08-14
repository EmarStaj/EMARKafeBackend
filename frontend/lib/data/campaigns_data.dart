import '../models/campaign.dart';
import '../theme.dart';

export '../models/campaign.dart' show Campaign;

/// Supabase yapılandırılmadığında ya da yükleme başarısız olduğunda kullanılan
/// yerel yedek kampanyalar. Canlı liste için `Catalog.instance.campaigns`.
const List<Campaign> campaigns = [
  Campaign(
    title: '5 Siparişte 1 Kahve Hediye!',
    subtitle: 'Her 5. siparişinde dilediğin kahve bizden.',
    details:
        'Sadakat programına otomatik dahilsin. Verdiğin her sipariş sayaca eklenir; '
        '5. siparişini tamamladığında dilediğin kahveyi ücretsiz alırsın. Birikimini '
        'ana sayfadaki ödül kartından ve profilinden takip edebilirsin.',
    badge: 'SADAKAT',
    icon: '☕',
    colors: [EmarColors.paprika, EmarColors.paprikaDim],
  ),
  Campaign(
    title: 'İlk Siparişine Özel %20 İndirim',
    subtitle: 'EMAR Kafe\'ye ilk siparişinde geçerli.',
    details:
        'Aramıza yeni katılanlara özel: hesabını oluşturduktan sonra vereceğin ilk '
        'siparişte sepet toplamının tamamına %20 indirim uygulanır. Kampanya '
        'otomatik tanınır, promosyon kodu girmene gerek yok.',
    badge: 'YENİ ÜYE',
    icon: '🎉',
    colors: [EmarColors.moss, EmarColors.espresso],
  ),
  Campaign(
    title: 'Öğleden Sonra Molası',
    subtitle: '14:00-17:00 arası tatlı + kahve alımlarında %15 indirim.',
    details:
        'Hafta içi her gün 14:00-17:00 arasında sepetinde en az bir kahve ve bir '
        'tatlı olduğunda toplam tutara %15 indirim uygulanır. Ofis molası için '
        'biçilmiş kaftan.',
    badge: 'GÜNLÜK',
    icon: '🍰',
    colors: [EmarColors.gold, EmarColors.moss],
  ),
  Campaign(
    title: 'Hafta Sonu Çiftler Kampanyası',
    subtitle: 'Cumartesi ve Pazar 2. içecekte %50 indirim.',
    details:
        'Cumartesi ve Pazar günleri sepetine ikinci bir içecek eklediğinde, '
        'sepetteki en düşük fiyatlı içeceğe %50 indirim yansır. Arkadaşınla ya da '
        'sevgilinle paylaşmak için ideal.',
    badge: 'HAFTA SONU',
    icon: '🥤',
    colors: [EmarColors.espresso, EmarColors.roast],
  ),
];
