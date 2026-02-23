import 'package:equatable/equatable.dart';

class Operateur extends Equatable {
  const Operateur({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.matricule,
    required this.isActive,
  });

  final String id;
  final String firstName;
  final String lastName;
  final String matricule;
  final bool isActive;

  String get fullName => '$firstName $lastName'.trim();

  factory Operateur.fromJson(Map<String, dynamic> json) {
    final full = (json['Nom_prenom'] ?? json['nom_prenom'] ?? '').toString();
    final parts = full.split(RegExp(r'\s+'));
    final first = parts.isNotEmpty ? parts.first : '';
    final last = parts.length > 1 ? parts.sublist(1).join(' ') : '';

    return Operateur(
      id: (json['ID'] ?? json['id'] ?? '').toString(),
      firstName: first,
      lastName: last,
      matricule: (json['Matricule'] ?? json['matricule'] ?? '').toString(),
      isActive: ((json['Statut'] ?? json['statut'] ?? 'actif')
              .toString()
              .toLowerCase() ==
          'actif'),
    );
  }

  @override
  List<Object?> get props => [id, firstName, lastName, matricule, isActive];
}
