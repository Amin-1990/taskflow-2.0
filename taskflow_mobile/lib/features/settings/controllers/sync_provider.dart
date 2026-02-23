import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/services/sync_service.dart';
import '../../../data/repositories/defauts_process_repository.dart';
import '../../../data/repositories/intervention_repository.dart';
import '../../../data/repositories/packaging_repository.dart';
import '../../../data/repositories/settings_repository.dart';
import '../../../data/repositories/task_repository.dart';
import '../../../data/repositories/app_providers.dart';

class SyncState {
  const SyncState({
    required this.isSyncing,
    required this.pendingCount,
    required this.pendingActions,
    this.lastSyncTime,
    this.error,
  });

  final bool isSyncing;
  final int pendingCount;
  final List<PendingActionView> pendingActions;
  final DateTime? lastSyncTime;
  final String? error;

  factory SyncState.initial() {
    return const SyncState(
      isSyncing: false,
      pendingCount: 0,
      pendingActions: [],
    );
  }

  SyncState copyWith({
    bool? isSyncing,
    int? pendingCount,
    List<PendingActionView>? pendingActions,
    DateTime? lastSyncTime,
    String? error,
    bool clearError = false,
  }) {
    return SyncState(
      isSyncing: isSyncing ?? this.isSyncing,
      pendingCount: pendingCount ?? this.pendingCount,
      pendingActions: pendingActions ?? this.pendingActions,
      lastSyncTime: lastSyncTime ?? this.lastSyncTime,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

final syncServiceProvider = Provider<SyncService>((ref) {
  return SyncService(
    pendingDao: ref.watch(pendingActionsDaoProvider),
    taskRepository: ref.watch(taskRepositoryProvider),
    packagingRepository: ref.watch(packagingRepositoryProvider),
    defautsRepository: ref.watch(defautsProcessRepositoryProvider),
    interventionRepository: ref.watch(interventionRepositoryProvider),
  );
});

final syncProvider = StateNotifierProvider<SyncNotifier, SyncState>((ref) {
  final notifier = SyncNotifier(
    ref.watch(syncServiceProvider),
    ref.watch(settingsRepositoryProvider),
  );
  notifier.initialize();
  ref.onDispose(notifier.dispose);
  return notifier;
});

class SyncNotifier extends StateNotifier<SyncState> {
  SyncNotifier(this._syncService, this._settingsRepository)
      : super(SyncState.initial());
  final SyncService _syncService;
  final SettingsRepository _settingsRepository;
  StreamSubscription<int>? _pendingSub;
  Timer? _periodicTimer;

  Future<void> initialize() async {
    final settings = await _settingsRepository.load();
    state = state.copyWith(lastSyncTime: settings.lastSyncTime);
    await refreshPending();

    _pendingSub = _syncService.watchPendingCount().listen((count) {
      state = state.copyWith(pendingCount: count);
    });

    _periodicTimer = Timer.periodic(const Duration(seconds: 35), (_) async {
      if (state.pendingCount <= 0 || state.isSyncing) {
        return;
      }
      await syncNow(silent: true);
    });
  }

  Future<void> refreshPending() async {
    final actions = await _syncService.getPendingActionsWithDetails();
    state = state.copyWith(
      pendingCount: actions.length,
      pendingActions: actions,
    );
  }

  Future<SyncResult> syncNow({bool silent = false}) async {
    if (state.isSyncing) {
      return const SyncResult(
        initialPending: 0,
        finalPending: 0,
        syncedCount: 0,
        failedCount: 0,
      );
    }

    state = state.copyWith(isSyncing: true, clearError: true);
    try {
      final result = await _syncService.syncAll();
      final now = DateTime.now();
      await _settingsRepository.saveLastSyncTime(now);
      await refreshPending();
      state = state.copyWith(
        isSyncing: false,
        lastSyncTime: now,
      );
      return result;
    } catch (e) {
      state = state.copyWith(
        isSyncing: false,
        error: silent ? null : e.toString(),
      );
      return SyncResult(
        initialPending: state.pendingCount,
        finalPending: state.pendingCount,
        syncedCount: 0,
        failedCount: state.pendingCount,
      );
    }
  }

  Future<void> clearLocalData() async {
    await _syncService.clearPendingActions();
    state = state.copyWith(
      pendingCount: 0,
      pendingActions: const [],
    );
  }

  @override
  void dispose() {
    _pendingSub?.cancel();
    _periodicTimer?.cancel();
    super.dispose();
  }
}
