import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../domain/models/user.dart';
import '../../features/auth/controllers/auth_provider.dart';
import '../../features/auth/views/login_page.dart';
import '../../features/auth/views/server_config_page.dart';
import '../../features/auth/views/splash_page.dart';
import '../../features/operator/task/views/finish_task_page.dart';
import '../../features/operator/task/views/new_task_page.dart';
import '../../features/operator/views/affectations_page.dart';
import '../../features/operator/views/defects_page.dart';
import '../../features/operator/views/notifications_page.dart';
import '../../features/operator/views/operator_dashboard.dart';
import '../../features/operator/views/packaging_page.dart';
import '../../features/operator/views/request_intervention_page.dart';
import '../../features/operator/views/settings_page.dart';
import '../../features/operator/views/tasks_to_finish_page.dart';
import '../../features/technician/views/technician_dashboard.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/splash',
    routes: [
      GoRoute(
        path: '/',
        redirect: (context, state) => '/splash',
      ),
      GoRoute(
          path: '/splash',
          pageBuilder: (context, state) => _page(state, const SplashPage())),
      GoRoute(
          path: '/login',
          pageBuilder: (context, state) => _page(state, const LoginPage())),
      GoRoute(
          path: '/server-config',
          pageBuilder: (context, state) =>
              _page(state, const ServerConfigPage())),
      GoRoute(
          path: '/operator/dashboard',
          pageBuilder: (context, state) =>
              _page(state, const OperatorDashboardPage())),
      GoRoute(
          path: '/operator/affectations',
          pageBuilder: (context, state) =>
              _page(state, const AffectationsPage())),
      GoRoute(
          path: '/operator/tasks',
          pageBuilder: (context, state) =>
              _page(state, const TasksToFinishPage())),
      GoRoute(
          path: '/operator/task/new',
          name: 'newTask',
          pageBuilder: (context, state) => _page(state, const NewTaskPage())),
      GoRoute(
        path: '/operator/task/finish/:taskId',
        name: 'finishTask',
        pageBuilder: (context, state) => _page(
          state,
          FinishTaskPage(taskId: state.pathParameters['taskId']!),
        ),
      ),
      GoRoute(
          path: '/operator/packaging',
          pageBuilder: (context, state) => _page(state, const PackagingPage())),
      GoRoute(
          path: '/operator/defects',
          pageBuilder: (context, state) => _page(state, const DefectsPage())),
      GoRoute(
        path: '/operator/intervention/request',
        pageBuilder: (context, state) =>
            _page(state, const RequestInterventionPage()),
      ),
      GoRoute(
          path: '/notifications',
          pageBuilder: (context, state) =>
              _page(state, const NotificationsPage())),
      GoRoute(
          path: '/settings',
          pageBuilder: (context, state) => _page(state, const SettingsPage())),
      GoRoute(
        path: '/technician/dashboard',
        pageBuilder: (context, state) =>
            _page(state, const TechnicianDashboardPage()),
      ),
    ],
    redirect: (context, state) {
      final location = state.uri.path;
      final isAuthRoute = location == '/login' || location == '/server-config';

      if (location == '/') {
        return '/splash';
      }

      // While auth bootstrap is running, keep user on splash only.
      if (authState.isLoading) {
        return location == '/splash' ? null : '/splash';
      }

      if (!authState.isAuthenticated) {
        if (location == '/splash') {
          return '/login';
        }
        return isAuthRoute ? null : '/login';
      }

      if (location == '/login' ||
          location == '/splash' ||
          location == '/server-config') {
        final role = authState.user?.role ?? UserRole.operator;
        if (role == UserRole.technician) {
          return '/technician/dashboard';
        }
        return '/operator/dashboard';
      }

      return null;
    },
  );
});

CustomTransitionPage<void> _page(GoRouterState state, Widget child) {
  return CustomTransitionPage<void>(
    key: state.pageKey,
    transitionDuration: const Duration(milliseconds: 220),
    reverseTransitionDuration: const Duration(milliseconds: 180),
    child: child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      final offsetTween =
          Tween<Offset>(begin: const Offset(0.02, 0), end: Offset.zero);
      return FadeTransition(
        opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
        child: SlideTransition(
          position: animation
              .drive(offsetTween.chain(CurveTween(curve: Curves.easeOutCubic))),
          child: child,
        ),
      );
    },
  );
}
