import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class SelectSearchOption {
  final dynamic id;
  final String label;
  final Map<String, dynamic>? extra;

  SelectSearchOption({
    required this.id,
    required this.label,
    this.extra,
  });
}

class SelectSearch extends StatefulWidget {
  final List<SelectSearchOption> options;
  final dynamic selectedId;
  final Function(SelectSearchOption) onSelect;
  final String placeholder;
  final String? label;
  final bool required;
  final bool disabled;
  final int maxResults;
  final Future<List<SelectSearchOption>> Function(String)? onSearch;
  final bool isLoading;
  final bool isSearchable;
  final bool initiallyOpen;

  const SelectSearch({
    super.key,
    required this.options,
    required this.onSelect,
    this.selectedId,
    this.placeholder = 'Rechercher...',
    this.label,
    this.required = false,
    this.disabled = false,
    this.maxResults = 20,
    this.onSearch,
    this.isLoading = false,
    this.isSearchable = true,
    this.initiallyOpen = false,
  });

  @override
  State<SelectSearch> createState() => _SelectSearchState();
}

class _SelectSearchState extends State<SelectSearch> {
  late TextEditingController _controller;
  late FocusNode _focusNode;
  bool _isOpen = false;
  String _searchTerm = '';
  int _highlightedIndex = 0;
  late List<SelectSearchOption> _filteredOptions;
  bool _isSearching = false;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController();
    _focusNode = FocusNode();
    _focusNode.addListener(_handleFocus);
    _updateFilteredOptions();
    
