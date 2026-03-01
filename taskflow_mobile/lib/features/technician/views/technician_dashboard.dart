import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/constants/design_constants.dart';
import '../../../domain/models/intervention.dart';
import '../../auth/controllers/auth_provider.dart';
import '../controllers/technician_interventions_provider.dart';

class TechnicianDashboardPage extends ConsumerWidget {
  const TechnicianDashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final user = authState.user;
    final techId = user?.id ?? '';
    final state = ref.watch(technicianInterventionsProvider);
    final notifier = ref.read(technicianInterventionsProvider.notifier);

    final ongoing = state.ongoingFor(techId);
    final completed = state.completedFor(techId);
    final visible = state.tab == TechnicianTab.ongoing ? ongoing : completed;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      floatingActionButton: state.tab == TechnicianTab.ongoing
          ? FloatingActionButton(
              backgroundColor: AppPalette.primary,
              elevation: 4,
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                      content:
                          Text('Creation intervention technicien: a venir.')),
                );
              },
              child: const Icon(Icons.add_rounded, color: Colors.white),
            )
          : null,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: notifier.load,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 25,
                    backgroundColor: AppPalette.primary.withOpacity(0.2),
                    child: Text(
                      _initials(user?.fullName ?? ''),
                      style: TextStyle(
                          color: isDark ? Colors.white : AppPalette.primary, 
                          fontWeight: FontWeight.w700),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Bonjour,',
                            style: TextStyle(
                                color: isDark ? const Color(0xFF9CB0CE) : AppPalette.textSecondaryLight, 
                                fontSize: 18)),
                        Text(
                          user?.fullName ?? 'Technicien',
                          style: TextStyle(
                              color: theme.colorScheme.onSurface,
                              fontSize: 36 / 1.4,
                              fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                  ),
                  _SyncBadge(
                      isOnline: state.isOnline,
                      pendingCount: state.pendingSyncCount),
                ],
              ),
              const SizedBox(height: 18),
              Text(
                'Mes interventions',
                style: TextStyle(
                    color: theme.colorScheme.onSurface,
                    fontSize: 46 / 1.4,
                    fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 14),
              _Tabs(
                tab: state.tab,
                ongoingCount: ongoing.length,
                onTabChanged: notifier.setTab,
              ),
              const SizedBox(height: 12),
              if (state.error != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Text(state.error!,
                      style: const TextStyle(color: AppPalette.error)),
                ),
              if (state.isLoading)
                const Padding(
                  padding: EdgeInsets.only(top: 140),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (visible.isEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 140),
                  child: Center(
                    child: Text('Aucune intervention pour cet onglet.',
                        style: TextStyle(
                            color: isDark ? const Color(0xFF9FB2D0) : AppPalette.textMutedLight)),
                  ),
                )
              else
                ...visible.map(
                  (item) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _InterventionCard(
                      item: item,
                      isBusy: state.isActionInProgress,
                      onAction: () async {
                        String? message;
                        if (item.status == InterventionStatus.enAttente) {
                          message = await notifier.takeOwnership(item.id);
                        } else if (item.status == InterventionStatus.affectee) {
                          message = await notifier.start(item.id);
                        } else if (item.status == InterventionStatus.enCours) {
                          message = await notifier.finish(item.id);
                        }

                        if (!context.mounted) {
                          return;
                        }
                        if (message != null) {
                          ScaffoldMessenger.of(context)
                              .showSnackBar(SnackBar(content: Text(message)));
                        } else if (item.status != InterventionStatus.terminee) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                                content: Text('Intervention mise a jour.')),
                          );
                        }
                      },
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: Container(
        height: 74,
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF0E1E3A) : Colors.white,
          border: Border(top: BorderSide(
              color: isDark ? const Color(0xFF213A5E) : AppPalette.borderLight
          )),
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _BottomNavIcon(
                icon: Icons.home_rounded, label: 'Accueil', active: false),
            _BottomNavIcon(
                icon: Icons.assignment_rounded, label: 'Taches', active: true),
            _BottomNavIcon(
                icon: Icons.notifications_rounded,
                label: 'Alertes',
                active: false),
            _BottomNavIcon(
                icon: Icons.person_rounded, label: 'Profil', active: false),
          ],
        ),
      ),
    );
  }

  String _initials(String value) {
    final parts =
        value.trim().split(RegExp(r'\s+')).where((e) => e.isNotEmpty).toList();
    if (parts.isEmpty) {
      return 'TD';
    }
    if (parts.length == 1) {
      return parts.first.substring(0, 1).toUpperCase();
    }
    return '${parts.first.substring(0, 1)}${parts.last.substring(0, 1)}'
        .toUpperCase();
  }
}

