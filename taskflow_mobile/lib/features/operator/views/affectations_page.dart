import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class AffectationsPage extends StatefulWidget {
  const AffectationsPage({super.key});

  @override
  State<AffectationsPage> createState() => _AffectationsPageState();
}

class _AffectationsPageState extends State<AffectationsPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        context.go('/operator/task/new');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: CircularProgressIndicator()));
  }
}
