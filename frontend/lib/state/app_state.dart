import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:onesignal_flutter/onesignal_flutter.dart';

import '../data/campaigns_data.dart';
import '../data/catalog.dart';
import '../data/menu_data.dart';
import '../models/branch.dart';
import '../models/product.dart';
import '../services/api_service.dart';

enum UserRole { customer, barista, manager, admin, branchManager }

extension UserRoleLabel on UserRole {
  String get label => switch (this) {
        UserRole.customer => 'Müşteri',
        UserRole.barista => 'Barista',
        UserRole.manager => 'Şube Yöneticisi',
        UserRole.branchManager => 'Şube Yöneticisi',
        UserRole.admin => 'Admin',
      };
}

class OrderRecord {
  final String id;
  final String shortId;
  final Map<String, int> items;
  final DateTime placedAt;
  final int prepMinutes;
  final String branch;
  final String customerName;
  bool pickedUp;
  bool isPendingQR;
  OrderStatus manualStatus;

  OrderRecord({
    required this.id,
    required this.shortId,
    required this.items,
    required this.placedAt,
    required this.prepMinutes,
    required this.branch,
    required this.customerName,
    this.pickedUp = false,
    this.isPendingQR = false,
    this.manualStatus = OrderStatus.received,
  });

  factory OrderRecord.fromJson(Map<String, dynamic> json, {DateTime? fallbackPlacedAt}) {
    Map<String, int> parsedItems = {};
    final rawItems = json['items'] ?? json['order_items'];
    if (rawItems is Map) {
      rawItems.forEach((k, v) => parsedItems[k.toString()] = v as int);
    } else if (rawItems is List) {
      for (var item in rawItems) {
        if (item is Map) {
          final pId = item['product_id']?.toString() ?? item['id']?.toString() ?? '';
          final qty = item['quantity'] as int? ?? 1;
          if (pId.isNotEmpty) parsedItems[pId] = qty;
        }
      }
    }

    final rawStatus = json['status']?.toString() ?? 'created';
    final isPending = json['is_pending_qr'] ?? (rawStatus == 'created' || rawStatus == 'pending' || rawStatus == 'pending_payment');
    
    DateTime? pAt;
    if (json['created_at'] != null) {
      pAt = DateTime.tryParse(json['created_at'].toString())?.toLocal();
    } else if (json['placed_at'] != null) {
      pAt = DateTime.tryParse(json['placed_at'].toString())?.toLocal();
    }

    String sId = json['short_id']?.toString() ?? json['order_number']?.toString() ?? '';
    if (sId.isEmpty) {
      final fallbackId = json['id']?.toString() ?? '';
      sId = fallbackId.length >= 8 ? '#${fallbackId.substring(0, 8).toUpperCase()}' : '#---';
    }

    return OrderRecord(
      id: json['id']?.toString() ?? '',
      shortId: sId,
      items: parsedItems,
      placedAt: pAt ?? fallbackPlacedAt ?? DateTime.now(),
      prepMinutes: json['prep_minutes'] as int? ?? 5,
      branch: json['branch']?.toString() ?? '',
      customerName: json['customer_name']?.toString() ?? 'Misafir',
      pickedUp: json['picked_up'] == true || rawStatus == 'completed',
      isPendingQR: isPending,
      manualStatus: OrderStatus.values.firstWhere(
        (e) => e.name == rawStatus, 
        orElse: () => OrderStatus.received
      ),
    );
  }

  double get total => items.entries.fold(0.0, (sum, e) => sum + productById(e.key).price * e.value);

  OrderStatus get computedStatus {
    if (isPendingQR) return OrderStatus.received;
    if (remainingSeconds <= 0 && manualStatus != OrderStatus.completed) return OrderStatus.ready;
    return manualStatus;
  }

  int get remainingSeconds {
    if (isPendingQR) return prepMinutes * 60;
    return (prepMinutes * 60 - DateTime.now().difference(placedAt).inSeconds).clamp(0, prepMinutes * 60);
  }
}

enum OrderStatus { created, received, preparing, ready, completed, cancelled }

class AppState extends ChangeNotifier {
  final ApiService api = ApiService();
  Timer? _pollingTimer;

  bool loggedIn = false;
  UserRole role = UserRole.customer;
  String userName = '';
  String userEmail = '';
  DateTime? birthday;
  String? selectedBranchId;
  double walletBalance = 0.0;

