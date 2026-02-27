import 'package:flutter/material.dart';
import '../../../core/constants/design_constants.dart';

class SettingsSection extends StatelessWidget {
  const SettingsSection({
    super.key,
    required this.title,
    required this.child,
  });

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title.toUpperCase(),
          style: TextStyle(
            color: isDark ? const Color(0xFF7F93B4) : AppPalette.textMutedLight,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.1,
            fontSize: 28 / 2,
          ),
        ),
        const SizedBox(height: 10),
        Container(
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1A2C4B) : Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
                color: isDark ? const Color(0xFF2A426B) : AppPalette.borderLight
            ),
            boxShadow: isDark ? null : [
              const BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))
            ],
          ),
          child: child,
        ),
      ],
    );
  }
}
