import 'package:equatable/equatable.dart';

class Article extends Equatable {
  const Article({
    required this.id,
    required this.code,
    required this.name,
    this.client,
  });

  final String id;
  final String code;
  final String name;
  final String? client;

  factory Article.fromJson(Map<String, dynamic> json) {
    final code = (json['code'] ??
            json['Code'] ??
            json['Code_article'] ??
            json['Article_code'] ??
            '')
        .toString();
    final name =
        (json['name'] ?? json['Nom'] ?? json['Description'] ?? code).toString();
    return Article(
      id: (json['id'] ?? json['ID'] ?? '').toString(),
      code: code,
      name: name,
      client: (json['client'] ?? json['Client'])?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {'id': id, 'code': code, 'name': name, 'client': client};
  }

  @override
  List<Object?> get props => [id, code, name, client];
}
