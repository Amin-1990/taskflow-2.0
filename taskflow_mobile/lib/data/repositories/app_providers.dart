import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/constants/app_config.dart';
import '../../core/services/push_notification_service.dart';
import '../local/daos/pending_actions_dao.dart';
import '../local/prefs/token_storage.dart';
import '../remote/api_client.dart';

final tokenStorageProvider = Provider<TokenStorage>((ref) {
  return TokenStorage();
});

final apiClientProvider = Provider<ApiClient>((ref) {
  final tokenStorage = ref.watch(tokenStorageProvider);
  return ApiClient(
    tokenStorage: tokenStorage,
    baseUrl: AppConfig.defaultServerUrl,
  );
});

final pendingActionsDatabaseProvider = Provider<PendingActionsDatabase>((ref) {
  final db = PendingActionsDatabase();
  ref.onDispose(db.close);
  return db;
});

final pendingActionsDaoProvider = Provider<PendingActionsDao>((ref) {
  return PendingActionsDao(ref.watch(pendingActionsDatabaseProvider));
});

final pushNotificationServiceProvider =
    Provider<PushNotificationService>((ref) {
  final service = PushNotificationService();
  ref.onDispose(service.dispose);
  return service;
});
