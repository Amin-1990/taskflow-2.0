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
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
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
                          fontWeight: FontWeight.bold,
                          fontSize: 22),
                    ),
                  ),
                ),
                Positioned(
                  right: -1,
                  bottom: -1,
                  child: Container(
                    width: 18,
                    height: 18,
                    decoration: BoxDecoration(
                      color: userContext.isOnline
                          ? AppPalette.success
                          : const Color(0xFF6E7990),
                      shape: BoxShape.circle,
                      border: Border.all(
                          color: isDark ? AppPalette.backgroundDark : AppPalette.backgroundLight, 
                          width: 2.5),
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
                  Text('Bonjour,',
                      style: TextStyle(
                          color: isDark ? AppPalette.textSecondary : AppPalette.textSecondaryLight, 
                          fontSize: 16,
                          fontWeight: FontWeight.w500)),
                  Text(
                    userContext.fullName,
                    style: TextStyle(
                        color: isDark ? AppPalette.textPrimary : AppPalette.textPrimaryLight,
                        fontWeight: FontWeight.w800,
                        fontSize: 22),
                  ),
                ],
              ),
            ),
            Container(
              width: 54,
              height: 54,
              decoration: BoxDecoration(
                color: isDark ? AppPalette.surfaceDark : Colors.white,
                borderRadius: BorderRadius.circular(27),
                border: Border.all(
                    color: isDark ? AppPalette.borderDark : AppPalette.borderLight),
                boxShadow: isDark ? null : [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  )
                ],
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
              style: TextStyle(
                  color: isDark ? AppPalette.textSecondary : AppPalette.textSecondaryLight, 
                  fontSize: 16,
                  fontWeight: FontWeight.w500),
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
