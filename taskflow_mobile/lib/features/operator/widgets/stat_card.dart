import 'package:flutter/material.dart';
import '../../../core/constants/design_constants.dart';
import '../../../core/widgets/tap_scale.dart';

class StatCard extends StatelessWidget {
  const StatCard({
    super.key,
    required this.icon,
    required this.value,
    required this.label,
    required this.color,
    this.onTap,
  });

  final IconData icon;
  final String value;
  final String label;
  final Color color;
  final VoidCallback? onTap;

  @override
    Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Material(
      color: Colors.transparent,
      child: TapScale(
        onTap: onTap,
        child: Ink(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            color: isDark ? AppPalette.surfaceDark : AppPalette.surfaceLight,
            border: Border.all(
                color: isDark ? AppPalette.borderDark : AppPalette.borderLight, 
                width: 1.2),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 58,
                height: 58,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.18),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Icon(icon, color: color, size: 30),
              ),
              const Spacer(),
              Text(
                value,
                style: TextStyle(
                    color: isDark ? AppPalette.textPrimary : AppPalette.textPrimaryLight,
                    fontSize: 36,
                    fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                    color: isDark ? AppPalette.textSecondary : AppPalette.textSecondaryLight,
                    fontSize: 16,
                    fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
