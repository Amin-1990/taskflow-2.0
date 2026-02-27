import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../../../domain/models/article.dart';
import '../../../domain/models/article_lot.dart';
import '../../../domain/models/operateur.dart';
import '../../../domain/models/semaine.dart';
import '../../../domain/models/task.dart';
import '../../../domain/models/unite.dart';
import '../../../domain/models/workstation.dart';

class TaskService {
  TaskService(this._dio);

  final Dio _dio;

  Future<Task?> getCurrentTask(String operatorId) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
          '/api/affectations/operateur/$operatorId/en-cours');
      final body = response.data ?? <String, dynamic>{};

      // Gérer les différents formats de réponse
      final rawData = body['data'];

      // Cas 1: data est null
      if (rawData == null) {
        return null;
      }

      // Cas 2: data est une liste
      if (rawData is List) {
        if (rawData.isEmpty) {
          return null;
        }
        // Prendre le premier élément si c'est une liste non vide
        final firstItem = rawData.first;
        if (firstItem is Map<String, dynamic>) {
          return Task.fromJson(firstItem);
        }
        return null;
      }

      // Cas 3: data est un Map
      if (rawData is Map<String, dynamic>) {
        if (rawData.isEmpty) {
          return null;
        }
        return Task.fromJson(rawData);
      }

      // Cas 4: data est le body lui-même (pas de clé 'data')
      if (body.isNotEmpty && body.containsKey('ID')) {
        return Task.fromJson(body);
      }

      return null;
    } on DioException catch (e) {
      debugPrint('❌ Erreur réseau getCurrentTask: ${e.message}');
      return null;
    } catch (e) {
      debugPrint('❌ Erreur parsing getCurrentTask: $e');
      return null;
    }
  }

  Future<String?> resolveOperatorIdFromMatricule(String matricule) async {
    final value = matricule.trim();
    if (value.isEmpty) {
      return null;
    }

    try {
      final response = await _dio
          .get<Map<String, dynamic>>('/api/personnel/matricule/$value');
      final body = response.data ?? <String, dynamic>{};
      final rawData = body['data'];
      if (rawData is Map<String, dynamic>) {
        final id = (rawData['ID'] ?? rawData['id'] ?? '').toString();
        return id.isEmpty ? null : id;
      }
      return null;
    } on DioException {
      return null;
    }
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
    required String? commandeId,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/affectations',
      data: {
        'ID_Operateur': int.tryParse(operatorId) ?? operatorId,
        'ID_Article': int.tryParse(articleId) ?? articleId,
        'ID_Poste': int.tryParse(workstationId) ?? workstationId,
        'ID_Semaine': int.tryParse(semaineId) ?? semaineId,
        if (commandeId != null) 'ID_Commande': int.tryParse(commandeId) ?? commandeId,
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
        'quantite_produite': quantity,
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

  Future<List<Operateur>> searchOperators(String query) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/api/personnel/recherche',
        queryParameters: {'q': query},
      );
      final body = response.data ?? <String, dynamic>{};
      final data = body['data'];
      if (data is! List) {
        return const [];
      }

      return data
          .whereType<Map<String, dynamic>>()
          .map(Operateur.fromJson)
          .toList();
    } on DioException {
      return const [];
    }
  }

  Future<List<Semaine>> getSemainesAvecCommandes() async {
    final response = await _dio
        .get<Map<String, dynamic>>('/api/commandes/semaines-disponibles');
    final body = response.data ?? <String, dynamic>{};
    final data = body['data'];
    if (data is! List) {
      return const [];
    }
    return data
        .whereType<Map<String, dynamic>>()
        .map(Semaine.fromJson)
        .toList();
  }

  Future<List<Unite>> getUnitesProduction() async {
    final response =
        await _dio.get<Map<String, dynamic>>('/api/commandes/unites');
    final body = response.data ?? <String, dynamic>{};
    final data = body['data'];
    if (data is! List) {
      return const [];
    }
    return data
        .whereType<String>()
        .map((nom) => Unite(id: nom, nom: nom))
        .toList();
  }

  Future<List<Article>> getArticlesFiltres(String semaineId, String unite) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/api/commandes/articles-filtres',
      queryParameters: {'semaineId': semaineId, 'unite': unite},
    );
    final body = response.data ?? <String, dynamic>{};
    final data = body['data'];
    if (data is! List) {
      return const [];
    }
    return data
        .whereType<Map<String, dynamic>>()
        .map((item) => Article(
              id: (item['id'] ?? item['ID'] ?? '').toString(),
              code: (item['code'] ??
                      item['Code_article'] ??
                      item['codeArticle'] ??
                      '')
                  .toString(),
              name: (item['code'] ??
                      item['Code_article'] ??
                      item['codeArticle'] ??
                      '')
                  .toString(),
              client: null,
            ))
        .toList();
  }

  Future<List<ArticleLot>> getArticlesLotsFiltres(String semaineId, String unite) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/api/commandes/articles-lots-filtres',
      queryParameters: {'semaineId': semaineId, 'unite': unite},
    );
    final body = response.data ?? <String, dynamic>{};
    final data = body['data'];
    if (data is! List) {
      return const [];
    }
    return data
        .whereType<Map<String, dynamic>>()
        .map(ArticleLot.fromJson)
        .toList();
  }
}