    // Ouvrir le dropdown au démarrage si initiallyOpen est vrai
    if (widget.initiallyOpen) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        setState(() => _isOpen = true);
      });
    }
  }

  @override
  void didUpdateWidget(SelectSearch oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.options != widget.options) {
      _updateFilteredOptions();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.removeListener(_handleFocus);
    _focusNode.dispose();
    super.dispose();
  }

  void _handleFocus() {
    if (_focusNode.hasFocus) {
      setState(() => _isOpen = true);
      _updateFilteredOptions();
    } else {
      setState(() => _isOpen = false);
    }
  }

  void _updateFilteredOptions() {
    if (_searchTerm.isEmpty) {
      _filteredOptions = widget.options.take(widget.maxResults).toList();
    } else {
      _filteredOptions = widget.options
          .where((opt) =>
              opt.label.toLowerCase().contains(_searchTerm.toLowerCase()))
          .take(widget.maxResults)
          .toList();
    }
    _highlightedIndex = 0;
  }

  Future<void> _handleSearch(String value) async {
    setState(() {
      _searchTerm = value;
      _isSearching = true;
      _isOpen = true;
    });

    if (widget.onSearch != null) {
      try {
        final results = await widget.onSearch!(_searchTerm);
        if (mounted) {
          setState(() {
            _filteredOptions =
                results.take(widget.maxResults).toList();
            _isSearching = false;
          });
        }
      } catch (e) {
        if (mounted) {
          setState(() => _isSearching = false);
        }
      }
    } else {
      _updateFilteredOptions();
      if (mounted) {
        setState(() => _isSearching = false);
      }
    }
  }

  void _handleSelect(SelectSearchOption option) {
    widget.onSelect(option);
    _controller.text = option.label;
    _focusNode.unfocus();
    setState(() {
      _isOpen = false;
      _searchTerm = '';
    });
    _updateFilteredOptions();
  }

  void _handleKeyDown(RawKeyEvent event) {
    if (_filteredOptions.isEmpty) {
      if (event.isKeyPressed(LogicalKeyboardKey.enter) ||
          event.isKeyPressed(LogicalKeyboardKey.space)) {
        setState(() => _isOpen = !_isOpen);
      }
      return;
    }

    if (!_isOpen) {
      if (event.isKeyPressed(LogicalKeyboardKey.enter) ||
          event.isKeyPressed(LogicalKeyboardKey.space)) {
        setState(() => _isOpen = true);
      }
      return;
    }

    if (event.isKeyPressed(LogicalKeyboardKey.arrowDown)) {
      setState(() {
        _highlightedIndex =
            (_highlightedIndex + 1) % _filteredOptions.length;
      });
    } else if (event.isKeyPressed(LogicalKeyboardKey.arrowUp)) {
      setState(() {
        _highlightedIndex = _highlightedIndex == 0
            ? _filteredOptions.length - 1
            : _highlightedIndex - 1;
      });
    } else if (event.isKeyPressed(LogicalKeyboardKey.enter)) {
      if (_highlightedIndex < _filteredOptions.length) {
        _handleSelect(_filteredOptions[_highlightedIndex]);
      }
    } else if (event.isKeyPressed(LogicalKeyboardKey.escape)) {
      _focusNode.unfocus();
      setState(() => _isOpen = false);
    }
  }

  String _getSelectedLabel() {
    if (widget.selectedId == null) return '';
    final selected = widget.options
        .firstWhere((opt) => opt.id == widget.selectedId, orElse: () => SelectSearchOption(id: null, label: ''));
    return selected.label;
  }

  @override
  Widget build(BuildContext context) {
    return RawKeyboardListener(
      focusNode: FocusNode(),
      onKey: _handleKeyDown,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (widget.label != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: RichText(
                text: TextSpan(
                  children: [
                    TextSpan(
                      text: widget.label,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFFB8C6DE),
                      ),
                    ),
                    if (widget.required)
                      const TextSpan(
                        text: ' *',
                        style: TextStyle(color: Color(0xFFFF7A83)),
                      ),
                  ],
                ),
              ),
            ),
          Stack(
            children: [
              TextField(
                controller: _controller,
                focusNode: _focusNode,
                onChanged: widget.isSearchable ? _handleSearch : null,
                enabled: !widget.disabled,
                readOnly: !widget.isSearchable,
                style: const TextStyle(
                  color: Color(0xFFE8EEF8),
                  fontSize: 16,
                ),
                decoration: InputDecoration(
                  hintText: widget.placeholder,
                  hintStyle: const TextStyle(color: Color(0xFF6B7A95)),
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(
                      color: Color(0xFF1E2A4C),
                    ),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(
                      color: Color(0xFF1E2A4C),
                    ),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(
                      color: Color(0xFF3B82F6),
                      width: 2,
                    ),
                  ),
                  disabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(
                      color: Color(0xFF1E2A4C),
                    ),
                  ),
                  suffixIcon: Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: _isSearching
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Color(0xFF3B82F6),
                              ),
                            ),
                          )
                        : Icon(
                            _isOpen ? Icons.expand_less : Icons.expand_more,
                            color: const Color(0xFF6B7A95),
                          ),
                  ),
                  filled: true,
                  fillColor: const Color(0xFF0F1B35),
                ),
              ),
              if (_isOpen && _filteredOptions.isNotEmpty)
                Positioned(
                  top: 56,
                  left: 0,
                  right: 0,
                  child: Material(
                    elevation: 4,
                    borderRadius: BorderRadius.circular(8),
                    color: const Color(0xFF0F1B35),
                    child: Container(
                      constraints: const BoxConstraints(maxHeight: 256),
                      decoration: BoxDecoration(
                        border:
                            Border.all(color: const Color(0xFF1E2A4C), width: 1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: ListView.builder(
                        padding: EdgeInsets.zero,
                        shrinkWrap: true,
                        itemCount: _filteredOptions.length,
                        itemBuilder: (context, index) {
                          final option = _filteredOptions[index];
                          final isHighlighted = index == _highlightedIndex;

                          return Material(
                            color: isHighlighted
                                ? const Color(0xFF3B82F6)
                                : const Color(0xFF0F1B35),
                            child: InkWell(
                              onTap: () => _handleSelect(option),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 10,
                                ),
                                color: isHighlighted
                                    ? const Color(0xFF3B82F6)
                                    : Colors.transparent,
                                child: Text(
                                  option.label,
                                  style: TextStyle(
                                    color: isHighlighted
                                        ? Colors.white
                                        : const Color(0xFFE8EEF8),
                                    fontSize: 14,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                ),
              if (_isOpen && _filteredOptions.isEmpty && _searchTerm.isNotEmpty)
                Positioned(
                  top: 56,
                  left: 0,
                  right: 0,
                  child: Material(
                    elevation: 4,
                    borderRadius: BorderRadius.circular(8),
                    color: const Color(0xFF0F1B35),
                    child: Container(
                      decoration: BoxDecoration(
                        border:
                            Border.all(color: const Color(0xFF1E2A4C), width: 1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      padding: const EdgeInsets.all(16),
                      child: Center(
                        child: Text(
                          'Aucun résultat pour "$_searchTerm"',
                          style: const TextStyle(
                            color: Color(0xFF6B7A95),
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
