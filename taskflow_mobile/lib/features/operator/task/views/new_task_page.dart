import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/constants/design_constants.dart';
import '../../../../core/services/toast_service.dart';
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
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: theme.appBarTheme.backgroundColor,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, 
                color: theme.appBarTheme.iconTheme?.color),
          onPressed: () => context.go('/operator/dashboard'),
        ),
        title: Text('NOUVELLE AFFECTATION',
            style: TextStyle(
              color: theme.appBarTheme.titleTextStyle?.color,
              fontWeight: FontWeight.w700,
              fontSize: 18,
            )),
        actions: [
          IconButton(
            onPressed: () {}, 
            icon: Icon(Icons.help_outline, color: theme.appBarTheme.iconTheme?.color)
          ),
        ],
      ),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator(color: AppPalette.primary))
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
                          color: AppPalette.error.withOpacity(0.1),
                          border: Border.all(color: AppPalette.error),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          state.error!,
                          style: TextStyle(
                            color: isDark ? const Color(0xFFFF7A83) : const Color(0xFFD32F2F),
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 24),
        decoration: BoxDecoration(
          color: theme.scaffoldBackgroundColor,
          border: Border(top: BorderSide(
            color: isDark ? AppPalette.borderDark : AppPalette.borderLight,
            width: 1,
          )),
        ),
        child: SizedBox(
          height: 60,
          child: FilledButton.icon(
            onPressed: !state.isValid || state.isSubmitting
                ? null
                : () async {
                    final created = await notifier.submit();
                    if (!context.mounted) {
                      return;
                    }
                    
                    final state = ref.read(newTaskProvider);
                    
                    if (created != null) {
                      // Succès
                      ToastService.showSuccess(context, 'Affectation enregistrée avec succès');
                      notifier.clearOperateur();
                    } else if (state.error != null) {
                      // Erreur
                      ToastService.showError(context, state.error!);
                    }
                  },
            icon: state.isSubmitting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2.5, color: Colors.white))
                : const Icon(Icons.check_circle_outline, size: 24),
            label: const Text('CONFIRMER L\'AFFECTATION',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, letterSpacing: 0.5)),
            style: FilledButton.styleFrom(
                backgroundColor: AppPalette.primary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
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
        Icon(icon, color: AppPalette.primary, size: 22),
        const SizedBox(width: 8),
        Text(label,
            style: const TextStyle(
                color: AppPalette.primary,
                fontSize: 16,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.2)),
      ],
    );
  }
}

class _Panel extends StatelessWidget {
  const _Panel({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1A2C4B) : AppPalette.surfaceLight,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? AppPalette.borderDark : AppPalette.borderLight,
          width: 1,
        ),
        boxShadow: isDark ? null : [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: child,
    );
  }
}
