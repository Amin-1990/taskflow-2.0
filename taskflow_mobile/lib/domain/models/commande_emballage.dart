import 'package:equatable/equatable.dart';

enum PackagingOrderStatus { inProgress, completed }

class CommandeEmballage extends Equatable {
  const CommandeEmballage({
    required this.id,
    required this.lotNumber,
    required this.articleName,
    required this.articleRef,
    required this.productionLine,
    required this.periodLabel,
    required this.dailyTarget,
    required this.packedToday,
  });

  final String id;
  final String lotNumber;
  final String articleName;
  final String articleRef;
  final String productionLine;
  final String periodLabel;
  final int dailyTarget;
  final int packedToday;

  double get progress =>
      dailyTarget <= 0 ? 0 : (packedToday / dailyTarget).clamp(0, 1).toDouble();
  int get remaining => (dailyTarget - packedToday).clamp(0, dailyTarget);
  bool get isCompleted => packedToday >= dailyTarget && dailyTarget > 0;

  PackagingOrderStatus get status => isCompleted
      ? PackagingOrderStatus.completed
      : PackagingOrderStatus.inProgress;

  factory CommandeEmballage.fromJson(Map<String, dynamic> json) {
    return CommandeEmballage(
      id: (json['ID'] ?? json['id'] ?? '').toString(),
      lotNumber: (json['Lot'] ?? json['lot'] ?? 'N/A').toString(),
      articleName: (json['Article_nom'] ??
              json['articleName'] ??
              json['Code_article'] ??
              'Article')
          .toString(),
      articleRef: (json['Code_article'] ?? json['articleRef'] ?? '').toString(),
      productionLine:
          (json['Unite_production'] ?? json['productionLine'] ?? 'Ligne')
              .toString(),
      periodLabel: (json['periodLabel'] ?? _currentPeriodLabel()).toString(),
      dailyTarget: _toInt(json['Quantite_facturee'] ?? json['dailyTarget']),
      packedToday: _toInt(json['Quantite_emballe'] ?? json['packedToday']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'lotNumber': lotNumber,
      'articleName': articleName,
      'articleRef': articleRef,
      'productionLine': productionLine,
      'periodLabel': periodLabel,
      'dailyTarget': dailyTarget,
      'packedToday': packedToday,
    };
  }

  CommandeEmballage copyWith({
    String? id,
    String? lotNumber,
    String? articleName,
    String? articleRef,
    String? productionLine,
    String? periodLabel,
    int? dailyTarget,
    int? packedToday,
  }) {
    return CommandeEmballage(
      id: id ?? this.id,
      lotNumber: lotNumber ?? this.lotNumber,
      articleName: articleName ?? this.articleName,
      articleRef: articleRef ?? this.articleRef,
      productionLine: productionLine ?? this.productionLine,
      periodLabel: periodLabel ?? this.periodLabel,
      dailyTarget: dailyTarget ?? this.dailyTarget,
      packedToday: packedToday ?? this.packedToday,
    );
  }

  @override
  List<Object?> get props => [
        id,
        lotNumber,
        articleName,
        articleRef,
        productionLine,
        periodLabel,
        dailyTarget,
        packedToday
      ];

  static int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }

  static String _currentPeriodLabel() {
    final now = DateTime.now();
    final startHour = now.hour;
    final endHour = startHour + 2;
    return '${startHour}h-${endHour}h';
  }
}
