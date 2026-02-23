import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/models/operator_dashboard_data.dart';
import '../../domain/models/user.dart';
import '../../domain/models/user_context.dart';
import '../remote/services/operator_service.dart';
import 'app_providers.dart';

final operatorServiceProvider = Provider<OperatorService>((ref) {
  final api = ref.watch(apiClientProvider);
  return OperatorService(api.client);
});

final operatorRepositoryProvider = Provider<OperatorRepository>((ref) {
  return OperatorRepository(ref.watch(operatorServiceProvider));
});

class OperatorRepository {
  OperatorRepository(this._service);

  final OperatorService _service;

  static const OperatorDashboardData _mockData = OperatorDashboardData(
    activeTasks: 3,
    tasksToFinish: 12,
    packagingRate: 0.85,
    processDefects: 1,
    productivity: 0.92,
    targetUnits: 150,
    achievedUnits: 138,
  );

  Future<OperatorDashboardData> getDashboardStats(String userId) async {
    try {
      final dashboard = await _service.getDashboardStats(userId);
      try {
        final production = await _service.getTodayProduction();
        return dashboard.copyWith(
          targetUnits: production.targetUnits,
          achievedUnits: production.achievedUnits,
          productivity: production.productivity,
        );
      } catch (_) {
        return dashboard;
      }
    } on DioException {
      return _mockData;
    }
  }

  Future<UserContext> getUserContext(String userId,
      {User? fallbackUser}) async {
    try {
      final context = await _service.getUserContext(userId);
      return UserContext(
        firstName: context.firstName.isEmpty
            ? (fallbackUser?.firstName ?? 'Marc')
            : context.firstName,
        lastName: context.lastName.isEmpty
            ? (fallbackUser?.lastName ?? 'Johnson')
            : context.lastName,
        line: context.line,
        shift: context.shift,
        lastSync: DateTime.now(),
        isOnline: true,
      );
    } on DioException {
      final user = fallbackUser ??
          const User(
            id: '0',
            email: 'operator@taskflow.local',
            firstName: 'Marc',
            lastName: 'Johnson',
            role: UserRole.operator,
          );
      return UserContext.fromUser(user,
          lastSync: DateTime.now(), isOnline: false);
    }
  }
}
