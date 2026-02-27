import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/constants/design_constants.dart';
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
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final lastSync = sync.lastSyncTime;
    final lastSyncLabel = lastSync == null
        ? 'Jamais'
        : DateFormat('dd/MM/yyyy HH:mm').format(lastSync);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: theme.appBarTheme.backgroundColor,
        leading: IconButton(
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/operator/dashboard');
            }
          },
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          color: theme.appBarTheme.iconTheme?.color,
        ),
        title: Text('Parametres',
            style: TextStyle(
                color: theme.appBarTheme.titleTextStyle?.color,
                fontWeight: FontWeight.w700)),
        actions: [
          TextButton(
            onPressed: () {
              if (context.canPop()) {
                context.pop();
              } else {
                context.go('/operator/dashboard');
              }
            },
            child: const Text('OK',
                style: TextStyle(
                    fontSize: 18, 
                    fontWeight: FontWeight.w700,
                    color: AppPalette.primary)),
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
                          title: 'URL Serveur',
                          subtitle: settings.serverUrl,
                          leading: Icon(Icons.dns_rounded,
                              color: isDark ? const Color(0xFF8EA3C5) : AppPalette.primary),
                          trailing: Icon(Icons.edit_rounded,
                              color: isDark ? const Color(0xFF8EA3C5) : AppPalette.primary),
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
                    title: 'Synchronisation',
                    child: Column(
                      children: [
                        SettingsTile(
                          title: 'Derniere Sync',
                          subtitle: lastSyncLabel,
                          leading: Container(
                            width: 46,
                            height: 46,
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF1E3A6A) : AppPalette.primary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(Icons.sync_rounded,
                                color: AppPalette.primary),
                          ),
                          trailing: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(10),
                              color: sync.pendingCount == 0
                                  ? (isDark ? const Color(0xFF253A57) : AppPalette.success.withOpacity(0.1))
                                  : (isDark ? const Color(0xFF4B2630) : AppPalette.error.withOpacity(0.1)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.circle,
                                  size: 10,
                                  color: sync.pendingCount == 0
                                      ? AppPalette.success
                                      : AppPalette.error,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  sync.pendingCount == 0
                                      ? 'A jour'
                                      : 'En attente',
                                  style: TextStyle(
                                    color: sync.pendingCount == 0
                                        ? AppPalette.success
                                        : AppPalette.error,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        SettingsTile(
                          title: 'Actions en attente',
                          subtitle: null,
                          trailing: Text(
                            '${sync.pendingCount}',
                            style: TextStyle(
                              color: isDark ? const Color(0xFF94A8C7) : AppPalette.textSecondaryLight,
                              fontFamily: 'monospace',
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        SettingsTile(
                          title: 'Synchroniser maintenant',
                          bottomBorder: false,
                          leading: sync.isSyncing
                              ? const SizedBox(
                                  width: 24,
                                  height: 24,
                                  child:
                                      CircularProgressIndicator(strokeWidth: 2),
                                )
                              : Icon(Icons.sync,
                                  color: AppPalette.primary),
                          trailing: Icon(Icons.chevron_right_rounded,
                              color: AppPalette.primary),
                          onTap: sync.isSyncing
                              ? null
                              : () async {
                                  final result = await ref.read(syncProvider.notifier).syncNow();
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
                          title: 'Mode Sombre',
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
                    title: 'A propos',
                    child: Column(
                      children: [
                        SettingsTile(
                          title: 'Version',
                          subtitle: settings.versionLabel,
                        ),
                        SettingsTile(
                          title: 'ID Appareil',
                          subtitle: settings.deviceId,
                          bottomBorder: false,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),
                  Container(
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1A2C4B) : Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(
                        color: isDark ? const Color(0xFF2A426B) : AppPalette.borderLight
                      ),
                      boxShadow: isDark ? null : [
                        const BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))
                      ],
                    ),
                    child: TextButton(
                      onPressed: () => _onLogoutPressed(context),
                      child: const Padding(
                        padding: EdgeInsets.symmetric(vertical: 8),
                        child: Text(
                          'Deconnexion',
                          style: TextStyle(
                              color: AppPalette.error,
                              fontSize: 17,
                              fontWeight: FontWeight.w700),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Icon(Icons.warning_amber_rounded,
                            color: AppPalette.warning, size: 18),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Les donnees non synchronisees seront perdues definitivement lors de la deconnexion.',
                          style: TextStyle(
                              color: isDark ? const Color(0xFF7F93B4) : AppPalette.textMutedLight
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (settings.error != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(
                        settings.error!,
                        style: TextStyle(color: AppPalette.error),
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
