import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tz_data;

/// Service centralisé pour la gestion des timezones
/// Assure la cohérence avec le timezone défini en backend (DB_TIMEZONE)
class TimezoneService {
  static late tz.Location _appTimezone;
  static const String _appTimezoneString = 'Africa/Lagos'; // UTC+1 equivalent

  /// Initialise le service timezone au démarrage de l'app
  static Future<void> initialize() async {
    try {
      tz_data.initializeTimeZones();
      _appTimezone = tz.getLocation(_appTimezoneString);
    } catch (e) {
      print('❌ Erreur initialisation TimezoneService: $e');
      rethrow;
    }
  }

  /// Retourne l'heure actuelle dans le timezone configuré
  static DateTime now() {
    final now = tz.TZDateTime.now(_appTimezone);
    return now;
  }

  /// Convertit une date UTC en date locale (timezone de l'usine)
  static DateTime utcToLocal(DateTime utcDate) {
    final utc = tz.TZDateTime.from(utcDate, tz.UTC);
    return utc.toLocal();
  }

  /// Convertit une date locale en date UTC
  static DateTime localToUtc(DateTime localDate) {
    return localDate.toUtc();
  }

  /// Parse une date/heure depuis le serveur (format ISO)
  static DateTime? parseServerDateTime(String? dateString) {
    if (dateString == null || dateString.isEmpty) {
      return null;
    }

    try {
      // Supporte les formats: YYYY-MM-DD, YYYY-MM-DD HH:mm:ss, ISO 8601
      final parsed = DateTime.tryParse(dateString);
      if (parsed == null) {
        return null;
      }

      // Si la date est en UTC, la convertir au timezone local
      if (parsed.isUtc) {
        return parsed.toLocal();
      }

      return parsed;
    } catch (e) {
      print('❌ Erreur parsing date: $e');
      return null;
    }
  }

  /// Formate une date pour l'affichage (YYYY-MM-DD)
  static String formatDate(DateTime date) {
    final year = date.year;
    final month = date.month.toString().padLeft(2, '0');
    final day = date.day.toString().padLeft(2, '0');
    return '$year-$month-$day';
  }

  /// Formate une date/heure pour l'affichage (YYYY-MM-DD HH:mm:ss)
  static String formatDateTime(DateTime date) {
    final year = date.year;
    final month = date.month.toString().padLeft(2, '0');
    final day = date.day.toString().padLeft(2, '0');
    final hour = date.hour.toString().padLeft(2, '0');
    final minute = date.minute.toString().padLeft(2, '0');
    final second = date.second.toString().padLeft(2, '0');
    return '$year-$month-$day $hour:$minute:$second';
  }

  /// Formate seulement l'heure (HH:mm:ss)
  static String formatTime(DateTime date) {
    final hour = date.hour.toString().padLeft(2, '0');
    final minute = date.minute.toString().padLeft(2, '0');
    final second = date.second.toString().padLeft(2, '0');
    return '$hour:$minute:$second';
  }

  /// Retourne le décalage horaire en heures
  static double getTimezoneOffset() {
    final now = tz.TZDateTime.now(_appTimezone);
    return now.timeZoneOffset.inHours.toDouble();
  }

  /// Obtient le nom du timezone configuré
  static String getTimezoneName() {
    return _appTimezoneString;
  }
}
