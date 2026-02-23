import 'dart:io';

import 'package:drift/native.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

/// Prepares the SQLite database location for offline mode.
Future<NativeDatabase> openTaskflowDatabase() async {
  final appDirectory = await getApplicationDocumentsDirectory();
  final dbFile = File(p.join(appDirectory.path, 'taskflow_mobile.sqlite'));
  return NativeDatabase(dbFile);
}
