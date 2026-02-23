import 'package:flutter/material.dart';

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
    return SettingsTile(
      title: title,
      bottomBorder: bottomBorder,
      leading: icon == null
          ? null
          : Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                color: const Color(0xFF243B61),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: const Color(0xFFA7B8D3)),
            ),
      trailing: Switch(
        value: value,
        onChanged: onChanged,
      ),
      onTap: () => onChanged(!value),
    );
  }
}
