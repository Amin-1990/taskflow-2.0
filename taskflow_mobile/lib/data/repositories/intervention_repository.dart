import 'dart:math';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/services/timezone_service.dart';
import '../../domain/models/intervention.dart';
import '../../domain/models/maintenance_machine.dart';
import '../../domain/models/type_machine.dart';
import '../../domain/models/type_panne.dart';
import '../local/daos/pending_actions_dao.dart';
import '../remote/services/intervention_service.dart';
import 'app_providers.dart';

final interventionServiceProvider = Provider<InterventionService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return InterventionService(apiClient.client);
});

final interventionRepositoryProvider = Provider<InterventionRepository>((ref) {
  return InterventionRepository(
    ref.watch(interventionServiceProvider),
    ref.watch(pendingActionsDaoProvider),
  );
});

class InterventionLookups {
  const InterventionLookups({
    required this.typeMachines,
    required this.machines,
    required this.typePannes,
  });

  final List<TypeMachine> typeMachines;
  final List<MaintenanceMachine> machines;
  final List<TypePanne> typePannes;
}

class InterventionRepository {
  InterventionRepository(this._service, this._pendingDao);

  final InterventionService _service;
  final PendingActionsDao _pendingDao;

  List<TypeMachine> _cachedTypeMachines = const [];
  List<MaintenanceMachine> _cachedMachines = const [];
  List<TypePanne> _cachedTypePannes = const [];
  List<Intervention> _cachedInterventions = const [];

  Future<InterventionLookups> loadLookups() async {
    try {
      final results = await Future.wait([
        _service.getTypeMachines(),
        _service.getMachines(),
        _service.getTypePannes(),
      ]);
      _cachedTypeMachines = (results[0] as List<TypeMachine>)
        ..sort((a, b) => a.label.compareTo(b.label));
      _cachedMachines = (results[1] as List<MaintenanceMachine>)
        ..sort((a, b) => a.display.compareTo(b.display));
      _cachedTypePannes = (results[2] as List<TypePanne>)
        ..sort((a, b) => a.code.compareTo(b.code));
    } on DioException {
      if (_cachedTypeMachines.isEmpty) {
        _cachedTypeMachines = const [
          TypeMachine(id: '1', label: 'Presse Hydraulique'),
          TypeMachine(id: '2', label: 'Convoyeur'),
          TypeMachine(id: '3', label: 'Compresseur'),
        ];
      }
      if (_cachedMachines.isEmpty) {
        _cachedMachines = const [
          MaintenanceMachine(
            id: '21',
            code: 'P-B2',
            name: 'Presse B2',
            location: 'Atelier Nord',
            description: 'Presse B2 - Atelier Nord',
            typeMachineId: '1',
            typeMachineLabel: 'Presse Hydraulique',
          ),
          MaintenanceMachine(
            id: '22',
            code: 'C-L4',
            name: 'Convoyeur Ligne 4',
            location: 'Quai Chargement',
            description: 'Convoyeur Ligne 4 - Quai Chargement',
            typeMachineId: '2',
            typeMachineLabel: 'Convoyeur',
          ),
        ];
      }
      if (_cachedTypePannes.isEmpty) {
        _cachedTypePannes = const [
          TypePanne(
              id: '301',
              code: 'ELEC-01',
              label: 'Panne electrique',
              category: 'ELEC',
              typeMachineId: '1'),
          TypePanne(
              id: '302',
              code: 'MECA-02',
              label: 'Panne mecanique',
              category: 'MECA',
              typeMachineId: '1'),
          TypePanne(
              id: '303',
              code: 'HYD-03',
              label: 'Fuite hydraulique',
              category: 'HYD',
              typeMachineId: '1'),
        ];
      }
    }

    return InterventionLookups(
      typeMachines: _cachedTypeMachines,
      machines: _cachedMachines,
      typePannes: _cachedTypePannes,
    );
  }

  Future<Intervention> createIntervention({
    required String typeMachineId,
    required String machineId,
    required String demandeurId,
    required String typePanneId,
    required String description,
    required InterventionPriority priority,
  }) async {
    try {
      final created = await _service.createIntervention(
        typeMachineId: typeMachineId,
        machineId: machineId,
        demandeurId: demandeurId,
        typePanneId: typePanneId,
        description: description,
        priority: priority,
      );
      _cachedInterventions = [created, ..._cachedInterventions];
      return created;
    } on DioException {
      final actionId = _actionId('intervention-create');
      await _pendingDao.enqueue(
        id: actionId,
        type: 'CREATE_INTERVENTION',
        data: {
          'typeMachineId': typeMachineId,
          'machineId': machineId,
          'demandeurId': demandeurId,
          'typePanneId': typePanneId,
          'description': description,
          'priority': priority.name,
        },
      );

      final machine = _cachedMachines.firstWhere(
        (m) => m.id == machineId,
        orElse: () => _cachedMachines.first,
      );
      final typePanne = _cachedTypePannes.firstWhere(
        (p) => p.id == typePanneId,
        orElse: () => _cachedTypePannes.first,
      );
      final local = Intervention(
        id: actionId,
        machine: machine,
        typePanne: typePanne.label,
        description: description,
        priority: priority,
        status: InterventionStatus.enAttente,
        dateDemande: TimezoneService.now(),
        demandeurId: demandeurId,
      );
      _cachedInterventions = [local, ..._cachedInterventions];
      return local;
    }
  }

