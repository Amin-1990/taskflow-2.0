import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/widgets/scanner_button.dart';
import '../../../../core/widgets/searchable_dropdown.dart';
import '../../../../domain/models/article.dart';
import '../../../../domain/models/operateur.dart';
import '../../../../domain/models/semaine.dart';
import '../../../../domain/models/workstation.dart';
import '../controllers/new_task_provider.dart';
import '../widgets/recent_task_tile.dart';

class NewTaskPage extends ConsumerStatefulWidget {
  const NewTaskPage({super.key});

  @override
  ConsumerState<NewTaskPage> createState() => _NewTaskPageState();
}

class _NewTaskPageState extends ConsumerState<NewTaskPage> {
  @override
  Widget build(BuildContext context) {
    final state = ref.watch(newTaskProvider);
    final notifier = ref.read(newTaskProvider.notifier);

    return Scaffold(
      backgroundColor: const Color(0xFF07152F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF07152F),
        title: const Text('NOUVELLE AFFECTATION',
            style: TextStyle(fontWeight: FontWeight.w700)),
        actions: [
          IconButton(onPressed: () {}, icon: const Icon(Icons.help_outline)),
        ],
      ),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 24),
                children: [
                  const _SectionTitle(icon: Icons.timelapse, label: 'TIMELINE'),
                  const SizedBox(height: 10),
                  _Panel(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const _FieldLabel('SEMAINE DE PRODUCTION'),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: _WeekDropdown(
                                weeks: state.weeks,
                                selected: state.selectedWeek,
                                onChanged: (w) {
                                  if (w != null) notifier.selectWeek(w);
                                },
                              ),
                            ),
                            const SizedBox(width: 10),
                            ScannerButton(
                              onScan: (value) {
                                final matched = state.weeks
                                    .where((w) =>
                                        w.id == value ||
                                        w.label.contains(value))
                                    .firstOrNull;
                                if (matched != null) {
                                  notifier.selectWeek(matched);
                                }
                              },
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  const _SectionTitle(
                      icon: Icons.assignment_rounded,
                      label: 'DETAILS DE LA TACHE'),
                  const SizedBox(height: 10),
                  _Panel(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const _FieldLabel('ARTICLE / REFERENCE'),
                        const SizedBox(height: 8),
                        SearchableDropdown<Article>(
                          hint: 'Scannez ou recherchez...',
                          selected: state.selectedArticle,
                          onSearch: notifier.searchArticles,
                          itemToText: (a) => '${a.code} - ${a.name}',
                          onSelected: notifier.selectArticle,
                          onScan: (value) async {
                            final result = await notifier.searchArticles(value);
                            if (result.isNotEmpty) {
                              notifier.selectArticle(result.first);
                            }
                          },
                        ),
                        const SizedBox(height: 16),
                        const _FieldLabel('POSTE DE TRAVAIL'),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: _WorkstationDropdown(
                                values: state.availableWorkstations,
                                selected: state.selectedWorkstation,
                                onChanged: (w) {
                                  if (w != null) notifier.selectWorkstation(w);
                                },
                              ),
                            ),
                            const SizedBox(width: 10),
                            ScannerButton(
                              onScan: (value) {
                                final matched = state.availableWorkstations
                                    .where((ws) =>
                                        ws.code == value ||
                                        ws.name
                                            .toLowerCase()
                                            .contains(value.toLowerCase()))
                                    .firstOrNull;
                                if (matched != null) {
                                  notifier.selectWorkstation(matched);
                                }
                              },
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  const _SectionTitle(
                      icon: Icons.badge_outlined, label: 'PERSONNEL'),
                  const SizedBox(height: 10),
                  _Panel(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const _FieldLabel('OPERATEUR (BADGE)'),
                        const SizedBox(height: 8),
                        SearchableDropdown<Operateur>(
                          hint: 'Nom prenom ou matricule...',
                          selected: state.selectedOperator,
                          onSearch: notifier.searchOperators,
                          itemToText: (item) =>
                              '${item.fullName} (${item.matricule})',
                          onSelected: notifier.selectOperator,
                          onQueryChanged: notifier.setOperatorInput,
                          onScan: notifier.setOperatorInput,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  const Text('RECENT',
                      style: TextStyle(
                          color: Color(0xFFAFC0DB),
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 1.5)),
                  const SizedBox(height: 10),
                  if (state.recentTasks.isEmpty)
                    const Text('Aucune activite recente',
                        style: TextStyle(color: Color(0xFF7D95BA)))
                  else
                    ...state.recentTasks.take(3).map((t) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: RecentTaskTile(task: t),
                        )),
                  if (state.error != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(state.error!,
                          style: const TextStyle(color: Color(0xFFFF7A83))),
                    ),
                ],
              ),
            ),
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 20),
        child: SizedBox(
          height: 58,
          child: FilledButton.icon(
            onPressed: !state.isValid || state.isSubmitting
                ? null
                : () async {
                    final created = await notifier.submit();
                    if (created == null || !context.mounted) {
                      return;
                    }
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                          content:
                              Text('Affectation enregistree avec succes.')),
                    );
                    context.go('/operator/dashboard');
                  },
            icon: state.isSubmitting
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.check_circle_outline),
            label: const Text('CONFIRMER L\'AFFECTATION',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
            style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF1F63E8)),
          ),
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: const Color(0xFF2A7BFF)),
        const SizedBox(width: 8),
        Text(label,
            style: const TextStyle(
                color: Color(0xFF2A7BFF),
                fontSize: 18,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.5)),
      ],
    );
  }
}

class _Panel extends StatelessWidget {
  const _Panel({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1A2C4B),
        borderRadius: BorderRadius.circular(18),
      ),
      child: child,
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Text(label,
        style: const TextStyle(
            color: Color(0xFF8EA2C3),
            fontSize: 17,
            fontWeight: FontWeight.w600));
  }
}

class _WeekDropdown extends StatelessWidget {
  const _WeekDropdown(
      {required this.weeks, required this.selected, required this.onChanged});

  final List<Semaine> weeks;
  final Semaine? selected;
  final ValueChanged<Semaine?> onChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<Semaine>(
      value: selected,
      onChanged: onChanged,
      dropdownColor: const Color(0xFF13284A),
      decoration: const InputDecoration(),
      items: weeks
          .map((w) => DropdownMenuItem(
              value: w,
              child: Text(w.label,
                  style: const TextStyle(color: Color(0xFFE8EEF8)))))
          .toList(),
    );
  }
}

class _WorkstationDropdown extends StatelessWidget {
  const _WorkstationDropdown(
      {required this.values, required this.selected, required this.onChanged});

  final List<Workstation> values;
  final Workstation? selected;
  final ValueChanged<Workstation?> onChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<Workstation>(
      value: selected,
      onChanged: onChanged,
      dropdownColor: const Color(0xFF13284A),
      decoration: const InputDecoration(hintText: 'Selectionner un poste'),
      items: values
          .map((w) => DropdownMenuItem(
              value: w,
              child: Text(w.name.isEmpty ? w.code : w.name,
                  style: const TextStyle(color: Color(0xFFE8EEF8)))))
          .toList(),
    );
  }
}
