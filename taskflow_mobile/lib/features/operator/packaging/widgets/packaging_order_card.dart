import 'package:flutter/material.dart';

import '../../../../domain/models/commande_emballage.dart';

class PackagingOrderCard extends StatelessWidget {
  const PackagingOrderCard({
    super.key,
    required this.order,
    required this.periodQuantity,
    required this.onIncrement,
    required this.onDecrement,
    required this.onValidate,
  });

  final CommandeEmballage order;
  final int periodQuantity;
  final VoidCallback onIncrement;
  final VoidCallback onDecrement;
  final VoidCallback onValidate;

  @override
  Widget build(BuildContext context) {
    final statusColor =
        order.isCompleted ? const Color(0xFF42D48C) : const Color(0xFF2A7BFF);

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF13284A),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF24456F)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.18),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  order.isCompleted ? 'TERMINEE' : 'EN COURS',
                  style: TextStyle(
                      color: statusColor, fontWeight: FontWeight.w700),
                ),
              ),
              const SizedBox(width: 10),
              Text('LOT ${order.lotNumber}',
                  style:
                      const TextStyle(color: Color(0xFF94A8CA), fontSize: 18)),
            ],
          ),
          const SizedBox(height: 8),
          Text(order.articleName,
              style: const TextStyle(
                  color: Color(0xFFEAF0F9),
                  fontSize: 20,
                  fontWeight: FontWeight.w700)),
          const SizedBox(height: 2),
          Text('${order.productionLine} • ${order.periodLabel}',
              style: const TextStyle(color: Color(0xFF8CA3C6), fontSize: 17)),
          const SizedBox(height: 10),
          Text('Objectif jour: ${order.dailyTarget}',
              style: const TextStyle(color: Color(0xFFB7C7DE))),
          Text('Deja emballe: ${order.packedToday}',
              style: const TextStyle(color: Color(0xFFB7C7DE))),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFF0D1F3F),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                IconButton(
                    onPressed: onDecrement,
                    icon: const Icon(Icons.remove, size: 26)),
                Expanded(
                  child: Column(
                    children: [
                      const Text('Qte periode',
                          style: TextStyle(color: Color(0xFF93A8CB))),
                      Text('$periodQuantity',
                          style: const TextStyle(
                              color: Color(0xFFEAF0F9),
                              fontSize: 30,
                              fontWeight: FontWeight.w700)),
                    ],
                  ),
                ),
                IconButton(
                    onPressed: onIncrement,
                    icon: const Icon(Icons.add, size: 26)),
              ],
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: periodQuantity <= 0 ? null : onValidate,
              child: const Text('Valider periode'),
            ),
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(99),
            child: LinearProgressIndicator(
              minHeight: 12,
              value: order.progress,
              backgroundColor: const Color(0xFF1E3559),
              valueColor: AlwaysStoppedAnimation<Color>(statusColor),
            ),
          ),
          const SizedBox(height: 4),
          Align(
            alignment: Alignment.centerRight,
            child: Text('${(order.progress * 100).round()}%',
                style: const TextStyle(color: Color(0xFFB9C9DF))),
          ),
        ],
      ),
    );
  }
}
