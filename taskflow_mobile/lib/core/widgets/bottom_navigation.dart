import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

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
    return Container(
      padding: const EdgeInsets.fromLTRB(8, 6, 8, 10),
      decoration: const BoxDecoration(
        color: Color(0xFF13284A),
        border: Border(top: BorderSide(color: Color(0xFF233E67), width: 1.2)),
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
                      color: active
                          ? const Color(0xFF2A7BFF)
                          : const Color(0xFF8CA2C5),
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
                    color: active
                        ? const Color(0xFF2A7BFF)
                        : const Color(0xFF8CA2C5),
                    fontSize: 14),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
