import 'package:equatable/equatable.dart';

import '../../core/services/timezone_service.dart';
import 'maintenance_machine.dart';

enum InterventionStatus { enAttente, affectee, enCours, terminee, annulee }

enum InterventionPriority { basse, moyenne, haute }

class Intervention extends Equatable {
  const Intervention({
    required this.id,
    required this.machine,
    required this.typePanne,
    required this.description,
    required this.priority,
    required this.status,
    required this.dateDemande,
    this.datePrise,
    this.dateDebut,
    this.dateFin,
    this.technicienId,
    this.technicienNom,
    this.demandeurId,
  });

  final String id;
  final MaintenanceMachine machine;
  final String typePanne;
  final String description;
  final InterventionPriority priority;
  final InterventionStatus status;
  final DateTime dateDemande;
  final DateTime? datePrise;
  final DateTime? dateDebut;
  final DateTime? dateFin;
  final String? technicienId;
  final String? technicienNom;
  final String? demandeurId;
  String get machineDisplay =>
      machine.display.isNotEmpty ? machine.display : machine.name;
  String get shortDescription =>
      description.trim().isEmpty ? typePanne : description.trim();

  factory Intervention.fromJson(Map<String, dynamic> json,
      {MaintenanceMachine? fallbackMachine}) {
    final machine = fallbackMachine ?? MaintenanceMachine.fromJson(json);
    final rawType =
        (json['Nom_defaut'] ?? json['typePanne'] ?? json['Type_panne'] ?? '')
            .toString();
    final rawDescription = (json['Description_panne'] ??
            json['Description_probleme'] ??
            json['description'] ??
            '')
        .toString();
    final techId = (json['ID_Technicien'] ?? '').toString();
    final techName = (json['Technicien_nom'] ?? '').toString();
    final demandeur = (json['Demandeur'] ?? '').toString();
    return Intervention(
      id: (json['ID'] ?? json['id'] ?? '').toString(),
      machine: machine,
      typePanne: rawType,
      description: rawDescription,
      priority: _priorityFromApi((json['Priorite'] ?? 'NORMALE').toString()),
      status: _statusFromApi((json['Statut'] ?? 'EN_ATTENTE').toString()),
      dateDemande: TimezoneService.parseServerDateTime(
              (json['Date_heure_demande'] ?? json['dateDemande'] ?? '')
                  .toString()) ??
          TimezoneService.now(),
      datePrise: TimezoneService.parseServerDateTime(
          (json['Date_heure_affectation'] ?? '').toString()),
      dateDebut:
          TimezoneService.parseServerDateTime((json['Date_heure_debut'] ?? '').toString()),
      dateFin:
          TimezoneService.parseServerDateTime((json['Date_heure_fin'] ?? '').toString()),
      technicienId: techId.isEmpty ? null : techId,
      technicienNom: techName.isEmpty ? null : techName,
      demandeurId: demandeur.isEmpty ? null : demandeur,
    );
  }

  Intervention copyWith({
    MaintenanceMachine? machine,
    String? typePanne,
    String? description,
    InterventionPriority? priority,
    InterventionStatus? status,
    DateTime? datePrise,
    DateTime? dateDebut,
    DateTime? dateFin,
    String? technicienId,
    String? technicienNom,
  }) {
    return Intervention(
      id: id,
      machine: machine ?? this.machine,
      typePanne: typePanne ?? this.typePanne,
      description: description ?? this.description,
      priority: priority ?? this.priority,
      status: status ?? this.status,
      dateDemande: dateDemande,
      datePrise: datePrise ?? this.datePrise,
      dateDebut: dateDebut ?? this.dateDebut,
      dateFin: dateFin ?? this.dateFin,
      technicienId: technicienId ?? this.technicienId,
      technicienNom: technicienNom ?? this.technicienNom,
      demandeurId: demandeurId,
    );
  }

  @override
  List<Object?> get props => [
        id,
        machine,
        typePanne,
        description,
        priority,
        status,
        dateDemande,
        datePrise,
        dateDebut,
        dateFin,
        technicienId,
        technicienNom,
        demandeurId,
      ];

  static InterventionStatus _statusFromApi(String status) {
    switch (status.toUpperCase()) {
      case 'AFFECTEE':
        return InterventionStatus.affectee;
      case 'EN_COURS':
        return InterventionStatus.enCours;
      case 'TERMINEE':
        return InterventionStatus.terminee;
      case 'ANNULEE':
        return InterventionStatus.annulee;
      default:
        return InterventionStatus.enAttente;
    }
  }

  static InterventionPriority _priorityFromApi(String priority) {
    switch (priority.toUpperCase()) {
      case 'HAUTE':
      case 'URGENTE':
        return InterventionPriority.haute;
      case 'BASSE':
        return InterventionPriority.basse;
      default:
        return InterventionPriority.moyenne;
    }
  }
}
