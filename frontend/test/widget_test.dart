import 'package:flutter_test/flutter_test.dart';

import 'package:emar_kafe/main.dart';

void main() {
  testWidgets('Login screen shows EMAR Kafe branding', (WidgetTester tester) async {
    await tester.pumpWidget(const EmarKafeApp());
    await tester.pump();

    expect(find.text('EMAR Kafe'), findsOneWidget);
    expect(find.text('Devam Et'), findsOneWidget);
  });
}
