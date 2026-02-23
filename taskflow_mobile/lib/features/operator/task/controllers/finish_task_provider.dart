import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../data/repositories/task_repository.dart';
import '../../../../domain/models/task.dart';
import '../../../auth/controllers/auth_provider.dart';

class FinishTaskState {
  const FinishTaskState({
    required this.isLoading,
    required this.currentTask,
    required this.quantity,
    required this.notes,
    required this.isSubmitting,
    required this.error,
    required this.finishedTask,
  });

  final bool isLoading;
  final Task? currentTask;
  final int quantity;
  final String notes;
  final bool isSubmitting;
  final String? error;
  final Task? finishedTask;

  factory FinishTaskState.initial() {
    return const FinishTaskState(
      isLoading: true,
      currentTask: null,
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
    int? quantity,
    String? notes,
    bool? isSubmitting,
    String? error,
    bool clearError = false,
    Task? finishedTask,
  }) {
    return FinishTaskState(
      isLoading: isLoading ?? this.isLoading,
      currentTask: currentTask ?? this.currentTask,
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
  final operatorId = ref.read(authProvider).user?.id ?? 'OP-782';
  final notifier =
      FinishTaskNotifier(repository, taskId, operatorId: operatorId);
  notifier.loadCurrentTask();
  return notifier;
});

class FinishTaskNotifier extends StateNotifier<FinishTaskState> {
  FinishTaskNotifier(this._repository, this._taskId, {required this.operatorId})
      : super(FinishTaskState.initial());

  final TaskRepository _repository;
  final String? _taskId;
  final String operatorId;

  Future<void> loadCurrentTask() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final task = await _repository.getCurrentTask(operatorId);
      if (task == null) {
        state = state.copyWith(
            isLoading: false, error: 'Aucune production en cours.');
        return;
      }

      final resolved = _taskId != null ? task.copyWith(id: _taskId) : task;
      state = state.copyWith(
          isLoading: false,
          currentTask: resolved,
          quantity: resolved.producedQuantity);
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
