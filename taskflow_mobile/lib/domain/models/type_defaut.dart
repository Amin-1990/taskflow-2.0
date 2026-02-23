import 'package:equatable/equatable.dart';

class TypeDefaut extends Equatable {
  const TypeDefaut({
    required this.code,
    required this.description,
    required this.categorie,
  });

  final String code;
  final String description;
  final String categorie;

  String get codeAndDescription => '$code - $description';

  factory TypeDefaut.fromJson(Map<String, dynamic> json) {
    final code = (json['Code_defaut'] ?? json['code'] ?? '').toString();
    final description =
        (json['Description'] ?? json['description'] ?? '').toString();
    final categorie = code.contains('-') ? code.split('-').first : 'GEN';

    return TypeDefaut(
        code: code, description: description, categorie: categorie);
  }

  @override
  List<Object?> get props => [code, description, categorie];
}
