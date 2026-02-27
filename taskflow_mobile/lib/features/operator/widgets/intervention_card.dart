import 'package:flutter/material.dart';
import '../../../core/constants/design_constants.dart';
import '../../../core/widgets/tap_scale.dart';

class InterventionCard extends StatelessWidget {
  const InterventionCard({super.key, this.onTap});

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
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 20),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
                color: isDark ? AppPalette.borderDark : AppPalette.borderLight),
            gradient: LinearGradient(
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
              colors: isDark
                  ? [const Color(0xFF233758), const Color(0xFF192845)]
                  : [const Color(0xFFFFFFFF), const Color(0xFFF1F5F9)],
            ),
            boxShadow: isDark
                ? null
                : [
                    const BoxShadow(
                      color: Colors.black12,
                      blurRadius: 10,
                      offset: Offset(0, 4),
                    ),
                  ],
            image: isDark ? null : DecorationImage(
              image: const AssetImage('assets/images/card_pattern.png'), // Fallback safe
              opacity: 0.03,
              alignment: Alignment.centerRight,
              repeat: ImageRepeat.repeat,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: const Color(0xFF5D63FF).withOpacity(0.18),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: const Icon(Icons.build_rounded,
                    color: Color(0xFF7A7FFF), size: 32),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Demander Intervention',
                      style: TextStyle(
                          color: isDark ? AppPalette.textPrimary : AppPalette.textPrimaryLight,
                          fontSize: 32 / 1.4,
                          fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Maintenance requise ?',
                      style: TextStyle(
                          color: isDark ? AppPalette.textSecondary : AppPalette.textSecondaryLight, 
                          fontSize: 16),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right,
                  color: isDark ? AppPalette.textSecondary : AppPalette.textSecondaryLight, 
                  size: 36),
            ],
          ),
        ),
      ),
    );
  }
}
