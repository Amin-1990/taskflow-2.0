import 'dart:async';

import 'package:dio/dio.dart';

import '../local/prefs/token_storage.dart';

class ApiClient {
  ApiClient({
    required TokenStorage tokenStorage,
    required String baseUrl,
    Duration connectTimeout = const Duration(seconds: 15),
    Duration sendTimeout = const Duration(seconds: 15),
    Duration receiveTimeout = const Duration(seconds: 30),
  })  : _tokenStorage = tokenStorage,
        _baseUrl = baseUrl,
        _connectTimeout = connectTimeout,
        _sendTimeout = sendTimeout,
        _receiveTimeout = receiveTimeout,
        _dio = Dio(
          BaseOptions(
            baseUrl: baseUrl,
            connectTimeout: connectTimeout,
            sendTimeout: sendTimeout,
            receiveTimeout: receiveTimeout,
            responseType: ResponseType.json,
          ),
        ) {
    _dio.interceptors.add(
      QueuedInterceptorsWrapper(
        onRequest: _onRequest,
        onError: _onError,
      ),
    );

    _dio.interceptors.add(
      LogInterceptor(
        request: true,
        requestHeader: true,
        requestBody: true,
        responseHeader: false,
        responseBody: true,
        error: true,
      ),
    );
  }

  final Dio _dio;
  final TokenStorage _tokenStorage;
  final Duration _connectTimeout;
  final Duration _sendTimeout;
  final Duration _receiveTimeout;

  String _baseUrl;
  Completer<void>? _refreshCompleter;

  Dio get client => _dio;
  String get baseUrl => _baseUrl;

  Future<void> updateBaseUrl(String newBaseUrl) async {
    _baseUrl = newBaseUrl;
    _dio.options.baseUrl = newBaseUrl;
  }

  Future<void> _onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _tokenStorage.getAccessToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  Future<void> _onError(
    DioException error,
    ErrorInterceptorHandler handler,
  ) async {
    final request = error.requestOptions;
    final statusCode = error.response?.statusCode;

    final isUnauthorized = statusCode == 401;
    final isRefreshCall = request.path.contains('/api/auth/refresh-token');
    final isRetried = request.extra['retried'] == true;

    if (!isUnauthorized || isRefreshCall || isRetried) {
      handler.next(error);
      return;
    }

    try {
      await _refreshToken();

      final newToken = await _tokenStorage.getAccessToken();
      if (newToken == null || newToken.isEmpty) {
        handler.next(error);
        return;
      }

      final retryOptions = request.copyWith(
        headers: Map<String, dynamic>.from(request.headers)
          ..['Authorization'] = 'Bearer $newToken',
        extra: Map<String, dynamic>.from(request.extra)..['retried'] = true,
      );

      final response = await _dio.fetch(retryOptions);
      handler.resolve(response);
    } catch (_) {
      await _tokenStorage.clear();
      handler.next(error);
    }
  }

  Future<void> _refreshToken() async {
    if (_refreshCompleter != null) {
      return _refreshCompleter!.future;
    }

    _refreshCompleter = Completer<void>();

    try {
      final currentTokens = await _tokenStorage.getTokens();
      if (currentTokens == null) {
        throw StateError('No token available for refresh');
      }

      final refreshDio = Dio(
        BaseOptions(
          baseUrl: _baseUrl,
          connectTimeout: _connectTimeout,
          sendTimeout: _sendTimeout,
          receiveTimeout: _receiveTimeout,
          responseType: ResponseType.json,
          headers: {
            'Authorization': 'Bearer ${currentTokens.accessToken}',
          },
        ),
      );

      final response = await refreshDio.post<Map<String, dynamic>>(
        '/api/auth/refresh-token',
        data: currentTokens.refreshToken == null
            ? null
            : {'refreshToken': currentTokens.refreshToken},
      );

      final data = response.data ?? <String, dynamic>{};
      final nestedData = (data['data'] as Map<String, dynamic>?) ?? data;
      final newAccessToken = nestedData['token'] as String?;
      final newRefreshToken = nestedData['refreshToken'] as String?;

      if (newAccessToken == null || newAccessToken.isEmpty) {
        throw StateError('Refresh token response does not contain token');
      }

      await _tokenStorage.saveTokens(
        TokenPair(
          accessToken: newAccessToken,
          refreshToken: newRefreshToken ?? currentTokens.refreshToken,
        ),
      );

      _refreshCompleter!.complete();
    } catch (e) {
      _refreshCompleter!.completeError(e);
      rethrow;
    } finally {
      _refreshCompleter = null;
    }
  }
}