class _Tabs extends StatelessWidget {
  const _Tabs({
    required this.tab,
    required this.ongoingCount,
    required this.onTabChanged,
  });

  final TechnicianTab tab;
  final int ongoingCount;
  final ValueChanged<TechnicianTab> onTabChanged;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F2446) : const Color(0xFFEDF2F9),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
            color: isDark ? const Color(0xFF2A426B) : AppPalette.borderLight
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: _TabButton(
              title: 'En cours',
              selected: tab == TechnicianTab.ongoing,
              trailingCount: ongoingCount,
              onTap: () => onTabChanged(TechnicianTab.ongoing),
            ),
          ),
          Expanded(
            child: _TabButton(
              title: 'Terminees',
              selected: tab == TechnicianTab.completed,
              onTap: () => onTabChanged(TechnicianTab.completed),
            ),
          ),
        ],
      ),
    );
  }
}

class _TabButton extends StatelessWidget {
  const _TabButton({
    required this.title,
    required this.selected,
    required this.onTap,
    this.trailingCount,
  });

  final String title;
  final bool selected;
  final VoidCallback onTap;
  final int? trailingCount;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        margin: const EdgeInsets.all(6),
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: selected ? AppPalette.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              title,
              style: TextStyle(
                color: selected 
                    ? Colors.white 
                    : (isDark ? const Color(0xFF9FB2D0) : AppPalette.textSecondaryLight),
                fontSize: 31 / 1.6,
                fontWeight: FontWeight.w700,
              ),
            ),
            if (trailingCount != null && trailingCount! > 0) ...[
              const SizedBox(width: 8),
              CircleAvatar(
                radius: 13,
                backgroundColor: selected
                    ? Colors.white.withOpacity(0.2)
                    : (isDark ? const Color(0xFF263E63) : AppPalette.borderLight),
                child: Text(
                  '$trailingCount',
                  style: TextStyle(
                      color: selected ? Colors.white : (isDark ? Colors.white : AppPalette.primary),
                      fontSize: 12,
                      fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _InterventionCard extends StatelessWidget {
  const _InterventionCard({
    required this.item,
    required this.isBusy,
    required this.onAction,
  });

  final Intervention item;
  final bool isBusy;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final dateText = DateFormat('HH:mm').format(item.dateDemande);
    final color = _priorityColor(item.priority);
    final label = _statusAction(item.status);

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1A2C4B) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
            color: isDark ? const Color(0xFF2A426B) : AppPalette.borderLight
        ),
        boxShadow: isDark ? null : [
          const BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, 3))
        ]
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 5,
            height: label == null ? 176 : 220,
            margin: const EdgeInsets.only(top: 16, left: 8),
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(999),
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(14, 16, 14, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          item.machine.name.toUpperCase(),
                          style: TextStyle(
                              color: isDark ? const Color(0xFF9DB0CC) : AppPalette.textSecondaryLight,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 1),
                        ),
                      ),
                      _PriorityBadge(priority: item.priority),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    item.typePanne,
                    style: TextStyle(
                        color: theme.colorScheme.onSurface,
                        fontSize: 20 / 1.1,
                        fontWeight: FontWeight.w700),
                  ),
                  if (item.description.trim().isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      item.description,
                      style: TextStyle(
                          color: isDark ? const Color(0xFFA4B7D4) : AppPalette.textMutedLight, 
                          height: 1.35),
                    ),
                  ],
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Icon(Icons.location_on_outlined,
                          color: isDark ? const Color(0xFF91A5C7) : AppPalette.textMutedLight, 
                          size: 19),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          item.machine.location,
                          style: TextStyle(
                              color: isDark ? const Color(0xFFB2C2DB) : AppPalette.textSecondaryLight, 
                              fontSize: 18),
                        ),
                      ),
                      Text(
                        dateText,
                        style: TextStyle(
                            color: isDark ? const Color(0xFF90A4C4) : AppPalette.textMutedLight, 
                            fontSize: 18),
                      ),
                    ],
                  ),
                  if (label != null) ...[
                    const SizedBox(height: 12),
                    Divider(
                      color: isDark ? const Color(0xFF2A426B) : AppPalette.borderLight, 
                      height: 1
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: isBusy ? null : onAction,
                        child: isBusy
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2, color: Colors.white))
                            : Text(label,
                                style: const TextStyle(
                                    fontSize: 18, fontWeight: FontWeight.w700)),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  String? _statusAction(InterventionStatus status) {
    switch (status) {
      case InterventionStatus.enAttente:
        return 'Prendre en charge';
      case InterventionStatus.affectee:
        return 'Demarrer';
      case InterventionStatus.enCours:
        return 'Terminer';
      case InterventionStatus.terminee:
      case InterventionStatus.annulee:
        return null;
    }
  }

  Color _priorityColor(InterventionPriority priority) {
    switch (priority) {
      case InterventionPriority.urgente:
      case InterventionPriority.haute:
        return AppPalette.error;
      case InterventionPriority.basse:
        return AppPalette.success;
      case InterventionPriority.normale:
      case InterventionPriority.moyenne:
        return AppPalette.warning;
    }
  }
}

