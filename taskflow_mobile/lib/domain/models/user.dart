import 'package:equatable/equatable.dart';

enum UserRole { operator, technician, admin }

class User extends Equatable {
  const User({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
    this.avatarUrl,
    this.matricule,
    this.site,
  });

  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final UserRole role;
  final String? avatarUrl;
  final String? matricule;
  final String? site;

  String get fullName => '$firstName $lastName'.trim();

  factory User.fromJson(Map<String, dynamic> json) {
    final rolesRaw = json['roles'];
    final roleCode = switch (rolesRaw) {
      List<dynamic> roles when roles.isNotEmpty =>
        (roles.first as Map<String, dynamic>?)?['Code_role'] ??
            (roles.first as Map<String, dynamic>?)?['code_role'],
      _ => json['role'] ?? json['Role']
    };

    final role = _parseRole(roleCode?.toString());

    final email = (json['email'] ?? json['Email'] ?? '').toString();
    final profileName =
        (json['nom_prenom'] ?? json['Nom_prenom'] ?? '').toString();
    final firstName =
        (json['firstName'] ?? json['first_name'] ?? '').toString();
    final lastName = (json['lastName'] ?? json['last_name'] ?? '').toString();

    final split = _splitName(profileName);

    return User(
      id: (json['id'] ?? json['ID'] ?? '').toString(),
      email: email,
      firstName: firstName.isNotEmpty ? firstName : split.$1,
      lastName: lastName.isNotEmpty ? lastName : split.$2,
      role: role,
      avatarUrl: (json['avatarUrl'] ?? json['avatar_url'])?.toString(),
      matricule: (json['matricule'] ?? json['Matricule'])?.toString(),
      site:
          (json['site'] ?? json['site_affectation'] ?? json['Site_affectation'])
              ?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'firstName': firstName,
      'lastName': lastName,
      'role': role.name,
      'avatarUrl': avatarUrl,
      'matricule': matricule,
      'site': site,
    };
  }

  @override
  List<Object?> get props {
    return [id, email, firstName, lastName, role, avatarUrl, matricule, site];
  }

  @override
  String toString() {
    return 'User(id: $id, email: $email, fullName: $fullName, role: ${role.name})';
  }

  static UserRole _parseRole(String? roleCode) {
    final raw = roleCode?.toLowerCase() ?? '';
    if (raw.contains('tech')) {
      return UserRole.technician;
    }
    if (raw.contains('admin')) {
      return UserRole.admin;
    }
    return UserRole.operator;
  }

  static (String, String) _splitName(String fullName) {
    final tokens = fullName
        .trim()
        .split(RegExp(r'\s+'))
        .where((e) => e.isNotEmpty)
        .toList();
    if (tokens.isEmpty) {
      return ('', '');
    }
    if (tokens.length == 1) {
      return (tokens.first, '');
    }
    return (tokens.first, tokens.sublist(1).join(' '));
  }
}
