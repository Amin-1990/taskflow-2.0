import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/widgets/selection_field.dart';
import '../../../core/widgets/selection_modal.dart';
import '../../../core/services/toast_service.dart';
import '../../../domain/models/article.dart';
import '../../../domain/models/poste.dart';
import '../../../domain/models/semaine.dart';
import '../../../domain/models/operateur.dart';
import '../../../domain/models/type_defaut.dart';
import '../defects/controllers/defects_process_provider.dart';
import '../../../core/constants/design_constants.dart';

class DefectsPage extends ConsumerWidget {
  const DefectsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(defectsProcessProvider);
    final notifier = ref.read(defectsProcessProvider.notifier);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final dateLabel = DateFormat('dd/MM/yyyy HH:mm').format(state.now);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: theme.appBarTheme.backgroundColor,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          color: theme.appBarTheme.iconTheme?.color,
          onPressed: () => context.go('/operator/dashboard'),
        ),
        title: Text('Défauts process',
            style: TextStyle(
                color: theme.appBarTheme.titleTextStyle?.color,
                fontWeight: FontWeight.w700)),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12, top: 8, bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
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
                  state.isOnline
                      ? Icons.cloud_done_rounded
                      : Icons.cloud_off_rounded,
                  size: 16,
                  color: state.isOnline
                      ? AppPalette.success
                      : AppPalette.error,
                ),
                const SizedBox(width: 6),
                Text(
                  state.isOnline ? 'SYNC' : 'OFFLINE ${state.pendingCount}',
                  style: TextStyle(
                      color: state.isOnline
                          ? AppPalette.success
                          : AppPalette.error,
                      fontWeight: FontWeight.w700),
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
                      icon: Icons.factory_outlined,
                      title: 'Contexte de Production'),
                  const SizedBox(height: 12),
                  _Panel(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SelectionField<Poste>(
                          label: 'POSTE DE TRAVAIL',
                          value: state.selectedPoste,
                          displayText: (p) => p.name,
                          onTap: () {
                            showDialog(
                              context: context,
                              builder: (context) => SelectionModal<Poste>(
                                title: 'Sélectionner un poste',
                                items: state.postes,
                                displayText: (p) => p.name,
                                selectedValue: state.selectedPoste,
                                onSelect: (p) {
                                  notifier.selectPoste(p);
                                },
                              ),
                            );
                          },
                          enableQrScan: false,
                          onClear: () {
                            notifier.clearPoste();
                          },
                          ),
                          const SizedBox(height: 16),
                          SelectionField<Semaine>(
                           label: 'SEMAINE',
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
                           enableQrScan: false,
                           onClear: () {
                             notifier.clearSemaine();
                           },
                          ),
                        const SizedBox(height: 16),
                        SelectionField<Article>(
                          label: 'ARTICLE / RÉFÉRENCE',
                          value: state.selectedArticle,
                          displayText: (a) => a.code == a.name ? a.code : '${a.code} - ${a.name}',
                          onTap: () {
                            if (state.selectedSemaine == null) {
                              ToastService.showInfo(context, 'Veuillez d\'abord sélectionner une semaine');
                              return;
                            }
                            showDialog(
                              context: context,
                              builder: (context) => SelectionModal<Article>(
                                title: 'Sélectionner un article',
                                items: state.articleSuggestions,
                                displayText: (a) => a.code == a.name ? a.code : '${a.code} - ${a.name}',
                                selectedValue: state.selectedArticle,
                                onSelect: (a) {
                                  notifier.selectArticle(a);
                                },
                              ),
                            );
                          },
                          enableQrScan: true,
                          onScanQr: () async {
                            // TODO: Implement QR scan logic
                          },
                          onClear: () {
                            notifier.clearArticle();
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  const _SectionTitle(
                      icon: Icons.error_outline, title: 'Détails du Défaut'),
                  const SizedBox(height: 12),
                  _Panel(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SelectionField<Operateur>(
                          label: 'OPÉRATEUR',
                          value: state.selectedOperateur,
                          displayText: (o) => '${o.firstName} ${o.lastName} (${o.matricule})',
                          onTap: () {
                            showDialog(
                              context: context,
                              builder: (context) => SelectionModal<Operateur>(
                                title: 'Sélectionner un opérateur',
                                items: state.operateurs,
                                displayText: (o) => '${o.firstName} ${o.lastName} (${o.matricule})',
                                selectedValue: state.selectedOperateur,
                                onSelect: (o) {
                                  notifier.selectOperateur(o);
                                },
                              ),
                            );
                          },
                          enableQrScan: false,
                          onClear: () {
                            notifier.clearOperateur();
                          },
                        ),
                        const SizedBox(height: 16),
                        SelectionField<TypeDefaut>(
                          label: 'TYPE DE DÉFAUT',
                          value: state.selectedTypeDefaut,
                          displayText: (t) => t.codeAndDescription,
                          onTap: () {
                            showDialog(
                              context: context,
                              builder: (context) => SelectionModal<TypeDefaut>(
                                title: 'Sélectionner un type de défaut',
                                items: state.typesDefaut,
                                displayText: (t) => t.codeAndDescription,
                                selectedValue: state.selectedTypeDefaut,
                                onSelect: (t) {
                                  notifier.selectTypeDefaut(t);
                                },
                              ),
                            );
                          },
                          enableQrScan: true,
                          onScanQr: () async {
                            // TODO: Implement QR scan logic or use direct scan
                          },
                          onClear: () {
                            notifier.clearTypeDefaut();
                          },
                        ),
                        const SizedBox(height: 18),
                        const _Label('Quantité'),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            _QtyButton(
                                icon: Icons.remove,
                                onTap: notifier.decrementQuantite),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Container(
                                height: 58,
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: isDark ? const Color(0xFF0D1F3F) : const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                      color: isDark ? const Color(0xFF2A426B) : AppPalette.borderLight,
                                      width: 1.5),
                                ),
                                child: Text('${state.quantite}',
                                    style: TextStyle(
                                        color: isDark ? AppPalette.textPrimary : AppPalette.textPrimaryLight,
                                        fontSize: 28,
                                        fontWeight: FontWeight.w800)),
                              ),
                            ),
                            const SizedBox(width: 12),
                            _QtyButton(
                                icon: Icons.add,
                                onTap: notifier.incrementQuantite),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF112341) : AppPalette.primary.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: isDark ? Colors.transparent : AppPalette.primary.withOpacity(0.1))),
                    child: Row(
                      children: [
                        Icon(Icons.schedule, color: isDark ? const Color(0xFF89A3C9) : AppPalette.primary, size: 20),
                        const SizedBox(width: 10),
                        Text('Date/heure enregistrement: $dateLabel',
                            style: TextStyle(
                                color: isDark ? const Color(0xFF9CB1D3) : AppPalette.textSecondaryLight,
                                fontSize: 13,
                                fontWeight: FontWeight.w500)),
                      ],
                    ),
                  ),
                  if (state.error != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppPalette.error.withOpacity(0.1),
                          border: Border.all(color: AppPalette.error),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(state.error!,
                            textAlign: TextAlign.center,
                            style: TextStyle(color: isDark ? const Color(0xFFFF7A83) : const Color(0xFFD32F2F), fontWeight: FontWeight.w500)),
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
          child: FilledButton.icon(
            onPressed: !state.isValid || state.isSubmitting
                ? null
                : () async {
                    final ok = await notifier.submit();
                    if (!ok || !context.mounted) {
                      if (context.mounted && state.error != null) {
                        ToastService.showError(context, state.error!);
                      }
                      return;
                    }
                    notifier.reset();
                    ToastService.showSuccess(context, 'Défaut enregistré avec succès');
                  },
            icon: state.isSubmitting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2.5, color: Colors.white))
                : const Icon(Icons.save_rounded, size: 24),
            label: const Text('ENREGISTRER LE DEFAUT',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, letterSpacing: 0.5)),
            style: FilledButton.styleFrom(
              backgroundColor: AppPalette.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
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
        Text(title,
            style: TextStyle(
                color: isDark ? AppPalette.textPrimary : AppPalette.textPrimaryLight,
                fontSize: 18,
                fontWeight: FontWeight.w700)),
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
        border: Border.all(color: isDark ? const Color(0xFF264773) : AppPalette.borderLight),
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

class _Label extends StatelessWidget {
  const _Label(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Text(label,
        style: TextStyle(
            color: isDark ? const Color(0xFF98ABC9) : AppPalette.textSecondaryLight,
            fontSize: 14,
            fontWeight: FontWeight.w700));
  }
}

class _QtyButton extends StatelessWidget {
  const _QtyButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return SizedBox(
      width: 58,
      height: 58,
      child: Material(
        color: isDark ? const Color(0xFF0D1F3F) : const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Icon(icon, color: AppPalette.primary, size: 28),
        ),
      ),
    );
  }
}
