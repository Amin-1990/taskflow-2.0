import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/widgets/selection_field.dart';
import '../../../../core/widgets/selection_modal.dart';
import '../../../../domain/models/article_lot.dart';
import '../../../../domain/models/operateur.dart';
import '../../../../domain/models/semaine.dart';
import '../../../../domain/models/unite.dart';
import '../../../../domain/models/workstation.dart';
import '../controllers/new_task_provider.dart';

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
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFFE8EEF8)),
          onPressed: () => context.go('/operator/dashboard'),
        ),
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
                        SelectionField<Semaine>(
                          label: 'SEMAINE DE PRODUCTION',
                          value: state.selectedSemaine,
                          displayText: (s) => s.label,
                          onTap: () {
                            showDialog(
                              context: context,
                              builder: (context) => SelectionModal<Semaine>(
                                title: 'Sélectionner une semaine',
                                items: state.semaines,
                                displayText: (s) => s.label,
                                selectedValue: state.selectedSemaine,
                                onSelect: (s) {
                                  notifier.selectSemaine(s);
                                },
                              ),
                            );
                          },
                          enableQrScan: true,
                          onScanQr: () async {
                            // TODO: Implement QR scan logic
                          },
                          onClear: () {
                            notifier.clearSemaine();
                          },
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
                        SelectionField<Unite>(
                          label: 'UNITE',
                          value: state.selectedUnite,
                          displayText: (u) => u.nom,
                          onTap: () {
                            showDialog(
                              context: context,
                              builder: (context) => SelectionModal<Unite>(
                                title: 'Sélectionner une unité',
                                items: state.unites,
                                displayText: (u) => u.nom,
                                selectedValue: state.selectedUnite,
                                onSelect: (u) {
                                  notifier.selectUnite(u);
                                },
                              ),
                            );
                          },
                          enableQrScan: false,
                          onClear: () {
                            notifier.clearUnite();
                          },
                        ),
                        const SizedBox(height: 16),
                        SelectionField<ArticleLot>(
                          label: 'ARTICLE / LOT',
                          value: state.selectedArticleLot,
                          displayText: (al) => al.displayLabel,
                          onTap: () {
                            showDialog(
                              context: context,
                              builder: (context) => SelectionModal<ArticleLot>(
                                title: 'Sélectionner un article',
                                items: state.articlesLots,
                                displayText: (al) => al.displayLabel,
                                selectedValue: state.selectedArticleLot,
                                onSelect: (al) {
                                  notifier.selectArticleLot(al);
                                },
                              ),
                            );
                          },
                          enableQrScan: true,
                          onScanQr: () async {
                            // TODO: Implement QR scan logic
                          },
                          onClear: () {
                            notifier.clearArticleLot();
                          },
                        ),
                        const SizedBox(height: 16),
                        SelectionField<Workstation>(
                          label: 'POSTE DE TRAVAIL',
                          value: state.selectedPoste,
                          displayText: (p) =>
                              p.name.isEmpty ? p.code : p.name,
                          onTap: () {
                            showDialog(
                              context: context,
                              builder: (context) => SelectionModal<Workstation>(
                                title: 'Sélectionner un poste',
                                items: state.postes,
                                displayText: (p) =>
                                    p.name.isEmpty ? p.code : p.name,
                                selectedValue: state.selectedPoste,
                                onSelect: (p) {
                                  notifier.selectPoste(p);
                                },
                              ),
                            );
                          },
                          enableQrScan: true,
                          onScanQr: () async {
                            // TODO: Implement QR scan logic
                          },
                          onClear: () {
                            notifier.clearPoste();
                          },
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
                        SelectionField<Operateur>(
                          label: 'OPERATEUR (BADGE)',
                          value: state.selectedOperateur,
                          displayText: (op) =>
                              '${op.fullName} (${op.matricule})',
                          onTap: () {
                            showDialog(
                              context: context,
                              builder: (context) => SelectionModal<Operateur>(
                                title: 'Sélectionner un opérateur',
                                items: state.operateurs,
                                displayText: (op) =>
                                    '${op.fullName} (${op.matricule})',
                                selectedValue: state.selectedOperateur,
                                onSelect: (op) {
                                  notifier.selectOperateur(op);
                                },
                              ),
                            );
                          },
                          enableQrScan: true,
                          onScanQr: () async {
                            // TODO: Implement QR scan logic
                          },
                          onClear: () {
                            notifier.clearOperateur();
                          },
                        ),
                      ],
                    ),
                  ),
                  if (state.error != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 16),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFD32F2F).withOpacity(0.1),
                          border: Border.all(color: const Color(0xFFD32F2F)),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          state.error!,
                          style: const TextStyle(
                            color: Color(0xFFFF7A83),
                            fontSize: 14,
                          ),
                        ),
                      ),
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
                          content: Text(
                              'Affectation enregistree avec succes.')),
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
