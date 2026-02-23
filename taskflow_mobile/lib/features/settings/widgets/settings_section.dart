import 'package:flutter/material.dart';

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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title.toUpperCase(),
          style: const TextStyle(
            color: Color(0xFF7F93B4),
            fontWeight: FontWeight.w700,
            letterSpacing: 1.1,
            fontSize: 28 / 2,
          ),
        ),
        const SizedBox(height: 10),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFF1A2C4B),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFF2A426B)),
          ),
          child: child,
        ),
      ],
    );
  }
}
