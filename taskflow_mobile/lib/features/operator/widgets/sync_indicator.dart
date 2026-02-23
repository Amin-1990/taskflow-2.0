import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class SyncIndicator extends StatefulWidget {
  const SyncIndicator({
    super.key,
    required this.lastSync,
    required this.isSyncing,
    required this.onSync,
  });

  final DateTime lastSync;
  final bool isSyncing;
  final VoidCallback onSync;

  @override
  State<SyncIndicator> createState() => _SyncIndicatorState();
}

class _SyncIndicatorState extends State<SyncIndicator>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1100));
    if (widget.isSyncing) {
      _pulseController.repeat(reverse: true);
    }
  }

  @override
  void didUpdateWidget(covariant SyncIndicator oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isSyncing && !_pulseController.isAnimating) {
      _pulseController.repeat(reverse: true);
    } else if (!widget.isSyncing && _pulseController.isAnimating) {
      _pulseController.stop();
      _pulseController.value = 0;
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final label = DateFormat('h:mm a').format(widget.lastSync);

    return Row(
      children: [
        const Text('Sync: ',
            style: TextStyle(color: Color(0xFF8EA2C3), fontSize: 16)),
        Text(label,
            style: const TextStyle(
                color: Color(0xFF8EA2C3),
                fontSize: 16,
                fontWeight: FontWeight.w600)),
        const SizedBox(width: 8),
        ScaleTransition(
          scale: Tween<double>(begin: 1, end: 1.1).animate(
            CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
          ),
          child: IconButton(
            onPressed: widget.onSync,
            icon: Icon(
              widget.isSyncing ? Icons.sync : Icons.sync_outlined,
              color: widget.isSyncing
                  ? const Color(0xFF2E7BFF)
                  : const Color(0xFF8EA2C3),
            ),
          ),
        ),
      ],
    );
  }
}
