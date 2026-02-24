import 'package:equatable/equatable.dart';

class ArticleLot extends Equatable {
  const ArticleLot({
    required this.commandeId,
    required this.codeArticle,
    required this.lot,
    this.articleId,
  });

  final String commandeId;
  final String codeArticle;
  final String lot;
  final String? articleId;

  /// Format: "AL-9920-X | LOT-A" ou "AL-9920-X | Sans Lot"
  String get displayLabel => '$codeArticle | $lot';

  factory ArticleLot.fromJson(Map<String, dynamic> json) {
    return ArticleLot(
      commandeId: (json['commandeId'] ?? json['ID'] ?? '').toString(),
      codeArticle: (json['codeArticle'] ?? json['Code_article'] ?? '').toString(),
      lot: (json['lot'] ?? json['Lot'] ?? 'Sans Lot').toString(),
      articleId: json['articleId']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'commandeId': commandeId,
        'codeArticle': codeArticle,
        'lot': lot,
        'articleId': articleId,
      };

  @override
  List<Object?> get props => [commandeId, codeArticle, lot, articleId];
}
