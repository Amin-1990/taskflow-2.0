import 'package:dio/dio.dart';

import '../../../domain/models/operator_dashboard_data.dart';
import '../../../domain/models/production_stats.dart';
import '../../../domain/models/user_context.dart';

class OperatorService {
  OperatorService(this._dio);

  final Dio _dio;

  Future<OperatorDashboardData> getDashboardStats(String operatorId) async {
    final response = await _dio.get<Map<String, dynamic>>(
        '/api/affectations/operateur/$operatorId/stats');
    final body = response.data ?? <String, dynamic>{};
    final data = (body['data'] as Map<String, dynamic>?) ?? body;
    return OperatorDashboardData.fromJson(data);
  }

  Future<ProductionStats> getTodayProduction() async {
    final response = await _dio
        .get<Map<String, dynamic>>('/api/commandes/statistiques/aujourdhui');
    final body = response.data ?? <String, dynamic>{};
    final data = (body['data'] as Map<String, dynamic>?) ?? body;
    return ProductionStats.fromJson(data);
  }

  Future<UserContext> getUserContext(String userId) async {
    final response =
        await _dio.get<Map<String, dynamic>>('/api/personnel/$userId/contexte');
    final body = response.data ?? <String, dynamic>{};
    final data = (body['data'] as Map<String, dynamic>?) ?? body;
    return UserContext.fromJson(data);
  }
}
