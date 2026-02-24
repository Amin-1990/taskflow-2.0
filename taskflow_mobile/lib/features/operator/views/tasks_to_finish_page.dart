import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../task/controllers/finish_task_provider.dart';

class TasksToFinishPage extends ConsumerStatefulWidget {
  const TasksToFinishPage({super.key});

  @override
  ConsumerState<TasksToFinishPage> createState() => _TasksToFinishPageState();
}

class _TasksToFinishPageState extends ConsumerState<TasksToFinishPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final taskId = ref.read(currentTaskIdProvider);
      if (!mounted) {
        return;
      }
      if (taskId != null && taskId.isNotEmpty) {
        context.go('/operator/task/finish/$taskId');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFFE8EEF8)),
          onPressed: () => context.go('/operator/dashboard'),
        ),
        title: const Text('Taches a finir'),
      ),
      body: Center(
        child: FilledButton(
          onPressed: () {
            final taskId = ref.read(currentTaskIdProvider) ?? 'task-123';
            context.go('/operator/task/finish/$taskId');
          },
          child: const Text('Ouvrir la tache en cours'),
        ),
      ),
    );
  }
}
