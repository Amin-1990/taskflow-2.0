import 'package:equatable/equatable.dart';

class Poste extends Equatable {
  const Poste(
      {required this.id,
      required this.name,
      required this.code,
      required this.isActive});

  final String id;
  final String name;
  final String code;
  final bool isActive;

  factory Poste.fromJson(Map<String, dynamic> json) {
    final id = (json['ID'] ?? json['id'] ?? '').toString();
    final desc = (json['Description'] ?? json['name'] ?? '').toString();
    return Poste(
      id: id,
      name: desc,
      code: id.isEmpty ? desc : '#$id',
      isActive: true,
    );
  }

  @override
  List<Object?> get props => [id, name, code, isActive];
}
