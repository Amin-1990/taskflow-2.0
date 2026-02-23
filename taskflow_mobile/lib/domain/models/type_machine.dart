import 'package:equatable/equatable.dart';

class TypeMachine extends Equatable {
  const TypeMachine({required this.id, required this.label});

  final String id;
  final String label;

  factory TypeMachine.fromJson(Map<String, dynamic> json) {
    final label =
        (json['Type_machine'] ?? json['Nom'] ?? json['label'] ?? '').toString();
    return TypeMachine(
      id: (json['ID'] ?? json['id'] ?? '').toString(),
      label: label,
    );
  }

  @override
  List<Object?> get props => [id, label];
}
