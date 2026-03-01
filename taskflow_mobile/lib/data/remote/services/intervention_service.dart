import 'package:dio/dio.dart';

import '../../../core/services/timezone_service.dart';
import '../../../domain/models/intervention.dart';
import '../../../domain/models/maintenance_machine.dart';
import '../../../domain/models/type_machine.dart';
import '../../../domain/models/type_panne.dart';

class InterventionService {
  InterventionService(this._dio);

  final Dio _dio;

  Future<List<TypeMachine>> getTypeMachines() async {
    final response = await _dio.get<Map<String, dynamic>>('/api/types-machine');
    final body = response.data ?? <String, dynamic>{};
    final data = body['data'];
    if (data is! List) {
      return const [];
    }
    return data
        .whereType<Map<String, dynamic>>()
        .map(TypeMachine.fromJson)
        .toList();
  }

  Future<List<MaintenanceMachine>> getMachines() async {
    final response = await _dio.get<Map<String, dynamic>>('/api/machines');
    final body = response.data ?? <String, dynamic>{};
    final data = body['data'];
    if (data is! List) {
      return const [];
    }
    return data
        .whereType<Map<String, dynamic>>()
        .map(MaintenanceMachine.fromJson)
        .toList();
  }

  Future<List<TypePanne>> getTypePannes() async {
    final response =
        await _dio.get<Map<String, dynamic>>('/api/defauts-type-machine');
    final body = response.data ?? <String, dynamic>{};
    final data = body['data'];
    if (data is! List) {
      return const [];
    }
    return data
        .whereType<Map<String, dynamic>>()
        .map(TypePanne.fromJson)
        .toList();
  }

  Future<Intervention> createIntervention({
    required String typeMachineId,
    required String machineId,
    required String demandeurId,
    required String typePanneId,
    required String description,
    required InterventionPriority priority,
  }) async {
    final now = TimezoneService.now();
    final formattedDate = '${now.year.toString().padLeft(4, '0')}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}T${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}:${now.second.toString().padLeft(2, '0')}';
    
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/interventions',
      data: {
        'ID_Type_machine': typeMachineId,
        'ID_Machine': machineId,
        'ID_Defaut': typePanneId,
        'Demandeur': demandeurId,
        'Description_panne': description,
        'Description_probleme': description,
        'Date_heure_demande': formattedDate,
        'Priorite': _priorityToApi(priority),
      },
    );

    final body = response.data ?? <String, dynamic>{};
    final data = (body['data'] as Map<String, dynamic>?) ?? body;
    return Intervention.fromJson(data);
  }

  Future<List<Intervention>> getInterventions() async {
    final response = await _dio.get<Map<String, dynamic>>('/api/interventions');
    final body = response.data ?? <String, dynamic>{};
    final data = body['data'];
    if (data is! List) {
      return const [];
    }
    return data
        .whereType<Map<String, dynamic>>()
        .map(Intervention.fromJson)
        .toList();
  }

  Future<Intervention> affectIntervention({
    required String interventionId,
    required String technicianId,
  }) async {
    final response = await _dio.patch<Map<String, dynamic>>(
      '/api/interventions/$interventionId/affecter',
      data: {'ID_Technicien': technicianId},
    );
    final body = response.data ?? <String, dynamic>{};
    final data = (body['data'] as Map<String, dynamic>?) ?? body;
    return Intervention.fromJson(data);
  }

  Future<Intervention> startIntervention(String interventionId) async {
    final response = await _dio.patch<Map<String, dynamic>>(
        '/api/interventions/$interventionId/demarrer');
    final body = response.data ?? <String, dynamic>{};
    final data = (body['data'] as Map<String, dynamic>?) ?? body;
    return Intervention.fromJson(data);
  }

  Future<Intervention> finishIntervention({
    required String interventionId,
    String? commentaire,
  }) async {
    final response = await _dio.patch<Map<String, dynamic>>(
      '/api/interventions/$interventionId/terminer',
      data: commentaire == null || commentaire.trim().isEmpty
          ? null
          : {'Commentaire': commentaire.trim()},
    );
    final body = response.data ?? <String, dynamic>{};
    final data = (body['data'] as Map<String, dynamic>?) ?? body;
    return Intervention.fromJson(data);
  }

  Future<bool> registerFcmToken(String token) async {
    final payload = {'token': token};
    try {
      await _dio.post('/api/auth/fcm-token', data: payload);
      return true;
    } catch (_) {
      try {
        await _dio.post('/api/notifications/token', data: payload);
        return true;
      } catch (_) {
        return false;
      }
    }
  }

  Future<bool> unregisterFcmToken(String token) async {
    final payload = {'token': token};
    try {
      await _dio.post('/api/auth/fcm-token/unregister', data: payload);
      return true;
    } catch (_) {
      try {
        await _dio.post('/api/notifications/token/unregister', data: payload);
        return true;
      } catch (_) {
        return false;
      }
    }
  }

  String _priorityToApi(InterventionPriority priority) {
    switch (priority) {
      case InterventionPriority.urgente:
        return 'URGENTE';
      case InterventionPriority.haute:
        return 'HAUTE';
      case InterventionPriority.normale:
      case InterventionPriority.moyenne:
        return 'NORMALE';
      case InterventionPriority.basse:
        return 'BASSE';
    }
  }
}
