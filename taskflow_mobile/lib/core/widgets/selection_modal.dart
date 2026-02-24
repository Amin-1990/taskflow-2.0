import 'package:flutter/material.dart';

class SelectionModal<T> extends StatefulWidget {
  const SelectionModal({
    Key? key,
    required this.title,
    required this.items,
    required this.displayText,
    required this.onSelect,
    this.selectedValue,
  }) : super(key: key);

  final String title;
  final List<T> items;
  final String Function(T) displayText;
  final Function(T) onSelect;
  final T? selectedValue;

  @override
  State<SelectionModal<T>> createState() => _SelectionModalState<T>();
}

class _SelectionModalState<T> extends State<SelectionModal<T>> {
  late List<T> _filteredItems;
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _filteredItems = widget.items;
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _filterItems(String query) {
    setState(() {
      if (query.isEmpty) {
        _filteredItems = widget.items;
      } else {
        final lowerQuery = query.toLowerCase();
        _filteredItems = widget.items
            .where((item) =>
                widget.displayText(item).toLowerCase().contains(lowerQuery))
            .toList();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              widget.title,
              style: Theme.of(context).textTheme.titleLarge,
            ),
          ),
          const Divider(),
          // Search Field
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: TextField(
              controller: _searchController,
              onChanged: _filterItems,
              decoration: InputDecoration(
                hintText: 'Rechercher...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
          // List
          Expanded(
            child: _filteredItems.isEmpty
                ? Center(
                    child: Text(
                      'Aucun résultat trouvé',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  )
                : ListView.builder(
                    itemCount: _filteredItems.length,
                    itemBuilder: (context, index) {
                      final item = _filteredItems[index];
                      final isSelected = item == widget.selectedValue;
                      return ListTile(
                        leading: Radio<T>(
                          value: item,
                          groupValue: widget.selectedValue,
                          onChanged: (value) {
                            if (value != null) {
                              widget.onSelect(value);
                              Navigator.pop(context);
                            }
                          },
                        ),
                        title: Text(widget.displayText(item)),
                        onTap: () {
                          widget.onSelect(item);
                          Navigator.pop(context);
                        },
                        selected: isSelected,
                        tileColor: isSelected
                            ? Colors.blue.withOpacity(0.1)
                            : null,
                      );
                    },
                  ),
          ),
          const Divider(),
          // Close Button
          Padding(
            padding: const EdgeInsets.all(16),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Fermer'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
