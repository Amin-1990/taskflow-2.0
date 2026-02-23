import 'package:equatable/equatable.dart';

class ProductionStats extends Equatable {
  const ProductionStats(
      {required this.targetUnits,
      required this.achievedUnits,
      required this.productivity});

  final int targetUnits;
  final int achievedUnits;
  final double productivity;

  factory ProductionStats.fromJson(Map<String, dynamic> json) {
    final target = (json['targetUnits'] ?? json['target_units'] ?? 0) as num;
    final achieved =
        (json['achievedUnits'] ?? json['achieved_units'] ?? 0) as num;
    final productivityRaw = (json['productivity'] ?? 0) as num;
    final productivity = productivityRaw > 1
        ? productivityRaw.toDouble() / 100
        : productivityRaw.toDouble();

    return ProductionStats(
      targetUnits: target.toInt(),
      achievedUnits: achieved.toInt(),
      productivity: productivity,
    );
  }

  @override
  List<Object?> get props => [targetUnits, achievedUnits, productivity];
}
