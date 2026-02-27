import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../data/repositories/task_repository.dart';
import '../../../../domain/models/operateur.dart';

final operatorSearchProvider = FutureProvider.autoDispose
    .family<List<Operateur>, String>((ref, query) async {
  final repository = ref.watch(taskRepositoryProvider);
  if (query.isEmpty) {
    return repository.getOperators();
  }
  return repository.searchOperators(query);
});

// Provider pour obtenir tous les opérateurs (sans filtre)
final allOperatorsProvider = FutureProvider<List<Operateur>>((ref) async {
  final repository = ref.watch(taskRepositoryProvider);
  return repository.getOperators();
});

// Helper pour trouver le nom d'un opérateur par ID
final operatorNameProvider = FutureProvider.family<String, String?>((ref, id) async {
  if (id == null) return 'Sélectionner';
  
  final operators = await ref.watch(allOperatorsProvider.future);
  try {
    final operator = operators.firstWhere((op) => op.id.toString() == id);
    return '${operator.firstName} ${operator.lastName} (${operator.matricule})';
  } catch (_) {
    return 'Opérateur non trouvé';
  }
});
