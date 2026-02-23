import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

class PushNotificationService {
  PushNotificationService();

  StreamSubscription<RemoteMessage>? _openedSub;

  Future<String?> initialize({
    required void Function(String route) onNotificationTap,
  }) async {
    try {
      if (Firebase.apps.isEmpty) {
        await Firebase.initializeApp();
      }
    } catch (_) {
      return null;
    }

    final messaging = FirebaseMessaging.instance;
    await messaging.requestPermission(alert: true, badge: true, sound: true);

    final initialMessage = await messaging.getInitialMessage();
    if (initialMessage != null) {
      onNotificationTap(_routeFromMessage(initialMessage));
    }

    _openedSub?.cancel();
    _openedSub = FirebaseMessaging.onMessageOpenedApp.listen((message) {
      onNotificationTap(_routeFromMessage(message));
    });

    return messaging.getToken();
  }

  Future<String?> getCurrentToken() async {
    try {
      return FirebaseMessaging.instance.getToken();
    } catch (_) {
      return null;
    }
  }

  String _routeFromMessage(RemoteMessage message) {
    final route = message.data['route']?.toString();
    if (route != null && route.isNotEmpty) {
      return route;
    }
    return '/technician/dashboard';
  }

  void dispose() {
    _openedSub?.cancel();
  }
}
