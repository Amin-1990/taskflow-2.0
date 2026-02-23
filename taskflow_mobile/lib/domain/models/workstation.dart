import 'package:equatable/equatable.dart';

class Workstation extends Equatable {
  const Workstation({
    required this.id,
    required this.name,
    required this.code,
    required this.isActive,
  });

  final String id;
  final String name;
  final String code;
  final bool isActive;

  factory Workstation.fromJson(Map<String, dynamic> json) {
    final description =
        (json['Description'] ?? json['description'] ?? '').toString();
    return Workstation(
      id: (json['id'] ?? json['ID'] ?? '').toString(),
      name: (json['name'] ?? json['Nom'] ?? description).toString(),
      code: (json['code'] ?? json['Code'] ?? json['ID'] ?? '').toString(),
      isActive: (json['isActive'] ?? json['Est_actif'] ?? true) == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {'id': id, 'name': name, 'code': code, 'isActive': isActive};
  }

  @override
  List<Object?> get props => [id, name, code, isActive];
}