  Future<List<Intervention>> getInterventions() async {
    try {
      final items = await _service.getInterventions();
      final withMachine = items.map(_resolveMachine).toList();
      _cachedInterventions = withMachine;
      return withMachine;
    } on DioException {
      if (_cachedInterventions.isNotEmpty) {
        return _cachedInterventions;
      }
      return _mockInterventions;
    }
  }

  Future<Intervention> affectIntervention({
    required String interventionId,
    required String technicianId,
  }) async {
    try {
      final updated = _resolveMachine(
        await _service.affectIntervention(
          interventionId: interventionId,
          technicianId: technicianId,
        ),
      );
      _replaceInCache(updated);
      return updated;
    } on DioException catch (error) {
      if (error.type == DioExceptionType.connectionError ||
          error.type == DioExceptionType.connectionTimeout) {
        await _pendingDao.enqueue(
          id: _actionId('intervention-affect'),
          type: 'AFFECT_INTERVENTION',
          data: {
            'interventionId': interventionId,
            'technicianId': technicianId
          },
        );
        final optimistic = _updateCachedStatus(
          interventionId,
          InterventionStatus.affectee,
          technicianId: technicianId,
        );
        return optimistic ?? _fallbackIntervention(interventionId);
      }
      rethrow;
    }
  }

  Future<Intervention> startIntervention(String interventionId) async {
    try {
      final updated =
          _resolveMachine(await _service.startIntervention(interventionId));
      _replaceInCache(updated);
      return updated;
    } on DioException catch (error) {
      if (error.type == DioExceptionType.connectionError ||
          error.type == DioExceptionType.connectionTimeout) {
        await _pendingDao.enqueue(
          id: _actionId('intervention-start'),
          type: 'START_INTERVENTION',
          data: {'interventionId': interventionId},
        );
        final optimistic =
            _updateCachedStatus(interventionId, InterventionStatus.enCours);
        return optimistic ?? _fallbackIntervention(interventionId);
      }
      rethrow;
    }
  }

  Future<Intervention> finishIntervention({
    required String interventionId,
    String? commentaire,
  }) async {
    try {
      final updated = _resolveMachine(
        await _service.finishIntervention(
          interventionId: interventionId,
          commentaire: commentaire,
        ),
      );
      _replaceInCache(updated);
      return updated;
    } on DioException catch (error) {
      if (error.type == DioExceptionType.connectionError ||
          error.type == DioExceptionType.connectionTimeout) {
        await _pendingDao.enqueue(
          id: _actionId('intervention-finish'),
          type: 'FINISH_INTERVENTION',
          data: {'interventionId': interventionId, 'commentaire': commentaire},
        );
        final optimistic =
            _updateCachedStatus(interventionId, InterventionStatus.terminee);
        return optimistic ?? _fallbackIntervention(interventionId);
      }
      rethrow;
    }
  }

  Future<int> syncPending() async {
    final actions = await _pendingDao.getAll();
    var synced = 0;
    for (final action in actions.where((a) =>
        a.type.startsWith('CREATE_INTERVENTION') ||
        a.type.endsWith('_INTERVENTION'))) {
      try {
        switch (action.type) {
          case 'CREATE_INTERVENTION':
            await _service.createIntervention(
              typeMachineId: (action.data['typeMachineId'] ?? '').toString(),
              machineId: (action.data['machineId'] ?? '').toString(),
              demandeurId: (action.data['demandeurId'] ?? '').toString(),
              typePanneId: (action.data['typePanneId'] ?? '').toString(),
              description: (action.data['description'] ?? '').toString(),
              priority: _priorityFromName(
                  (action.data['priority'] ?? 'moyenne').toString()),
            );
            break;
          case 'AFFECT_INTERVENTION':
            await _service.affectIntervention(
              interventionId: (action.data['interventionId'] ?? '').toString(),
              technicianId: (action.data['technicianId'] ?? '').toString(),
            );
            break;
          case 'START_INTERVENTION':
            await _service.startIntervention(
                (action.data['interventionId'] ?? '').toString());
            break;
          case 'FINISH_INTERVENTION':
            await _service.finishIntervention(
              interventionId: (action.data['interventionId'] ?? '').toString(),
              commentaire: action.data['commentaire']?.toString(),
            );
            break;
        }
        await _pendingDao.remove(action.id);
        synced++;
      } catch (_) {
        await _pendingDao.incrementRetry(action.id);
      }
    }

    return synced;
  }

