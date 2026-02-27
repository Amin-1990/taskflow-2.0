import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/scanner_button.dart';
import '../packaging/controllers/packaging_provider.dart';
import '../packaging/widgets/packaging_order_card.dart';
import '../../../core/constants/design_constants.dart';

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
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    if (_searchController.text != state.searchQuery) {
      _searchController.text = state.searchQuery;
      _searchController.selection = TextSelection.fromPosition(
          TextPosition(offset: state.searchQuery.length));
    }

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: theme.appBarTheme.backgroundColor,
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          color: theme.appBarTheme.iconTheme?.color,
        ),
        title: Text('Emballage',
            style: TextStyle(
                color: theme.appBarTheme.titleTextStyle?.color,
                fontWeight: FontWeight.w700)),
        actions: [
          IconButton(
            onPressed: () {}, 
            icon: const Icon(Icons.print_outlined),
            color: theme.appBarTheme.iconTheme?.color,
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            if (!state.isOnline)
              Container(
                width: double.infinity,
                color: AppPalette.error.withOpacity(0.18),
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                child: Row(
                  children: [
                    Icon(Icons.cloud_off_rounded, color: AppPalette.error, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'Mode hors-ligne • ${state.pendingSyncCount} action(s) en attente',
                      style: TextStyle(color: AppPalette.error, fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _searchController,
                      onChanged: notifier.setSearchQuery,
                      style: TextStyle(color: isDark ? AppPalette.textPrimary : AppPalette.textPrimaryLight),
                      decoration: InputDecoration(
                        hintText: 'Lot ou commande...',
                        hintStyle: TextStyle(color: isDark ? AppPalette.textMuted : AppPalette.textMutedLight),
                        prefixIcon: const Icon(Icons.search),
                        fillColor: isDark ? const Color(0xFF1A2C4B) : Colors.white,
                        filled: true,
                        contentPadding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
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
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  _FilterChipWidget(
                    label: 'Toutes',
                    selected: state.filter == PackagingFilter.all,
                    onTap: () => notifier.setFilter(PackagingFilter.all),
                  ),
                  const SizedBox(width: 10),
                  _FilterChipWidget(
                    label: 'En cours',
                    selected: state.filter == PackagingFilter.inProgress,
                    onTap: () => notifier.setFilter(PackagingFilter.inProgress),
                  ),
                  const SizedBox(width: 10),
                  _FilterChipWidget(
                    label: 'Terminées',
                    selected: state.filter == PackagingFilter.completed,
                    onTap: () => notifier.setFilter(PackagingFilter.completed),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: RefreshIndicator(
                onRefresh: notifier.loadOrders,
                child: state.isLoading
                    ? const Center(child: CircularProgressIndicator(color: AppPalette.primary))
                    : ListView(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                        children: [
                          if (state.error != null)
                            Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: AppPalette.error.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: AppPalette.error.withOpacity(0.3)),
                                ),
                                child: Text(state.error!,
                                    style: TextStyle(
                                        color: isDark ? const Color(0xFFFF7A83) : const Color(0xFFD32F2F), 
                                        fontWeight: FontWeight.w500)),
                              ),
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
                                      content: Text('Période enregistrée avec succès.')),
                                );
                              },
                            ),
                          ),
                          if (state.filteredOrders.isEmpty)
                            Padding(
                              padding: const EdgeInsets.only(top: 80),
                              child: Center(
                                child: Column(
                                  children: [
                                    Icon(Icons.inventory_2_outlined, 
                                        size: 64, 
                                        color: isDark ? const Color(0xFF2A426B) : AppPalette.borderLight),
                                    const SizedBox(height: 16),
                                    Text('Aucune commande pour ce filtre.',
                                        style: TextStyle(
                                            color: isDark ? AppPalette.textMuted : AppPalette.textMutedLight,
                                            fontSize: 16,
                                            fontWeight: FontWeight.w500)),
                                  ],
                                ),
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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
          decoration: BoxDecoration(
            color: selected 
                ? AppPalette.primary 
                : (isDark ? const Color(0xFF1A2E50) : const Color(0xFFF1F5F9)),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: selected 
                ? AppPalette.primary 
                : (isDark ? const Color(0xFF2A426B) : AppPalette.borderLight),
              width: 1.5,
            ),
            boxShadow: (!isDark && selected) ? [
              BoxShadow(
                color: AppPalette.primary.withOpacity(0.3),
                blurRadius: 8,
                offset: const Offset(0, 4),
              )
            ] : null,
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: selected 
                  ? Colors.white 
                  : (isDark ? const Color(0xFFA7B9D4) : AppPalette.textSecondaryLight),
              fontWeight: FontWeight.w700,
              fontSize: 14,
            ),
          ),
        ),
      ),
    );
  }
}
