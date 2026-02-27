import 'package:flutter/material.dart';

import '../../../../core/constants/design_constants.dart';
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
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    final statusColor =
        order.isCompleted ? const Color(0xFF42D48C) : AppPalette.primary;

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF13284A) : AppPalette.surfaceLight,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDark ? const Color(0xFF24456F) : AppPalette.borderLight),
        boxShadow: isDark ? null : [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
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
                      color: statusColor, fontWeight: FontWeight.w800, fontSize: 13),
                ),
              ),
              const SizedBox(width: 10),
              Text('LOT ${order.lotNumber}',
                  style:
                      TextStyle(color: isDark ? const Color(0xFF94A8CA) : AppPalette.textSecondaryLight, fontSize: 16, fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 12),
          Text(order.articleName,
              style: TextStyle(
                  color: isDark ? AppPalette.textPrimary : AppPalette.textPrimaryLight,
                  fontSize: 20,
                  fontWeight: FontWeight.w800)),
          const SizedBox(height: 4),
          Text('${order.productionLine} • ${order.periodLabel}',
              style: TextStyle(color: isDark ? const Color(0xFF8CA3C6) : AppPalette.textSecondaryLight, fontSize: 16)),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Objectif jour: ${order.dailyTarget}',
                      style: TextStyle(color: isDark ? const Color(0xFFB7C7DE) : AppPalette.textSecondaryLight, fontSize: 15)),
                  Text('Déjà emballé: ${order.packedToday}',
                      style: TextStyle(color: isDark ? const Color(0xFFB7C7DE) : AppPalette.textSecondaryLight, fontSize: 15)),
                ],
              ),
              ClipOval(
                child: Container(
                  width: 44,
                  height: 44,
                  color: statusColor.withOpacity(0.1),
                  child: Center(
                    child: Text('${(order.progress * 100).round()}%',
                        style: TextStyle(color: statusColor, fontWeight: FontWeight.w800, fontSize: 13)),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF0D1F3F) : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                _StepperButton(icon: Icons.remove, onPressed: onDecrement, color: statusColor),
                Expanded(
                  child: Column(
                    children: [
                      Text('Qté période',
                          style: TextStyle(color: isDark ? const Color(0xFF93A8CB) : AppPalette.textSecondaryLight, fontSize: 13)),
                      Text('$periodQuantity',
                          style: TextStyle(
                              color: isDark ? AppPalette.textPrimary : AppPalette.textPrimaryLight,
                              fontSize: 28,
                              fontWeight: FontWeight.w800)),
                    ],
                  ),
                ),
                _StepperButton(icon: Icons.add, onPressed: onIncrement, color: statusColor),
              ],
            ),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: FilledButton(
              onPressed: periodQuantity <= 0 ? null : onValidate,
              style: FilledButton.styleFrom(
                backgroundColor: statusColor,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: const Text('Valider période', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
            ),
          ),
          const SizedBox(height: 14),
          ClipRRect(
            borderRadius: BorderRadius.circular(99),
            child: LinearProgressIndicator(
              minHeight: 8,
              value: order.progress,
              backgroundColor: isDark ? const Color(0xFF1E3559) : const Color(0xFFE2E8F0),
              valueColor: AlwaysStoppedAnimation<Color>(statusColor),
            ),
          ),
        ],
      ),
    );
  }
}

class _StepperButton extends StatelessWidget {
  const _StepperButton({required this.icon, required this.onPressed, required this.color});
  final IconData icon;
  final VoidCallback onPressed;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            border: Border.all(color: isDark ? const Color(0xFF24456F) : AppPalette.borderLight),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, size: 22, color: color),
        ),
      ),
    );
  }
}
