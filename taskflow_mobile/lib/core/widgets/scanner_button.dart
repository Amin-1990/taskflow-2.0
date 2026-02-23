import 'package:flutter/material.dart';
import 'package:qr_code_scanner/qr_code_scanner.dart';

class ScannerButton extends StatelessWidget {
  const ScannerButton({
    super.key,
    required this.onScan,
    this.size = 48,
    this.backgroundColor = const Color(0xFF1A3F7D),
    this.iconColor = const Color(0xFF2A7BFF),
  });

  final ValueChanged<String> onScan;
  final double size;
  final Color backgroundColor;
  final Color iconColor;

  Future<void> _openScanner(BuildContext context) async {
    final value = await Navigator.of(context).push<String>(
      MaterialPageRoute(builder: (_) => const _QrScannerPage()),
    );
    if (value != null && value.trim().isNotEmpty) {
      onScan(value.trim());
    }
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: size,
      width: size,
      child: Material(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: () => _openScanner(context),
          child:
              Icon(Icons.qr_code_scanner, color: iconColor, size: size * 0.5),
        ),
      ),
    );
  }
}

class _QrScannerPage extends StatefulWidget {
  const _QrScannerPage();

  @override
  State<_QrScannerPage> createState() => _QrScannerPageState();
}

class _QrScannerPageState extends State<_QrScannerPage> {
  final qrKey = GlobalKey(debugLabel: 'taskflow-qr');
  QRViewController? _controller;
  bool _sent = false;

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  void _onViewCreated(QRViewController controller) {
    _controller = controller;
    controller.scannedDataStream.listen((scanData) {
      if (_sent) {
        return;
      }
      final code = scanData.code;
      if (code != null && code.isNotEmpty) {
        _sent = true;
        Navigator.of(context).pop(code);
      }
    });
  }

  Future<void> _manualEntry() async {
    final controller = TextEditingController();
    final value = await showDialog<String>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Saisie manuelle'),
          content: TextField(
              controller: controller,
              decoration: const InputDecoration(hintText: 'Code QR')),
          actions: [
            TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Annuler')),
            FilledButton(
                onPressed: () =>
                    Navigator.of(context).pop(controller.text.trim()),
                child: const Text('Valider')),
          ],
        );
      },
    );

    if (value != null && value.isNotEmpty && mounted) {
      Navigator.of(context).pop(value);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scanner QR'),
        actions: [
          IconButton(
              onPressed: _manualEntry,
              icon: const Icon(Icons.keyboard_outlined)),
        ],
      ),
      body: QRView(
        key: qrKey,
        onQRViewCreated: _onViewCreated,
      ),
    );
  }
}
