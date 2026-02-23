import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/widgets/scanner_button.dart';
import '../../../core/widgets/searchable_dropdown.dart';
import '../../../domain/models/article.dart';
import '../defects/controllers/defects_process_provider.dart';

class DefectsPage extends ConsumerWidget {
  const DefectsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(defectsProcessProvider);
    final notifier = ref.read(defectsProcessProvider.notifier);

    final dateLabel = DateFormat('dd/MM/yyyy HH:mm').format(state.now);

    return Scaffold(
      backgroundColor: const Color(0xFF07152F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF13284A),
        title: const Text('Defauts process',
            style: TextStyle(fontWeight: FontWeight.w700)),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12, top: 8, bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              color: state.isOnline
                  ? const Color(0xFF113024)
                  : const Color(0xFF4B2630),
              border: Border.all(
                  color: state.isOnline
                      ? const Color(0xFF2C9A66)
                      : const Color(0xFFAA5963)),
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
                      ? const Color(0xFF35D088)
                      : const Color(0xFFFFA8B2),
                ),
                const SizedBox(width: 6),
                Text(
                  state.isOnline ? 'SYNCED' : 'OFFLINE ${state.pendingCount}',
                  style: TextStyle(
                      color: state.isOnline
                          ? const Color(0xFFB6F6D6)
                          : const Color(0xFFFFC3CB),
                      fontWeight: FontWeight.w700),
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
                      icon: Icons.factory_outlined,
                      title: 'Contexte de Production'),
                  const SizedBox(height: 10),
                  _Panel(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const _Label('Poste de travail'),
                        const SizedBox(height: 8),
                        DropdownButtonFormField(
                          value: state.selectedPoste,
                          onChanged: notifier.selectPoste,
                          dropdownColor: const Color(0xFF13284A),
                          decoration: const InputDecoration(
                              hintText: 'Selectionner un poste'),
                          items: state.postes
                              .map((p) => DropdownMenuItem(
                                  value: p,
                                  child: Text(p.name,
                                      style: const TextStyle(
                                          color: Color(0xFFEAF0F9)))))
                              .toList(),
                        ),
                        const SizedBox(height: 14),
                        const _Label('Semaine'),
                        const SizedBox(height: 8),
                        DropdownButtonFormField(
                          value: state.selectedSemaine,
                          onChanged: notifier.selectSemaine,
                          dropdownColor: const Color(0xFF13284A),
                          decoration: const InputDecoration(),
                          items: state.semaines
                              .map((s) => DropdownMenuItem(
                                  value: s,
                                  child: Text(s.label,
                                      style: const TextStyle(
                                          color: Color(0xFFEAF0F9)))))
                              .toList(),
                        ),
                        const SizedBox(height: 14),
                        const _Label('Article / Reference'),
                        const SizedBox(height: 8),
                        SearchableDropdown<Article>(
                          hint: 'Ex: REF-99201',
                          selected: state.selectedArticle,
                          onSearch: notifier.searchArticles,
                          itemToText: (a) => '${a.code} - ${a.name}',
                          onSelected: notifier.selectArticle,
                          onScan: notifier.scanArticle,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),
                  const _SectionTitle(
                      icon: Icons.error_outline, title: 'Details du Defaut'),
                  const SizedBox(height: 10),
                  _Panel(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const _Label('Operateur'),
                        const SizedBox(height: 8),
                        DropdownButtonFormField(
                          value: state.selectedOperateur,
                          onChanged: notifier.selectOperateur,
                          dropdownColor: const Color(0xFF13284A),
                          decoration: const InputDecoration(
                              hintText: 'Selectionner un operateur'),
                          items: state.operateurs
                              .map((o) => DropdownMenuItem(
                                  value: o,
                                  child: Text(
                                      '${o.firstName} ${o.lastName} (${o.matricule})',
                                      style: const TextStyle(
                                          color: Color(0xFFEAF0F9)))))
                              .toList(),
                        ),
                        const SizedBox(height: 14),
                        const _Label('Type de defaut'),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: DropdownButtonFormField(
                                value: state.selectedTypeDefaut,
                                onChanged: notifier.selectTypeDefaut,
                                dropdownColor: const Color(0xFF13284A),
                                decoration: const InputDecoration(
                                    hintText: 'CODE - Description'),
                                items: state.typesDefaut
                                    .map((t) => DropdownMenuItem(
                                        value: t,
                                        child: Text(t.codeAndDescription,
                                            style: const TextStyle(
                                                color: Color(0xFFEAF0F9)))))
                                    .toList(),
                              ),
                            ),
                            const SizedBox(width: 8),
                            ScannerButton(
                                onScan: notifier.scanTypeDefaut, size: 52),
                          ],
                        ),
                        const SizedBox(height: 14),
                        const _Label('Quantite'),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            _QtyButton(
                                icon: Icons.remove,
                                onTap: notifier.decrementQuantite),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Container(
                                height: 58,
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: const Color(0xFF0D1F3F),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                      color: const Color(0xFF2A426B)),
                                ),
                                child: Text('${state.quantite}',
                                    style: const TextStyle(
                                        color: Color(0xFFEAF0F9),
                                        fontSize: 30,
                                        fontWeight: FontWeight.w700)),
                              ),
                            ),
                            const SizedBox(width: 10),
                            _QtyButton(
                                icon: Icons.add,
                                onTap: notifier.incrementQuantite),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                        color: const Color(0xFF112341),
                        borderRadius: BorderRadius.circular(12)),
                    child: Row(
                      children: [
                        const Icon(Icons.schedule, color: Color(0xFF89A3C9)),
                        const SizedBox(width: 8),
                        Text('Date/heure enregistrement: $dateLabel',
                            style: const TextStyle(color: Color(0xFF9CB1D3))),
                      ],
                    ),
                  ),
                  if (state.error != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(state.error!,
                          style: const TextStyle(color: Color(0xFFFF8D98))),
                    ),
                ],
              ),
            ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 18),
        color: const Color(0xFF13284A),
        child: SizedBox(
          height: 58,
          child: FilledButton.icon(
            onPressed: !state.isValid || state.isSubmitting
                ? null
                : () async {
                    final ok = await notifier.submit();
                    if (!ok || !context.mounted) {
                      return;
                    }
                    ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Defaut enregistre.')));
                    context.go('/operator/dashboard');
                  },
            icon: state.isSubmitting
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.save_alt_rounded),
            label: const Text('Enregistrer le defaut',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
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
        Text(title,
            style: const TextStyle(
                color: Color(0xFFEAF0F9),
                fontSize: 26,
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
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1A2C4B),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFF264773)),
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
    return Text(label,
        style: const TextStyle(
            color: Color(0xFF98ABC9),
            fontSize: 17,
            fontWeight: FontWeight.w600));
  }
}

class _QtyButton extends StatelessWidget {
  const _QtyButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 58,
      height: 58,
      child: Material(
        color: const Color(0xFF0D1F3F),
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: Icon(icon, color: const Color(0xFFEAF0F9), size: 30),
        ),
      ),
    );
  }
}
