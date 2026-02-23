import 'dart:math';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/models/article.dart';
import '../../domain/models/defaut_process.dart';
import '../../domain/models/operateur.dart';
import '../../domain/models/poste.dart';
import '../../domain/models/semaine.dart';
import '../../domain/models/type_defaut.dart';
import '../local/daos/pending_actions_dao.dart';
import '../remote/services/defauts_process_service.dart';
import 'app_providers.dart';

final defautsProcessServiceProvider = Provider<DefautsProcessService>((ref) {
  final api = ref.watch(apiClientProvider);
  return DefautsProcessService(api.client);
});

final defautsProcessRepositoryProvider =
    Provider<DefautsProcessRepository>((ref) {
  return DefautsProcessRepository(
    ref.watch(defautsProcessServiceProvider),
    ref.watch(pendingActionsDaoProvider),
  );
});

class DefautsLookups {
  const DefautsLookups({
    required this.postes,
    required this.semaines,
    required this.operateurs,
    required this.typesDefaut,
  });

  final List<Poste> postes;
  final List<Semaine> semaines;
  final List<Operateur> operateurs;
  final List<TypeDefaut> typesDefaut;
}

class DefautsProcessRepository {
  DefautsProcessRepository(this._service, this._pendingDao);

  final DefautsProcessService _service;
  final PendingActionsDao _pendingDao;

  List<Poste> _postes = const [];
  List<Semaine> _semaines = const [];
  List<Operateur> _operateurs = const [];
  List<TypeDefaut> _types = const [];

  Future<DefautsLookups> loadLookups() async {
    try {
      final results = await Future.wait([
        _service.getPostes(),
        _service.getSemaines(),
        _service.getOperateurs(),
        _service.getTypesDefaut(),
      ]);

      _postes = (results[0] as List<Poste>)
        ..sort((a, b) => a.name.compareTo(b.name));
      _semaines = (results[1] as List<Semaine>)
        ..sort((a, b) => b.label.compareTo(a.label));
      _operateurs = (results[2] as List<Operateur>)
        ..sort((a, b) => a.fullName.compareTo(b.fullName));
      _types = (results[3] as List<TypeDefaut>)
        ..sort((a, b) => a.code.compareTo(b.code));
    } on DioException {
      if (_postes.isEmpty) {
        _postes = const [
          Poste(
              id: '1',
              name: 'Poste de montage #42',
              code: 'P42',
              isActive: true),
          Poste(
              id: '2',
              name: 'Ligne A - Assemblage',
              code: 'LA1',
              isActive: true),
        ];
      }
      if (_semaines.isEmpty) {
        _semaines = const [
          Semaine(id: '1', label: '2023-W42'),
          Semaine(id: '2', label: '2023-W41'),
        ];
      }
      if (_operateurs.isEmpty) {
        _operateurs = const [
          Operateur(
              id: '10',
              firstName: 'Marc',
              lastName: 'Johnson',
              matricule: 'OP-782',
              isActive: true),
          Operateur(
              id: '11',
              firstName: 'Sara',
              lastName: 'Bell',
              matricule: 'OP-511',
              isActive: true),
        ];
      }
      if (_types.isEmpty) {
        _types = const [
          TypeDefaut(
              code: 'D-001', description: 'Bavure usinage', categorie: 'D'),
          TypeDefaut(
              code: 'D-102', description: 'Mauvais percage', categorie: 'D'),
        ];
      }
    }

    return DefautsLookups(
      postes: _postes,
      semaines: _semaines,
      operateurs: _operateurs,
      typesDefaut: _types,
    );
  }

  Future<List<Article>> searchArticles(String query) async {
    try {
      return await _service.searchArticles(query);
    } on DioException {
      return const [
        Article(id: '100', code: 'REF-99201', name: 'Bolt Assembly AX-9920'),
        Article(id: '101', code: 'AL-9920-X', name: 'Boitier Aluminium CNC V2'),
      ]
          .where((a) =>
              a.code.toLowerCase().contains(query.toLowerCase()) ||
              a.name.toLowerCase().contains(query.toLowerCase()))
          .toList();
    }
  }

  Future<void> submitDefaut(DefautProcess defaut) async {
    try {
      await _service.createDefautProcess(defaut);
    } on DioException {
      final id =
          'defect-${DateTime.now().millisecondsSinceEpoch}-${Random().nextInt(9999)}';
      await _pendingDao.enqueue(
          id: id, type: 'CREATE_DEFECT_PROCESS', data: defaut.toApiPayload());
    }
  }

  Future<int> pendingCount() async {
    final all = await _pendingDao.getAll();
    return all.where((e) => e.type == 'CREATE_DEFECT_PROCESS').length;
  }

  Future<int> syncPending() async {
    final items = await _pendingDao.getAll();
    var synced = 0;

    for (final item in items.where((e) => e.type == 'CREATE_DEFECT_PROCESS')) {
      try {
        await _service.createDefautProcess(_fromPayload(item.data));
        await _pendingDao.remove(item.id);
        synced++;
      } catch (_) {
        await _pendingDao.incrementRetry(item.id);
      }
    }

    return synced;
  }

  DefautProcess _fromPayload(Map<String, dynamic> payload) {
    return DefautProcess(
      posteId: (payload['ID_Poste'] ?? '').toString(),
      semaineId: (payload['semaineId'] ?? '').toString(),
      articleId: (payload['ID_Article'] ?? '').toString(),
      articleCode: (payload['Code_article'] ?? '').toString(),
      operateurId: (payload['ID_Operateur'] ?? '').toString(),
      codeDefaut: (payload['Code_defaut'] ?? '').toString(),
      descriptionDefaut: (payload['Description_defaut'] ?? '').toString(),
      quantite: (payload['Quantite_concernee'] as num?)?.toInt() ?? 1,
      dateEnregistrement: DateTime.now(),
      enregistreurId: (payload['ID_Enregistreur'] ?? '').toString(),
    );
  }
}
