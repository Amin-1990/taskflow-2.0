import 'dart:convert';
import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

part 'pending_actions_dao.g.dart';

class PendingActions extends Table {
  TextColumn get id => text()();
  TextColumn get type => text()();
  TextColumn get data => text()();
  DateTimeColumn get createdAt => dateTime()();
  IntColumn get retryCount => integer().withDefault(const Constant(0))();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

@DriftDatabase(tables: [PendingActions])
class PendingActionsDatabase extends _$PendingActionsDatabase {
  PendingActionsDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 1;
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final directory = await getApplicationDocumentsDirectory();
    final file = p.join(directory.path, 'pending_actions.sqlite');
    return NativeDatabase.createInBackground(File(file));
  });
}

class PendingActionPayload {
  const PendingActionPayload({
    required this.id,
    required this.type,
    required this.data,
    required this.createdAt,
    required this.retryCount,
  });

  final String id;
  final String type;
  final Map<String, dynamic> data;
  final DateTime createdAt;
  final int retryCount;
}

class PendingActionsDao {
  PendingActionsDao(this._db);

  final PendingActionsDatabase _db;

  Future<void> enqueue({
    required String id,
    required String type,
    required Map<String, dynamic> data,
  }) async {
    await _db.into(_db.pendingActions).insertOnConflictUpdate(
          PendingActionsCompanion.insert(
            id: id,
            type: type,
            data: jsonEncode(data),
            createdAt: DateTime.now(),
          ),
        );
  }

  Future<List<PendingActionPayload>> getAll() async {
    final rows = await (_db.select(_db.pendingActions)
          ..orderBy([(t) => OrderingTerm.asc(t.createdAt)]))
        .get();

    return rows
        .map(
          (row) => PendingActionPayload(
            id: row.id,
            type: row.type,
            data: jsonDecode(row.data) as Map<String, dynamic>,
            createdAt: row.createdAt,
            retryCount: row.retryCount,
          ),
        )
        .toList();
  }

  Future<void> incrementRetry(String id) async {
    final row = await (_db.select(_db.pendingActions)
          ..where((tbl) => tbl.id.equals(id)))
        .getSingleOrNull();
    if (row == null) {
      return;
    }

    await (_db.update(_db.pendingActions)..where((tbl) => tbl.id.equals(id)))
        .write(
      PendingActionsCompanion(retryCount: Value(row.retryCount + 1)),
    );
  }

  Future<void> remove(String id) async {
    await (_db.delete(_db.pendingActions)..where((tbl) => tbl.id.equals(id)))
        .go();
  }

  Future<void> clearAll() async {
    await _db.delete(_db.pendingActions).go();
  }

  Stream<List<PendingActionPayload>> watchAll() {
    return (_db.select(_db.pendingActions)
          ..orderBy([(t) => OrderingTerm.asc(t.createdAt)]))
        .watch()
        .map(
          (rows) => rows
              .map(
                (row) => PendingActionPayload(
                  id: row.id,
                  type: row.type,
                  data: jsonDecode(row.data) as Map<String, dynamic>,
                  createdAt: row.createdAt,
                  retryCount: row.retryCount,
                ),
              )
              .toList(),
        );
  }
}
