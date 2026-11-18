import 'package:flutter/material.dart';

/// Acento violeta alineado al frontend web (oklch 0.585 0.233 296).
class TurnixColors {
  static const accent = Color(0xFF7C3AED);
  static const accentForeground = Color(0xFFFAF5FF);
  static const background = Color(0xFFF7F6FA);
  static const muted = Color(0xFF6B7280);
}

ThemeData buildTurnixTheme() {
  final colorScheme = ColorScheme.fromSeed(
    seedColor: TurnixColors.accent,
    brightness: Brightness.light,
    surface: TurnixColors.background,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: colorScheme,
    scaffoldBackgroundColor: TurnixColors.background,
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey.shade300),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey.shade300),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: TurnixColors.accent, width: 2),
      ),
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.grey.shade200),
      ),
    ),
    appBarTheme: const AppBarTheme(
      centerTitle: false,
      elevation: 0,
      scrolledUnderElevation: 0,
      backgroundColor: TurnixColors.background,
      foregroundColor: Colors.black87,
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: TurnixColors.accent,
        foregroundColor: TurnixColors.accentForeground,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
  );
}
