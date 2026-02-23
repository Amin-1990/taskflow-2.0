import 'package:equatable/equatable.dart';

import '../enums/task_status.dart';

class Task extends Equatable {
  const Task({
    required this.id,
    required this.orderNumber,
    required this.articleName,
    required this.articleRef,
    required this.workstation,
    required this.startTime,
    required this.activeDuration,
    required this.status,
    required this.targetQuantity,
    required this.producedQuantity,
  });

  final String id;
  final String orderNumber;
  final String articleName;
  final String articleRef;
  final String workstation;
  final DateTime startTime;
  final Duration activeDuration;
  final TaskStatus status;
  final int targetQuantity;
  final int producedQuantity;

  factory Task.fromJson(Map<String, dynamic> json) {
    final start = DateTime.tryParse(
            (json['startTime'] ?? json['Date_debut'] ?? '').toString()) ??
        DateTime.now();
    final durationMinutes =
        _toInt(json['activeDurationMinutes'] ?? json['Duree_minutes']);

    return Task(
      id: (json['id'] ?? json['ID'] ?? '').toString(),
      orderNumber:
          (json['orderNumber'] ?? json['Numero_OF'] ?? 'OF-N/A').toString(),
      articleName:
          (json['articleName'] ?? json['Article_nom'] ?? '').toString(),
      articleRef: (json['articleRef'] ?? json['Article_ref'] ?? '').toString(),
      workstation: (json['workstation'] ?? json['Poste_nom'] ?? '').toString(),
      startTime: start,
      activeDuration: durationMinutes > 0
          ? Duration(minutes: durationMinutes)
          : DateTime.now().difference(start),
      status:
          taskStatusFromString((json['status'] ?? json['Statut'])?.toString()),
      targetQuantity:
          _toInt(json['targetQuantity'] ?? json['Quantite_objectif']),
      producedQuantity:
          _toInt(json['producedQuantity'] ?? json['Quantite_realisee']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'orderNumber': orderNumber,
      'articleName': articleName,
      'articleRef': articleRef,
      'workstation': workstation,
      'startTime': startTime.toIso8601String(),
      'activeDurationMinutes': activeDuration.inMinutes,
      'status': taskStatusToApi(status),
      'targetQuantity': targetQuantity,
      'producedQuantity': producedQuantity,
    };
  }

  Task copyWith({
    String? id,
    String? orderNumber,
    String? articleName,
    String? articleRef,
    String? workstation,
    DateTime? startTime,
    Duration? activeDuration,
    TaskStatus? status,
    int? targetQuantity,
    int? producedQuantity,
  }) {
    return Task(
      id: id ?? this.id,
      orderNumber: orderNumber ?? this.orderNumber,
      articleName: articleName ?? this.articleName,
      articleRef: articleRef ?? this.articleRef,
      workstation: workstation ?? this.workstation,
      startTime: startTime ?? this.startTime,
      activeDuration: activeDuration ?? this.activeDuration,
      status: status ?? this.status,
      targetQuantity: targetQuantity ?? this.targetQuantity,
      producedQuantity: producedQuantity ?? this.producedQuantity,
    );
  }

  @override
  List<Object?> get props => [
        id,
        orderNumber,
        articleName,
        articleRef,
        workstation,
        startTime,
        activeDuration,
        status,
        targetQuantity,
        producedQuantity,
      ];

  static int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }
}
