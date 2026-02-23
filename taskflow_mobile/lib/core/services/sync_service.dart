import '../../data/local/daos/pending_actions_dao.dart';
import '../../data/repositories/defauts_process_repository.dart';
import '../../data/repositories/intervention_repository.dart';
import '../../data/repositories/packaging_repository.dart';
import '../../data/repositories/task_repository.dart';

class PendingActionView {
  const PendingActionView({
    required this.id,
    required this.title,
    required this.description,
    required this.statusLabel,
    required this.type,
    required this.createdAt,
    required this.retryCount,
    this.meta,
  });

  final String id;
  final String title;
  final String description;
  final String statusLabel;
  final String type;
  final DateTime createdAt;
  final int retryCount;
  final String? meta;
}

class SyncResult {
  const SyncResult({
    required this.initialPending,
    required this.finalPending,
    required this.syncedCount,
    required this.failedCount,
  });

  final int initialPending;
  final int finalPending;
  final int syncedCount;
  final int failedCount;

  bool get success => failedCount == 0;
}

class SyncService {
  SyncService({
    required PendingActionsDao pendingDao,
    required TaskRepository taskRepository,
    required PackagingRepository packagingRepository,
    required DefautsProcessRepository defautsRepository,
    required InterventionRepository interventionRepository,
  })  : _pendingDao = pendingDao,
        _taskRepository = taskRepository,
        _packagingRepository = packagingRepository,
        _defautsRepository = defautsRepository,
        _interventionRepository = interventionRepository;

  final PendingActionsDao _pendingDao;
  final TaskRepository _taskRepository;
  final PackagingRepository _packagingRepository;
  final DefautsProcessRepository _defautsRepository;
  final InterventionRepository _interventionRepository;

  Future<SyncResult> syncAll() async {
    final initialPending = await getPendingCount();
    var synced = 0;

    synced += await _taskRepository.syncPending();
    synced += await _packagingRepository.syncPendingValidations();
    synced += await _defautsRepository.syncPending();
    synced += await _interventionRepository.syncPending();

    final finalPending = await getPendingCount();
    return SyncResult(
      initialPending: initialPending,
      finalPending: finalPending,
      syncedCount: synced,
      failedCount: finalPending,
    );
  }

  Future<int> getPendingCount() async {
    final all = await _pendingDao.getAll();
    return all.length;
  }

  Future<List<PendingActionView>> getPendingActionsWithDetails() async {
    final all = await _pendingDao.getAll();
    return all.map(_mapAction).toList();
  }

  Stream<int> watchPendingCount() {
    return _pendingDao.watchAll().map((items) => items.length);
  }

  Future<void> clearPendingActions() => _pendingDao.clearAll();

  PendingActionView _mapAction(PendingActionPayload payload) {
    final data = payload.data;
    switch (payload.type) {
      case 'CREATE_TASK':
        return PendingActionView(
          id: payload.id,
          title: 'Nouvelle affectation',
          description:
              'Article ${data['articleId'] ?? '-'} • Poste ${data['workstationId'] ?? '-'}',
          statusLabel: 'En attente',
          type: payload.type,
          createdAt: payload.createdAt,
          retryCount: payload.retryCount,
        );
      case 'FINISH_TASK':
        return PendingActionView(
          id: payload.id,
          title: 'Fin de production',
          description: 'Quantite ${(data['quantity'] ?? 0)} pcs',
          statusLabel: 'En attente',
          type: payload.type,
          createdAt: payload.createdAt,
          retryCount: payload.retryCount,
          meta: (data['notes'] ?? '').toString().trim().isEmpty
              ? null
              : data['notes'].toString(),
        );
      case 'PACKAGING_VALIDATE':
        return PendingActionView(
          id: payload.id,
          title: 'Saisie emballage',
          description:
              'Lot ${data['orderId'] ?? '-'} • +${data['quantity'] ?? 0}',
          statusLabel: 'En attente',
          type: payload.type,
          createdAt: payload.createdAt,
          retryCount: payload.retryCount,
        );
      case 'CREATE_DEFECT_PROCESS':
        return PendingActionView(
          id: payload.id,
          title: 'Defaut process',
          description:
              'Article ${data['Code_article'] ?? '-'} • ${data['Code_defaut'] ?? '-'}',
          statusLabel: 'En attente',
          type: payload.type,
          createdAt: payload.createdAt,
          retryCount: payload.retryCount,
        );
      case 'CREATE_INTERVENTION':
        return PendingActionView(
          id: payload.id,
          title: 'Demande intervention',
          description:
              'Machine ${data['machineId'] ?? '-'} • ${data['description'] ?? ''}',
          statusLabel: 'En attente',
          type: payload.type,
          createdAt: payload.createdAt,
          retryCount: payload.retryCount,
        );
      case 'AFFECT_INTERVENTION':
        return PendingActionView(
          id: payload.id,
          title: 'Prise en charge',
          description: 'Intervention #${data['interventionId'] ?? '-'}',
          statusLabel: 'En attente',
          type: payload.type,
          createdAt: payload.createdAt,
          retryCount: payload.retryCount,
        );
      case 'START_INTERVENTION':
        return PendingActionView(
          id: payload.id,
          title: 'Demarrage intervention',
          description: 'Intervention #${data['interventionId'] ?? '-'}',
          statusLabel: 'En attente',
          type: payload.type,
          createdAt: payload.createdAt,
          retryCount: payload.retryCount,
        );
      case 'FINISH_INTERVENTION':
        return PendingActionView(
          id: payload.id,
          title: 'Cloture intervention',
          description: 'Intervention #${data['interventionId'] ?? '-'}',
          statusLabel: 'En attente',
          type: payload.type,
          createdAt: payload.createdAt,
          retryCount: payload.retryCount,
        );
      default:
        return PendingActionView(
          id: payload.id,
          title: payload.type,
          description: 'Action en attente',
          statusLabel: 'En attente',
          type: payload.type,
          createdAt: payload.createdAt,
          retryCount: payload.retryCount,
        );
    }
  }
}
