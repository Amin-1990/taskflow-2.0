import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/constants/design_constants.dart';
import '../../../../core/widgets/selection_field.dart';
import '../../../../core/widgets/selection_modal.dart';
import '../../widgets/sync_indicator.dart';
import '../controllers/finish_task_provider.dart';
import '../controllers/operator_search_provider.dart';
import '../widgets/quantity_stepper.dart';
import '../widgets/task_detail_card.dart';

class FinishTaskPage extends ConsumerStatefulWidget {
  const FinishTaskPage({super.key, required this.taskId});

  final String taskId;

  @override
  ConsumerState<FinishTaskPage> createState() => _FinishTaskPageState();
}

class _FinishTaskPageState extends ConsumerState<FinishTaskPage> {
  final _notesController = TextEditingController();

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(finishTaskProvider(null));
    final notifier = ref.read(finishTaskProvider(null).notifier);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: theme.appBarTheme.backgroundColor,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded,
              color: theme.appBarTheme.iconTheme?.color),
          onPressed: () => context.go('/operator/dashboard'),
        ),
        title: Text('FIN DE TÂCHE',
            style: TextStyle(
                color: theme.appBarTheme.titleTextStyle?.color,
                fontWeight: FontWeight.w700,
                fontSize: 18)),
        actions: [
          if (state.currentTask != null)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: SyncIndicator(
                lastSync: DateTime.now(),
                isSyncing: state.isSubmitting,
                onSync: notifier.loadCurrentTask,
              ),
            ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
          children: [
            const _SectionTitle(
                icon: Icons.badge_outlined, label: 'PERSONNEL'),
            const SizedBox(height: 10),
            _Panel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _OperatorSelectionField(
                    selectedId: state.selectedOperatorId,
                    onSelect: (id) {
                      notifier.setSelectedOperator(id);
                    },
                    onClear: () {
                      notifier.clearOperator();
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            if (state.currentTask != null) ...[
              const _SectionTitle(
                  icon: Icons.assignment_rounded, label: 'DETAILS DE LA TÂCHE'),
              const SizedBox(height: 10),
              _Panel(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TaskDetailCard(task: state.currentTask!),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              const _SectionTitle(icon: Icons.edit_rounded, label: 'SAISIE DE FIN'),
              const SizedBox(height: 10),
              _Panel(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'QUANTITÉ PRODUITE (UNITÉS)',
                      style: theme.textTheme.labelLarge?.copyWith(
                        color: isDark
                            ? const Color(0xFF8EA2C3)
                            : AppPalette.textSecondaryLight,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 12),
                    QuantityStepper(
                      value: state.quantity,
                      min: 0,
                      quickAdds: const [10, 50],
                      onChanged: notifier.updateQuantity,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              _Panel(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'NOTES / OBSERVATIONS (OPTIONNEL)',
                      style: theme.textTheme.labelLarge?.copyWith(
                        color: isDark
                            ? const Color(0xFF8EA2C3)
                            : AppPalette.textSecondaryLight,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _notesController,
                      onChanged: notifier.updateNotes,
                      maxLines: 4,
                      style: TextStyle(
                          color: isDark
                              ? AppPalette.textPrimary
                              : AppPalette.textPrimaryLight),
                      decoration: InputDecoration(
                        hintText: 'Problème machine, rebuts...',
                        hintStyle: TextStyle(
                            color: isDark
                                ? AppPalette.textMuted
                                : AppPalette.textMutedLight),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ] else ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0xFF1A2C4B)
                      : AppPalette.surfaceLight,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                      color: isDark
                          ? AppPalette.borderDark
                          : AppPalette.borderLight),
                ),
                child: Text(
                  state.selectedOperatorId == null
                      ? 'Sélectionnez un opérateur pour voir la tâche'
                      : state.error ?? 'Aucune tâche en cours',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      color: isDark
                          ? const Color(0xFFB8C6DE)
                          : AppPalette.textSecondaryLight),
                ),
              ),
            ],
            if (state.error != null && state.currentTask != null)
              Padding(
                padding: const EdgeInsets.only(top: 16),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppPalette.error.withOpacity(0.1),
                    border: Border.all(color: AppPalette.error),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    state.error!,
                    style: TextStyle(
                        color: isDark
                            ? const Color(0xFFFF7A83)
                            : const Color(0xFFD32F2F),
                        fontWeight: FontWeight.w500),
                  ),
                ),
              ),
          ],
        ),
      ),
      bottomNavigationBar: state.currentTask != null
          ? Container(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 24),
              decoration: BoxDecoration(
                color: theme.scaffoldBackgroundColor,
                border: Border(
                    top: BorderSide(
                  color: isDark
                      ? AppPalette.borderDark
                      : AppPalette.borderLight,
                  width: 1,
                )),
              ),
              child: SizedBox(
                height: 60,
                child: FilledButton.icon(
                  onPressed: state.isSubmitting || state.quantity <= 0
                      ? null
                      : () async {
                          final result = await notifier.submit();
                          if (result == null || !context.mounted) {
                            return;
                          }
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                                content: Text(
                                    'Production clôturée avec succès.')),
                          );
                          context.go('/operator/dashboard');
                        },
                  icon: state.isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                              strokeWidth: 2.5, color: Colors.white))
                      : const Icon(Icons.check_circle_outline, size: 24),
                  label: const Text('CLÔTURER LA PRODUCTION',
                      style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.5)),
                  style: FilledButton.styleFrom(
                      backgroundColor: AppPalette.primary,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16))),
                ),
              ),
            )
          : null,
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({
    required this.icon,
    required this.label,
  });

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Row(
      children: [
        Icon(icon, color: AppPalette.primary, size: 20),
        const SizedBox(width: 8),
        Text(
          label,
          style: TextStyle(
            color: isDark ? AppPalette.textPrimary : AppPalette.textPrimaryLight,
            fontSize: 14,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.5,
          ),
        ),
      ],
    );
  }
}

