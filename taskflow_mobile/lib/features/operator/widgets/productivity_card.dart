import 'package:flutter/material.dart';
import '../../../core/constants/design_constants.dart';

class ProductivityCard extends StatelessWidget {
  const ProductivityCard({
    super.key,
    required this.productivity,
    required this.targetUnits,
    required this.achievedUnits,
  });

  final double productivity;
  final int targetUnits;
  final int achievedUnits;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? AppPalette.surfaceDark : AppPalette.surfaceLight,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
            color: isDark ? AppPalette.borderDark : AppPalette.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('Productivite',
                  style: TextStyle(
                      color: isDark ? AppPalette.textPrimary : AppPalette.textPrimaryLight,
                      fontSize: 18,
                      fontWeight: FontWeight.w600)),
              const Spacer(),
              Text(
                '${(productivity * 100).round()}%',
                style: const TextStyle(
                    color: AppPalette.primary,
                    fontSize: 18,
                    fontWeight: FontWeight.w700),
              ),
            ],
          ),
          const SizedBox(height: 14),
          ClipRRect(
            borderRadius: BorderRadius.circular(99),
            child: LinearProgressIndicator(
              minHeight: 18,
              value: productivity.clamp(0, 1),
              backgroundColor: isDark ? const Color(0xFF24334E) : const Color(0xFFE2E8F0),
              valueColor:
                  const AlwaysStoppedAnimation<Color>(AppPalette.primary),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Text('Objectif: $targetUnits unites',
                  style: TextStyle(
                      color: isDark ? AppPalette.textSecondary : AppPalette.textSecondaryLight, 
                      fontSize: 16)),
              const Spacer(),
              Text('Realise: $achievedUnits unites',
                  style: TextStyle(
                      color: isDark ? AppPalette.textSecondary : AppPalette.textSecondaryLight, 
                      fontSize: 16)),
            ],
          ),
        ],
      ),
    );
  }
}
