import 'package:equatable/equatable.dart';

class Unite extends Equatable {
  const Unite({
    required this.id,
    required this.nom,
  });

  final String id;
  final String nom;

  factory Unite.fromJson(Map<String, dynamic> json) {
    return Unite(
      id: (json['id'] ?? json['ID'] ?? '').toString(),
      nom: (json['nom'] ?? json['name'] ?? '').toString().trim(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'nom': nom,
      };

  @override
  List<Object?> get props => [id, nom];
}
