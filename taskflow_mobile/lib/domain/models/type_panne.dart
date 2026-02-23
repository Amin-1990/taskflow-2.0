import 'package:equatable/equatable.dart';

class TypePanne extends Equatable {
  const TypePanne({
    required this.id,
    required this.code,
    required this.label,
    required this.category,
    required this.typeMachineId,
  });

  final String id;
  final String code;
  final String label;
  final String category;
  final String typeMachineId;

  String get display => '$code - $label';

  factory TypePanne.fromJson(Map<String, dynamic> json) {
    final code = (json['Code_defaut'] ?? json['code'] ?? '').toString();
    final label = (json['Nom_defaut'] ??
            json['label'] ??
            json['Description_defaut'] ??
            json['description'] ??
            '')
        .toString();
    final category = (json['Categorie'] ?? '').toString();

    return TypePanne(
      id: (json['ID'] ?? json['id'] ?? '').toString(),
      code: code,
      label: label,
      category: category.isNotEmpty
          ? category
          : (code.contains('-') ? code.split('-').first : 'GEN'),
      typeMachineId:
          (json['ID_Type_machine'] ?? json['typeMachineId'] ?? '').toString(),
    );
  }

  @override
  List<Object?> get props => [id, code, label, category, typeMachineId];
}
