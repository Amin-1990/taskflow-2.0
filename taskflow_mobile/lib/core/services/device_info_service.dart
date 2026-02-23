import 'dart:math';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart';

class DeviceInfoService {
  final DeviceInfoPlugin _plugin = DeviceInfoPlugin();

  Future<String?> tryGetStableId() async {
    try {
      switch (defaultTargetPlatform) {
        case TargetPlatform.android:
          final android = await _plugin.androidInfo;
          return android.id.isNotEmpty ? android.id : android.fingerprint;
        case TargetPlatform.iOS:
          final ios = await _plugin.iosInfo;
          return ios.identifierForVendor;
        case TargetPlatform.windows:
          final windows = await _plugin.windowsInfo;
          return windows.deviceId;
        case TargetPlatform.linux:
          final linux = await _plugin.linuxInfo;
          return linux.machineId;
        case TargetPlatform.macOS:
          final mac = await _plugin.macOsInfo;
          return mac.systemGUID;
        case TargetPlatform.fuchsia:
          return null;
      }
    } catch (_) {
      return null;
    }
  }

  String generateFallbackId() {
    final rng = Random.secure();
    final bytes = List<int>.generate(16, (_) => rng.nextInt(256));
    final hex = bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
    return '${hex.substring(0, 4)}-${hex.substring(4, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}';
  }
}
