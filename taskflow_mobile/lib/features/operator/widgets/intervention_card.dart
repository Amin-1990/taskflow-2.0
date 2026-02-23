import 'package:flutter/material.dart';
import '../../../core/constants/design_constants.dart';
import '../../../core/widgets/tap_scale.dart';

class InterventionCard extends StatelessWidget {
  const InterventionCard({super.key, this.onTap});

  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: TapScale(
        onTap: onTap,
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 20),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppPalette.borderDark),
            gradient: const LinearGradient(
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
              colors: [Color(0xFF233758), Color(0xFF192845)],
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
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Demander Intervention',
                      style: TextStyle(
                          color: AppPalette.textPrimary,
                          fontSize: 32 / 1.4,
                          fontWeight: FontWeight.w700),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Maintenance requise ?',
                      style: TextStyle(
                          color: AppPalette.textSecondary, fontSize: 16),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right,
                  color: AppPalette.textSecondary, size: 36),
            ],
          ),
        ),
      ),
    );
  }
}
