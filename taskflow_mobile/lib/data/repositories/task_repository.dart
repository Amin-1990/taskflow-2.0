import 'dart:math';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/enums/task_status.dart';
import '../../domain/models/article.dart';
import '../../domain/models/operateur.dart';
import '../../domain/models/semaine.dart';
import '../../domain/models/task.dart';
import '../../domain/models/workstation.dart';
import '../local/daos/pending_actions_dao.dart';
import '../remote/services/task_service.dart';
import 'app_providers.dart';

final taskServiceProvider = Provider<TaskService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return TaskService(apiClient.client);
});

final taskRepositoryProvider = Provider<TaskRepository>((ref) {
  return TaskRepository(
    ref.watch(taskServiceProvider),
    ref.watch(pendingActionsDaoProvider),
  );
});

class TaskRepository {
  TaskRepository(this._service, this._pendingDao);

  final TaskService _service;
  final PendingActionsDao _pendingDao;

  List<Article> _cachedArticles = const [];
  final Map<String, List<Article>> _cachedWeekArticles = {};
  List<Workstation> _cachedWorkstations = const [];
  List<Operateur> _cachedOperators = const [];
  List<Semaine> _cachedWeeks = const [];

  static final Task mockCurrentTask = Task(
    id: 'task-123',
    orderNumber: 'OF-2023-8842',
    articleName: 'Boitier Aluminium CNC V2',
    articleRef: 'AL-9920-X',
    workstation: 'Ligne-04',
    startTime: DateTime.now().subtract(const Duration(hours: 4, minutes: 30)),
    activeDuration: const Duration(hours: 4, minutes: 30),
    status: TaskStatus.inProgress,
    targetQuantity: 100,
    producedQuantity: 45,
  );

  Future<Task?> getCurrentTask(String operatorId) async {
    try {
      return await _service.getCurrentTask(operatorId);
    } on DioException {
      return mockCurrentTask;
    }
  }

  Future<List<Article>> searchArticles(String query) async {
    if (query.trim().isEmpty) {
      return _cachedArticles;
    }

    try {
      final result = await _service.searchArticles(query);
      if (result.isNotEmpty) {
        _cachedArticles = result;
      }
      return result;
    } on DioException {
      if (_cachedArticles.isNotEmpty) {
        return _cachedArticles
            .where((a) =>
                a.name.toLowerCase().contains(query.toLowerCase()) ||
                a.code.toLowerCase().contains(query.toLowerCase()))
            .toList();
      }
      return [
        const Article(
            id: 'a1',
            code: 'AL-9920-X',
            name: 'Boitier Aluminium CNC V2',
            client: 'Atlas'),
        const Article(
            id: 'a2', code: 'GBX-X5', name: 'Gearbox X5', client: 'Orion'),
      ]
          .where((a) =>
              a.name.toLowerCase().contains(query.toLowerCase()) ||
              a.code.toLowerCase().contains(query.toLowerCase()))
          .toList();
    }
  }

  Future<List<Workstation>> getAvailableWorkstations() async {
    try {
      final result = await _service.getAvailableWorkstations();
      if (result.isNotEmpty) {
        _cachedWorkstations = result;
      }
      return result;
    } on DioException {
      if (_cachedWorkstations.isNotEmpty) {
        return _cachedWorkstations;
      }
      return const [
        Workstation(
            id: 'w1',
            name: 'Ligne A - Assemblage',
            code: 'LIGNE-A-01',
            isActive: true),
        Workstation(
            id: 'w2', name: 'Ligne-04', code: 'LIGNE-04', isActive: true),
      ];
    }
  }

  Future<List<Task>> getRecentTasks(String operatorId) async {
    try {
      return await _service.getRecentTasks(operatorId);
    } on DioException {
      return [
        mockCurrentTask.copyWith(
          id: 'recent-1',
          articleName: 'Gearbox X5',
          workstation: 'Ligne A',
          startTime: DateTime.now().subtract(const Duration(minutes: 10)),
          activeDuration: const Duration(minutes: 10),
        ),
      ];
    }
  }

  Future<Semaine> getCurrentWeek() async {
    try {
      return await _service.getCurrentWeek();
    } on DioException {
      return const Semaine(id: '42-2023', label: 'Semaine 42 - 2023');
    }
  }

