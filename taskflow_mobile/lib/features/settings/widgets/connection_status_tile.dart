import 'package:flutter/material.dart';

import '../controllers/settings_provider.dart';
import 'settings_tile.dart';

class ConnectionStatusTile extends StatelessWidget {
  const ConnectionStatusTile({
    super.key,
    required this.state,
    required this.onTap,
  });

  final SettingsState state;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final status = switch (state.connectionState) {
      ConnectionStateType.online =>
        'Online (${state.connectionLatencyMs ?? '-'}ms)',
      ConnectionStateType.offline => 'Offline',
      ConnectionStateType.checking => 'Testing...',
      ConnectionStateType.idle => 'Not tested',
    };
    final color = switch (state.connectionState) {
      ConnectionStateType.online => const Color(0xFF35D088),
      ConnectionStateType.offline => const Color(0xFFFF8D98),
      ConnectionStateType.checking => const Color(0xFFF2B01A),
      ConnectionStateType.idle => const Color(0xFF94A8C7),
    };

    return SettingsTile(
      title: 'Check Connection',
      subtitle: status,
      onTap:
          state.connectionState == ConnectionStateType.checking ? null : onTap,
      leading: Container(
        width: 46,
        height: 46,
        decoration: BoxDecoration(
          color: const Color(0xFF1E3F3B),
          borderRadius: BorderRadius.circular(12),
        ),
        child: state.connectionState == ConnectionStateType.checking
            ? const Padding(
                padding: EdgeInsets.all(12),
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : Icon(Icons.speed_rounded, color: color),
      ),
      trailing: Icon(
        Icons.chevron_right_rounded,
        color: color,
      ),
    );
  }
}
