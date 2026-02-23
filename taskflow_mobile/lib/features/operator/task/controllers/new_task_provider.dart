import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../data/repositories/task_repository.dart';
import '../../../../domain/models/article.dart';
import '../../../../domain/models/operateur.dart';
import '../../../../domain/models/semaine.dart';
import '../../../../domain/models/task.dart';
import '../../../../domain/models/workstation.dart';
import '../../../auth/controllers/auth_provider.dart';

class NewTaskState {
  static const Object _unset = Object();

  const NewTaskState({
    required this.isLoading,
    required this.isSubmitting,
    required this.weeks,
    required this.selectedWeek,
    required this.selectedArticle,
    required this.selectedWorkstation,
    required this.selectedOperator,
    required this.operatorId,
    required this.availableWorkstations,
    required this.availableOperators,
    required this.availableArticles,
    required this.recentArticles,
    required this.recentTasks,
    required this.error,
    required this.createdTask,
  });

  final bool isLoading;
  final bool isSubmitting;
  final List<Semaine> weeks;
  final Semaine? selectedWeek;
  final Article? selectedArticle;
  final Workstation? selectedWorkstation;
  final Operateur? selectedOperator;
  final String? operatorId;
  final List<Workstation> availableWorkstations;
  final List<Operateur> availableOperators;
  final List<Article> availableArticles;
  final List<Article> recentArticles;
  final List<Task> recentTasks;
  final String? error;
  final Task? createdTask;

  bool get isValid =>
      selectedWeek != null &&
      selectedArticle != null &&
      selectedWorkstation != null &&
      (operatorId?.isNotEmpty == true);

  factory NewTaskState.initial() {
    return const NewTaskState(
      isLoading: true,
      isSubmitting: false,
      weeks: [],
      selectedWeek: null,
      selectedArticle: null,
      selectedWorkstation: null,
      selectedOperator: null,
      operatorId: null,
      availableWorkstations: [],
      availableOperators: [],
      availableArticles: [],
      recentArticles: [],
      recentTasks: [],
      error: null,
      createdTask: null,
    );
  }

  NewTaskState copyWith({
    bool? isLoading,
    bool? isSubmitting,
    List<Semaine>? weeks,
    Object? selectedWeek = _unset,
    Object? selectedArticle = _unset,
    Object? selectedWorkstation = _unset,
    Object? selectedOperator = _unset,
    Object? operatorId = _unset,
    List<Workstation>? availableWorkstations,
    List<Operateur>? availableOperators,
    List<Article>? availableArticles,
    List<Article>? recentArticles,
    List<Task>? recentTasks,
    String? error,
    bool clearError = false,
    Task? createdTask,
  }) {
    return NewTaskState(
      isLoading: isLoading ?? this.isLoading,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      weeks: weeks ?? this.weeks,
      selectedWeek:
          selectedWeek == _unset ? this.selectedWeek : selectedWeek as Semaine?,
      selectedArticle: selectedArticle == _unset
          ? this.selectedArticle
          : selectedArticle as Article?,
      selectedWorkstation: selectedWorkstation == _unset
          ? this.selectedWorkstation
          : selectedWorkstation as Workstation?,
      selectedOperator: selectedOperator == _unset
          ? this.selectedOperator
          : selectedOperator as Operateur?,
      operatorId:
          operatorId == _unset ? this.operatorId : operatorId as String?,
      availableWorkstations:
          availableWorkstations ?? this.availableWorkstations,
      availableOperators: availableOperators ?? this.availableOperators,
      availableArticles: availableArticles ?? this.availableArticles,
      recentArticles: recentArticles ?? this.recentArticles,
      recentTasks: recentTasks ?? this.recentTasks,
      error: clearError ? null : (error ?? this.error),
      createdTask: createdTask ?? this.createdTask,
    );
  }
}

final newTaskProvider =
    StateNotifierProvider.autoDispose<NewTaskNotifier, NewTaskState>((ref) {
  final repository = ref.read(taskRepositoryProvider);
  final operatorId = ref.read(authProvider).user?.id;
  final notifier = NewTaskNotifier(repository, defaultOperatorId: operatorId);
  notifier.loadInitialData();
  return notifier;
});

class NewTaskNotifier extends StateNotifier<NewTaskState> {
  NewTaskNotifier(this._repository, {String? defaultOperatorId})
      : super(NewTaskState.initial()) {
    if (defaultOperatorId != null && defaultOperatorId.isNotEmpty) {
      state = state.copyWith(operatorId: defaultOperatorId);
    }
  }

