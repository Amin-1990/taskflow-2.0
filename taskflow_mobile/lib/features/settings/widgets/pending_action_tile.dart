import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../core/services/sync_service.dart';

class PendingActionTile extends StatelessWidget {
  const PendingActionTile({super.key, required this.action});

  final PendingActionView action;

  @override
  Widget build(BuildContext context) {
    final time = DateFormat('HH:mm').format(action.createdAt);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF2A426B)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  action.title,
                  style: const TextStyle(
                      color: Color(0xFFEAF0F9), fontWeight: FontWeight.w600),
                ),
              ),
              const Text('En attente',
                  style: TextStyle(
                      color: Color(0xFFF2A33A), fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 4),
          Text(action.description,
              style: const TextStyle(color: Color(0xFF9CB0CE))),
          if (action.meta != null) ...[
            const SizedBox(height: 2),
            Text(action.meta!,
                style: const TextStyle(
                    color: Color(0xFF8BA2C6), fontStyle: FontStyle.italic)),
          ],
          const SizedBox(height: 6),
          Text(
            'Cree a $time • Tentatives: ${action.retryCount}',
            style: const TextStyle(color: Color(0xFF7E92B3), fontSize: 12),
          ),
        ],
      ),
    );
  }
}
