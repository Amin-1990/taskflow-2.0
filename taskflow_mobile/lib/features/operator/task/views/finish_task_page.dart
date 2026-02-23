import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/widgets/scanner_button.dart';
import '../../widgets/sync_indicator.dart';
import '../controllers/finish_task_provider.dart';
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
  final _operatorController = TextEditingController();

  @override
  void dispose() {
    _notesController.dispose();
    _operatorController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(finishTaskProvider(widget.taskId));
    final notifier = ref.read(finishTaskProvider(widget.taskId).notifier);

    if (_operatorController.text.isEmpty) {
      _operatorController.text = 'OP-782';
    }

    return Scaffold(
      backgroundColor: const Color(0xFF07152F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF07152F),
        title: const Text('Fin de Production'),
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
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : state.currentTask == null
              ? Center(
                  child: Text(state.error ?? 'Aucune tache en cours.',
                      style: const TextStyle(color: Color(0xFFB8C6DE))),
                )
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    const Text('Identification Operateur',
                        style:
                            TextStyle(color: Color(0xFFB8C6DE), fontSize: 16)),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _operatorController,
                            style: const TextStyle(
                                color: Color(0xFFE8EEF8), fontSize: 22),
                            decoration: const InputDecoration(),
                          ),
                        ),
                        const SizedBox(width: 8),
                        ScannerButton(
                            onScan: (value) =>
                                _operatorController.text = value),
                      ],
                    ),
                    const SizedBox(height: 18),
                    const Text('Details de la Production',
                        style:
                            TextStyle(color: Color(0xFFB8C6DE), fontSize: 16)),
                    const SizedBox(height: 8),
                    TaskDetailCard(task: state.currentTask!),
                    const SizedBox(height: 18),
                    const Text('Saisie de Fin',
                        style: TextStyle(
                            color: Color(0xFFE9EEF8),
                            fontWeight: FontWeight.w600,
                            fontSize: 18)),
                    const SizedBox(height: 10),
                    const Text('Quantite Produite (Unites)',
                        style:
                            TextStyle(color: Color(0xFFB8C6DE), fontSize: 16)),
                    const SizedBox(height: 8),
                    QuantityStepper(
                      value: state.quantity,
                      min: 0,
                      quickAdds: const [10, 50],
                      onChanged: notifier.updateQuantity,
                    ),
                    const SizedBox(height: 16),
                    const Text('Notes / Observations (Optionnel)',
                        style:
                            TextStyle(color: Color(0xFFB8C6DE), fontSize: 16)),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _notesController,
                      onChanged: notifier.updateNotes,
                      maxLines: 4,
                      style: const TextStyle(color: Color(0xFFE8EEF8)),
                      decoration: const InputDecoration(
                          hintText: 'Probleme machine, rebuts...'),
                    ),
                    if (state.error != null) ...[
                      const SizedBox(height: 8),
                      Text(state.error!,
                          style: const TextStyle(color: Color(0xFFFF7A83))),
                    ],
                    const SizedBox(height: 22),
                    SizedBox(
                      height: 56,
                      child: FilledButton(
                        onPressed: state.isSubmitting
                            ? null
                            : () async {
                                final result = await notifier.submit();
                                if (result == null || !context.mounted) {
                                  return;
                                }
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                      content: Text(
                                          'Production cloturee avec succes.')),
                                );
                                context.go('/operator/dashboard');
                              },
                        child: state.isSubmitting
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2, color: Colors.white),
                              )
                            : const Text('Cloturer la production',
                                style: TextStyle(
                                    fontSize: 20, fontWeight: FontWeight.w700)),
                      ),
                    ),
                  ],
                ),
    );
  }
}
