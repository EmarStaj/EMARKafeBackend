import 'dart:convert';

import 'package:http/http.dart' as http;

import '../data/menu_data.dart';
import '../models/product.dart';

/// Sohbetteki tek bir mesaj (kullanıcı ya da asistan).
class ChatTurn {
  final bool fromUser;
  final String text;
  const ChatTurn({required this.fromUser, required this.text});
}

/// Kafe asistanı servisi.
///
/// Model sağlayıcısına (Gemini) doğrudan bağlanmaz — Supabase Edge Function
/// üzerinden geçer. Böylece model API anahtarı sunucuda kalır, tarayıcıya
/// hiçbir zaman inmez. Uygulamanın bildiği tek sır Supabase anon key'dir;
/// o zaten istemci tarafına açık olacak şekilde tasarlanmıştır.
class AssistantService {
  static const _supabaseUrl = String.fromEnvironment('SUPABASE_URL');
  static const _supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');
  static const _functionName = 'cafe-assistant';

  static bool get isConfigured => _supabaseUrl.isNotEmpty && _supabaseAnonKey.isNotEmpty;

  /// Menüyü Edge Function'ın sistem promptunda kullanacağı kompakt biçime çevirir.
  /// Menü ileride Supabase veritabanına taşınınca bu gönderim kaldırılıp
  /// fonksiyon menüyü doğrudan tablodan okuyabilir.
  static List<Map<String, dynamic>> _menuPayload() {
    return menuProducts
        .map((p) => {
              'name': p.name,
              'kind': p.category == ProductCategory.dessert ? 'tatlı' : 'kahve',
              'price': p.price,
              'rating': p.rating,
            })
        .toList();
  }

  /// [history] önceki tur listesidir (en eskiden en yeniye). Yeni
  /// [userMessage] ile birlikte Edge Function'a gönderilir, asistanın
  /// cevap metnini döner.
  static Future<String> sendMessage({
    required List<ChatTurn> history,
    required String userMessage,
  }) async {
    if (!isConfigured) {
      throw StateError(
        'SUPABASE_URL ve SUPABASE_ANON_KEY tanımlı değil. Uygulamayı --dart-define ile çalıştır.',
      );
    }

    final turns = [
      ...history.map((t) => {
            'role': t.fromUser ? 'user' : 'model',
            'text': t.text,
          }),
      {'role': 'user', 'text': userMessage},
    ];

    final http.Response response;
    try {
      response = await http.post(
        Uri.parse('$_supabaseUrl/functions/v1/$_functionName'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_supabaseAnonKey',
          'apikey': _supabaseAnonKey,
        },
        body: jsonEncode({'turns': turns, 'menu': _menuPayload()}),
      );
    } on http.ClientException {
      // Web'de "Failed to fetch" iki durumu birbirinden ayırmaz: fonksiyon
      // deploy edilmemiş olabilir (404'te CORS başlığı dönmediği için tarayıcı
      // cevabı okutmaz) ya da ağ erişimi yok. İkisini de anlatan bir mesaj ver.
      throw StateError(
        'Asistana ulaşılamadı. Muhtemel sebep: "$_functionName" Edge Function '
        'henüz deploy edilmemiş. Terminalde: supabase functions deploy $_functionName',
      );
    }

    Map<String, dynamic> body;
    try {
      body = jsonDecode(utf8.decode(response.bodyBytes)) as Map<String, dynamic>;
    } catch (_) {
      throw StateError('Asistandan beklenmeyen bir cevap geldi (${response.statusCode}).');
    }

    if (response.statusCode == 404) {
      throw StateError(
        '"$_functionName" Edge Function bulunamadı. '
        'Terminalde: supabase functions deploy $_functionName',
      );
    }

    if (response.statusCode != 200) {
      throw StateError(body['error'] as String? ?? 'Asistana ulaşılamadı (${response.statusCode}).');
    }

    return (body['reply'] as String?)?.trim() ?? 'Bir cevap alamadım, tekrar dener misin?';
  }
}
