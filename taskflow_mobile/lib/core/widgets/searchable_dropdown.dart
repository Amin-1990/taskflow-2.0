import 'dart:async';

import 'package:flutter/material.dart';

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
  Timer? _debounce;
  List<T> _items = const [];
  bool _loading = false;

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
    if (widget.selected != oldWidget.selected && widget.selected != null) {
      _controller.text = widget.itemToText(widget.selected as T);
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
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
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _controller,
                onChanged: (value) {
                  widget.onQueryChanged?.call(value);
                  _search(value);
                },
                decoration: InputDecoration(
                  hintText: widget.hint,
                  suffixIcon: _loading
                      ? const Padding(
                          padding: EdgeInsets.all(10),
                          child: SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2)),
                        )
                      : const Icon(Icons.search),
                ),
              ),
            ),
            if (widget.onScan != null) ...[
              const SizedBox(width: 8),
              ScannerButton(
                onScan: (value) {
                  _controller.text = value;
                  widget.onScan!(value);
                  _search(value);
                },
                size: 52,
              ),
            ],
          ],
        ),
        if (_items.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(top: 6),
            decoration: BoxDecoration(
              color: const Color(0xFF13284A),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF2A426B)),
            ),
            child: Column(
              children: _items
                  .take(5)
                  .map(
                    (item) => ListTile(
                      dense: true,
                      title: Text(widget.itemToText(item),
                          style: const TextStyle(color: Color(0xFFE1E8F5))),
                      onTap: () {
                        _controller.text = widget.itemToText(item);
                        widget.onSelected(item);
                        setState(() {
                          _items = const [];
                        });
                      },
                    ),
                  )
                  .toList(),
            ),
          ),
      ],
    );
  }
}
