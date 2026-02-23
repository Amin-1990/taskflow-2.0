import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/widgets/bottom_navigation.dart';
import '../../settings/controllers/settings_provider.dart';
import '../../settings/controllers/sync_provider.dart';
import '../../settings/widgets/connection_status_tile.dart';
import '../../settings/widgets/logout_warning_modal.dart';
import '../../settings/widgets/settings_section.dart';
import '../../settings/widgets/settings_tile.dart';
import '../../settings/widgets/settings_toggle_tile.dart';

class SettingsPage extends ConsumerStatefulWidget {
  const SettingsPage({super.key});

  @override
  ConsumerState<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends ConsumerState<SettingsPage> {
  bool _forceLogoutProcessing = false;

  @override
  Widget build(BuildContext context) {
    final settings = ref.watch(settingsProvider);
    final sync = ref.watch(syncProvider);
    final settingsNotifier = ref.read(settingsProvider.notifier);
    final syncNotifier = ref.read(syncProvider.notifier);

    final lastSync = sync.lastSyncTime;
    final lastSyncLabel = lastSync == null
        ? 'Jamais'
        : DateFormat('dd/MM/yyyy HH:mm').format(lastSync);

    return Scaffold(
      backgroundColor: const Color(0xFF07152F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A2C4B),
        leading: IconButton(
          onPressed: () => Navigator.of(context).maybePop(),
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
        ),
        title: const Text('Settings',
            style: TextStyle(fontWeight: FontWeight.w700)),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).maybePop(),
            child: const Text('Done',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
      body: settings.isLoading
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 120),
                children: [
                  SettingsSection(
                    title: 'Configuration',
                    child: Column(
                      children: [
                        SettingsTile(
                          title: 'Server URL',
                          subtitle: settings.serverUrl,
                          leading: const Icon(Icons.dns_rounded,
                              color: Color(0xFF8EA3C5)),
                          trailing: const Icon(Icons.edit_rounded,
                              color: Color(0xFF8EA3C5)),
                          onTap: () =>
                              _editServerUrl(context, settings.serverUrl),
                        ),
                        ConnectionStatusTile(
                          state: settings,
                          onTap: settingsNotifier.testConnection,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),
                  SettingsSection(
                    title: 'Synchronization',
                    child: Column(
                      children: [
                        SettingsTile(
                          title: 'Last Sync',
                          subtitle: lastSyncLabel,
                          leading: Container(
                            width: 46,
                            height: 46,
                            decoration: BoxDecoration(
                              color: const Color(0xFF1E3A6A),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.sync_rounded,
                                color: Color(0xFF2A7BFF)),
                          ),
                          trailing: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(10),
                              color: sync.pendingCount == 0
                                  ? const Color(0xFF253A57)
                                  : const Color(0xFF4B2630),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.circle,
                                  size: 10,
                                  color: sync.pendingCount == 0
                                      ? const Color(0xFF35D088)
                                      : const Color(0xFFFF8D98),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  sync.pendingCount == 0
                                      ? 'Up to date'
                                      : 'Pending',
                                  style: TextStyle(
                                    color: sync.pendingCount == 0
                                        ? const Color(0xFFB6F6D6)
                                        : const Color(0xFFFFC3CB),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        SettingsTile(
                          title: 'Pending Uploads',
                          subtitle: null,
                          trailing: Text(
                            '${sync.pendingCount}',
                            style: const TextStyle(
                              color: Color(0xFF94A8C7),
                              fontFamily: 'monospace',
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        SettingsTile(
                          title: 'Sync Now',
                          bottomBorder: false,
                          leading: sync.isSyncing
                              ? const SizedBox(
                                  width: 24,
                                  height: 24,
                                  child:
                                      CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Icon(Icons.sync,
                                  color: Color(0xFF2A7BFF)),
                          trailing: const Icon(Icons.chevron_right_rounded,
                              color: Color(0xFF2A7BFF)),
                          onTap: sync.isSyncing
                              ? null
                              : () async {
                                  final result = await syncNotifier.syncNow();
                                  if (!context.mounted) {
                                    return;
                                  }
                                  final msg = result.success
                                      ? 'Synchronisation terminee (${result.syncedCount} action(s)).'
                                      : 'Synchronisation partielle: ${result.syncedCount} envoyee(s), ${result.failedCount} restante(s).';
                                  ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text(msg)));
                                },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),
                  SettingsSection(
                    title: 'Preferences',
                    child: Column(
                      children: [
                        SettingsToggleTile(
                          title: 'Dark Mode',
                          value: settings.darkMode,
                          icon: Icons.dark_mode_rounded,
                          onChanged: settingsNotifier.setDarkMode,
                        ),
                        SettingsToggleTile(
                          title: 'Notifications',
                          value: settings.notificationsEnabled,
                          icon: Icons.notifications_rounded,
                          bottomBorder: false,
                          onChanged: settingsNotifier.setNotificationsEnabled,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),
                  SettingsSection(
                    title: 'About',
                    child: Column(
                      children: [
                        SettingsTile(
                          title: 'Version',
                          subtitle: settings.versionLabel,
                        ),
                        SettingsTile(
                          title: 'Device ID',
                          subtitle: settings.deviceId,
                          bottomBorder: false,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFF1A2C4B),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFF2A426B)),
                    ),
                    child: TextButton(
                      onPressed: () => _onLogoutPressed(context),
                      child: const Padding(
                        padding: EdgeInsets.symmetric(vertical: 8),
                        child: Text(
                          'Deconnexion',
                          style: TextStyle(
                              color: Color(0xFFFF4E5D),
                              fontSize: 34 / 2,
                              fontWeight: FontWeight.w700),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: EdgeInsets.only(top: 2),
                        child: Icon(Icons.warning_amber_rounded,
                            color: Color(0xFFF2A33A), size: 18),
                      ),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Unsynced data will be lost permanently upon logout. Please ensure all tasks are synced.',
                          style: TextStyle(color: Color(0xFF7F93B4)),
                        ),
                      ),
                    ],
                  ),
                  if (settings.error != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(
                        settings.error!,
                        style: const TextStyle(color: Color(0xFFFF8D98)),
                      ),
                    ),
                ],
              ),
            ),
      bottomNavigationBar: const TaskflowBottomNavigation(currentIndex: 2),
    );
  }

  Future<void> _editServerUrl(BuildContext context, String currentUrl) async {
    final controller = TextEditingController(text: currentUrl);
    final value = await showDialog<String>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Server URL'),
          content: TextField(
            controller: controller,
            decoration:
                const InputDecoration(hintText: 'https://api.taskflow.com/v1'),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Annuler'),
            ),
            FilledButton(
              onPressed: () =>
                  Navigator.of(context).pop(controller.text.trim()),
              child: const Text('Enregistrer'),
            ),
          ],
        );
      },
    );
    if (value == null || value.isEmpty) {
      return;
    }
    await ref.read(settingsProvider.notifier).setServerUrl(value);
  }

  Future<void> _onLogoutPressed(BuildContext context) async {
    final syncState = ref.read(syncProvider);
    if (syncState.pendingCount <= 0) {
      await ref.read(settingsProvider.notifier).forceLogout();
      return;
    }

    await ref.read(syncProvider.notifier).refreshPending();
    final state = ref.read(syncProvider);
    if (!context.mounted) {
      return;
    }

    await showDialog<void>(
      context: context,
      barrierDismissible: !_forceLogoutProcessing,
      builder: (context) {
        final navigator = Navigator.of(context);
        return LogoutWarningModal(
          pendingActions: state.pendingActions,
          isProcessing: _forceLogoutProcessing,
          onWait: () => navigator.pop(),
          onForceLogout: () async {
            if (state.pendingCount > 5) {
              final confirm = await showDialog<bool>(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Confirmation'),
                  content: Text(
                      'Vous allez perdre ${state.pendingCount} actions locales. Continuer ?'),
                  actions: [
                    TextButton(
                        onPressed: () => Navigator.of(context).pop(false),
                        child: const Text('Annuler')),
                    FilledButton(
                        onPressed: () => Navigator.of(context).pop(true),
                        child: const Text('Continuer')),
                  ],
                ),
              );
              if (confirm != true) {
                return;
              }
            }

            setState(() => _forceLogoutProcessing = true);
            await ref.read(settingsProvider.notifier).forceLogout();
            if (!mounted) {
              return;
            }
            setState(() => _forceLogoutProcessing = false);
            if (navigator.canPop()) {
              navigator.pop();
            }
          },
        );
      },
    );
  }
}
