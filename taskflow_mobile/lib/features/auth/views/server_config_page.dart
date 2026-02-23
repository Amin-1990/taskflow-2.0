import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_config.dart';
import '../controllers/auth_provider.dart';

class ServerConfigPage extends ConsumerStatefulWidget {
  const ServerConfigPage({super.key});

  @override
  ConsumerState<ServerConfigPage> createState() => _ServerConfigPageState();
}

class _ServerConfigPageState extends ConsumerState<ServerConfigPage> {
  late final TextEditingController _urlController;
  bool _testing = false;
  bool? _success;
  String? _message;

  @override
  void initState() {
    super.initState();
    final current =
        ref.read(authProvider).serverUrl ?? AppConfig.defaultServerUrl;
    _urlController = TextEditingController(text: current);
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  Future<void> _testConnection() async {
    final url = _urlController.text.trim();
    if (url.isEmpty) {
      setState(() {
        _success = false;
        _message = 'Veuillez saisir une URL serveur.';
      });
      return;
    }

    setState(() {
      _testing = true;
      _success = null;
      _message = null;
    });

    try {
      final dio = Dio(
        BaseOptions(
          baseUrl: url,
          connectTimeout: const Duration(seconds: 8),
          receiveTimeout: const Duration(seconds: 8),
        ),
      );
      final response = await dio.get<Map<String, dynamic>>('/api/health');
      final ok = response.statusCode == 200;

      setState(() {
        _success = ok;
        _message = ok
            ? 'Connexion reussie. Serveur valide.'
            : 'Serveur joignable mais reponse invalide.';
      });
    } catch (_) {
      setState(() {
        _success = false;
        _message = 'Echec de connexion. Verifiez l\'URL et le reseau.';
      });
    } finally {
      setState(() {
        _testing = false;
      });
    }
  }

  Future<void> _validate() async {
    if (_urlController.text.trim().isEmpty) {
      return;
    }
    await ref.read(authProvider.notifier).setServer(_urlController.text);
    if (!mounted) {
      return;
    }
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final resultColor = switch (_success) {
      true => Colors.green,
      false => Colors.redAccent,
      null => Colors.transparent,
    };

    return Scaffold(
      appBar: AppBar(title: const Text('Configuration serveur')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Adresse API',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
            const SizedBox(height: 10),
            TextField(
              controller: _urlController,
              decoration: const InputDecoration(
                hintText: 'https://...',
                prefixIcon: Icon(Icons.dns_outlined),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: _testing ? null : _testConnection,
                icon: _testing
                    ? const SizedBox(
                        height: 16,
                        width: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.health_and_safety_outlined),
                label:
                    Text(_testing ? 'Test en cours...' : 'Tester la connexion'),
              ),
            ),
            const SizedBox(height: 14),
            AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              padding: _message == null
                  ? EdgeInsets.zero
                  : const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: _message == null
                    ? Colors.transparent
                    : resultColor.withOpacity(0.12),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                    color: _message == null ? Colors.transparent : resultColor),
              ),
              child: _message == null
                  ? const SizedBox.shrink()
                  : Row(
                      children: [
                        Icon(
                            _success == true
                                ? Icons.check_circle
                                : Icons.error_outline,
                            color: resultColor),
                        const SizedBox(width: 8),
                        Expanded(
                            child: Text(_message!,
                                style: TextStyle(color: resultColor))),
                      ],
                    ),
            ),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: _validate,
                child: const Text('Valider'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
