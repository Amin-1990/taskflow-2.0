import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../data/repositories/packaging_repository.dart';
import '../../../../domain/models/commande_emballage.dart';
import '../../../auth/controllers/auth_provider.dart';

enum PackagingFilter { all, inProgress, completed }

class PackagingState {
  const PackagingState({
    required this.isLoading,
    required this.isSubmitting,
    required this.isOnline,
    required this.searchQuery,
    required this.focusedOrderId,
    required this.filter,
    required this.orders,
    required this.periodInputs,
    required this.pendingSyncCount,
    required this.error,
  });

  final bool isLoading;
  final bool isSubmitting;
  final bool isOnline;
  final String searchQuery;
  final String? focusedOrderId;
  final PackagingFilter filter;
  final List<CommandeEmballage> orders;
  final Map<String, int> periodInputs;
  final int pendingSyncCount;
  final String? error;

  factory PackagingState.initial() {
    return const PackagingState(
      isLoading: true,
      isSubmitting: false,
      isOnline: true,
      searchQuery: '',
      focusedOrderId: null,
      filter: PackagingFilter.all,
      orders: [],
      periodInputs: {},
      pendingSyncCount: 0,
      error: null,
    );
  }

  List<CommandeEmballage> get filteredOrders {
    final byFilter = switch (filter) {
      PackagingFilter.all => orders,
      PackagingFilter.inProgress =>
        orders.where((o) => !o.isCompleted).toList(),
      PackagingFilter.completed => orders.where((o) => o.isCompleted).toList(),
    };

    final query = searchQuery.trim().toLowerCase();
    if (query.isEmpty) {
      return byFilter;
    }

    return byFilter
        .where((o) =>
            o.lotNumber.toLowerCase().contains(query) ||
            o.articleName.toLowerCase().contains(query) ||
            o.articleRef.toLowerCase().contains(query))
        .toList();
  }

  PackagingState copyWith({
    bool? isLoading,
    bool? isSubmitting,
    bool? isOnline,
    String? searchQuery,
    String? focusedOrderId,
    PackagingFilter? filter,
    List<CommandeEmballage>? orders,
    Map<String, int>? periodInputs,
    int? pendingSyncCount,
    String? error,
    bool clearError = false,
  }) {
    return PackagingState(
      isLoading: isLoading ?? this.isLoading,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      isOnline: isOnline ?? this.isOnline,
      searchQuery: searchQuery ?? this.searchQuery,
      focusedOrderId: focusedOrderId ?? this.focusedOrderId,
      filter: filter ?? this.filter,
      orders: orders ?? this.orders,
      periodInputs: periodInputs ?? this.periodInputs,
      pendingSyncCount: pendingSyncCount ?? this.pendingSyncCount,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

final packagingProvider =
    StateNotifierProvider.autoDispose<PackagingNotifier, PackagingState>((ref) {
  final repository = ref.read(packagingRepositoryProvider);
  final operatorId = ref.read(authProvider).user?.id ?? 'OP-782';
  final notifier = PackagingNotifier(repository, operatorId);
  notifier.initialize();
  ref.onDispose(notifier.dispose);
  return notifier;
});

class PackagingNotifier extends StateNotifier<PackagingState> {
  PackagingNotifier(this._repository, this._operatorId)
      : super(PackagingState.initial());

  final PackagingRepository _repository;
  final String _operatorId;
  Timer? _syncTimer;

  Future<void> initialize() async {
    await loadOrders();
    _syncTimer =
        Timer.periodic(const Duration(seconds: 20), (_) => syncPending());
  }

  Future<void> loadOrders() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final orders = await _repository.loadOrders(_operatorId);
      final pending = await _repository.pendingCount();
      
      if (!mounted) return;

      final inputs = <String, int>{
        for (final o in orders) o.id: state.periodInputs[o.id] ?? 0,
      };
      state = state.copyWith(
        isLoading: false,
        isOnline: true,
        orders: orders,
        pendingSyncCount: pending,
        periodInputs: inputs,
      );
    } catch (e) {
      if (mounted) {
        state = state.copyWith(
            isLoading: false, isOnline: false, error: e.toString());
      }
    }
  }

  void setFilter(PackagingFilter filter) {
    state = state.copyWith(filter: filter);
  }

  void setSearchQuery(String query) {
    state = state.copyWith(searchQuery: query);
  }

  void focusByScan(String code) {
    state = state.copyWith(searchQuery: code, focusedOrderId: code);
  }

  void increment(String orderId) {
    final order = state.orders.firstWhere((o) => o.id == orderId,
        orElse: () => throw StateError('order not found'));
    final current = state.periodInputs[orderId] ?? 0;
    final next = current + 1;
    final clamped = next > order.remaining ? order.remaining : next;
    state =
        state.copyWith(periodInputs: {...state.periodInputs, orderId: clamped});
  }

  void decrement(String orderId) {
    final current = state.periodInputs[orderId] ?? 0;
    state = state.copyWith(periodInputs: {
      ...state.periodInputs,
      orderId: current > 0 ? current - 1 : 0
    });
  }

  void setQuantity(String orderId, int value) {
    final order = state.orders.firstWhere((o) => o.id == orderId,
        orElse: () => throw StateError('order not found'));
    final normalized =
        value < 0 ? 0 : (value > order.remaining ? order.remaining : value);
    state = state
        .copyWith(periodInputs: {...state.periodInputs, orderId: normalized});
  }

  Future<void> validatePeriod(String orderId) async {
    final quantity = state.periodInputs[orderId] ?? 0;
    if (quantity <= 0) {
      state = state.copyWith(
          error: 'La quantite periode doit etre superieure a zero.');
      return;
    }

    final order = state.orders.firstWhere((o) => o.id == orderId,
        orElse: () => throw StateError('order not found'));
    if (quantity > order.remaining) {
      state = state.copyWith(error: 'La quantite depasse l\'objectif restant.');
      return;
    }

    state = state.copyWith(isSubmitting: true, clearError: true);
    try {
      final updated =
          await _repository.validatePeriod(order: order, quantity: quantity);
      final pending = await _repository.pendingCount();

      if (!mounted) return;

      final newOrders =
          state.orders.map((o) => o.id == updated.id ? updated : o).toList();
      state = state.copyWith(
        isSubmitting: false,
        isOnline: true,
        orders: newOrders,
        pendingSyncCount: pending,
        periodInputs: {...state.periodInputs, orderId: 0},
      );
    } catch (e) {
      if (mounted) {
        state = state.copyWith(
            isSubmitting: false, isOnline: false, error: e.toString());
      }
    }
  }

  Future<void> syncPending() async {
    try {
      final count = await _repository.syncPendingValidations();
      final pending = await _repository.pendingCount();
      
      if (!mounted) return;

      if (count > 0) {
        final orders = await _repository.loadOrders(_operatorId);
        if (!mounted) return;
        state = state.copyWith(
            orders: orders, pendingSyncCount: pending, isOnline: true);
      } else {
        state = state.copyWith(pendingSyncCount: pending, isOnline: true);
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