  Map<String, int> cart = {};
  Map<String, String> cartItemIds = {}; // product_id -> cart_item_id
  final Map<String, Timer> _cartDebounceTimers = {};
  bool isUpdatingCart = false;
  double cartTotal = 0.0;
  
  final Map<String, double> ratings = {};
  List<OrderRecord> orderHistory = [];
  List<OrderRecord> activeBaristaOrders = [];
  
  int loyaltyProgress = 0;
  int freeCoffeesEarned = 0;

  void Function(OrderRecord order)? onRateReminder;

  List<Branch> get branches => Catalog.instance.branches;
  
  Branch? get currentBranch {
    try {
      return branches.firstWhere((b) => b.id == selectedBranchId);
    } catch (_) {
      return branches.firstOrNull;
    }
  }
  final List<Campaign> campaignList = List.of(Catalog.instance.campaigns);
  final Set<String> outOfStock = {};
  
  static const demoAccountEmail = 'boragok356@gmail.com';
  static const demoAccountPassword = '123456';

  AppState() {
    selectedBranchId = Catalog.instance.branches.firstOrNull?.id;
    _initApi();
  }

  Future<void> _initApi() async {
    await api.init();
    if (api.token != null) {
      await _fetchMe();
    }
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchMe() async {
    final res = await api.getMe();
    final userObj = res['user'] as Map<String, dynamic>? ?? res;
    final metadata = userObj['user_metadata'] as Map<String, dynamic>?;

    userEmail = userObj['email'] ?? '';
    role = UserRole.values.firstWhere((e) => e.name == (userObj['role'] ?? metadata?['role'] ?? 'customer'), orElse: () => UserRole.customer);
    
    String fallbackName = metadata?['full_name'] ?? '';
    
    try {
      final profile = await api.getProfile();
      userName = profile['full_name'] ?? fallbackName;
      if (profile['birth_date'] != null) birthday = DateTime.tryParse(profile['birth_date']);
      final branchData = profile['branch_id'] ?? profile['branch'];
      if (branchData != null) {
        if (branchData is Map) {
          selectedBranchId = branchData['id'] ?? branchData['branch_id'];
        } else {
          selectedBranchId = branchData.toString();
        }
      }
    } catch (_) {
      userName = fallbackName;
    }
    
    try {
      final wallet = await api.getWalletBalance();
      walletBalance = (wallet['balance'] ?? 0.0).toDouble();
    } catch (_) {}

    loggedIn = true;
    
    // Push token init
    OneSignal.login(userEmail);
    final osId = OneSignal.User.pushSubscription.id;
    if (osId != null) {
      await api.registerDeviceToken(osId);
    }

    await _fetchCart();
    _startPolling();
    notifyListeners();
  }

  void _clearSession() {
    loggedIn = false;
    userName = '';
    userEmail = '';
    walletBalance = 0.0;
    cart.clear();
    cartItemIds.clear();
    cartTotal = 0.0;
    orderHistory.clear();
    activeBaristaOrders.clear();
    _pollingTimer?.cancel();
    OneSignal.logout();
    notifyListeners();
  }

  void _startPolling() {
    _pollingTimer?.cancel();
    _fetchOrders();
    _pollingTimer = Timer.periodic(const Duration(seconds: 10), (_) => _fetchOrders());
  }

  Future<void> _fetchOrders() async {
    if (!loggedIn) return;
    try {
      if (role == UserRole.barista || role == UserRole.manager) {
        final list = await api.getBranchOrders();
        activeBaristaOrders = list.map((json) => OrderRecord.fromJson(json)).toList();
      } else {
        final list = await api.getMyOrders();
        orderHistory = list.map((json) => OrderRecord.fromJson(json)).toList();
      }
      notifyListeners();
    } catch (e) {
      debugPrint('Order polling error: $e');
    }
  }

  Future<void> _fetchCart() async {
    try {
      final res = await api.getCart();
      cart.clear();
      cartItemIds.clear();
      if (res['items'] != null) {
        for (var item in res['items']) {
          cart[item['product_id']] = item['quantity'];
          cartItemIds[item['product_id']] = item['id'];
        }
      }
      cartTotal = 0.0;
      cart.forEach((id, qty) {
        final product = productById(id);
        cartTotal += product.price * qty;
      });
      notifyListeners();
    } catch (e) {
      debugPrint('Cart fetch error: $e');
    }
  }

  Future<String?> register({
    required String name,
    required String email,
    required String phone,
    required String password,
    required DateTime birthDate,
    required UserRole selectedRole,
    required String branch,
  }) async {
    try {
      // Backend artık register'da token dönüyor, login yapmamıza gerek yok!
      final res = await api.register(email.trim(), phone, password, name, birthDate.toIso8601String().split('T')[0]);
      
      final session = res['session'] as Map<String, dynamic>?;
      final token = res['token'] ?? 
                    res['access_token'] ?? 
                    session?['access_token'];

      if (token != null) {
        await api.saveToken(token);
        
        // Backend register'da branch desteklemiyorsa, profili güncelliyoruz
        try {
          await api.setDefaultBranch(branch);
          if (selectedRole != UserRole.customer) {
            await api.updateProfile(role: selectedRole.name);
          }
        } catch (_) {}
        
        await _fetchMe();
        return null;
      } else {
        throw Exception('Kayıt başarılı ama token dönmedi!');
      }
    } catch (e) {
      await api.clearToken();
      _clearSession();
      return e.toString();
    }
  }

  Future<String?> loginWithCredentials({required String email, required String password}) async {
    try {
      final res = await api.login(email.trim(), password);
      
      // data objesi doğrudan döndüğü için artık token res['session']['access_token'] içinde
      final session = res['session'] as Map<String, dynamic>?;
      final token = res['token'] ?? 
                    res['access_token'] ?? 
                    session?['access_token'];
                    
      if (token != null) {
        await api.saveToken(token);
        await _fetchMe();
      } else {
        throw Exception('Backend token döndürmedi! Cevap: $res');
      }
      return null;
    } catch (e) {
      await api.clearToken();
      _clearSession();
      return 'Giriş yapılamadı: ${e.toString()}';
    }
  }

  Future<void> logout() async {
    await api.logout();
    _clearSession();
  }

  void selectBranch(String branchId) {
    selectedBranchId = branchId;
    if (loggedIn) {
      api.setDefaultBranch(branchId).catchError((_) {});
    }
    notifyListeners();
  }

  Future<List<String>> changeQty(String productId, int delta) async {
    // 1. Optimistic UI (Anında tepki)
    final originalQty = cart[productId] ?? 0;
    final next = originalQty + delta;
    
    if (next <= 0) {
      cart.remove(productId);
    } else {
      cart[productId] = next;
    }
    
    _recalcTotal();
    notifyListeners(); // Arayüzü anında güncelle!

    if (!loggedIn) return [];
    
    // 2. Debounce (İstek Geciktirme) Uygulanması
    _cartDebounceTimers[productId]?.cancel();
    isUpdatingCart = true;
    notifyListeners();

    _cartDebounceTimers[productId] = Timer(const Duration(milliseconds: 600), () async {
      _cartDebounceTimers.remove(productId);
      
      try {
        final cartItemId = cartItemIds[productId];
        final finalQty = cart[productId] ?? 0;
        
        if (cartItemId != null) {
          // Sepette var olan ürünü güncelle (idempotent PUT isteği)
          // Miktar 0 ise backend otomatik silecektir.
          await api.updateCartItem(cartItemId, finalQty);
        } else {
          // Sepete yeni eklenen ürün
          if (finalQty > 0) {
            await api.addToCart(productId, finalQty);
          }
        }
        
        // İşlem bitince arka planda son durumu çek (Opsiyonel ama güvenli)
        await _fetchCart();
      } catch (e) {
        debugPrint('Cart update error: $e');
        // 3. Hata Yönetimi ve Rollback (Geri Alma)
        cart[productId] = originalQty;
        if (originalQty <= 0) cart.remove(productId);
        _recalcTotal();
      } finally {
        if (_cartDebounceTimers.isEmpty) {
          isUpdatingCart = false;
        }
        notifyListeners();
      }
    });

    return [];
  }

  void _recalcTotal() {
    cartTotal = 0.0;
    cart.forEach((id, qty) {
      final product = productById(id);
      cartTotal += product.price * qty;
    });
  }

  int get cartCount => cart.values.fold(0, (a, b) => a + b);

  int prepMinutesFor(Map<String, int> items, DateTime at) {
    // Aynı mantık
    final coffeeQty = items.entries.where((e) => productById(e.key).isCoffee).fold(0, (s, e) => s + e.value);
    final dessertQty = items.entries.where((e) => productById(e.key).category == ProductCategory.dessert).fold(0, (s, e) => s + e.value);
    final beforeSix = at.hour < 18;

    final int base;
    if (coffeeQty > 0 && dessertQty > 0) {
      base = beforeSix ? 4 : 6;
    } else if (coffeeQty > 0) {
      base = beforeSix ? 2 : 3;
    } else if (dessertQty > 0) {
      base = beforeSix ? 3 : 5;
    } else {
      return 0;
    }

    final extraCoffee = coffeeQty > 0 ? (coffeeQty - 1) : 0;
    final extraDessert = dessertQty > 0 ? (dessertQty - 1) : 0;
    return base + (extraCoffee / 2).ceil() + (extraDessert / 2).ceil();
  }

  OrderRecord? get activeOrder {
    if (orderHistory.isEmpty) return null;
    final latest = orderHistory.first;
    if (latest.pickedUp) return null;
    return latest;
  }

  Future<void> addWalletBalance(double amount) async {
    if (!loggedIn) return;
    try {
      await api.topupWallet(amount);
      final wallet = await api.getWalletBalance();
      walletBalance = (wallet['balance'] ?? 0.0).toDouble();
      notifyListeners();
    } catch (e) {
      debugPrint('Wallet topup error: $e');
    }
  }

  Future<String?> generateWalletToken() async {
    isUpdatingCart = true;
    notifyListeners();

    try {
      final token = await api.getWalletQrToken();
      return token;
    } finally {
      isUpdatingCart = false;
      notifyListeners();
    }
  }

  /// Siparişi onaylayıp backend'e gönderir (veya cüzdan ile ödeme mocklanır).
  Future<OrderRecord?> placeOrder({bool useWallet = false}) async {
    if (!loggedIn) return null;
    
    if (useWallet) {
      if (walletBalance < cartTotal) throw Exception('Yetersiz bakiye');
    }
    
    if (selectedBranchId == null) throw Exception('Şube seçilmedi');

    await api.placeOrder(selectedBranchId!); // Sepet onayi
    await _fetchCart(); // Sepet bosalir
    await _fetchOrders(); // Siparis listesi guncellenir
    return activeOrder;
  }

  Future<String?> generateWalletQR() async {
    if (!loggedIn) return null;
    try {
      return await api.getWalletQrToken();
    } catch (e) {
      debugPrint('QR error: $e');
      return null;
    }
  }

  Future<void> advanceOrderStatus(OrderRecord order) async {
    var newStatus = OrderStatus.received;
    if (order.manualStatus == OrderStatus.received || order.manualStatus == OrderStatus.created) {
      newStatus = OrderStatus.preparing;
    } else if (order.manualStatus == OrderStatus.preparing) {
      newStatus = OrderStatus.ready;
    } else {
      return;
    }
    
    try {
      await api.updateOrderStatus(order.id, newStatus.name);
      await _fetchOrders(); // Polling tetiklenir ama manuel hizlandiralim
    } catch (e) {
      debugPrint('Order update error: $e');
    }
  }

  Future<void> confirmOrderFromQR(String qrToken) async {
    try {
      await api.scanQrOrder(qrToken);
      await _fetchOrders();
    } catch (e) {
      throw Exception('QR tarama basarisiz: $e');
    }
  }

  Future<void> markPickedUp(OrderRecord order) async {
    try {
      await api.updateOrderStatus(order.id, OrderStatus.completed.name);
      await _fetchOrders();
    } catch (e) {
      debugPrint('Pick up error: $e');
    }
  }

  // Mock removeBranch logic removed as branches come from API now

  void addCampaign(Campaign c) {
    campaignList.insert(0, c);
    notifyListeners();
  }

  void removeCampaign(Campaign c) {
    campaignList.remove(c);
    notifyListeners();
  }

  bool isOutOfStock(String productId) => outOfStock.contains(productId);

  void toggleStock(String productId) {
    if (!outOfStock.add(productId)) outOfStock.remove(productId);
    notifyListeners();
  }

  Future<List<String>> addToCart(String productId) {
    return changeQty(productId, 1);
  }

  bool hasOrderedProduct(String productId) {
    for (var order in orderHistory) {
      if (order.items.containsKey(productId)) return true;
    }
    return false;
  }

  bool canRateProduct(String productId) {
    return hasOrderedProduct(productId) && !ratings.containsKey(productId);
  }

  void rateProduct(String productId, double rating) {
    ratings[productId] = rating;
    notifyListeners();
    // Gerekirse API cagir: POST /api/products/:productId/ratings
  }
}
