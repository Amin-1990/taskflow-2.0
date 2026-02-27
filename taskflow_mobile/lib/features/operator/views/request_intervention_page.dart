import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/design_constants.dart';
import '../../../core/widgets/scanner_button.dart';
import '../../../domain/models/intervention.dart';
import '../controllers/request_intervention_provider.dart';

class RequestInterventionPage extends ConsumerWidget {
  const RequestInterventionPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(requestInterventionProvider);
    final notifier = ref.read(requestInterventionProvider.notifier);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: theme.appBarTheme.backgroundColor,
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          color: theme.appBarTheme.iconTheme?.color,
        ),
        title: Text('Demander intervention',
            style: TextStyle(
              color: theme.appBarTheme.titleTextStyle?.color,
              fontWeight: FontWeight.w700)),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 14, top: 10, bottom: 10),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(999),
              color: state.isOnline
                  ? AppPalette.success.withOpacity(0.18)
                  : AppPalette.error.withOpacity(0.18),
              border: Border.all(
                  color: state.isOnline
                      ? AppPalette.success
                      : AppPalette.error),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  state.isOnline ? Icons.circle : Icons.cloud_off_rounded,
                  size: 10,
                  color: state.isOnline
                      ? AppPalette.success
                      : AppPalette.error,
                ),
                const SizedBox(width: 6),
                Text(
                  state.isOnline ? 'En ligne' : 'Hors-ligne',
                  style: TextStyle(
                    color: state.isOnline
                        ? AppPalette.success
                        : AppPalette.error,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator(color: AppPalette.primary))
          : SafeArea(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 130),
                children: [
                  const _SectionTitle(
                      icon: Icons.precision_manufacturing_outlined,
                      title: 'Equipement'),
                  const SizedBox(height: 12),
                  const _Label('Type de Machine'),
                  const SizedBox(height: 8),
                  DropdownButtonFormField(
                    value: state.selectedTypeMachine,
                    onChanged: notifier.selectTypeMachine,
                    dropdownColor: isDark ? const Color(0xFF13284A) : Colors.white,
                    decoration: InputDecoration(
                        hintText: 'Sélectionner le type',
                        hintStyle: TextStyle(color: isDark ? AppPalette.textMuted : AppPalette.textMutedLight)),
                    items: state.typeMachines
                        .map((item) => DropdownMenuItem(
                              value: item,
                              child: Text(item.label,
                                  style: TextStyle(
                                      color: isDark ? const Color(0xFFEAF0F9) : AppPalette.textPrimaryLight,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 16)),
                            ))
                        .toList(),
                  ),
                  const SizedBox(height: 18),
                  const _Label('Machine'),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField(
                          value: state.selectedMachine,
                          onChanged: notifier.selectMachine,
                          dropdownColor: isDark ? const Color(0xFF13284A) : Colors.white,
                          decoration: InputDecoration(
                              hintText: 'Scanner ou saisir ID',
                              hintStyle: TextStyle(color: isDark ? AppPalette.textMuted : AppPalette.textMutedLight)),
                          items: state.visibleMachines
                              .map((m) => DropdownMenuItem(
                                    value: m,
                                    child: Text(
                                      m.display,
                                      style: TextStyle(
                                          color: isDark ? const Color(0xFFEAF0F9) : AppPalette.textPrimaryLight,
                                          fontWeight: FontWeight.w600,
                                          fontSize: 16),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ))
                              .toList(),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ScannerButton(onScan: notifier.scanMachine, size: 52),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Divider(color: isDark ? const Color(0xFF2B4268) : AppPalette.borderLight),
                  const SizedBox(height: 18),
                  const _SectionTitle(
                      icon: Icons.warning_amber_rounded, title: 'Probleme'),
                  const SizedBox(height: 12),
                  const _Label('Type de Panne'),
                  const SizedBox(height: 8),
                  DropdownButtonFormField(
                    value: state.selectedTypePanne,
                    onChanged: notifier.selectTypePanne,
                    dropdownColor: isDark ? const Color(0xFF13284A) : Colors.white,
                    decoration: InputDecoration(
                        hintText: 'Sélectionner la panne',
                        hintStyle: TextStyle(color: isDark ? AppPalette.textMuted : AppPalette.textMutedLight)),
                    items: state.visibleTypePannes
                        .map((item) => DropdownMenuItem(
                              value: item,
                              child: Text(item.display,
                                  style: TextStyle(
                                      color: isDark ? const Color(0xFFEAF0F9) : AppPalette.textPrimaryLight,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 16)),
                            ))
                        .toList(),
                  ),
                  const SizedBox(height: 18),
                  const _Label('Description'),
                  const SizedBox(height: 8),
                  TextField(
                    minLines: 4,
                    maxLines: 5,
                    onChanged: notifier.setDescription,
                    style: TextStyle(color: isDark ? AppPalette.textPrimary : AppPalette.textPrimaryLight),
                    decoration: InputDecoration(
                      hintText: 'Décrivez le problème en détail...',
                      hintStyle: TextStyle(color: isDark ? AppPalette.textMuted : AppPalette.textMutedLight),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Divider(color: isDark ? const Color(0xFF2B4268) : AppPalette.borderLight),
                  const SizedBox(height: 18),
                  const _SectionTitle(
                      icon: Icons.timelapse_rounded, title: 'Priorite'),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _PriorityCard(
                          title: 'Basse',
                          icon: Icons.low_priority_rounded,
                          selected:
                              state.priority == InterventionPriority.basse,
                          color: const Color(0xFF3AA860),
                          onTap: () =>
                              notifier.setPriority(InterventionPriority.basse),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _PriorityCard(
                          title: 'Moyenne',
                          icon: Icons.warning_amber_rounded,
                          selected:
                              state.priority == InterventionPriority.moyenne,
                          color: const Color(0xFFF2B01A),
                          onTap: () => notifier
                              .setPriority(InterventionPriority.moyenne),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _PriorityCard(
                          title: 'Haute',
                          icon: Icons.priority_high_rounded,
                          selected:
                              state.priority == InterventionPriority.haute,
                          color: const Color(0xFFE84C4C),
                          onTap: () =>
                              notifier.setPriority(InterventionPriority.haute),
                        ),
                      ),
                    ],
                  ),
                  if (state.pendingSyncCount > 0)
                    Padding(
                      padding: const EdgeInsets.only(top: 16),
                      child: Text(
                        '${state.pendingSyncCount} action(s) en attente de synchronisation',
                        style: TextStyle(color: isDark ? const Color(0xFFFFCCB5) : AppPalette.primary, fontWeight: FontWeight.w500),
                      ),
                    ),
                  if (state.error != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 16),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppPalette.error.withOpacity(0.1),
                          border: Border.all(color: AppPalette.error),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          state.error!,
                          style: TextStyle(color: isDark ? const Color(0xFFFF8D98) : const Color(0xFFD32F2F), fontWeight: FontWeight.w500),
                        ),
                      ),
                    ),
                ],
              ),
            ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
        decoration: BoxDecoration(
           color: theme.scaffoldBackgroundColor,
           border: Border(top: BorderSide(color: isDark ? AppPalette.borderDark : AppPalette.borderLight, width: 1)),
        ),
        child: SizedBox(
          height: 58,
          child: FilledButton(
            onPressed: !state.isValid || state.isSubmitting
                ? null
                : () async {
                    final ok = await notifier.submit();
                    if (!context.mounted) {
                      return;
                    }
                    if (!ok) {
                      return;
                    }
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          state.isOnline
                              ? 'Demande envoyée.'
                              : 'Demande enregistrée hors-ligne.',
                        ),
                      ),
                    );
                    context.go('/operator/dashboard');
                  },
            style: FilledButton.styleFrom(
              backgroundColor: AppPalette.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
            child: state.isSubmitting
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                        strokeWidth: 2.5, color: Colors.white))
                : const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('ENVOYER LA DEMANDE',
                          style: TextStyle(
                              fontSize: 18, fontWeight: FontWeight.w800, letterSpacing: 0.5)),
                      SizedBox(width: 10),
                      Icon(Icons.arrow_forward_rounded, size: 24),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.icon, required this.title});

  final IconData icon;
  final String title;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Row(
      children: [
        Icon(icon, color: AppPalette.primary, size: 22),
        const SizedBox(width: 8),
        Text(
          title.toUpperCase(),
          style: TextStyle(
            color: AppPalette.primary,
            fontSize: 16,
            fontWeight: FontWeight.w800,
            letterSpacing: 1.2,
          ),
        ),
      ],
    );
  }
}

