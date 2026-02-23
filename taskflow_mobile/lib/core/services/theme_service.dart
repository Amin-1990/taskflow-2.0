import 'package:flutter/material.dart';

class ThemeService {
  ThemeMode fromDarkMode(bool darkMode) =>
      darkMode ? ThemeMode.dark : ThemeMode.light;
}