class _Panel extends StatelessWidget {
  const _Panel({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1A2C4B) : Colors.white,
        border: Border.all(
          color: isDark ? AppPalette.borderDark : AppPalette.borderLight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: isDark
            ? null
            : [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
      ),
      child: child,
    );
  }
}

class _OperatorSelectionField extends ConsumerWidget {
  const _OperatorSelectionField({
    required this.selectedId,
    required this.onSelect,
    required this.onClear,
  });

  final String? selectedId;
  final Function(String) onSelect;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final operatorsAsync = ref.watch(allOperatorsProvider);
    final operatorNameAsync = ref.watch(operatorNameProvider(selectedId));

    return operatorsAsync.when(
      data: (operators) {
        return SelectionField<String>(
          label: 'OPÉRATEUR (BADGE)',
          value: selectedId,
          displayText: (id) {
            // Try to find display name synchronously or return loading
            if (operatorNameAsync.hasValue) {
              return operatorNameAsync.value!;
            }
            return 'Chargement...';
          },
          onTap: () {
            showDialog(
              context: context,
              builder: (dialogContext) => SelectionModal<String>(
                title: 'Sélectionner un opérateur',
                items: operators.map((op) => op.id.toString()).toList(),
                displayText: (id) {
                  final operator = operators.firstWhere(
                    (op) => op.id.toString() == id,
                    orElse: () => throw Exception('Opérateur non trouvé'),
                  );
                  return '${operator.firstName} ${operator.lastName} (${operator.matricule})';
                },
                selectedValue: selectedId,
                onSelect: (id) {
                  debugPrint('🎯 [FinishTaskPage] onSelect callback triggered with ID: $id');
                  onSelect(id);
                  debugPrint('🎯 [FinishTaskPage] SelectionModal will close itself');
                },
              ),
            );
          },
          onClear: onClear,
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) => SelectionField<String>(
        label: 'OPÉRATEUR (BADGE)',
        value: selectedId,
        displayText: (id) => 'Erreur de chargement',
        onTap: () {},
      ),
    );
  }
}