  Future<List<Semaine>> getWeeks() async {
    try {
      final weeks = await _service.getWeeks();
      if (weeks.isNotEmpty) {
        _cachedWeeks = weeks;
      }
      return weeks;
    } on DioException {
      if (_cachedWeeks.isNotEmpty) {
        return _cachedWeeks;
      }
      return const [
        Semaine(id: '42-2023', label: '2023 - Semaine 42'),
      ];
    }
  }

  Future<List<Article>> getArticlesByWeek(String weekId) async {
    if (weekId.isEmpty) {
      return const [];
    }

    try {
      final result = await _service.getArticlesByWeek(weekId);
      if (result.isNotEmpty) {
        _cachedWeekArticles[weekId] = result;
        _cachedArticles = result;
      }
      return result;
    } on DioException {
      final cached = _cachedWeekArticles[weekId];
      if (cached != null && cached.isNotEmpty) {
        return cached;
      }
      return [
        const Article(
          id: 'a1',
          code: 'AL-9920-X',
          name: 'AL-9920-X',
          client: 'Commande',
        ),
        const Article(
          id: 'a2',
          code: 'GBX-X5',
          name: 'GBX-X5',
          client: 'Commande',
        ),
      ];
    }
  }

  Future<List<Operateur>> getOperators() async {
    try {
      final operators = await _service.getActiveOperators();
      final filtered = operators
          .where((item) =>
              item.isActive &&
              (item.firstName.isNotEmpty ||
                  item.lastName.isNotEmpty ||
                  item.matricule.isNotEmpty))
          .toList();
      if (filtered.isNotEmpty) {
        _cachedOperators = filtered;
      }
      return filtered;
    } on DioException {
      if (_cachedOperators.isNotEmpty) {
        return _cachedOperators;
      }
      return const [
        Operateur(
          id: '1',
          firstName: 'Marc',
          lastName: 'Johnson',
          matricule: 'OP-782',
          isActive: true,
        ),
      ];
    }
  }

  Future<Task> createAffectation({
    required String operatorId,
    required String articleId,
    required String workstationId,
    required String semaineId,
  }) async {
    try {
      return await _service.createAffectation(
        operatorId: operatorId,
        articleId: articleId,
        workstationId: workstationId,
        semaineId: semaineId,
      );
    } on DioException {
      final actionId =
          'create-${DateTime.now().millisecondsSinceEpoch}-${Random().nextInt(9999)}';
      await _pendingDao.enqueue(
        id: actionId,
        type: 'CREATE_TASK',
        data: {
          'operatorId': operatorId,
          'articleId': articleId,
          'workstationId': workstationId,
          'semaineId': semaineId,
        },
      );

      return mockCurrentTask.copyWith(
        id: actionId,
        status: TaskStatus.inProgress,
      );
    }
  }

  Future<Task> finishTask({
    required String taskId,
    required int quantity,
    String? notes,
  }) async {
    try {
      return await _service.finishTask(
          taskId: taskId, quantity: quantity, notes: notes);
    } on DioException {
      final actionId =
          'finish-${DateTime.now().millisecondsSinceEpoch}-${Random().nextInt(9999)}';
      await _pendingDao.enqueue(
        id: actionId,
        type: 'FINISH_TASK',
        data: {
          'taskId': taskId,
          'quantity': quantity,
          'notes': notes,
        },
      );

      return mockCurrentTask.copyWith(
        id: taskId,
        producedQuantity: quantity,
        status: TaskStatus.completed,
      );
    }
  }

  Future<int> syncPending() async {
    final actions = await _pendingDao.getAll();
    var synced = 0;

    for (final action in actions
        .where((a) => a.type == 'CREATE_TASK' || a.type == 'FINISH_TASK')) {
      try {
        if (action.type == 'CREATE_TASK') {
          await _service.createAffectation(
            operatorId: (action.data['operatorId'] ?? '').toString(),
            articleId: (action.data['articleId'] ?? '').toString(),
            workstationId: (action.data['workstationId'] ?? '').toString(),
            semaineId: (action.data['semaineId'] ?? '').toString(),
          );
        } else if (action.type == 'FINISH_TASK') {
          await _service.finishTask(
            taskId: (action.data['taskId'] ?? '').toString(),
            quantity: (action.data['quantity'] as num?)?.toInt() ?? 0,
            notes: action.data['notes']?.toString(),
          );
        }
        await _pendingDao.remove(action.id);
        synced++;
      } catch (_) {
        await _pendingDao.incrementRetry(action.id);
      }
    }

    return synced;
  }
}
