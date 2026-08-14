import 'package:flutter/material.dart';

/// EMAR Kafe renk paleti.
class EmarColors {
  static const espresso = Color(0xFF364D63); // koyu lacivert-gri — ink / dark yüzeyler
  static const roast = Color(0xFF25384A); // espresso'nun koyu tonu — gradyan derinliği
  static const oat = Color(0xFFEDF2F3); // sayfa arka planı — açık gri-mavi
  static const oatDark = Color(0xFFD3DCDE); // ikincil yüzey / chip zemini
  static const surface = Color(0xFFFFFFFF); // kart / sheet zemini
  static const paprika = Color(0xFFE95949); // birincil vurgu — CTA / sipariş
  static const paprikaDim = Color(0xFFC6473A); // koyu mercan — gradyan / basılı durum
  static const moss = Color(0xFF439BD6); // ikincil vurgu — onay / başarı
  static const gold = Color(0xFF52A7E0); // üçüncül vurgu — puanlama / öne çıkanlar
}

class EmarTheme {
  static ThemeData light() {
    const scheme = ColorScheme(
      brightness: Brightness.light,
      primary: EmarColors.paprika,
      onPrimary: EmarColors.surface,
      secondary: EmarColors.moss,
      onSecondary: EmarColors.surface,
      tertiary: EmarColors.gold,
      onTertiary: EmarColors.espresso,
      error: EmarColors.paprikaDim,
      onError: EmarColors.surface,
      surface: EmarColors.surface,
      onSurface: EmarColors.espresso,
      surfaceContainerHighest: EmarColors.oatDark,
      outline: Color(0x1F364D63),
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: EmarColors.oat,
      splashFactory: InkRipple.splashFactory,
      fontFamily: 'Roboto',

      appBarTheme: const AppBarTheme(
        backgroundColor: EmarColors.oat,
        foregroundColor: EmarColors.espresso,
        elevation: 0,
        centerTitle: false,
        surfaceTintColor: Colors.transparent,
      ),
      textTheme: const TextTheme(
        headlineSmall: TextStyle(
          fontFamily: 'Georgia',
          fontWeight: FontWeight.w700,
          color: EmarColors.espresso,
        ),
        titleLarge: TextStyle(
          fontFamily: 'Georgia',
          fontWeight: FontWeight.w700,
          color: EmarColors.espresso,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: EmarColors.paprika,
          foregroundColor: EmarColors.surface,
          disabledBackgroundColor: EmarColors.espresso.withValues(alpha: 0.18),
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
          animationDuration: const Duration(milliseconds: 180),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: EmarColors.espresso,
          side: BorderSide(color: EmarColors.espresso.withValues(alpha: 0.25)),
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14.5),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: EmarColors.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: EmarColors.espresso.withValues(alpha: 0.14)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: EmarColors.espresso.withValues(alpha: 0.14)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: EmarColors.paprika, width: 1.6),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: EmarColors.paprikaDim, width: 1.4),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: EmarColors.paprikaDim, width: 1.8),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: EmarColors.oatDark,
        labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12.5),
        shape: const StadiumBorder(),
        side: BorderSide.none,
      ),
      cardTheme: CardThemeData(
        color: EmarColors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: EmarColors.espresso,
        contentTextStyle: const TextStyle(color: EmarColors.surface, fontWeight: FontWeight.w600, fontSize: 13),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    );
  }
}
