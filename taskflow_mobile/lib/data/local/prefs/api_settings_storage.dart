import 'package:shared_preferences/shared_preferences.dart';

class ApiSettingsStorage {
  ApiSettingsStorage._();

  static const String baseUrlKey = 'api_base_url';

  static Future<String?> getBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(baseUrlKey);
  }

  static Future<void> saveBaseUrl(String baseUrl) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(baseUrlKey, baseUrl);
  }
}
