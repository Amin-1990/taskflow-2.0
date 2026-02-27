import 'package:flutter/material.dart';
import '../../../core/constants/design_constants.dart';

import 'settings_tile.dart';

class SettingsToggleTile extends StatelessWidget {
  const SettingsToggleTile({
    super.key,
    required this.title,
    required this.value,
    required this.onChanged,
    this.icon,
    this.bottomBorder = true,
  });

  final String title;
  final bool value;
  final ValueChanged<bool> onChanged;
  final IconData? icon;
  final bool bottomBorder;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return SettingsTile(
      title: title,
      bottomBorder: bottomBorder,
      leading: icon == null
          ? null
          : Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF243B61) : AppPalette.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, 
                  color: isDark ? const Color(0xFFA7B8D3) : AppPalette.primary),
            ),
      trailing: Switch(
        value: value,
        onChanged: onChanged,
        activeColor: AppPalette.primary,
      ),
      onTap: () => onChanged(!value),
    );
  }
}
