import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../data/repositories/task_repository.dart';
import '../../../../domain/models/task.dart';
import '../../../auth/controllers/auth_provider.dart';

class FinishTaskState {
  const FinishTaskState({
    required this.isLoading,
    required this.currentTask,
    required this.operatorInput,
    required this.selectedOperatorId,
    required this.quantity,
    required this.notes,
    required this.isSubmitting,
    required this.error,
    required this.finishedTask,
  });

  final bool isLoading;
  final Task? currentTask;
  final String operatorInput;
  final String? selectedOperatorId;
  final int quantity;
  final String notes;
  final bool isSubmitting;
  final String? error;
  final Task? finishedTask;

  factory FinishTaskState.initial() {
    return const FinishTaskState(
      isLoading: true,
      currentTask: null,
      operatorInput: '',
      selectedOperatorId: null,
      quantity: 0,
      notes: '',
      isSubmitting: false,
      error: null,
      finishedTask: null,
    );
  }

  FinishTaskState copyWith({
    bool? isLoading,
    Task? currentTask,
    bool clearCurrentTask = false,
    String? operatorInput,
    String? selectedOperatorId,
    bool clearSelectedOperator = false,
    int? quantity,
    String? notes,
    bool? isSubmitting,
    String? error,
    bool clearError = false,
    Task? finishedTask,
  }) {
    return FinishTaskState(
      isLoading: isLoading ?? this.isLoading,
      currentTask: clearCurrentTask ? null : (currentTask ?? this.currentTask),
      operatorInput: operatorInput ?? this.operatorInput,
      selectedOperatorId: clearSelectedOperator
          ? null
          : (selectedOperatorId ?? this.selectedOperatorId),
      quantity: quantity ?? this.quantity,
      notes: notes ?? this.notes,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      error: clearError ? null : (error ?? this.error),
      finishedTask: finishedTask ?? this.finishedTask,
    );
  }
}

final currentTaskIdProvider = Provider<String?>((ref) {
  final userId = ref.watch(authProvider.select((state) => state.user?.id));
  if (userId == null) {
    return null;
  }
  return TaskRepository.mockCurrentTask.id;
});

final finishTaskProvider = StateNotifierProvider
    .family<FinishTaskNotifier, FinishTaskState, String?>((ref, taskId) {
  final repository = ref.read(taskRepositoryProvider);
  final user = ref.read(authProvider).user;
  final userId = user?.id ?? '';
  final operatorMatricule = user?.matricule;

  debugPrint(
      '[FinishTaskProvider] userId=$userId, matricule=${operatorMatricule ?? ''}');

  final notifier = FinishTaskNotifier(
    repository,
    taskId,
    userId: userId,
    operatorMatricule: operatorMatricule,
  );
  // Don't load automatically - wait for user selection
  return notifier;
});

class FinishTaskNotifier extends StateNotifier<FinishTaskState> {
  FinishTaskNotifier(
    this._repository,
    this._taskId, {
    required this.userId,
    required this.operatorMatricule,
  }) : super(FinishTaskState.initial());

  final TaskRepository _repository;
  final String? _taskId;
  final String userId;
  final String? operatorMatricule;

  void setOperatorInput(String value) {
    state = state.copyWith(operatorInput: value.trim(), clearError: true);
  }

  void setSelectedOperator(String operatorId) {
    debugPrint('🔍 [FinishTaskNotifier] setSelectedOperator called with ID: $operatorId');
    state = state.copyWith(selectedOperatorId: operatorId, clearError: true);
    // Charger la tâche automatiquement après sélection
    debugPrint('🔍 [FinishTaskNotifier] About to call loadCurrentTask()');
    loadCurrentTask();
  }

  void clearOperator() {
    state = state.copyWith(
      clearSelectedOperator: true,
      clearCurrentTask: true,
      quantity: 0,
      clearError: true,
    );
  }

  Future<void> loadCurrentTask() async {
    debugPrint('⏳ [FinishTaskNotifier] loadCurrentTask() STARTED');
    debugPrint('⏳ [FinishTaskNotifier] mounted=$mounted, selectedOperatorId=${state.selectedOperatorId}');
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final selectedOp = state.selectedOperatorId;
      final fallbackMatricule = operatorMatricule?.trim() ?? '';

      debugPrint('⏳ [FinishTaskNotifier] Calling API with selectedOp=$selectedOp');
      final task = selectedOp != null
          ? await _repository.getCurrentTaskForIdentity(
              userId: selectedOp,
              matricule: selectedOp,
            )
          : await _repository.getCurrentTaskForIdentity(
              userId: userId,
              matricule: fallbackMatricule.isEmpty ? null : fallbackMatricule,
            );

      debugPrint('⏳ [FinishTaskNotifier] API Response received, task=$task');
      debugPrint('⏳ [FinishTaskNotifier] Before mounted check: mounted=$mounted');
      
      if (!mounted) {
        debugPrint('❌ [FinishTaskNotifier] NOT MOUNTED - skipping state update. Task: $task');
        return;
      }

      debugPrint('✅ [FinishTaskNotifier] Still mounted, proceeding with state update');

      if (task == null) {
        debugPrint('⚠️ [FinishTaskNotifier] Task is null');
        state = state.copyWith(
          isLoading: false,
          clearCurrentTask: true,
          quantity: 0,
          error: 'Aucune production en cours.',
        );
        return;
      }

      debugPrint('✅ [FinishTaskNotifier] Task loaded successfully: ID=${task.id}, producedQty=${task.producedQuantity}');
      state = state.copyWith(
        isLoading: false,
        currentTask: task,
        quantity: task.producedQuantity,
        clearError: true,
      );
    } catch (e) {
      debugPrint('❌ [FinishTaskNotifier] Exception caught: $e');
      if (mounted) {
        state = state.copyWith(isLoading: false, error: e.toString());
      } else {
        debugPrint('❌ [FinishTaskNotifier] NOT MOUNTED after exception - skipping error state update');
      }
    }
  }

  void updateQuantity(int quantity) {
    state = state.copyWith(quantity: quantity, clearError: true);
  }

  void updateNotes(String notes) {
    state = state.copyWith(notes: notes, clearError: true);
  }

  Future<Task?> submit() async {
    if (state.currentTask == null) {
      state = state.copyWith(error: 'Aucune tache active.');
      return null;
    }
    if (state.quantity <= 0) {
      state = state.copyWith(error: 'La quantite doit etre superieure a zero.');
      return null;
    }

    state = state.copyWith(isSubmitting: true, clearError: true);
    try {
      final result = await _repository.finishTask(
        taskId: state.currentTask!.id,
        quantity: state.quantity,
        notes: state.notes.isEmpty ? null : state.notes,
      );
      
      if (!mounted) return result;

      state = state.copyWith(isSubmitting: false, finishedTask: result);
      return result;
    } catch (e) {
      if (mounted) {
        state = state.copyWith(isSubmitting: false, error: e.toString());
      }
      return null;
    }
  }
}
