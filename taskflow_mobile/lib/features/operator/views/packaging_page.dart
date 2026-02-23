import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/scanner_button.dart';
import '../packaging/controllers/packaging_provider.dart';
import '../packaging/widgets/packaging_order_card.dart';

class PackagingPage extends ConsumerStatefulWidget {
  const PackagingPage({super.key});

  @override
  ConsumerState<PackagingPage> createState() => _PackagingPageState();
}

class _PackagingPageState extends ConsumerState<PackagingPage> {
  late final TextEditingController _searchController;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(packagingProvider);
    final notifier = ref.read(packagingProvider.notifier);

    if (_searchController.text != state.searchQuery) {
      _searchController.text = state.searchQuery;
      _searchController.selection = TextSelection.fromPosition(
          TextPosition(offset: state.searchQuery.length));
    }

    return Scaffold(
      backgroundColor: const Color(0xFF07152F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF07152F),
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back),
        ),
        title: const Text('Emballage',
            style: TextStyle(fontWeight: FontWeight.w700)),
        actions: [
          IconButton(onPressed: () {}, icon: const Icon(Icons.print_outlined)),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            if (!state.isOnline)
              Container(
                width: double.infinity,
                color: const Color(0xFF4B2630),
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Text(
                  'Mode hors-ligne • ${state.pendingSyncCount} validation(s) en attente',
                  style: const TextStyle(color: Color(0xFFFFB6C0)),
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _searchController,
                      onChanged: notifier.setSearchQuery,
                      style: const TextStyle(color: Color(0xFFEAF0F9)),
                      decoration: const InputDecoration(
                        hintText: 'Scanner lot ou commande...',
                        prefixIcon: Icon(Icons.search),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ScannerButton(
                    onScan: (value) {
                      notifier.focusByScan(value);
                    },
                    size: 52,
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14),
              child: Row(
                children: [
                  _FilterChipWidget(
                    label: 'Toutes',
                    selected: state.filter == PackagingFilter.all,
                    onTap: () => notifier.setFilter(PackagingFilter.all),
                  ),
                  const SizedBox(width: 8),
                  _FilterChipWidget(
                    label: 'En cours',
                    selected: state.filter == PackagingFilter.inProgress,
                    onTap: () => notifier.setFilter(PackagingFilter.inProgress),
                  ),
                  const SizedBox(width: 8),
                  _FilterChipWidget(
                    label: 'Terminees',
                    selected: state.filter == PackagingFilter.completed,
                    onTap: () => notifier.setFilter(PackagingFilter.completed),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            Expanded(
              child: RefreshIndicator(
                onRefresh: notifier.loadOrders,
                child: state.isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : ListView(
                        padding: const EdgeInsets.fromLTRB(14, 8, 14, 20),
                        children: [
                          if (state.error != null)
                            Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: Text(state.error!,
                                  style: const TextStyle(
                                      color: Color(0xFFFF8D98))),
                            ),
                          ...state.filteredOrders.map(
                            (order) => PackagingOrderCard(
                              order: order,
                              periodQuantity: state.periodInputs[order.id] ?? 0,
                              onIncrement: () => notifier.increment(order.id),
                              onDecrement: () => notifier.decrement(order.id),
                              onValidate: () async {
                                await notifier.validatePeriod(order.id);
                                if (!context.mounted) {
                                  return;
                                }
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                      content: Text('Periode enregistree.')),
                                );
                              },
                            ),
                          ),
                          if (state.filteredOrders.isEmpty)
                            const Padding(
                              padding: EdgeInsets.only(top: 120),
                              child: Center(
                                child: Text('Aucune commande pour ce filtre.',
                                    style: TextStyle(color: Color(0xFFA2B4D0))),
                              ),
                            ),
                        ],
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterChipWidget extends StatelessWidget {
  const _FilterChipWidget(
      {required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
          decoration: BoxDecoration(
            color: selected ? const Color(0xFF2A7BFF) : const Color(0xFF1A2E50),
            borderRadius: BorderRadius.circular(999),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: selected ? Colors.white : const Color(0xFFA7B9D4),
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }
}
