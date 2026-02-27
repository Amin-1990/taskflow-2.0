import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/repositories/operator_repository.dart';
import '../../../domain/models/operator_dashboard_data.dart';
import '../../../domain/models/user.dart';
import '../../../domain/models/user_context.dart';
import '../../auth/controllers/auth_provider.dart';

class OperatorDashboardState {
  const OperatorDashboardState({
    required this.isLoading,
    required this.isRefreshing,
    required this.userContext,
    required this.stats,
    required this.error,
  });

  final bool isLoading;
  final bool isRefreshing;
  final UserContext? userContext;
  final OperatorDashboardData? stats;
  final String? error;

  factory OperatorDashboardState.initial() {
    return const OperatorDashboardState(
      isLoading: true,
      isRefreshing: false,
      userContext: null,
      stats: null,
      error: null,
    );
  }

  OperatorDashboardState copyWith({
    bool? isLoading,
    bool? isRefreshing,
    UserContext? userContext,
    OperatorDashboardData? stats,
    String? error,
    bool clearError = false,
  }) {
    return OperatorDashboardState(
      isLoading: isLoading ?? this.isLoading,
      isRefreshing: isRefreshing ?? this.isRefreshing,
      userContext: userContext ?? this.userContext,
      stats: stats ?? this.stats,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

final mockDashboardProvider = Provider<OperatorDashboardData>((ref) {
  return const OperatorDashboardData(
    activeTasks: 3,
    tasksToFinish: 12,
    packagingRate: 0.85,
    processDefects: 1,
    productivity: 0.92,
    targetUnits: 150,
    achievedUnits: 138,
  );
});

final operatorDashboardProvider =
    StateNotifierProvider<OperatorDashboardNotifier, OperatorDashboardState>(
        (ref) {
  final userId = ref.watch(authProvider.select((state) => state.user?.id));
  final user = ref.watch(authProvider.select((state) => state.user));
  if (userId == null) {
    throw Exception('User not authenticated');
  }

  final notifier = OperatorDashboardNotifier(
    ref.read(operatorRepositoryProvider),
    userId,
    fallbackUser: user,
  );

  notifier.loadDashboard();
  return notifier;
});

class OperatorDashboardNotifier extends StateNotifier<OperatorDashboardState> {
  OperatorDashboardNotifier(this._repository, this._userId, {this.fallbackUser})
      : super(OperatorDashboardState.initial());

  final OperatorRepository _repository;
  final String _userId;
  final User? fallbackUser;

  Future<void> loadDashboard() async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final context =
          await _repository.getUserContext(_userId, fallbackUser: fallbackUser);
      final stats = await _repository.getDashboardStats(_userId);
      
      if (!mounted) return;

      state = state.copyWith(
        isLoading: false,
        isRefreshing: false,
        userContext: context,
        stats: stats,
        clearError: true,
      );
    } catch (e) {
      if (mounted) {
        state = state.copyWith(
            isLoading: false, isRefreshing: false, error: e.toString());
      }
    }
  }

  Future<void> refresh() async {
    state = state.copyWith(isRefreshing: true, clearError: true);
    await loadDashboard();
  }
}
