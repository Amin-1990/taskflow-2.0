import 'package:equatable/equatable.dart';

import 'user.dart';

class AuthResult extends Equatable {
  const AuthResult({
    required this.user,
    required this.token,
    required this.refreshToken,
    required this.expiresAt,
  });

  final User user;
  final String token;
  final String refreshToken;
  final DateTime expiresAt;

  bool get isExpired => DateTime.now().isAfter(expiresAt);

  Duration get timeUntilExpiry => expiresAt.difference(DateTime.now());

  @override
  List<Object?> get props => [user, token, refreshToken, expiresAt];
}
