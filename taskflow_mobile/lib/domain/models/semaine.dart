import 'package:equatable/equatable.dart';

class Semaine extends Equatable {
  const Semaine({required this.id, required this.label});

  final String id;
  final String label;

  factory Semaine.fromJson(Map<String, dynamic> json) {
    final numero =
        (json['numero'] ?? json['Numero_semaine'] ?? '').toString().trim();
    final annee = (json['annee'] ?? json['Annee'] ?? '').toString().trim();
    final code =
        (json['Code_semaine'] ?? json['code_semaine'] ?? '').toString().trim();
    final label = annee.isNotEmpty && numero.isNotEmpty
        ? '$annee - Semaine $numero'
        : (code.isNotEmpty ? code : 'Semaine');
    return Semaine(
      id: (json['id'] ?? json['ID'] ?? '$numero-$annee').toString(),
      label: (json['label'] ?? label).toString(),
    );
  }

  Map<String, dynamic> toJson() => {'id': id, 'label': label};

  @override
  List<Object?> get props => [id, label];
}
