import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/repositories/intervention_repository.dart';
import '../../../domain/models/intervention.dart';
import '../../../domain/models/maintenance_machine.dart';
import '../../../domain/models/type_machine.dart';
import '../../../domain/models/type_panne.dart';
import '../../auth/controllers/auth_provider.dart';

class RequestInterventionState {
  const RequestInterventionState({
    required this.isLoading,
    required this.isSubmitting,
    required this.isOnline,
    required this.pendingSyncCount,
    required this.typeMachines,
    required this.machines,
    required this.typePannes,
    required this.selectedTypeMachine,
    required this.selectedMachine,
    required this.selectedTypePanne,
    required this.description,
    required this.priority,
    required this.error,
  });

  final bool isLoading;
  final bool isSubmitting;
  final bool isOnline;
  final int pendingSyncCount;
  final List<TypeMachine> typeMachines;
  final List<MaintenanceMachine> machines;
  final List<TypePanne> typePannes;
  final TypeMachine? selectedTypeMachine;
  final MaintenanceMachine? selectedMachine;
  final TypePanne? selectedTypePanne;
  final String description;
  final InterventionPriority priority;
  final String? error;

  List<MaintenanceMachine> get visibleMachines {
    if (selectedTypeMachine == null) {
      return machines;
    }
    return machines
        .where((m) => m.typeMachineId == selectedTypeMachine!.id)
        .toList();
  }

  List<TypePanne> get visibleTypePannes {
    if (selectedTypeMachine == null) {
      return typePannes;
    }
    return typePannes
        .where((p) => p.typeMachineId == selectedTypeMachine!.id)
        .toList();
  }

  bool get isValid {
    return selectedTypeMachine != null &&
        selectedMachine != null &&
        selectedTypePanne != null &&
        selectedMachine!.typeMachineId == selectedTypeMachine!.id;
  }

  factory RequestInterventionState.initial() {
    return const RequestInterventionState(
      isLoading: true,
      isSubmitting: false,
      isOnline: true,
      pendingSyncCount: 0,
      typeMachines: [],
      machines: [],
      typePannes: [],
      selectedTypeMachine: null,
      selectedMachine: null,
      selectedTypePanne: null,
      description: '',
      priority: InterventionPriority.moyenne,
      error: null,
    );
  }

