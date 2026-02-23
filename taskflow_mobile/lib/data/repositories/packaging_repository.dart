import 'dart:math';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/models/commande_emballage.dart';
import '../local/daos/pending_actions_dao.dart';
import '../remote/services/packaging_service.dart';
import 'app_providers.dart';

final packagingServiceProvider = Provider<PackagingService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return PackagingService(apiClient.client);
});

final packagingRepositoryProvider = Provider<PackagingRepository>((ref) {
  return PackagingRepository(
    ref.watch(packagingServiceProvider),
    ref.watch(pendingActionsDaoProvider),
  );
});

class PackagingRepository {
  PackagingRepository(this._service, this._pendingDao);

  final PackagingService _service;
  final PendingActionsDao _pendingDao;

  List<CommandeEmballage> _cache = const [];

  Future<List<CommandeEmballage>> loadOrders(String operatorId) async {
    try {
      final orders = await _service.getPackagingOrders(operatorId: operatorId);
      if (orders.isNotEmpty) {
        _cache = orders;
      }
      return orders;
    } on DioException {
      if (_cache.isNotEmpty) {
        return _cache;
      }
      return _mockOrders;
    }
  }

  Future<CommandeEmballage> validatePeriod({
    required CommandeEmballage order,
    required int quantity,
  }) async {
    try {
      final updated = await _service.validatePeriodQuantity(
        orderId: order.id,
        quantity: quantity,
        periodLabel: order.periodLabel,
      );

      _cache = _cache
          .map((o) => o.id == updated.id
              ? o.copyWith(packedToday: updated.packedToday)
              : o)
          .toList();
      return updated;
    } on DioException {
      final actionId =
          'pack-${DateTime.now().millisecondsSinceEpoch}-${Random().nextInt(9999)}';
      await _pendingDao.enqueue(
        id: actionId,
        type: 'PACKAGING_VALIDATE',
        data: {
          'orderId': order.id,
          'quantity': quantity,
          'periodLabel': order.periodLabel
        },
      );

      final optimistic =
          order.copyWith(packedToday: order.packedToday + quantity);
      _cache =
          _cache.map((o) => o.id == optimistic.id ? optimistic : o).toList();
      return optimistic;
    }
  }

  Future<int> syncPendingValidations() async {
    final actions = await _pendingDao.getAll();
    var successCount = 0;

    for (final action in actions.where((e) => e.type == 'PACKAGING_VALIDATE')) {
      try {
        final orderId = action.data['orderId']?.toString();
        final quantity = action.data['quantity'] as int? ?? 0;
        final period = action.data['periodLabel']?.toString() ?? '';
        if (orderId == null || orderId.isEmpty || quantity <= 0) {
          await _pendingDao.remove(action.id);
          continue;
        }

        await _service.validatePeriodQuantity(
            orderId: orderId, quantity: quantity, periodLabel: period);
        await _pendingDao.remove(action.id);
        successCount++;
      } catch (_) {
        await _pendingDao.incrementRetry(action.id);
      }
    }

    return successCount;
  }

  Future<int> pendingCount() async {
    final all = await _pendingDao.getAll();
    return all.where((e) => e.type == 'PACKAGING_VALIDATE').length;
  }

  List<CommandeEmballage> get cached => _cache;
}

final _mockOrders = <CommandeEmballage>[
  const CommandeEmballage(
    id: '101',
    lotNumber: '#99283',
    articleName: 'Bolt Assembly AX-9920',
    articleRef: 'AX-9920',
    productionLine: 'Ligne A2',
    periodLabel: '8h-10h',
    dailyTarget: 100,
    packedToday: 45,
  ),
  const CommandeEmballage(
    id: '102',
    lotNumber: '#8812A',
    articleName: 'Hex Nut M8 Steel',
    articleRef: 'HN-M8',
    productionLine: 'Ligne B1',
    periodLabel: '10h-12h',
    dailyTarget: 500,
    packedToday: 128,
  ),
  const CommandeEmballage(
    id: '103',
    lotNumber: '#7742C',
    articleName: 'Washer Flat 1/2"',
    articleRef: 'WF-12',
    productionLine: 'Ligne A3',
    periodLabel: '13h-15h',
    dailyTarget: 2000,
    packedToday: 12,
  ),
];
