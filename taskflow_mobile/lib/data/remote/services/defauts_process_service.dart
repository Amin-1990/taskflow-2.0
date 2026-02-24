import 'package:dio/dio.dart';

import '../../../domain/models/article.dart';
import '../../../domain/models/defaut_process.dart';
import '../../../domain/models/operateur.dart';
import '../../../domain/models/poste.dart';
import '../../../domain/models/semaine.dart';
import '../../../domain/models/type_defaut.dart';

class DefautsProcessService {
  DefautsProcessService(this._dio);

  final Dio _dio;

  Future<List<Poste>> getPostes() async {
    final response = await _dio.get<Map<String, dynamic>>('/api/postes');
    final body = response.data ?? <String, dynamic>{};
    final data = body['data'];
    if (data is! List) {
      return const [];
    }
    return data.whereType<Map<String, dynamic>>().map(Poste.fromJson).toList();
  }

  Future<List<Semaine>> getSemaines() async {
    final response = await _dio.get<Map<String, dynamic>>('/api/semaines');
    final body = response.data ?? <String, dynamic>{};
    final root = body['data'];
    final data = root is Map<String, dynamic> ? root['data'] : root;
    if (data is! List) {
      return const [];
    }

    return data
        .whereType<Map<String, dynamic>>()
        .map((e) {
          final code = (e['Code_semaine'] ?? '').toString();
          final numero =
              int.tryParse((e['Numero_semaine'] ?? '0').toString()) ?? 0;
          final annee = int.tryParse((e['Annee'] ?? '0').toString()) ?? 0;
          return Semaine(
            id: (e['ID'] ?? '').toString(),
            codeSemaine: code,
            numeroSemaine: numero,
            annee: annee,
          );
        })
        .toList();
  }

  Future<List<Operateur>> getOperateurs() async {
    final response = await _dio.get<Map<String, dynamic>>('/api/personnel');
    final body = response.data ?? <String, dynamic>{};
    final data = body['data'];
    if (data is! List) {
      return const [];
    }
    return data
        .whereType<Map<String, dynamic>>()
        .map(Operateur.fromJson)
        .where((o) => o.isActive)
        .toList();
  }

  Future<List<TypeDefaut>> getTypesDefaut() async {
    final response =
        await _dio.get<Map<String, dynamic>>('/api/defauts-produit');
    final body = response.data ?? <String, dynamic>{};
    final data = body['data'];
    if (data is! List) {
      return const [];
    }
    return data
        .whereType<Map<String, dynamic>>()
        .map(TypeDefaut.fromJson)
        .toList();
  }

  Future<List<Article>> searchArticles(String query) async {
    final response = await _dio.get<Map<String, dynamic>>('/api/articles');
    final body = response.data ?? <String, dynamic>{};
    final data = body['data'];
    if (data is! List) {
      return const [];
    }

    final all =
        data.whereType<Map<String, dynamic>>().map(Article.fromJson).toList();
    final q = query.toLowerCase();
    if (q.isEmpty) {
      return all.take(20).toList();
    }

    return all
        .where((a) =>
            a.code.toLowerCase().contains(q) ||
            a.name.toLowerCase().contains(q))
        .toList();
  }

  Future<void> createDefautProcess(DefautProcess defaut) async {
    await _dio.post('/api/defauts-process', data: defaut.toApiPayload());
  }
}
