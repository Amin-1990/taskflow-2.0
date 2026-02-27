import 'package:flutter/material.dart';

class DesignRadii {
  const DesignRadii._();

  // 0.25rem, 0.5rem, 0.75rem, 9999px
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double pill = 9999.0;
}

class DesignSpacing {
  const DesignSpacing._();

  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 20;
  static const double section = 24;
}

class AppPalette {
  const AppPalette._();

  static const Color primary = Color(0xFF135BEC);
  static const Color backgroundDark = Color(0xFF101622);
  static const Color surfaceDark = Color(0xFF192233);
  static const Color borderDark = Color(0xFF232F48);

  static const Color backgroundLight = Color(0xFFF4F7FC);
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color borderLight = Color(0xFFDCE4F2);

  static const Color textPrimary = Color(0xFFEAF0F9);
  static const Color textPrimaryLight = Color(0xFF1A2138);
  static const Color textSecondary = Color(0xFF92A4C9);
  static const Color textSecondaryLight = Color(0xFF64748B);
  static const Color textMuted = Color(0xFF7D90B8);
  static const Color textMutedLight = Color(0xFF94A3B8);

  static const Color success = Color(0xFF2DCE89);
  static const Color warning = Color(0xFFF2A33A);
  static const Color error = Color(0xFFFF5A66);
}
