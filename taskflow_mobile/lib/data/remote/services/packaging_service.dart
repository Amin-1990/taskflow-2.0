import 'package:dio/dio.dart';

import '../../../domain/models/commande_emballage.dart';

class PackagingService {
  PackagingService(this._dio);

  final Dio _dio;

  Future<List<CommandeEmballage>> getPackagingOrders(
      {required String operatorId}) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/api/commandes',
      queryParameters: {'limit': 100},
    );

    final body = response.data ?? <String, dynamic>{};
    final data = body['data'];
    if (data is! List) {
      return const [];
    }

    return data
        .whereType<Map<String, dynamic>>()
        .map(CommandeEmballage.fromJson)
        .where((order) => order.dailyTarget > 0)
        .toList();
  }

  Future<CommandeEmballage> validatePeriodQuantity({
    required String orderId,
    required int quantity,
    required String periodLabel,
  }) async {
    await _dio.patch<Map<String, dynamic>>(
      '/api/commandes/$orderId/emballe',
      data: {'quantite': quantity, 'periodLabel': periodLabel},
    );

    final stats = await _dio
        .get<Map<String, dynamic>>('/api/commandes/$orderId/emballage/stats');
    final body = stats.data ?? <String, dynamic>{};
    final data = (body['data'] as Map<String, dynamic>?) ?? body;

    return CommandeEmballage.fromJson(data);
  }
}
