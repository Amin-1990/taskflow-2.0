import 'package:equatable/equatable.dart';

class Semaine extends Equatable {
  const Semaine({
    required this.id,
    required this.codeSemaine,
    required this.numeroSemaine,
    required this.annee,
  });

  final String id;
  final String codeSemaine;
  final int numeroSemaine;
  final int annee;

  String get label => '$codeSemaine - $annee';

  factory Semaine.fromJson(Map<String, dynamic> json) {
    final id = (json['id'] ?? json['ID'] ?? '').toString();
    final codeSemaine =
        (json['codeSemaine'] ?? json['Code_semaine'] ?? '').toString().trim();
    final numeroSemaine =
        int.tryParse((json['numeroSemaine'] ?? json['Numero_semaine'] ?? '0').toString()) ?? 0;
    final annee =
        int.tryParse((json['annee'] ?? json['Annee'] ?? '0').toString()) ?? 0;

    return Semaine(
      id: id,
      codeSemaine: codeSemaine,
      numeroSemaine: numeroSemaine,
      annee: annee,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'codeSemaine': codeSemaine,
        'numeroSemaine': numeroSemaine,
        'annee': annee,
      };

  @override
  List<Object?> get props => [id, codeSemaine, numeroSemaine, annee];
}
