import 'package:flutter/material.dart';

import '../../../../domain/models/task.dart';

class TaskDetailCard extends StatelessWidget {
  const TaskDetailCard({super.key, required this.task});

  final Task task;

  @override
  Widget build(BuildContext context) {
    final started =
        '${task.startTime.hour.toString().padLeft(2, '0')}:${task.startTime.minute.toString().padLeft(2, '0')}';
    final duration =
        '${task.activeDuration.inHours.toString().padLeft(2, '0')}h ${(task.activeDuration.inMinutes % 60).toString().padLeft(2, '0')}m';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF13284A),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF284978)),
        boxShadow: const [
          BoxShadow(
              color: Color(0x33000000), blurRadius: 10, offset: Offset(0, 6))
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('${task.orderNumber} • ${task.workstation}',
              style: const TextStyle(
                  color: Color(0xFFE9EEF8),
                  fontWeight: FontWeight.w700,
                  fontSize: 16)),
          const SizedBox(height: 6),
          Text('Article: ${task.articleName}',
              style: const TextStyle(color: Color(0xFFC1D0E8))),
          Text('REF: ${task.articleRef}',
              style: const TextStyle(color: Color(0xFFC1D0E8))),
          const SizedBox(height: 6),
          Text('Debut: $started   Duree: $duration',
              style: const TextStyle(color: Color(0xFF90A6C8))),
        ],
      ),
    );
  }
}
