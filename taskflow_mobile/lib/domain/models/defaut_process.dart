import 'package:equatable/equatable.dart';

class DefautProcess extends Equatable {
  const DefautProcess({
    required this.posteId,
    required this.semaineId,
    required this.articleId,
    required this.articleCode,
    required this.operateurId,
    required this.codeDefaut,
    required this.descriptionDefaut,
    required this.quantite,
    required this.dateEnregistrement,
    required this.enregistreurId,
  });

  final String posteId;
  final String semaineId;
  final String articleId;
  final String articleCode;
  final String operateurId;
  final String codeDefaut;
  final String descriptionDefaut;
  final int quantite;
  final DateTime dateEnregistrement;
  final String enregistreurId;

  Map<String, dynamic> toApiPayload() {
    final date =
        '${dateEnregistrement.year.toString().padLeft(4, '0')}-${dateEnregistrement.month.toString().padLeft(2, '0')}-${dateEnregistrement.day.toString().padLeft(2, '0')}';
    final hour =
        '${dateEnregistrement.hour.toString().padLeft(2, '0')}:${dateEnregistrement.minute.toString().padLeft(2, '0')}';

    return {
      'ID_Article': int.tryParse(articleId) ?? articleId,
      'ID_Poste': int.tryParse(posteId) ?? posteId,
      'Code_defaut': codeDefaut,
      'Date_defaut': date,
      'Heure_defaut': hour,
      'Code_article': articleCode,
      'Description_defaut': descriptionDefaut,
      'Quantite_concernee': quantite,
      'Quantite_defaut': quantite,
      'ID_Operateur': int.tryParse(operateurId) ?? operateurId,
      'ID_Enregistreur': int.tryParse(enregistreurId) ?? enregistreurId,
      'Commentaire': 'Saisie mobile - semaine $semaineId',
    };
  }

  @override
  List<Object?> get props => [
        posteId,
        semaineId,
        articleId,
        articleCode,
        operateurId,
        codeDefaut,
        descriptionDefaut,
        quantite,
        dateEnregistrement,
        enregistreurId,
      ];
}
