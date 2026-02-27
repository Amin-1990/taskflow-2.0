import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/bottom_navigation.dart';
import '../../../core/constants/design_constants.dart';
import '../controllers/operator_dashboard_provider.dart';
import '../widgets/header_with_profile.dart';
import '../widgets/intervention_card.dart';
import '../widgets/stat_card.dart';

class OperatorDashboardPage extends ConsumerWidget {
  const OperatorDashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(operatorDashboardProvider);
    final notifier = ref.read(operatorDashboardProvider.notifier);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: notifier.refresh,
          color: AppPalette.primary,
          backgroundColor: isDark ? const Color(0xFF112341) : Colors.white,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 18),
            children: [
              if (state.isLoading && state.userContext == null)
                const _DashboardShimmer()
              else if (state.error != null && state.stats == null)
                _ErrorView(
                  message: state.error!,
                  onRetry: notifier.loadDashboard,
                )
              else ...[
                HeaderWithProfile(
                  userContext: state.userContext!,
                  isSyncing: state.isRefreshing,
                  onSync: notifier.refresh,
                ),
                const SizedBox(height: 14),
                Container(
                  height: 1, 
                  color: isDark ? AppPalette.borderDark : AppPalette.borderLight
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Tableau de bord',
                        style: TextStyle(
                            color: isDark ? AppPalette.textPrimary : AppPalette.textPrimaryLight,
                            fontWeight: FontWeight.w700,
                            fontSize: 38 / 1.4),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                            color: AppPalette.primary.withOpacity(0.5)),
                        color: isDark ? const Color(0xFF12274A) : AppPalette.primary.withOpacity(0.08),
                      ),
                      child: const Text('v2.4.0',
                          style: TextStyle(
                              color: AppPalette.primary,
                              fontSize: 14,
                              fontWeight: FontWeight.w700)),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const _StatGrid(),
                const SizedBox(height: 14),
                InterventionCard(
                    onTap: () =>
                        context.push('/operator/intervention/request')),
              ],
            ],
          ),
        ),
      ),
      bottomNavigationBar:
          const TaskflowBottomNavigation(currentIndex: 0, notificationCount: 0),
    );
  }
}

class _StatGrid extends StatelessWidget {
  const _StatGrid();

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.0,
      children: [
        StatCard(
          icon: Icons.assignment_rounded,
          label: 'Affectations',
          color: const Color(0xFF2A7BFF),
          onTap: () => context.push('/operator/affectations'),
        ),
        StatCard(
          icon: Icons.check_circle_outline,
          label: 'Finir tâche',
          color: const Color(0xFF33D39A),
          onTap: () => context.push('/operator/tasks'),
        ),
        StatCard(
          icon: Icons.inventory_2_outlined,
          label: 'Emballage',
          color: const Color(0xFFF7C744),
          onTap: () => context.push('/operator/packaging'),
        ),
        StatCard(
          icon: Icons.warning_amber_rounded,
          label: 'Défauts Process',
          color: const Color(0xFFFD6A77),
          onTap: () => context.push('/operator/defects'),
        ),
      ],
    );
  }
}

class _DashboardShimmer extends StatefulWidget {
  const _DashboardShimmer();

  @override
  State<_DashboardShimmer> createState() => _DashboardShimmerState();
}

class _DashboardShimmerState extends State<_DashboardShimmer>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1300))
      ..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final pulse = isDark 
            ? 0.22 + (_controller.value * 0.24)
            : 0.12 + (_controller.value * 0.10);
        final color = isDark 
            ? Color.fromRGBO(36, 64, 102, pulse)
            : Color.fromRGBO(203, 213, 225, pulse);
            
        return Column(
          children: [
            Container(
                height: 90,
                decoration: BoxDecoration(
                    color: color, borderRadius: BorderRadius.circular(20))),
            const SizedBox(height: 16),
            Container(
                height: 50,
                decoration: BoxDecoration(
                    color: color, borderRadius: BorderRadius.circular(12))),
            const SizedBox(height: 16),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1,
              children: List.generate(
                4,
                (_) => Container(
                  decoration: BoxDecoration(
                      color: color, borderRadius: BorderRadius.circular(24)),
                ),
              ),
            ),
            const SizedBox(height: 14),
            Container(
                height: 100,
                decoration: BoxDecoration(
                    color: color, borderRadius: BorderRadius.circular(24))),
          ],
        );
      },
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final mutedColor = isDark ? const Color(0xFF9DB2D4) : AppPalette.textMutedLight;
    
    return Padding(
      padding: const EdgeInsets.only(top: 120),
      child: Column(
        children: [
          Icon(Icons.cloud_off, color: mutedColor, size: 44),
          const SizedBox(height: 10),
          Text(
            message,
            textAlign: TextAlign.center,
            style: TextStyle(color: mutedColor, fontSize: 16),
          ),
          const SizedBox(height: 14),
          FilledButton(onPressed: onRetry, child: const Text('Réessayer')),
        ],
      ),
    );
  }
}
