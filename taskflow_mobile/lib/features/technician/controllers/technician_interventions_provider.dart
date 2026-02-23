import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/repositories/intervention_repository.dart';
import '../../../domain/models/intervention.dart';
import '../../auth/controllers/auth_provider.dart';

enum TechnicianTab { ongoing, completed }

class TechnicianInterventionsState {
  const TechnicianInterventionsState({
    required this.isLoading,
    required this.isOnline,
    required this.isActionInProgress,
    required this.pendingSyncCount,
    required this.tab,
    required this.allInterventions,
    required this.error,
  });

  final bool isLoading;
  final bool isOnline;
  final bool isActionInProgress;
  final int pendingSyncCount;
  final TechnicianTab tab;
  final List<Intervention> allInterventions;
  final String? error;

  List<Intervention> ongoingFor(String technicianId) {
    return allInterventions.where((item) {
      if (item.status == InterventionStatus.enAttente) {
        return true;
      }
      if (item.status == InterventionStatus.affectee ||
          item.status == InterventionStatus.enCours) {
        return item.technicienId == technicianId;
      }
      return false;
    }).toList()
      ..sort((a, b) => b.dateDemande.compareTo(a.dateDemande));
  }

  List<Intervention> completedFor(String technicianId) {
    return allInterventions
        .where((item) =>
            item.status == InterventionStatus.terminee &&
            item.technicienId == technicianId)
        .toList()
      ..sort((a, b) => b.dateDemande.compareTo(a.dateDemande));
  }

  factory TechnicianInterventionsState.initial() {
    return const TechnicianInterventionsState(
      isLoading: true,
      isOnline: true,
      isActionInProgress: false,
      pendingSyncCount: 0,
      tab: TechnicianTab.ongoing,
      allInterventions: [],
      error: null,
    );
  }

  TechnicianInterventionsState copyWith({
    bool? isLoading,
    bool? isOnline,
    bool? isActionInProgress,
    int? pendingSyncCount,
    TechnicianTab? tab,
    List<Intervention>? allInterventions,
    String? error,
    bool clearError = false,
  }) {
    return TechnicianInterventionsState(
      isLoading: isLoading ?? this.isLoading,
      isOnline: isOnline ?? this.isOnline,
      isActionInProgress: isActionInProgress ?? this.isActionInProgress,
      pendingSyncCount: pendingSyncCount ?? this.pendingSyncCount,
      tab: tab ?? this.tab,
      allInterventions: allInterventions ?? this.allInterventions,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

final technicianInterventionsProvider = StateNotifierProvider.autoDispose<
    TechnicianInterventionsNotifier, TechnicianInterventionsState>((ref) {
  final repository = ref.read(interventionRepositoryProvider);
  final technicianId = ref.read(authProvider).user?.id ?? '';
  final notifier =
      TechnicianInterventionsNotifier(repository, technicianId: technicianId);
  notifier.initialize();
  ref.onDispose(notifier.dispose);
  return notifier;
});

class TechnicianInterventionsNotifier
    extends StateNotifier<TechnicianInterventionsState> {
  TechnicianInterventionsNotifier(this._repository,
      {required this.technicianId})
      : super(TechnicianInterventionsState.initial());

  final InterventionRepository _repository;
  final String technicianId;
  Timer? _syncTimer;

  Future<void> initialize() async {
    await _repository.loadLookups();
    await load();
    _syncTimer =
        Timer.periodic(const Duration(seconds: 20), (_) => syncPending());
  }

  void setTab(TechnicianTab value) {
    state = state.copyWith(tab: value);
  }

  Future<void> load() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final list = await _repository.getInterventions();
      final pending = await _repository.pendingCount();
      state = state.copyWith(
        isLoading: false,
        isOnline: true,
        allInterventions: list,
        pendingSyncCount: pending,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        isOnline: false,
        error: e.toString(),
      );
    }
  }

  Future<String?> takeOwnership(String interventionId) async {
    state = state.copyWith(isActionInProgress: true, clearError: true);
    try {
      await _repository.affectIntervention(
        interventionId: interventionId,
        technicianId: technicianId,
      );
      await load();
      return null;
    } on DioException catch (e) {
      await load();
      final code = e.response?.statusCode;
      if (code == 409 || code == 400) {
        return 'Intervention deja prise par un collegue.';
      }
      return _readableError(e);
    } catch (_) {
      await load();
      return 'Impossible de prendre en charge cette intervention.';
    } finally {
      state = state.copyWith(isActionInProgress: false);
    }
  }

  Future<String?> start(String interventionId) async {
    state = state.copyWith(isActionInProgress: true, clearError: true);
    try {
      await _repository.startIntervention(interventionId);
      await load();
      return null;
    } on DioException catch (e) {
      await load();
      return _readableError(e);
    } catch (_) {
      await load();
      return 'Impossible de demarrer cette intervention.';
    } finally {
      state = state.copyWith(isActionInProgress: false);
    }
  }

  Future<String?> finish(String interventionId) async {
    state = state.copyWith(isActionInProgress: true, clearError: true);
    try {
      await _repository.finishIntervention(interventionId: interventionId);
      await load();
      return null;
    } on DioException catch (e) {
      await load();
      return _readableError(e);
    } catch (_) {
      await load();
      return 'Impossible de terminer cette intervention.';
    } finally {
      state = state.copyWith(isActionInProgress: false);
    }
  }

  Future<void> syncPending() async {
    try {
      await _repository.syncPending();
      final pending = await _repository.pendingCount();
      state = state.copyWith(isOnline: true, pendingSyncCount: pending);
    } catch (_) {
      state = state.copyWith(isOnline: false);
    }
  }

  String _readableError(DioException error) {
    final code = error.response?.statusCode;
    if (code == 400 || code == 409) {
      return 'Conflit detecte. Rafraichissez la liste.';
    }
    return 'Erreur reseau, operation reportee si hors-ligne.';
  }

  @override
  void dispose() {
    _syncTimer?.cancel();
    super.dispose();
  }
}
