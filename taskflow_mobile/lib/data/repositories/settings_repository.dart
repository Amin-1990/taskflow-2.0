import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/constants/app_config.dart';
import '../local/prefs/api_settings_storage.dart';

class SettingsSnapshot {
  const SettingsSnapshot({
    required this.serverUrl,
    required this.darkMode,
    required this.notificationsEnabled,
    required this.deviceId,
    this.lastSyncTime,
  });

  final String serverUrl;
  final bool darkMode;
  final bool notificationsEnabled;
  final String deviceId;
  final DateTime? lastSyncTime;
}

class SettingsRepository {
  static const String serverUrlKey = 'server_url';
  static const String darkModeKey = 'dark_mode';
  static const String notificationsEnabledKey = 'notifications_enabled';
  static const String deviceIdKey = 'device_id';
  static const String lastSyncTimeKey = 'last_sync_time';

  Future<SettingsSnapshot> load() async {
    final prefs = await SharedPreferences.getInstance();
    final legacyServer = await ApiSettingsStorage.getBaseUrl();
    final storedServer = prefs.getString(serverUrlKey);
    final server = (storedServer?.isNotEmpty == true
            ? storedServer
            : (legacyServer?.isNotEmpty == true ? legacyServer : null)) ??
        AppConfig.defaultServerUrl;

    final darkMode = prefs.getBool(darkModeKey) ?? true;
    final notificationsEnabled = prefs.getBool(notificationsEnabledKey) ?? true;
    final deviceId = prefs.getString(deviceIdKey) ?? '';
    final lastSyncMillis = prefs.getInt(lastSyncTimeKey);

    return SettingsSnapshot(
      serverUrl: server,
      darkMode: darkMode,
      notificationsEnabled: notificationsEnabled,
      deviceId: deviceId,
      lastSyncTime: lastSyncMillis == null
          ? null
          : DateTime.fromMillisecondsSinceEpoch(lastSyncMillis),
    );
  }

  Future<void> saveServerUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(serverUrlKey, url);
    await ApiSettingsStorage.saveBaseUrl(url);
  }

  Future<void> saveDarkMode(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(darkModeKey, value);
  }

  Future<void> saveNotificationsEnabled(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(notificationsEnabledKey, value);
  }

  Future<void> saveDeviceId(String id) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(deviceIdKey, id);
  }

  Future<void> saveLastSyncTime(DateTime value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(lastSyncTimeKey, value.millisecondsSinceEpoch);
  }

  Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }
}

final settingsRepositoryProvider = Provider<SettingsRepository>((ref) {
  return SettingsRepository();
});