  Future<int> pendingCount() async {
    final actions = await _pendingDao.getAll();
    return actions
        .where((a) =>
            a.type == 'CREATE_INTERVENTION' ||
            a.type == 'AFFECT_INTERVENTION' ||
            a.type == 'START_INTERVENTION' ||
            a.type == 'FINISH_INTERVENTION')
        .length;
  }

  Future<bool> registerFcmToken(String token) =>
      _service.registerFcmToken(token);

  Future<bool> unregisterFcmToken(String token) =>
      _service.unregisterFcmToken(token);

  Intervention _resolveMachine(Intervention intervention) {
    final current = intervention.machine;
    if (current.id.isNotEmpty && current.name.isNotEmpty) {
      return intervention;
    }
    final byId = _cachedMachines.where((m) => m.id == current.id).firstOrNull;
    final byCode =
        _cachedMachines.where((m) => m.code == current.code).firstOrNull;
    final machine = byId ?? byCode ?? current;
    return intervention.copyWith(machine: machine);
  }

  void _replaceInCache(Intervention updated) {
    var found = false;
    final next = _cachedInterventions.map((i) {
      if (i.id == updated.id) {
        found = true;
        return updated;
      }
      return i;
    }).toList();
    if (!found) {
      next.insert(0, updated);
    }
    _cachedInterventions = next;
  }

  Intervention? _updateCachedStatus(
    String interventionId,
    InterventionStatus status, {
    String? technicianId,
  }) {
    Intervention? updated;
    _cachedInterventions = _cachedInterventions.map((item) {
      if (item.id != interventionId) {
        return item;
      }
      updated = item.copyWith(
        status: status,
        technicienId: technicianId ?? item.technicienId,
        datePrise: status == InterventionStatus.affectee
            ? TimezoneService.now()
            : item.datePrise,
        dateDebut: status == InterventionStatus.enCours
            ? TimezoneService.now()
            : item.dateDebut,
        dateFin: status == InterventionStatus.terminee
            ? TimezoneService.now()
            : item.dateFin,
      );
      return updated!;
    }).toList();
    return updated;
  }

  Intervention _fallbackIntervention(String id) {
    return _cachedInterventions.firstWhere(
      (item) => item.id == id,
      orElse: () => _mockInterventions.first,
    );
  }

  InterventionPriority _priorityFromName(String value) {
    switch (value.toLowerCase()) {
      case 'urgente':
        return InterventionPriority.urgente;
      case 'haute':
        return InterventionPriority.haute;
      case 'basse':
        return InterventionPriority.basse;
      default:
        return InterventionPriority.normale;
    }
  }

  String _actionId(String prefix) =>
      '$prefix-${TimezoneService.now().millisecondsSinceEpoch}-${Random().nextInt(9999)}';
}

final _mockInterventions = <Intervention>[
  Intervention(
    id: 'int-1',
    machine: const MaintenanceMachine(
      id: '21',
      code: 'P-B2',
      name: 'PRESSE HYDRAULIQUE B2',
      location: 'Atelier Nord - Zone 2',
      description: 'Presse B2 - Atelier Nord',
      typeMachineId: '1',
      typeMachineLabel: 'Presse Hydraulique',
    ),
    typePanne: 'Panne capteur pression',
    description: 'Capteur instable, arrets intermittents.',
    priority: InterventionPriority.haute,
    status: InterventionStatus.enCours,
    dateDemande: TimezoneService.now().subtract(const Duration(minutes: 50)),
    dateDebut: TimezoneService.now().subtract(const Duration(minutes: 20)),
    technicienId: 'tech-1',
  ),
  Intervention(
    id: 'int-2',
    machine: const MaintenanceMachine(
      id: '22',
      code: 'C-L4',
      name: 'CONVOYEUR LIGNE 4',
      location: 'Quai Chargement',
      description: 'Convoyeur Ligne 4 - Quai Chargement',
      typeMachineId: '2',
      typeMachineLabel: 'Convoyeur',
    ),
    typePanne: 'Maintenance preventive',
    description: 'Graissage des roulements et verification tension bande.',
    priority: InterventionPriority.normale,
    status: InterventionStatus.affectee,
    dateDemande: TimezoneService.now().subtract(const Duration(hours: 1, minutes: 10)),
    datePrise: TimezoneService.now().subtract(const Duration(hours: 1)),
    technicienId: 'tech-1',
  ),
  Intervention(
    id: 'int-3',
    machine: const MaintenanceMachine(
      id: '23',
      code: 'COMP-01',
      name: 'COMPRESSEUR AIR-01',
      location: 'Atelier Sud',
      description: 'Compresseur air - Atelier Sud',
      typeMachineId: '3',
      typeMachineLabel: 'Compresseur',
    ),
    typePanne: 'Releve de compteurs',
    description: 'Controle periodique',
    priority: InterventionPriority.basse,
    status: InterventionStatus.enAttente,
    dateDemande: TimezoneService.now().subtract(const Duration(minutes: 12)),
  ),
];