  RequestInterventionState copyWith({
    bool? isLoading,
    bool? isSubmitting,
    bool? isOnline,
    int? pendingSyncCount,
    List<TypeMachine>? typeMachines,
    List<MaintenanceMachine>? machines,
    List<TypePanne>? typePannes,
    TypeMachine? selectedTypeMachine,
    bool clearTypeMachine = false,
    MaintenanceMachine? selectedMachine,
    bool clearMachine = false,
    TypePanne? selectedTypePanne,
    bool clearTypePanne = false,
    String? description,
    InterventionPriority? priority,
    String? error,
    bool clearError = false,
  }) {
    return RequestInterventionState(
      isLoading: isLoading ?? this.isLoading,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      isOnline: isOnline ?? this.isOnline,
      pendingSyncCount: pendingSyncCount ?? this.pendingSyncCount,
      typeMachines: typeMachines ?? this.typeMachines,
      machines: machines ?? this.machines,
      typePannes: typePannes ?? this.typePannes,
      selectedTypeMachine: clearTypeMachine
          ? null
          : (selectedTypeMachine ?? this.selectedTypeMachine),
      selectedMachine:
          clearMachine ? null : (selectedMachine ?? this.selectedMachine),
      selectedTypePanne:
          clearTypePanne ? null : (selectedTypePanne ?? this.selectedTypePanne),
      description: description ?? this.description,
      priority: priority ?? this.priority,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

final requestInterventionProvider = StateNotifierProvider.autoDispose<
    RequestInterventionNotifier, RequestInterventionState>((ref) {
  final repository = ref.read(interventionRepositoryProvider);
  final demandeurId = ref.read(authProvider).user?.id ?? '';
  final notifier =
      RequestInterventionNotifier(repository, demandeurId: demandeurId);
  notifier.initialize();
  ref.onDispose(notifier.dispose);
  return notifier;
});

class RequestInterventionNotifier
    extends StateNotifier<RequestInterventionState> {
  RequestInterventionNotifier(this._repository, {required this.demandeurId})
      : super(RequestInterventionState.initial());

  final InterventionRepository _repository;
  final String demandeurId;
  Timer? _syncTimer;

  Future<void> initialize() async {
    await loadLookups();
    _syncTimer =
        Timer.periodic(const Duration(seconds: 20), (_) => syncPending());
  }

  Future<void> loadLookups() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final lookups = await _repository.loadLookups();
      final pending = await _repository.pendingCount();
      
      if (!mounted) return;

      state = state.copyWith(
        isLoading: false,
        isOnline: true,
        pendingSyncCount: pending,
        typeMachines: lookups.typeMachines,
        machines: lookups.machines,
        typePannes: lookups.typePannes,
      );
    } catch (e) {
      if (mounted) {
        state = state.copyWith(
          isLoading: false,
          isOnline: false,
          error: e.toString(),
        );
      }
    }
  }

  void selectTypeMachine(TypeMachine? value) {
    if (value == null) {
      state = state.copyWith(
          clearTypeMachine: true, clearMachine: true, clearTypePanne: true);
      return;
    }
    final keepMachine = state.selectedMachine?.typeMachineId == value.id;
    final keepPanne = state.selectedTypePanne?.typeMachineId == value.id;
    state = state.copyWith(
      selectedTypeMachine: value,
      clearMachine: !keepMachine,
      clearTypePanne: !keepPanne,
      clearError: true,
    );
  }

  void selectMachine(MaintenanceMachine? value) {
    if (value == null) {
      state = state.copyWith(clearMachine: true);
      return;
    }
    final machineType = state.typeMachines
        .where((t) => t.id == value.typeMachineId)
        .firstOrNull;
    state = state.copyWith(
      selectedMachine: value,
      selectedTypeMachine: machineType ?? state.selectedTypeMachine,
      clearError: true,
    );
  }

  void selectTypePanne(TypePanne? value) {
    state = state.copyWith(selectedTypePanne: value, clearError: true);
  }

  void setDescription(String value) {
    state = state.copyWith(description: value, clearError: true);
  }

  void setPriority(InterventionPriority value) {
    state = state.copyWith(priority: value, clearError: true);
  }

  void scanMachine(String value) {
    final normalized = value.trim().toLowerCase();
    final machine = state.machines.where((m) {
      return m.code.toLowerCase() == normalized ||
          m.name.toLowerCase().contains(normalized) ||
          m.display.toLowerCase().contains(normalized);
    }).firstOrNull;

    if (machine == null) {
      state = state.copyWith(error: 'Machine non trouvee pour ce code.');
      return;
    }
    selectMachine(machine);
  }

  Future<bool> submit() async {
    if (!state.isValid) {
      state =
          state.copyWith(error: 'Veuillez completer les champs obligatoires.');
      return false;
    }

    state = state.copyWith(isSubmitting: true, clearError: true);
    try {
      final fallbackDescription =
          state.selectedTypePanne?.label ?? 'Intervention maintenance';
      await _repository.createIntervention(
        typeMachineId: state.selectedTypeMachine!.id,
        machineId: state.selectedMachine!.id,
        demandeurId: demandeurId,
        typePanneId: state.selectedTypePanne!.id,
        description: state.description.trim().isEmpty
            ? fallbackDescription
            : state.description.trim(),
        priority: state.priority,
      );
      final pending = await _repository.pendingCount();
      
      if (!mounted) return true;

      state = state.copyWith(
        isSubmitting: false,
        isOnline: true,
        pendingSyncCount: pending,
      );
      return true;
    } catch (e) {
      if (mounted) {
        state = state.copyWith(
          isSubmitting: false,
          isOnline: false,
          error: e.toString(),
        );
      }
      return false;
    }
  }

  Future<void> syncPending() async {
    try {
      await _repository.syncPending();
      final pending = await _repository.pendingCount();
      if (mounted) {
        state = state.copyWith(isOnline: true, pendingSyncCount: pending);
      }
    } catch (_) {
      if (mounted) {
        state = state.copyWith(isOnline: false);
      }
    }
  }

  @override
  void dispose() {
    _syncTimer?.cancel();
    super.dispose();
  }
}
