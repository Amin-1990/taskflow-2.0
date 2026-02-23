import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const defaultBaseUrl = 'http://localhost:3000';

  final baseUrl =
      Platform.environment['BACKEND_BASE_URL']?.trim().isNotEmpty == true
          ? Platform.environment['BACKEND_BASE_URL']!.trim()
          : defaultBaseUrl;

  final username = Platform.environment['BACKEND_TEST_USERNAME'];
  final password = Platform.environment['BACKEND_TEST_PASSWORD'];

  final dio = Dio(
    BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 10),
      sendTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 20),
      validateStatus: (_) => true,
    ),
  );

  group('Backend connectivity', () {
    test('GET /api/health responds 200', () async {
      final response = await dio.get<Map<String, dynamic>>('/api/health');

      expect(response.statusCode, 200,
          reason:
              'Endpoint /api/health unreachable or unhealthy on $baseUrl.');
      expect(response.data, isNotNull);
      expect(response.data?['status'], anyOf('OK', 'ok', 'healthy'));
    });

    test('POST /api/auth/login and GET /api/auth/profile', () async {
      if (username == null || username.isEmpty || password == null || password.isEmpty) {
        // Intentionally no credentials in repo. Set env vars to enable this check.
        return;
      }

      final loginResponse = await dio.post<Map<String, dynamic>>(
        '/api/auth/login',
        data: {'username': username, 'password': password},
      );

      expect(loginResponse.statusCode, 200,
          reason: 'Login failed against /api/auth/login.');
      final token = (loginResponse.data?['data'] as Map<String, dynamic>?)?['token']
          as String?;

      expect(token, isNotNull,
          reason: 'Login succeeded but no token returned by backend.');

      final profileResponse = await dio.get<Map<String, dynamic>>(
        '/api/auth/profile',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      expect(profileResponse.statusCode, 200,
          reason: 'Profile endpoint failed after login.');
      expect(profileResponse.data?['success'], true);
    });
  });
}
