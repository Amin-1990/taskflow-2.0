import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../../../core/services/device_info_service.dart';
import '../../../core/services/theme_service.dart';
import '../../../data/repositories/app_providers.dart';
import '../../../data/repositories/intervention_repository.dart';
import '../../../data/repositories/settings_repository.dart';
import '../../auth/controllers/auth_provider.dart';
import 'sync_provider.dart';

enum ConnectionStateType { idle, checking, online, offline }

class SettingsState {
  const SettingsState({
    required this.isLoading,
    required this.serverUrl,
    required this.darkMode,
    required this.notificationsEnabled,
    required this.deviceId,
    required this.versionLabel,
    required this.connectionState,
    this.connectionMessage,
    this.connectionLatencyMs,
    this.error,
  });

  final bool isLoading;
  final String serverUrl;
  final bool darkMode;
  final bool notificationsEnabled;
  final String deviceId;
  final String versionLabel;
  final ConnectionStateType connectionState;
  final String? connectionMessage;
  final int? connectionLatencyMs;
  final String? error;

  factory SettingsState.initial() {
    return const SettingsState(
      isLoading: true,
      serverUrl: '',
      darkMode: true,
      notificationsEnabled: true,
      deviceId: '',
      versionLabel: '-',
      connectionState: ConnectionStateType.idle,
    );
  }

  SettingsState copyWith({
    bool? isLoading,
    String? serverUrl,
    bool? darkMode,
    bool? notificationsEnabled,
    String? deviceId,
    String? versionLabel,
    ConnectionStateType? connectionState,
    String? connectionMessage,
    int? connectionLatencyMs,
    String? error,
    bool clearError = false,
  }) {
    return SettingsState(
      isLoading: isLoading ?? this.isLoading,
      serverUrl: serverUrl ?? this.serverUrl,
      darkMode: darkMode ?? this.darkMode,
      notificationsEnabled: notificationsEnabled ?? this.notificationsEnabled,
      deviceId: deviceId ?? this.deviceId,
      versionLabel: versionLabel ?? this.versionLabel,
      connectionState: connectionState ?? this.connectionState,
      connectionMessage: connectionMessage ?? this.connectionMessage,
      connectionLatencyMs: connectionLatencyMs ?? this.connectionLatencyMs,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

final deviceInfoServiceProvider = Provider<DeviceInfoService>((ref) {
  return DeviceInfoService();
});

final themeServiceProvider = Provider<ThemeService>((ref) {
  return ThemeService();
});

final appThemeModeProvider = StateProvider<ThemeMode>((ref) {
  return ThemeMode.dark;
});

final settingsProvider =
    StateNotifierProvider<SettingsNotifier, SettingsState>((ref) {
  final notifier = SettingsNotifier(
    ref,
    ref.watch(settingsRepositoryProvider),
    ref.watch(deviceInfoServiceProvider),
    ref.watch(themeServiceProvider),
    ref.watch(interventionRepositoryProvider),
  );
  notifier.initialize();
  return notifier;
});

class SettingsNotifier extends StateNotifier<SettingsState> {
  SettingsNotifier(
    this._ref,
    this._settingsRepository,
    this._deviceInfoService,
    this._themeService,
    this._interventionRepository,
  ) : super(SettingsState.initial());

  final Ref _ref;
  final SettingsRepository _settingsRepository;
  final DeviceInfoService _deviceInfoService;
  final ThemeService _themeService;
  final InterventionRepository _interventionRepository;

  Future<void> initialize() async {
    state = state.copyWith(isLoading: true);
    final snapshot = await _settingsRepository.load();
    var deviceId = snapshot.deviceId;
    if (deviceId.trim().isEmpty) {
      deviceId = await _deviceInfoService.tryGetStableId() ??
          _deviceInfoService.generateFallbackId();
      await _settingsRepository.saveDeviceId(deviceId);
    }

    final packageInfo = await PackageInfo.fromPlatform();
    final versionLabel =
        '${packageInfo.version} (Build ${packageInfo.buildNumber})';

    _ref.read(appThemeModeProvider.notifier).state =
        _themeService.fromDarkMode(snapshot.darkMode);
    state = state.copyWith(
      isLoading: false,
      serverUrl: snapshot.serverUrl,
      darkMode: snapshot.darkMode,
      notificationsEnabled: snapshot.notificationsEnabled,
      deviceId: deviceId,
      versionLabel: versionLabel,
    );
  }

  Future<void> setServerUrl(String value) async {
    final normalized = value.trim();
    final valid = _isValidUrl(normalized);
    if (!valid) {
      state = state.copyWith(
          error: 'URL invalide. Format attendu: http://... ou https://...');
      return;
    }
    await _settingsRepository.saveServerUrl(normalized);
    await _ref.read(authProvider.notifier).setServer(normalized);
    state = state.copyWith(serverUrl: normalized, clearError: true);
  }

  Future<void> testConnection() async {
    final baseUrl = state.serverUrl.trim();
    if (!_isValidUrl(baseUrl)) {
      state = state.copyWith(
        connectionState: ConnectionStateType.offline,
        connectionMessage: 'URL invalide',
        connectionLatencyMs: null,
      );
      return;
    }

    state = state.copyWith(
      connectionState: ConnectionStateType.checking,
      connectionMessage: 'Test en cours...',
      connectionLatencyMs: null,
    );

    final stopwatch = Stopwatch()..start();
    try {
      final dio = Dio(
        BaseOptions(
          baseUrl: baseUrl,
          connectTimeout: const Duration(seconds: 8),
          receiveTimeout: const Duration(seconds: 8),
        ),
      );
      final response = await dio.get<Map<String, dynamic>>('/api/health');
      stopwatch.stop();
      final ok = response.statusCode == 200;
      state = state.copyWith(
        connectionState:
            ok ? ConnectionStateType.online : ConnectionStateType.offline,
        connectionMessage: ok ? 'Online' : 'Offline',
        connectionLatencyMs: ok ? stopwatch.elapsedMilliseconds : null,
      );
    } catch (e) {
      stopwatch.stop();
      state = state.copyWith(
        connectionState: ConnectionStateType.offline,
        connectionMessage: 'Offline',
        connectionLatencyMs: null,
        error: e.toString(),
      );
    }
  }

  Future<void> setDarkMode(bool value) async {
    await _settingsRepository.saveDarkMode(value);
    _ref.read(appThemeModeProvider.notifier).state =
        _themeService.fromDarkMode(value);
    state = state.copyWith(darkMode: value);
  }

  Future<void> setNotificationsEnabled(bool value) async {
    await _settingsRepository.saveNotificationsEnabled(value);
    if (value) {
      final token =
          await _ref.read(pushNotificationServiceProvider).getCurrentToken();
      if (token != null && token.isNotEmpty) {
        await _interventionRepository.registerFcmToken(token);
      }
    } else {
      final token =
          await _ref.read(pushNotificationServiceProvider).getCurrentToken();
      if (token != null && token.isNotEmpty) {
        await _interventionRepository.unregisterFcmToken(token);
      }
    }
    state = state.copyWith(notificationsEnabled: value);
  }

  Future<void> forceLogout() async {
    await _ref.read(syncProvider.notifier).clearLocalData();
    await _settingsRepository.clearAll();
    await _ref.read(authProvider.notifier).logout(clearServer: true);
  }

  bool _isValidUrl(String value) {
    final uri = Uri.tryParse(value);
    if (uri == null) {
      return false;
    }
    if (uri.host.isEmpty) {
      return false;
    }
    return uri.scheme == 'http' || uri.scheme == 'https';
  }
}
