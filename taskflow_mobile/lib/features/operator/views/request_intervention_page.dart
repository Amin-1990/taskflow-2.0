import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/scanner_button.dart';
import '../../../domain/models/intervention.dart';
import '../controllers/request_intervention_provider.dart';

class RequestInterventionPage extends ConsumerWidget {
  const RequestInterventionPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(requestInterventionProvider);
    final notifier = ref.read(requestInterventionProvider.notifier);

    return Scaffold(
      backgroundColor: const Color(0xFF07152F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF07152F),
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
        ),
        title: const Text('Demander intervention',
            style: TextStyle(fontWeight: FontWeight.w700)),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 14, top: 10, bottom: 10),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(999),
              color: state.isOnline
                  ? const Color(0xFF0E3D35)
                  : const Color(0xFF4B2630),
              border: Border.all(
                  color: state.isOnline
                      ? const Color(0xFF189D7E)
                      : const Color(0xFFAA5963)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  state.isOnline ? Icons.circle : Icons.cloud_off_rounded,
                  size: 10,
                  color: state.isOnline
                      ? const Color(0xFF31D0A4)
                      : const Color(0xFFFFA8B2),
                ),
                const SizedBox(width: 6),
                Text(
                  state.isOnline ? 'En ligne' : 'Hors-ligne',
                  style: TextStyle(
                    color: state.isOnline
                        ? const Color(0xFF84F2D3)
                        : const Color(0xFFFFCFD4),
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
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
                    dropdownColor: const Color(0xFF13284A),
                    decoration:
                        const InputDecoration(hintText: 'Selectionner le type'),
                    items: state.typeMachines
                        .map((item) => DropdownMenuItem(
                              value: item,
                              child: Text(item.label,
                                  style: const TextStyle(
                                      color: Color(0xFFEAF0F9))),
                            ))
                        .toList(),
                  ),
                  const SizedBox(height: 16),
                  const _Label('Machine'),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField(
                          value: state.selectedMachine,
                          onChanged: notifier.selectMachine,
                          dropdownColor: const Color(0xFF13284A),
                          decoration: const InputDecoration(
                              hintText: 'Scanner ou saisir ID'),
                          items: state.visibleMachines
                              .map((m) => DropdownMenuItem(
                                    value: m,
                                    child: Text(
                                      m.display,
                                      style: const TextStyle(
                                          color: Color(0xFFEAF0F9)),
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
                  const SizedBox(height: 22),
                  const Divider(color: Color(0xFF2B4268)),
                  const SizedBox(height: 18),
                  const _SectionTitle(
                      icon: Icons.warning_amber_rounded, title: 'Probleme'),
                  const SizedBox(height: 12),
                  const _Label('Type de Panne'),
                  const SizedBox(height: 8),
                  DropdownButtonFormField(
                    value: state.selectedTypePanne,
                    onChanged: notifier.selectTypePanne,
                    dropdownColor: const Color(0xFF13284A),
                    decoration: const InputDecoration(
                        hintText: 'Selectionner la panne'),
                    items: state.visibleTypePannes
                        .map((item) => DropdownMenuItem(
                              value: item,
                              child: Text(item.display,
                                  style: const TextStyle(
                                      color: Color(0xFFEAF0F9))),
                            ))
                        .toList(),
                  ),
                  const SizedBox(height: 16),
                  const _Label('Description'),
                  const SizedBox(height: 8),
                  TextField(
                    minLines: 4,
                    maxLines: 5,
                    onChanged: notifier.setDescription,
                    decoration: const InputDecoration(
                      hintText: 'Decrivez le probleme en detail...',
                    ),
                  ),
                  const SizedBox(height: 22),
                  const Divider(color: Color(0xFF2B4268)),
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
                      const SizedBox(width: 10),
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
                      const SizedBox(width: 10),
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
                      padding: const EdgeInsets.only(top: 12),
                      child: Text(
                        '${state.pendingSyncCount} action(s) en attente de synchronisation',
                        style: const TextStyle(color: Color(0xFFFFCCB5)),
                      ),
                    ),
                  if (state.error != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: Text(
                        state.error!,
                        style: const TextStyle(color: Color(0xFFFF8D98)),
                      ),
                    ),
                ],
              ),
            ),
      bottomNavigationBar: Container(
        color: const Color(0xFF101F3D),
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 18),
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
                              ? 'Demande envoyee.'
                              : 'Demande enregistree hors-ligne.',
                        ),
                      ),
                    );
                    context.go('/operator/dashboard');
                  },
            child: state.isSubmitting
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white))
                : const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('Envoyer la demande',
                          style: TextStyle(
                              fontSize: 18, fontWeight: FontWeight.w700)),
                      SizedBox(width: 8),
                      Icon(Icons.arrow_forward_rounded),
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
    return Row(
      children: [
        Icon(icon, color: const Color(0xFF2A7BFF)),
        const SizedBox(width: 8),
        Text(
          title.toUpperCase(),
          style: const TextStyle(
            color: Color(0xFF91A7CB),
            fontWeight: FontWeight.w700,
            letterSpacing: 1.4,
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
    return Text(
      label,
      style: const TextStyle(
          color: Color(0xFFC7D3E7), fontSize: 18, fontWeight: FontWeight.w600),
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
    return Material(
      color: selected ? color.withOpacity(0.16) : const Color(0xFF1A2C4B),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 160),
          height: 126,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border:
                Border.all(color: selected ? color : const Color(0xFF2A426B)),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon,
                  color: selected ? color : const Color(0xFFA6B5D0), size: 30),
              const SizedBox(height: 8),
              Text(
                title,
                style: TextStyle(
                  color: selected ? color : const Color(0xFFEAF0F9),
                  fontWeight: FontWeight.w700,
                  fontSize: 28 / 2,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
