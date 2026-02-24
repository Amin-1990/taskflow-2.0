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
    required this.quantity,
    required this.notes,
    required this.isSubmitting,
    required this.error,
    required this.finishedTask,
  });

  final bool isLoading;
  final Task? currentTask;
  final String operatorInput;
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

final finishTaskProvider = StateNotifierProvider.autoDispose
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
  notifier.setOperatorInput(operatorMatricule ?? userId);
  notifier.loadCurrentTask();
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

  Future<void> loadCurrentTask() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final input = state.operatorInput.trim();
      final fallbackMatricule = operatorMatricule?.trim() ?? '';

      final bool userTypedInput =
          input.isNotEmpty && input != userId && input != fallbackMatricule;

      final task = userTypedInput
          ? await _repository.getCurrentTaskForIdentity(
              userId: input,
              matricule: input,
            )
          : await _repository.getCurrentTaskForIdentity(
              userId: userId,
              matricule: fallbackMatricule.isEmpty ? null : fallbackMatricule,
            );

      if (task == null) {
        state = state.copyWith(
          isLoading: false,
          clearCurrentTask: true,
          quantity: 0,
          error: 'Aucune production en cours.',
        );
        return;
      }

      state = state.copyWith(
        isLoading: false,
        currentTask: task,
        quantity: task.producedQuantity,
        clearError: true,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
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
      state = state.copyWith(isSubmitting: false, finishedTask: result);
      return result;
    } catch (e) {
      state = state.copyWith(isSubmitting: false, error: e.toString());
      return null;
    }
  }
}