class _PriorityBadge extends StatelessWidget {
  const _PriorityBadge({required this.priority});

  final InterventionPriority priority;

  @override
  Widget build(BuildContext context) {
    final color = switch (priority) {
      InterventionPriority.urgente || InterventionPriority.haute => AppPalette.error,
      InterventionPriority.normale || InterventionPriority.moyenne => AppPalette.warning,
      InterventionPriority.basse => AppPalette.success,
    };
    final label = switch (priority) {
      InterventionPriority.urgente => 'URGENTE',
      InterventionPriority.haute => 'HAUTE',
      InterventionPriority.normale || InterventionPriority.moyenne => 'NORMALE',
      InterventionPriority.basse => 'BASSE',
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: color.withOpacity(0.16),
        border: Border.all(color: color.withOpacity(0.6)),
      ),
      child: Text(
        label,
        style: TextStyle(color: color, fontWeight: FontWeight.w800),
      ),
    );
  }
}

class _SyncBadge extends StatelessWidget {
  const _SyncBadge({required this.isOnline, required this.pendingCount});

  final bool isOnline;
  final int pendingCount;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
            color: isOnline ? AppPalette.success : AppPalette.error),
        color: isOnline 
            ? AppPalette.success.withOpacity(0.1) 
            : AppPalette.error.withOpacity(0.1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isOnline ? Icons.sync_rounded : Icons.cloud_off_rounded,
            color: isOnline ? AppPalette.success : AppPalette.error,
            size: 18,
          ),
          const SizedBox(width: 6),
          Text(
            isOnline ? 'Synchronise' : '$pendingCount en attente',
            style: TextStyle(
              color: isOnline ? AppPalette.success : AppPalette.error,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _BottomNavIcon extends StatelessWidget {
  const _BottomNavIcon(
      {required this.icon, required this.label, required this.active});

  final IconData icon;
  final String label;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final color = active 
        ? AppPalette.primary 
        : (isDark ? const Color(0xFF8EA3C5) : AppPalette.textSecondaryLight);
    
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(icon, color: color),
        const SizedBox(height: 4),
        Text(label,
            style: TextStyle(
                color: color,
                fontWeight: active ? FontWeight.w700 : FontWeight.w500)),
      ],
    );
  }
}
