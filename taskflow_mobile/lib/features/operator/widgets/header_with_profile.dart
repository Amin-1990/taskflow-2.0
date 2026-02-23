import 'package:flutter/material.dart';

import '../../../core/constants/design_constants.dart';
import '../../../domain/models/user_context.dart';
import 'sync_indicator.dart';

class HeaderWithProfile extends StatelessWidget {
  const HeaderWithProfile({
    super.key,
    required this.userContext,
    required this.isSyncing,
    required this.onSync,
  });

  final UserContext userContext;
  final bool isSyncing;
  final VoidCallback onSync;

  @override
  Widget build(BuildContext context) {
    final initials =
        '${userContext.firstName.isNotEmpty ? userContext.firstName[0] : ''}${userContext.lastName.isNotEmpty ? userContext.lastName[0] : ''}'
            .toUpperCase();

    return Column(
      children: [
        Row(
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  width: 58,
                  height: 58,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      colors: [Color(0xFF2A7BFF), Color(0xFF1B4FCC)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      initials,
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 24),
                    ),
                  ),
                ),
                Positioned(
                  right: -1,
                  bottom: -1,
                  child: Container(
                    width: 16,
                    height: 16,
                    decoration: BoxDecoration(
                      color: userContext.isOnline
                          ? AppPalette.success
                          : const Color(0xFF6E7990),
                      shape: BoxShape.circle,
                      border: Border.all(
                          color: AppPalette.backgroundDark, width: 2),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Bonjour,',
                      style: TextStyle(
                          color: AppPalette.textSecondary, fontSize: 18)),
                  Text(
                    userContext.fullName,
                    style: const TextStyle(
                        color: AppPalette.textPrimary,
                        fontWeight: FontWeight.w700,
                        fontSize: 22),
                  ),
                ],
              ),
            ),
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: AppPalette.surfaceDark,
                borderRadius: BorderRadius.circular(26),
                border: Border.all(color: AppPalette.borderDark),
              ),
              child: const Icon(Icons.cloud_done_outlined,
                  color: AppPalette.primary, size: 28),
            ),
          ],
        ),
        const SizedBox(height: 14),
        Row(
          children: [
            const Icon(Icons.circle, size: 10, color: AppPalette.success),
            const SizedBox(width: 8),
            Text(
              '${userContext.line} - ${userContext.shift} ${userContext.isOnline ? '| Live' : '| Hors-ligne'}',
              style: const TextStyle(
                  color: AppPalette.textSecondary, fontSize: 17),
            ),
            const Spacer(),
            SyncIndicator(
              lastSync: userContext.lastSync,
              isSyncing: isSyncing,
              onSync: onSync,
            ),
          ],
        ),
      ],
    );
  }
}
