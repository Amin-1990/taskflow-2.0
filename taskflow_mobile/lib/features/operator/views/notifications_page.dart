import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/design_constants.dart';

class NotificationsPage extends StatelessWidget {
  const NotificationsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: theme.appBarTheme.backgroundColor,
        leading: IconButton(
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/operator/dashboard');
            }
          },
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          color: theme.appBarTheme.iconTheme?.color,
        ),
        title: Text(
          'Notifications',
          style: TextStyle(
            color: theme.appBarTheme.titleTextStyle?.color,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.notifications_none_rounded,
              size: 80,
              color: isDark ? AppPalette.textMuted : AppPalette.textMutedLight,
            ),
            const SizedBox(height: 16),
            Text(
              'Aucune notification',
              style: TextStyle(
                fontSize: 22,
                color: isDark ? AppPalette.textPrimary : AppPalette.textPrimaryLight,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Vos notifications apparaîtront ici.',
              style: TextStyle(
                fontSize: 16,
                color: isDark ? AppPalette.textSecondary : AppPalette.textSecondaryLight,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