class _Label extends StatelessWidget {
  const _Label(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Text(
      label,
      style: TextStyle(
          color: isDark ? const Color(0xFFC7D3E7) : AppPalette.textSecondaryLight, 
          fontSize: 14, 
          fontWeight: FontWeight.w700),
    );
  }
}

class _PriorityCard extends StatelessWidget {
  const _PriorityCard({
    required this.title,
    required this.icon,
    required this.selected,
    required this.color,
    required this.onTap,
  });

  final String title;
  final IconData icon;
  final bool selected;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Material(
      color: selected ? color.withOpacity(0.12) : (isDark ? const Color(0xFF1A2C4B) : AppPalette.surfaceLight),
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 160),
          height: 110,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: selected ? color : (isDark ? const Color(0xFF2A426B) : AppPalette.borderLight),
              width: selected ? 2 : 1,
            ),
            boxShadow: (!isDark && selected) ? [
              BoxShadow(
                color: color.withOpacity(0.2),
                blurRadius: 8,
                offset: const Offset(0, 4),
              )
            ] : null,
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon,
                  color: selected ? color : (isDark ? const Color(0xFFA6B5D0) : AppPalette.textMutedLight), 
                  size: 28),
              const SizedBox(height: 8),
              Text(
                title,
                style: TextStyle(
                  color: selected ? color : (isDark ? const Color(0xFFEAF0F9) : AppPalette.textPrimaryLight),
                  fontWeight: FontWeight.w800,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
