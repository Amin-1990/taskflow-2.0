import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../constants/design_constants.dart';

class AppTheme {
  const AppTheme._();

  static const Color primaryColor = AppPalette.primary;

  static ThemeData get lightTheme {
    const colorScheme = ColorScheme.light(
      primary: AppPalette.primary,
      surface: AppPalette.surfaceLight,
      error: AppPalette.error,
      onPrimary: Colors.white,
      onSurface: AppPalette.textPrimaryLight,
    );

    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: AppPalette.backgroundLight,
      colorScheme: colorScheme,
      textTheme: GoogleFonts.interTextTheme(),
      appBarTheme: const AppBarTheme(
        centerTitle: false,
        backgroundColor: AppPalette.backgroundLight,
        foregroundColor: AppPalette.textPrimaryLight,
      ),
      cardTheme: CardThemeData(
        color: AppPalette.surfaceLight,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(DesignRadii.md),
          side: const BorderSide(color: AppPalette.borderLight),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppPalette.surfaceLight,
        hintStyle: const TextStyle(color: AppPalette.textMutedLight),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(DesignRadii.sm),
          borderSide: const BorderSide(color: AppPalette.borderLight),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(DesignRadii.sm),
          borderSide: const BorderSide(color: AppPalette.borderLight),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(DesignRadii.sm),
          borderSide: const BorderSide(color: AppPalette.primary, width: 1.4),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          minimumSize: const Size.fromHeight(48),
          backgroundColor: AppPalette.primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(DesignRadii.sm),
          ),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(48),
          backgroundColor: AppPalette.primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(DesignRadii.sm),
          ),
        ),
      ),
    );
  }

  static ThemeData get darkTheme {
    const colorScheme = ColorScheme.dark(
      primary: AppPalette.primary,
      surface: AppPalette.surfaceDark,
      error: AppPalette.error,
      onPrimary: Colors.white,
      onSurface: AppPalette.textPrimary,
    );

    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: AppPalette.backgroundDark,
      canvasColor: AppPalette.backgroundDark,
      colorScheme: colorScheme,
      textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme),
      appBarTheme: const AppBarTheme(
        centerTitle: false,
        backgroundColor: AppPalette.backgroundDark,
        foregroundColor: AppPalette.textPrimary,
      ),
      cardTheme: CardThemeData(
        color: AppPalette.surfaceDark,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(DesignRadii.md),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppPalette.surfaceDark,
        hintStyle: const TextStyle(color: AppPalette.textSecondary),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(DesignRadii.sm),
          borderSide: const BorderSide(color: AppPalette.borderDark),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(DesignRadii.sm),
          borderSide: const BorderSide(color: AppPalette.borderDark),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(DesignRadii.sm),
          borderSide: const BorderSide(color: AppPalette.primary, width: 1.4),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          minimumSize: const Size.fromHeight(48),
          backgroundColor: AppPalette.primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(DesignRadii.sm),
          ),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(48),
          backgroundColor: AppPalette.primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(DesignRadii.sm),
          ),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppPalette.surfaceDark,
        contentTextStyle: const TextStyle(color: AppPalette.textPrimary),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}
