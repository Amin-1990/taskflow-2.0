import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../data/local/prefs/api_settings_storage.dart';
import '../../../data/local/prefs/token_storage.dart';
import '../../../data/remote/api_client.dart';
import '../../../data/repositories/app_providers.dart';
import '../../../domain/models/auth_result.dart';
import '../../../domain/models/user.dart';

class AuthState {
  const AuthState({
    required this.isLoading,
    required this.user,
    required this.error,
    required this.serverUrl,
  });

  final bool isLoading;
  final User? user;
  final String? error;
  final String? serverUrl;

  bool get isAuthenticated => user != null;

  factory AuthState.initial() {
    return const AuthState(
      isLoading: true,
      user: null,
      error: null,
      serverUrl: null,
    );
  }

  AuthState copyWith({
    bool? isLoading,
    User? user,
    bool clearUser = false,
    String? error,
    bool clearError = false,
    String? serverUrl,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      user: clearUser ? null : (user ?? this.user),
      error: clearError ? null : (error ?? this.error),
      serverUrl: serverUrl ?? this.serverUrl,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._apiClient, this._tokenStorage)
      : super(AuthState.initial());

  static const _userStorageKey = 'auth_user_json';

  final ApiClient _apiClient;
  final TokenStorage _tokenStorage;

  Future<void> checkStoredToken() async {
    final storedServerUrl = await ApiSettingsStorage.getBaseUrl();
    if (storedServerUrl != null && storedServerUrl.isNotEmpty) {
      await _apiClient.updateBaseUrl(storedServerUrl);
      state = state.copyWith(serverUrl: storedServerUrl);
    } else {
      state = state.copyWith(serverUrl: _apiClient.baseUrl);
    }

    final tokens = await _tokenStorage.getTokens();
    if (tokens == null || tokens.accessToken.isEmpty) {
      state = state.copyWith(
        isLoading: false,
        clearUser: true,
        clearError: true,
      );
      return;
    }

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final user = await _fetchProfile();
      state = state.copyWith(isLoading: false, user: user, clearError: true);
    } catch (_) {
      final refreshed = await refreshToken();
      if (!refreshed) {
        await logout(clearServer: false);
        return;
      }

      try {
        final user = await _fetchProfile();
        state = state.copyWith(isLoading: false, user: user, clearError: true);
      } catch (_) {
        await logout(clearServer: false);
      }
    }
  }

  Future<AuthResult?> login(String email, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final response = await _apiClient.client.post<Map<String, dynamic>>(
        '/api/auth/login',
        data: {
          'username': email,
          'password': password,
        },
      );

      final body = response.data ?? <String, dynamic>{};
      final data =
          (body['data'] as Map<String, dynamic>?) ?? <String, dynamic>{};
      final token = (data['token'] ?? '').toString();
      if (token.isEmpty) {
        throw const FormatException(
            'Token absent dans la reponse de connexion.');
      }

      final refreshToken = (data['refreshToken'] ?? '').toString();
      await _tokenStorage.saveTokens(
        TokenPair(
          accessToken: token,
          refreshToken: refreshToken.isEmpty ? null : refreshToken,
        ),
      );

      final user = await _fetchProfile();
      state = state.copyWith(isLoading: false, user: user, clearError: true);

      return AuthResult(
        user: user,
        token: token,
        refreshToken: refreshToken,
        expiresAt: DateTime.now().add(const Duration(days: 7)),
      );
    } on DioException catch (error) {
      state = state.copyWith(isLoading: false, error: _readableError(error));
      return null;
    } on FormatException catch (error) {
      state = state.copyWith(isLoading: false, error: error.message);
      return null;
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        error: 'Impossible de se connecter. Veuillez reessayer.',
      );
      return null;
    }
  }

  Future<bool> refreshToken() async {
    try {
      final response = await _apiClient.client
          .post<Map<String, dynamic>>('/api/auth/refresh-token');
      final body = response.data ?? <String, dynamic>{};
      final data = (body['data'] as Map<String, dynamic>?) ?? body;
      final newToken = (data['token'] ?? '').toString();
      if (newToken.isEmpty) {
        return false;
      }

      final current = await _tokenStorage.getTokens();
      await _tokenStorage.saveTokens(
        TokenPair(accessToken: newToken, refreshToken: current?.refreshToken),
      );

      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> logout({bool clearServer = false}) async {
    try {
      await _apiClient.client.post('/api/auth/logout');
    } catch (_) {
      // API failure should not block local logout.
    }

    await _tokenStorage.clear();

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_userStorageKey);

    if (clearServer) {
      await ApiSettingsStorage.saveBaseUrl('');
      state = state.copyWith(serverUrl: null);
    }

    state = state.copyWith(
      isLoading: false,
      clearUser: true,
      clearError: true,
    );
  }

  Future<void> setServer(String url) async {
    final normalized = _normalizeUrl(url);
    await _apiClient.updateBaseUrl(normalized);
    await ApiSettingsStorage.saveBaseUrl(normalized);

    state = state.copyWith(serverUrl: normalized);
  }

  Future<User> _fetchProfile() async {
    final response =
        await _apiClient.client.get<Map<String, dynamic>>('/api/auth/profile');
    final body = response.data ?? <String, dynamic>{};
    final userJson =
        (body['data'] as Map<String, dynamic>?) ?? <String, dynamic>{};

    final user = User.fromJson(userJson);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userStorageKey, jsonEncode(user.toJson()));

    return user;
  }

  String _normalizeUrl(String value) {
    final trimmed = value.trim();
    if (trimmed.endsWith('/')) {
      return trimmed.substring(0, trimmed.length - 1);
    }
    return trimmed;
  }

  String _readableError(DioException error) {
    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.sendTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.connectionError) {
      return 'Connexion impossible. Verifiez le serveur configure.';
    }

    if (error.response?.statusCode == 401) {
      return 'Identifiant ou mot de passe invalide.';
    }

    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final message = data['error'] ?? data['message'];
      if (message is String && message.trim().isNotEmpty) {
        return message;
      }
    }

    return 'Une erreur est survenue. Veuillez reessayer.';
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(
      ref.read(apiClientProvider), ref.read(tokenStorageProvider));
});
