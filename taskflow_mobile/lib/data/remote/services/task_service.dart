import 'package:dio/dio.dart';

import '../../../domain/models/article.dart';
import '../../../domain/models/operateur.dart';
import '../../../domain/models/semaine.dart';
import '../../../domain/models/task.dart';
import '../../../domain/models/workstation.dart';

class TaskService {
  TaskService(this._dio);

  final Dio _dio;

  Future<Task?> getCurrentTask(String operatorId) async {
    final response = await _dio.get<Map<String, dynamic>>(
        '/api/affectations/operateur/$operatorId/en-cours');
    final body = response.data ?? <String, dynamic>{};
    final data = (body['data'] as Map<String, dynamic>?) ?? body;
    if (data.isEmpty) {
      return null;
    }
    return Task.fromJson(data);
  }

  Future<List<Article>> searchArticles(String query) async {
    final response = await _dio.get<Map<String, dynamic>>(
        '/api/articles/recherche',
        queryParameters: {'q': query});
    final body = response.data ?? <String, dynamic>{};
    final data = body['data'];
    if (data is! List) {
      return const [];
    }
    return data
        .whereType<Map<String, dynamic>>()
        .map(Article.fromJson)
        .toList();
  }

  Future<List<Workstation>> getAvailableWorkstations() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/api/postes');
      final body = response.data ?? <String, dynamic>{};
      final data = body['data'];
      if (data is! List) {
        return const [];
      }
      return data
          .whereType<Map<String, dynamic>>()
          .map(Workstation.fromJson)
          .toList();
    } on DioException {
      final response =
          await _dio.get<Map<String, dynamic>>('/api/postes/disponibles');
      final body = response.data ?? <String, dynamic>{};
      final data = body['data'];
      if (data is! List) {
        return const [];
      }
      return data
          .whereType<Map<String, dynamic>>()
          .map(Workstation.fromJson)
          .toList();
    }
  }

  Future<List<Task>> getRecentTasks(String operatorId) async {
    final response = await _dio
        .get<Map<String, dynamic>>('/api/affectations/recentes/$operatorId');
    final body = response.data ?? <String, dynamic>{};
    final data = body['data'];
    if (data is! List) {
      return const [];
    }
    return data.whereType<Map<String, dynamic>>().map(Task.fromJson).toList();
  }

  Future<Task> createAffectation({
    required String operatorId,
    required String articleId,
    required String workstationId,
    required String semaineId,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/affectations',
      data: {
        'operatorId': operatorId,
        'articleId': articleId,
        'workstationId': workstationId,
        'semaineId': semaineId,
      },
    );

    final body = response.data ?? <String, dynamic>{};
    final data = (body['data'] as Map<String, dynamic>?) ?? body;
    return Task.fromJson(data);
  }

  Future<Task> finishTask({
    required String taskId,
    required int quantity,
    String? notes,
  }) async {
    final response = await _dio.patch<Map<String, dynamic>>(
      '/api/affectations/$taskId/terminer',
      data: {
        'quantity': quantity,
        'notes': notes,
      },
    );

    final body = response.data ?? <String, dynamic>{};
    final data = (body['data'] as Map<String, dynamic>?) ?? body;
    return Task.fromJson(data);
  }

  Future<Semaine> getCurrentWeek() async {
    final response =
        await _dio.get<Map<String, dynamic>>('/api/semaines/courante');
    final body = response.data ?? <String, dynamic>{};
    final data = (body['data'] as Map<String, dynamic>?) ?? body;
    return Semaine.fromJson(data);
  }

  Future<List<Semaine>> getWeeks() async {
    final response = await _dio.get<Map<String, dynamic>>('/api/semaines');
    final body = response.data ?? <String, dynamic>{};
    final rawData = body['data'];

    if (rawData is List) {
      return rawData
          .whereType<Map<String, dynamic>>()
          .map(Semaine.fromJson)
          .toList();
    }

    if (rawData is Map<String, dynamic>) {
      final nested = rawData['data'];
      if (nested is List) {
        return nested
            .whereType<Map<String, dynamic>>()
            .map(Semaine.fromJson)
            .toList();
      }
    }

    return const [];
  }

  Future<List<Article>> getArticlesByWeek(String weekId) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/api/commandes/semaine/$weekId',
    );
    final body = response.data ?? <String, dynamic>{};
    final data = body['data'];
    if (data is! List) {
      return const [];
    }

    final articles = data
        .whereType<Map<String, dynamic>>()
        .map((item) {
          return Article.fromJson({
            'ID': item['ID_Article'] ?? item['ID'],
            'Code_article': item['Code_article'],
            'Nom': item['Article_code'] ?? item['Code_article'],
          });
        })
        .where((a) => a.code.trim().isNotEmpty)
        .toList();

    final byCode = <String, Article>{};
    for (final article in articles) {
      byCode.putIfAbsent(article.code, () => article);
    }
    return byCode.values.toList();
  }

  Future<List<Operateur>> getActiveOperators() async {
    final response = await _dio.get<Map<String, dynamic>>('/api/personnel');
    final body = response.data ?? <String, dynamic>{};
    final data = body['data'];
    if (data is! List) {
      return const [];
    }

    return data
        .whereType<Map<String, dynamic>>()
        .map(Operateur.fromJson)
        .where((item) => item.isActive)
        .toList();
  }
}
