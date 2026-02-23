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
    final user = authState.user;
    final techId = user?.id ?? '';
    final state = ref.watch(technicianInterventionsProvider);
    final notifier = ref.read(technicianInterventionsProvider.notifier);

    final ongoing = state.ongoingFor(techId);
    final completed = state.completedFor(techId);
    final visible = state.tab == TechnicianTab.ongoing ? ongoing : completed;

    return Scaffold(
      backgroundColor: AppPalette.backgroundDark,
      floatingActionButton: state.tab == TechnicianTab.ongoing
          ? FloatingActionButton(
              backgroundColor: const Color(0xFF2A7BFF),
              elevation: 10,
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                      content:
                          Text('Creation intervention technicien: a venir.')),
                );
              },
              child: const Icon(Icons.add_rounded),
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
                    backgroundColor: const Color(0xFF1D467A),
                    child: Text(
                      _initials(user?.fullName ?? ''),
                      style: const TextStyle(
                          color: Colors.white, fontWeight: FontWeight.w700),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Bonjour,',
                            style: TextStyle(
                                color: Color(0xFF9CB0CE), fontSize: 18)),
                        Text(
                          user?.fullName ?? 'Technicien',
                          style: const TextStyle(
                              color: Color(0xFFEAF0F9),
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
              const Text(
                'Mes interventions',
                style: TextStyle(
                    color: Color(0xFFEAF0F9),
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
                      style: const TextStyle(color: Color(0xFFFF8D98))),
                ),
              if (state.isLoading)
                const Padding(
                  padding: EdgeInsets.only(top: 140),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (visible.isEmpty)
                const Padding(
                  padding: EdgeInsets.only(top: 140),
                  child: Center(
                    child: Text('Aucune intervention pour cet onglet.',
                        style: TextStyle(color: Color(0xFF9FB2D0))),
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
        decoration: const BoxDecoration(
          color: Color(0xFF0E1E3A),
          border: Border(top: BorderSide(color: Color(0xFF213A5E))),
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
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF0F2446),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFF2A426B)),
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
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        margin: const EdgeInsets.all(6),
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFF2A7BFF) : Colors.transparent,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              title,
              style: TextStyle(
                color: selected ? Colors.white : const Color(0xFF9FB2D0),
                fontSize: 31 / 1.6,
                fontWeight: FontWeight.w700,
              ),
            ),
            if (trailingCount != null && trailingCount! > 0) ...[
              const SizedBox(width: 8),
              CircleAvatar(
                radius: 13,
                backgroundColor: selected
                    ? const Color(0xFF4F97FF)
                    : const Color(0xFF263E63),
                child: Text(
                  '$trailingCount',
                  style: const TextStyle(
                      color: Colors.white,
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
    final dateText = DateFormat('HH:mm').format(item.dateDemande);
    final color = _priorityColor(item.priority);
    final label = _statusAction(item.status);

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1A2C4B),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFF2A426B)),
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
                          style: const TextStyle(
                              color: Color(0xFF9DB0CC),
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
                    style: const TextStyle(
                        color: Color(0xFFEAF0F9),
                        fontSize: 20 / 1.1,
                        fontWeight: FontWeight.w700),
                  ),
                  if (item.description.trim().isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      item.description,
                      style: const TextStyle(
                          color: Color(0xFFA4B7D4), height: 1.35),
                    ),
                  ],
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined,
                          color: Color(0xFF91A5C7), size: 19),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          item.machine.location,
                          style: const TextStyle(
                              color: Color(0xFFB2C2DB), fontSize: 18),
                        ),
                      ),
                      Text(
                        dateText,
                        style: const TextStyle(
                            color: Color(0xFF90A4C4), fontSize: 18),
                      ),
                    ],
                  ),
                  if (label != null) ...[
                    const SizedBox(height: 12),
                    const Divider(color: Color(0xFF2A426B), height: 1),
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
      case InterventionPriority.haute:
        return const Color(0xFFE84C4C);
      case InterventionPriority.basse:
        return const Color(0xFF3AA860);
      case InterventionPriority.moyenne:
        return const Color(0xFFF2B01A);
    }
  }
}

class _PriorityBadge extends StatelessWidget {
  const _PriorityBadge({required this.priority});

  final InterventionPriority priority;

  @override
  Widget build(BuildContext context) {
    final color = switch (priority) {
      InterventionPriority.haute => const Color(0xFFE84C4C),
      InterventionPriority.moyenne => const Color(0xFFF2B01A),
      InterventionPriority.basse => const Color(0xFF3AA860),
    };
    final label = switch (priority) {
      InterventionPriority.haute => 'HAUTE',
      InterventionPriority.moyenne => 'MOYENNE',
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
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
            color:
                isOnline ? const Color(0xFF2C9A66) : const Color(0xFFAA5963)),
        color: isOnline ? const Color(0xFF103126) : const Color(0xFF4B2630),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isOnline ? Icons.sync_rounded : Icons.cloud_off_rounded,
            color: isOnline ? const Color(0xFF35D088) : const Color(0xFFFFA8B2),
            size: 18,
          ),
          const SizedBox(width: 6),
          Text(
            isOnline ? 'Synchronise' : '$pendingCount en attente',
            style: TextStyle(
              color:
                  isOnline ? const Color(0xFFB6F6D6) : const Color(0xFFFFC3CB),
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
    final color = active ? const Color(0xFF2A7BFF) : const Color(0xFF8EA3C5);
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
