import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'screens/customer/customer_shell.dart';
import 'screens/customer/order_history_screen.dart';
import 'screens/staff/admin_screen.dart';
import 'screens/staff/barista_screen.dart';
import 'screens/staff/manager_screen.dart';
import 'data/catalog.dart';
import 'package:onesignal_flutter/onesignal_flutter.dart';

import 'state/app_state.dart';
import 'theme.dart';
import 'utils/page_transitions.dart';

final navigatorKey = GlobalKey<NavigatorState>();
final scaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  const onesignalAppId = String.fromEnvironment('ONESIGNAL_APP_ID');
  if (onesignalAppId.isNotEmpty) {
    OneSignal.initialize(onesignalAppId);
    OneSignal.Notifications.requestPermission(true);
  }

  // Katalog arayüz kurulmadan önce yüklenir; böylece ürün id'leri oturum
  // boyunca sabit kalır ve sepetteki id'ler geçersizleşmez.
  await Catalog.instance.load();
  runApp(const EmarKafeApp());
}

class EmarKafeApp extends StatelessWidget {
  const EmarKafeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AppState()..onRateReminder = _showRateReminder,
      child: MaterialApp(
        title: 'EMAR Kafe',
        debugShowCheckedModeBanner: false,
        navigatorKey: navigatorKey,
        scaffoldMessengerKey: scaffoldMessengerKey,
        theme: EmarTheme.light(),
        home: const _RootRouter(),
      ),
    );
  }

  static void _showRateReminder(OrderRecord order) {
    scaffoldMessengerKey.currentState?.showSnackBar(
      SnackBar(
        duration: const Duration(seconds: 8),
        content: Text('☕ ${order.id} nasıldı? Siparişini değerlendirmek ister misin?'),
        action: SnackBarAction(
          label: 'Değerlendir',
          onPressed: () => navigatorKey.currentState?.push(softRoute(const OrderHistoryScreen())),
        ),
      ),
    );
  }
}

class _RootRouter extends StatelessWidget {
  const _RootRouter();

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    // Girişsiz kullanıcı da ana ekranı misafir olarak gezebilir;
    // giriş yalnızca sağ üstteki profil ikonuyla tetiklenir.
    if (!app.loggedIn) return const CustomerShell();
    return switch (app.role) {
      UserRole.customer => const CustomerShell(),
      UserRole.barista => const BaristaScreen(),
      UserRole.manager => const ManagerScreen(),
      UserRole.branchManager => const ManagerScreen(),
      UserRole.admin => const AdminScreen(),
    };
  }
}
