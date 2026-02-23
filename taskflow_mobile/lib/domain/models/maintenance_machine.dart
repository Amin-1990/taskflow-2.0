import 'package:equatable/equatable.dart';

class MaintenanceMachine extends Equatable {
  const MaintenanceMachine({
    required this.id,
    required this.code,
    required this.name,
    required this.location,
    required this.description,
    required this.typeMachineId,
    required this.typeMachineLabel,
  });

  final String id;
  final String code;
  final String name;
  final String location;
  final String description;
  final String typeMachineId;
  final String typeMachineLabel;

  String get display => '$name - $location';

  factory MaintenanceMachine.fromJson(Map<String, dynamic> json) {
    final name = (json['Nom_machine'] ?? json['name'] ?? '').toString();
    final location =
        (json['Site_affectation'] ?? json['location'] ?? '').toString();
    final emplacement = (json['Emplacement_detail'] ?? '').toString();
    final typeLabel =
        (json['Type_machine'] ?? json['typeMachineLabel'] ?? '').toString();

    return MaintenanceMachine(
      id: (json['ID'] ?? json['id'] ?? '').toString(),
      code: (json['Code_interne'] ?? json['code'] ?? '').toString(),
      name: name,
      location: emplacement.isNotEmpty ? '$location - $emplacement' : location,
      description:
          (json['Description'] ?? json['description'] ?? '').toString(),
      typeMachineId: (json['Type_machine_id'] ??
              json['ID_Type_machine'] ??
              json['typeMachineId'] ??
              '')
          .toString(),
      typeMachineLabel: typeLabel,
    );
  }

  @override
  List<Object?> get props =>
      [id, code, name, location, description, typeMachineId, typeMachineLabel];
}
