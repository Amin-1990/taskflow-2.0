import 'package:equatable/equatable.dart';

import '../../core/services/timezone_service.dart';
import 'user.dart';

class UserContext extends Equatable {
  const UserContext({
    required this.firstName,
    required this.lastName,
    required this.line,
    required this.shift,
    required this.lastSync,
    required this.isOnline,
  });

  final String firstName;
  final String lastName;
  final String line;
  final String shift;
  final DateTime lastSync;
  final bool isOnline;

  String get fullName => '$firstName $lastName'.trim();

  factory UserContext.fromUser(User user,
      {DateTime? lastSync, bool isOnline = true}) {
    return UserContext(
      firstName: user.firstName,
      lastName: user.lastName,
      line: user.site?.isNotEmpty == true ? user.site! : 'Ligne A',
      shift: 'Shift 1',
      lastSync: lastSync ?? TimezoneService.now(),
      isOnline: isOnline,
    );
  }

  factory UserContext.fromJson(Map<String, dynamic> json) {
    return UserContext(
      firstName: (json['firstName'] ?? json['first_name'] ?? '').toString(),
      lastName: (json['lastName'] ?? json['last_name'] ?? '').toString(),
      line: (json['line'] ?? json['ligne'] ?? 'Ligne A').toString(),
      shift: (json['shift'] ?? 'Shift 1').toString(),
      lastSync: TimezoneService.parseServerDateTime(
              (json['lastSync'] ?? json['last_sync'] ?? '').toString()) ??
          TimezoneService.now(),
      isOnline: (json['isOnline'] ?? json['is_online']) == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'firstName': firstName,
      'lastName': lastName,
      'line': line,
      'shift': shift,
      'lastSync': lastSync.toIso8601String(),
      'isOnline': isOnline,
    };
  }

  @override
  List<Object?> get props =>
      [firstName, lastName, line, shift, lastSync, isOnline];
}