  final TaskRepository _repository;
  Timer? _debounce;

  Future<void> loadInitialData() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final currentWeek = await _repository.getCurrentWeek();
      final weeks = await _repository.getWeeks();
      final workstations = await _repository.getAvailableWorkstations();
      final operators = await _repository.getOperators();
      final operatorId = state.operatorId ?? 'OP-782';
      final selectedWeek = weeks.any((w) => w.id == currentWeek.id)
          ? weeks.firstWhere((w) => w.id == currentWeek.id)
          : currentWeek;
      final articles = await _repository.getArticlesByWeek(selectedWeek.id);
      final recent = await _repository.getRecentTasks(operatorId);
      final matchedOperator = operators
          .where((item) =>
              item.id == operatorId ||
              item.matricule.toLowerCase() == operatorId.toLowerCase())
          .firstOrNull;

      state = state.copyWith(
        isLoading: false,
        weeks: weeks.isEmpty ? [currentWeek] : weeks,
        selectedWeek: selectedWeek,
        availableArticles: articles,
        selectedArticle: null,
        availableWorkstations: workstations,
        availableOperators: operators,
        selectedOperator: matchedOperator,
        operatorId: matchedOperator?.id ?? state.operatorId ?? operatorId,
        recentTasks: recent,
        recentArticles: articles.take(5).toList(),
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<List<Article>> searchArticles(String query) async {
    final trimmed = query.trim().toLowerCase();
    final source = state.availableArticles;
    if (trimmed.isEmpty) {
      return source;
    }
    return source
        .where((item) =>
            item.code.toLowerCase().contains(trimmed) ||
            item.name.toLowerCase().contains(trimmed))
        .toList();
  }

  void selectArticle(Article article) {
    state = state.copyWith(selectedArticle: article, clearError: true);
  }

  void selectWorkstation(Workstation workstation) {
    state = state.copyWith(selectedWorkstation: workstation, clearError: true);
  }

  void selectWeek(Semaine week) {
    state = state.copyWith(
      selectedWeek: week,
      selectedArticle: null,
      clearError: true,
    );
    _loadArticlesForWeek(week.id);
  }

  Future<List<Operateur>> searchOperators(String query) async {
    _debounce?.cancel();
    final completer = Completer<List<Operateur>>();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      final trimmed = query.trim().toLowerCase();
      if (trimmed.isEmpty) {
        completer.complete(state.availableOperators);
        return;
      }
      completer.complete(
        state.availableOperators
            .where((item) =>
                item.fullName.toLowerCase().contains(trimmed) ||
                item.matricule.toLowerCase().contains(trimmed))
            .toList(),
      );
    });
    return completer.future;
  }

  void selectOperator(Operateur operateur) {
    state = state.copyWith(
      selectedOperator: operateur,
      operatorId: operateur.id,
      clearError: true,
    );
  }

  void setOperatorInput(String input) {
    final value = input.trim();
    if (value.isEmpty) {
      state = state.copyWith(
          operatorId: null, selectedOperator: null, clearError: true);
      return;
    }

    final matched = state.availableOperators
        .where((item) =>
            item.matricule.toLowerCase() == value.toLowerCase() ||
            item.id == value ||
            item.fullName.toLowerCase() == value.toLowerCase())
        .firstOrNull;

    if (matched != null) {
      selectOperator(matched);
      return;
    }

    state = state.copyWith(
      operatorId: value,
      selectedOperator: null,
      clearError: true,
    );
  }

  Future<Task?> submit() async {
    if (!state.isValid) {
      state = state.copyWith(
          error: 'Veuillez completer tous les champs obligatoires.');
      return null;
    }

    state = state.copyWith(isSubmitting: true, clearError: true);
    try {
      final task = await _repository.createAffectation(
        operatorId: state.operatorId!,
        articleId: state.selectedArticle!.id,
        workstationId: state.selectedWorkstation!.id,
        semaineId: state.selectedWeek!.id,
      );
      state = state.copyWith(isSubmitting: false, createdTask: task);
      return task;
    } catch (e) {
      state = state.copyWith(isSubmitting: false, error: e.toString());
      return null;
    }
  }

  Future<void> _loadArticlesForWeek(String weekId) async {
    try {
      final articles = await _repository.getArticlesByWeek(weekId);
      state = state.copyWith(
        availableArticles: articles,
        recentArticles: articles.take(5).toList(),
      );
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }
}
