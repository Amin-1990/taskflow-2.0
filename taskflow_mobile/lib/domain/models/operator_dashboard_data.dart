import 'package:equatable/equatable.dart';

class OperatorDashboardData extends Equatable {
  const OperatorDashboardData({
    required this.activeTasks,
    required this.tasksToFinish,
    required this.packagingRate,
    required this.processDefects,
    required this.productivity,
    required this.targetUnits,
    required this.achievedUnits,
  });

  final int activeTasks;
  final int tasksToFinish;
  final double packagingRate;
  final int processDefects;
  final double productivity;
  final int targetUnits;
  final int achievedUnits;

  factory OperatorDashboardData.empty() {
    return const OperatorDashboardData(
      activeTasks: 0,
      tasksToFinish: 0,
      packagingRate: 0,
      processDefects: 0,
      productivity: 0,
      targetUnits: 0,
      achievedUnits: 0,
    );
  }

  factory OperatorDashboardData.fromJson(Map<String, dynamic> json) {
    return OperatorDashboardData(
      activeTasks: _toInt(json['activeTasks'] ?? json['active_tasks']),
      tasksToFinish: _toInt(json['tasksToFinish'] ?? json['tasks_to_finish']),
      packagingRate:
          _toPercent(json['packagingRate'] ?? json['packaging_rate']),
      processDefects: _toInt(json['processDefects'] ?? json['process_defects']),
      productivity: _toPercent(json['productivity']),
      targetUnits: _toInt(json['targetUnits'] ?? json['target_units']),
      achievedUnits: _toInt(json['achievedUnits'] ?? json['achieved_units']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'activeTasks': activeTasks,
      'tasksToFinish': tasksToFinish,
      'packagingRate': packagingRate,
      'processDefects': processDefects,
      'productivity': productivity,
      'targetUnits': targetUnits,
      'achievedUnits': achievedUnits,
    };
  }

  OperatorDashboardData copyWith({
    int? activeTasks,
    int? tasksToFinish,
    double? packagingRate,
    int? processDefects,
    double? productivity,
    int? targetUnits,
    int? achievedUnits,
  }) {
    return OperatorDashboardData(
      activeTasks: activeTasks ?? this.activeTasks,
      tasksToFinish: tasksToFinish ?? this.tasksToFinish,
      packagingRate: packagingRate ?? this.packagingRate,
      processDefects: processDefects ?? this.processDefects,
      productivity: productivity ?? this.productivity,
      targetUnits: targetUnits ?? this.targetUnits,
      achievedUnits: achievedUnits ?? this.achievedUnits,
    );
  }

  @override
  List<Object?> get props {
    return [
      activeTasks,
      tasksToFinish,
      packagingRate,
      processDefects,
      productivity,
      targetUnits,
      achievedUnits,
    ];
  }

  static int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }

  static double _toPercent(dynamic value) {
    if (value is num) {
      final parsed = value.toDouble();
      return parsed > 1 ? parsed / 100 : parsed;
    }
    if (value is String) {
      final cleaned = value.replaceAll('%', '').trim();
      final parsed = double.tryParse(cleaned) ?? 0;
      return parsed > 1 ? parsed / 100 : parsed;
    }
    return 0;
  }
}
