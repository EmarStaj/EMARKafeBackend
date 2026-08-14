import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart';

class ApiException implements Exception {
  final String message;
  final int statusCode;
  final List<dynamic>? errors;
  
  ApiException(this.message, this.statusCode, {this.errors});
  
  @override
  String toString() => 'ApiException: $message';
}

class ApiService {
  static const String baseUrl = 'https://emarkafe.duckdns.org';
  static const String _tokenKey = 'auth_token';

  String? _token;
  String? get token => _token;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString(_tokenKey);
  }

  Future<void> saveToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  Future<void> clearToken() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }

  Map<String, String> get _headers {
    final headers = <String, String>{'Content-Type': 'application/json'};
    if (_token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }
    return headers;
  }

  // --- Auth ---

  Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/auth/login'),
      headers: _headers,
      body: jsonEncode({'email': email, 'password': password}),
    );
    return _processResponse(res);
  }

  Future<Map<String, dynamic>> register(String email, String phone, String password, String name, String birthDate) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/auth/register'),
      headers: _headers,
      body: jsonEncode({
        'email': email,
        'phone': phone,
        'password': password,
        'full_name': name,
        'birth_date': birthDate
      }),
    );
    return _processResponse(res);
  }

  Future<Map<String, dynamic>> getMe() async {
    final res = await http.get(Uri.parse('$baseUrl/api/auth/me'), headers: _headers);
    return _processResponse(res);
  }

  Future<void> logout() async {
    try {
      await http.post(Uri.parse('$baseUrl/api/auth/logout'), headers: _headers);
    } catch (_) {}
    await clearToken();
  }

  // --- Profile ---

  Future<Map<String, dynamic>> getProfile() async {
    final res = await http.get(Uri.parse('$baseUrl/api/profile/me'), headers: _headers);
    return _processResponse(res);
  }

  Future<void> updateProfile({String? fullName, String? phone, String? avatarUrl, String? birthDate, String? branch, String? role}) async {
    final body = <String, dynamic>{};
    if (fullName != null) body['full_name'] = fullName;
    if (phone != null) body['phone'] = phone;
    if (avatarUrl != null) body['avatar_url'] = avatarUrl;
    if (birthDate != null) body['birth_date'] = birthDate;
    if (branch != null) body['branch'] = branch;
    if (role != null) body['role'] = role;
    
    final res = await http.put(
      Uri.parse('$baseUrl/api/profile/me'),
      headers: _headers,
      body: jsonEncode(body),
    );
    _processResponse(res);
  }

  Future<void> setDefaultBranch(String branchId) async {
    final res = await http.put(
      Uri.parse('$baseUrl/api/profile/me/default-branch'),
      headers: _headers,
      body: jsonEncode({'branch_id': branchId}),
    );
    _processResponse(res);
  }

  // --- Wallet ---

  Future<Map<String, dynamic>> getWalletBalance() async {
    final res = await http.get(Uri.parse('$baseUrl/api/wallet/balance'), headers: _headers);
    return _processResponse(res);
  }

  Future<void> topupWallet(double amount) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/wallet/topup'),
      headers: _headers,
      body: jsonEncode({'amount': amount}),
    );
    _processResponse(res);
  }

  Future<String> getWalletQrToken() async {
    final res = await http.get(Uri.parse('$baseUrl/api/wallet/qr'), headers: _headers);
    final data = _processResponse(res);
    return data['qr_token'] as String;
  }

  // --- Cart ---

  Future<Map<String, dynamic>> getCart() async {
    final res = await http.get(Uri.parse('$baseUrl/api/cart'), headers: _headers);
    return _processResponse(res);
  }

  Future<List<String>> addToCart(String productId, int qty) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/cart'),
      headers: _headers,
      body: jsonEncode({'product_id': productId, 'quantity': qty}),
    );
    final data = _processResponse(res);
    
    // Check if warnings exists in the original json body
    if (res.statusCode == 201 || res.statusCode == 200) {
      try {
        final body = jsonDecode(res.body);
        if (body['warnings'] != null) {
          final warnings = body['warnings'] as List<dynamic>;
          return warnings.map((w) => w['message'].toString()).toList();
        }
      } catch (_) {}
    }
    return [];
  }

  Future<void> updateCartItem(String cartItemId, int qty) async {
    final res = await http.put(
      Uri.parse('$baseUrl/api/cart/$cartItemId'),
      headers: _headers,
      body: jsonEncode({'quantity': qty}),
    );
    _processResponse(res);
  }

  Future<void> clearCart() async {
    final res = await http.delete(Uri.parse('$baseUrl/api/cart'), headers: _headers);
    _processResponse(res);
  }



  Future<void> placeOrder(String branchId) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/orders'),
      headers: _headers,
      body: jsonEncode({'branch_id': branchId}),
    );
    _processResponse(res);
  }

  Future<List<dynamic>> getMyOrders() async {
    final res = await http.get(Uri.parse('$baseUrl/api/orders'), headers: _headers);
    final data = _processResponse(res);
    return data['data'] as List<dynamic>? ?? [];
  }

  Future<List<dynamic>> getBranchOrders() async {
    final res = await http.get(Uri.parse('$baseUrl/api/orders/branch'), headers: _headers);
    final data = _processResponse(res);
    return data['data'] as List<dynamic>? ?? [];
  }

  Future<void> scanQrOrder(String qrToken) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/orders/scan-qr'),
      headers: _headers,
      body: jsonEncode({'qr_token': qrToken}),
    );
    _processResponse(res);
  }

  Future<void> updateOrderStatus(String orderId, String status) async {
    final res = await http.put(
      Uri.parse('$baseUrl/api/orders/$orderId/status'),
      headers: _headers,
      body: jsonEncode({'status': status}),
    );
    _processResponse(res);
  }

  // --- Device Tokens (OneSignal) ---

  Future<void> registerDeviceToken(String osId) async {
    if (_token == null) return;
    try {
      await http.post(
        Uri.parse('$baseUrl/api/device-tokens'),
        headers: _headers,
        body: jsonEncode({
          'onesignal_id': osId,
          'platform': defaultTargetPlatform == TargetPlatform.iOS ? 'ios' : 'android'
        }),
      );
    } catch (_) {}
  }

  Map<String, dynamic> _processResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return {};
      final json = jsonDecode(response.body);
      if (json is Map<String, dynamic>) {
        if (json.containsKey('data')) {
          final data = json['data'];
          if (data is Map<String, dynamic>) {
            // Include message if it exists so we don't lose it entirely
            if (json.containsKey('message')) data['__message'] = json['message'];
            return data;
          }
          if (data is List) {
            return {'data': data};
          }
        }
        return json;
      }
      return {};
    } else {
      String msg = 'Sunucu hatası: ${response.statusCode}';
      List<dynamic>? errors;
      try {
        final err = jsonDecode(response.body);
        if (err['message'] != null) {
          msg = err['message'];
        }
        if (err['errors'] != null) {
          errors = err['errors'];
        }
      } catch (_) {}
      throw ApiException(msg, response.statusCode, errors: errors);
    }
  }
}
