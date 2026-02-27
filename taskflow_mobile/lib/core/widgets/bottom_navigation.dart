import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../constants/design_constants.dart';

class TaskflowBottomNavigation extends StatelessWidget {
  const TaskflowBottomNavigation({
    super.key,
    required this.currentIndex,
    this.notificationCount = 0,
  });

  final int currentIndex;
  final int notificationCount;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.fromLTRB(8, 6, 8, 10),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF13284A) : Colors.white,
        border: Border(
            top: BorderSide(
                color: isDark ? const Color(0xFF233E67) : AppPalette.borderLight,
                width: 1.2)),
        boxShadow: isDark
            ? null
            : [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -5),
                ),
              ],
      ),
      child: Row(
        children: [
          _Item(
            icon: Icons.home_rounded,
            label: 'Accueil',
            active: currentIndex == 0,
            onTap: () => context.go('/operator/dashboard'),
          ),
          _Item(
            icon: Icons.notifications_none_rounded,
            label: 'Notifications',
            active: currentIndex == 1,
            badge: notificationCount,
            onTap: () => context.go('/notifications'),
          ),
          _Item(
            icon: Icons.settings,
            label: 'Parametres',
            active: currentIndex == 2,
            onTap: () => context.go('/settings'),
          ),
        ],
      ),
    );
  }
}

class _Item extends StatelessWidget {
  const _Item({
    required this.icon,
    required this.label,
    required this.active,
    required this.onTap,
    this.badge = 0,
  });

  final IconData icon;
  final String label;
  final bool active;
  final int badge;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final activeColor = AppPalette.primary;
    final inactiveColor = isDark ? const Color(0xFF8CA2C5) : AppPalette.textSecondaryLight;

    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: SizedBox(
          height: 70,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Icon(icon,
                      color: active ? activeColor : inactiveColor,
                      size: 31),
                  if (badge > 0)
                    Positioned(
                      right: -5,
                      top: -5,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                            color: Color(0xFFFF5B61), shape: BoxShape.circle),
                        constraints:
                            const BoxConstraints(minHeight: 18, minWidth: 18),
                        child: Text(
                          '$badge',
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w700),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                label,
                style: TextStyle(
                    color: active ? activeColor : inactiveColor,
                    fontSize: 14,
                    fontWeight: active ? FontWeight.w600 : FontWeight.normal),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
