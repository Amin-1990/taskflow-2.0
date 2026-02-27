import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/services/timezone_service.dart';
import 'core/theme/app_theme.dart';
import 'core/utils/app_router.dart';
import 'data/repositories/app_providers.dart';
import 'data/repositories/intervention_repository.dart';
import 'features/auth/controllers/auth_provider.dart';
import 'features/settings/controllers/settings_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await TimezoneService.initialize();
  runApp(const ProviderScope(child: TaskflowApp()));
}

class TaskflowApp extends ConsumerStatefulWidget {
  const TaskflowApp({super.key});

  @override
  ConsumerState<TaskflowApp> createState() => _TaskflowAppState();
}

class _TaskflowAppState extends ConsumerState<TaskflowApp> {
  String? _pendingRoute;
  bool _pushInitialized = false;
  bool _tokenRegistered = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _initPush());
  }

  Future<void> _initPush() async {
    if (_pushInitialized) {
      return;
    }
    _pushInitialized = true;

    final pushService = ref.read(pushNotificationServiceProvider);
    final token = await pushService.initialize(
      onNotificationTap: (route) {
        if (!mounted) {
          return;
        }
        setState(() {
          _pendingRoute = route;
        });
      },
    );
    if (token != null) {
      await _registerToken(token);
    }
  }

  Future<void> _registerToken(String token) async {
    if (_tokenRegistered) {
      return;
    }
    final auth = ref.read(authProvider);
    if (!auth.isAuthenticated) {
      return;
    }
    _tokenRegistered =
        await ref.read(interventionRepositoryProvider).registerFcmToken(token);
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(settingsProvider);
    final router = ref.watch(appRouterProvider);
    final auth = ref.watch(authProvider);
    final themeMode = ref.watch(appThemeModeProvider);

    if (auth.isAuthenticated) {
      ref.read(pushNotificationServiceProvider).getCurrentToken().then((value) {
        if (value == null || value.isEmpty) {
          return;
        }
        _registerToken(value);
      });
    } else {
      _tokenRegistered = false;
    }

    if (_pendingRoute != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        final route = _pendingRoute;
        if (route == null) {
          return;
        }
        _pendingRoute = null;
        router.go(route);
      });
    }

    return MaterialApp.router(
      title: 'Taskflow Mobile',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      routerConfig: router,
    );
  }
}
