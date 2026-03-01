import 'dart:async';

import 'package:flutter/material.dart';

import '../constants/design_constants.dart';
import 'scanner_button.dart';

class SearchableDropdown<T> extends StatefulWidget {
  const SearchableDropdown({
    super.key,
    required this.hint,
    required this.onSearch,
    required this.itemToText,
    required this.onSelected,
    this.selected,
    this.onScan,
    this.onQueryChanged,
  });

  final String hint;
  final Future<List<T>> Function(String query) onSearch;
  final String Function(T value) itemToText;
  final ValueChanged<T> onSelected;
  final T? selected;
  final ValueChanged<String>? onScan;
  final ValueChanged<String>? onQueryChanged;

  @override
  State<SearchableDropdown<T>> createState() => _SearchableDropdownState<T>();
}

class _SearchableDropdownState<T> extends State<SearchableDropdown<T>> {
  final _controller = TextEditingController();
  final _searchController = TextEditingController();
  Timer? _debounce;
  List<T> _items = const [];
  bool _loading = false;
  bool _isOpen = false;
  OverlayEntry? _overlayEntry;
  final _layerLink = LayerLink();

  @override
  void initState() {
    super.initState();
    if (widget.selected != null) {
      _controller.text = widget.itemToText(widget.selected as T);
    }
  }

  @override
  void didUpdateWidget(covariant SearchableDropdown<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.selected != oldWidget.selected) {
      if (widget.selected != null) {
        _controller.text = widget.itemToText(widget.selected as T);
      } else {
        _controller.clear();
      }
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    _searchController.dispose();
    _overlayEntry?.remove();
    super.dispose();
  }

  Future<void> _search(String query) async {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () async {
      if (!mounted) {
        return;
      }
      setState(() {
        _loading = true;
      });
      final result = await widget.onSearch(query);
      if (!mounted) {
        return;
      }
      setState(() {
        _items = result;
        _loading = false;
      });
      _updateOverlay();
    });
  }

  void _openDropdown() {
    if (_isOpen) return;
    
    _isOpen = true;
    _searchController.clear();
    _search('');
    
    _overlayEntry = OverlayEntry(
      builder: (context) {
        final theme = Theme.of(context);
        final isDark = theme.brightness == Brightness.dark;
        
        return Positioned(
          width: 300,
          child: CompositedTransformFollower(
            link: _layerLink,
            showWhenUnlinked: false,
            offset: const Offset(0, 8),
            child: Material(
              elevation: 8,
              borderRadius: BorderRadius.circular(12),
              color: isDark ? const Color(0xFF13284A) : Colors.white,
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isDark ? const Color(0xFF2A426B) : AppPalette.borderLight,
                  ),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Search field
                    Padding(
                      padding: const EdgeInsets.all(8),
                      child: Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _searchController,
                              onChanged: (value) {
                                widget.onQueryChanged?.call(value);
                                _search(value);
                              },
                              decoration: InputDecoration(
                                hintText: 'Rechercher...',
                                hintStyle: TextStyle(
                                  color: isDark ? AppPalette.textMuted : AppPalette.textMutedLight,
                                ),
                                prefixIcon: Icon(
                                  Icons.search,
                                  color: isDark ? AppPalette.primary : AppPalette.primary,
                                  size: 20,
                                ),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  borderSide: BorderSide(
                                    color: isDark ? const Color(0xFF2A426B) : AppPalette.borderLight,
                                  ),
                                ),
                              ),
                            ),
                          ),
                          if (widget.onScan != null)
                            Padding(
                              padding: const EdgeInsets.only(left: 8),
                              child: ScannerButton(
                                onScan: (value) {
                                  _searchController.text = value;
                                  widget.onScan!(value);
                                  _search(value);
                                },
                                size: 40,
                              ),
                            ),
                        ],
                      ),
                    ),
                    // Items list
                    if (_loading)
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppPalette.primary,
                          ),
                        ),
                      )
                    else if (_items.isEmpty)
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: Text(
                          'Aucun résultat',
                          style: TextStyle(
                            color: isDark ? AppPalette.textMuted : AppPalette.textMutedLight,
                          ),
                        ),
                      )
                    else
                      Container(
                        constraints: const BoxConstraints(maxHeight: 300),
                        child: ListView.builder(
                          shrinkWrap: true,
                          itemCount: _items.length,
                          itemBuilder: (context, index) {
                            final item = _items[index];
                            return InkWell(
                              onTap: () {
                                _controller.text = widget.itemToText(item);
                                widget.onSelected(item);
                                _closeDropdown();
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                child: Text(
                                  widget.itemToText(item),
                                  style: TextStyle(
                                    color: isDark ? const Color(0xFFE1E8F5) : AppPalette.textPrimaryLight,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );

    Overlay.of(context).insert(_overlayEntry!);
  }

  void _closeDropdown() {
    if (!_isOpen) return;
    _isOpen = false;
    _overlayEntry?.remove();
    _debounce?.cancel();
  }

  void _updateOverlay() {
    if (_isOpen) {
      _overlayEntry?.markNeedsBuild();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return CompositedTransformTarget(
      link: _layerLink,
      child: GestureDetector(
        onTap: () {
          if (_isOpen) {
            _closeDropdown();
          } else {
            _openDropdown();
          }
        },
        child: Container(
          height: 52,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF0D1F3F) : const Color(0xFFF8FAFB),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isDark ? const Color(0xFF2A426B) : AppPalette.borderLight,
              width: 1.5,
            ),
          ),
          child: Row(
            children: [
              Expanded(
                child: ValueListenableBuilder<TextEditingValue>(
                  valueListenable: _controller,
                  builder: (context, value, _) {
                    return Text(
                      value.text.isEmpty ? widget.hint : value.text,
                      style: TextStyle(
                        color: value.text.isEmpty
                            ? (isDark ? AppPalette.textMuted : AppPalette.textMutedLight)
                            : (isDark ? const Color(0xFFEAF0F9) : AppPalette.textPrimaryLight),
                        fontWeight: value.text.isEmpty ? FontWeight.w500 : FontWeight.w600,
                        fontSize: 15,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    );
                  },
                ),
              ),
              Icon(
                _isOpen ? Icons.expand_less : Icons.expand_more,
                color: AppPalette.primary,
                size: 24,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
