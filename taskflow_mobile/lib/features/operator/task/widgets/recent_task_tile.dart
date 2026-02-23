import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../domain/models/task.dart';

class RecentTaskTile extends StatelessWidget {
  const RecentTaskTile({super.key, required this.task, this.onTap});

  final Task task;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final agoMinutes = DateTime.now().difference(task.startTime).inMinutes;
    final ago = agoMinutes < 60
        ? 'il y a $agoMinutes min'
        : DateFormat('HH:mm').format(task.startTime);

    return Material(
      color: const Color(0xFF13284A),
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                    color: const Color(0xFF20395F),
                    borderRadius: BorderRadius.circular(22)),
                child: const Icon(Icons.history, color: Color(0xFF87A0C6)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('${task.workstation} - ${task.articleName}',
                        style: const TextStyle(
                            color: Color(0xFFCFDBEE),
                            fontSize: 18,
                            fontWeight: FontWeight.w500)),
                    const SizedBox(height: 2),
                    Text(ago,
                        style: const TextStyle(
                            color: Color(0xFF7E95BA), fontSize: 16)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
