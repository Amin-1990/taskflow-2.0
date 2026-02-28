const db = require('../config/database');
const importService = require('../services/import.service');
const affectationService = require('../services/affectation.service');
const { logAction } = require('../services/audit.service');
const { formatDateForAPI, formatDateTimeForDB, utcToLocal } = require('../utils/datetime');

class ImportController {

  /**
   * Template commandes
   */
  async getTemplateCommandes(req, res) {
    try {
      const columns = [
        { header: 'Echéance de Début', key: 'date_debut', width: 22, example: '2026-03-18 08:00:00' },
        { header: 'Article/Référence interne', key: 'code_article', width: 24, example: 'ART001' },
        { header: "Numero d'ordre", key: 'lot', width: 18, example: 'ORD-001' },
        { header: 'Quantité à produire', key: 'quantite', width: 18, example: '500' },
        { header: 'Origine', key: 'origine', width: 20, example: 'Prévision client' },
        { header: 'Priorité', key: 'priorite', width: 12, example: 'normale' },
        { header: 'Unité de production/Nom', key: 'unite_production', width: 24, example: 'Unite 1' }
      ];

      const buffer = await importService.generateTemplate(columns, 'Commandes');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=template_commandes.xlsx');
      res.send(buffer);

    } catch (error) {
      console.error('Erreur template commandes:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Template planning hebdomadaire
   */
  async getTemplatePlanning(req, res) {
    try {
      const columns = [
        { header: 'Semaine', key: 'semaine', width: 12, example: 'S10' },
        { header: 'Code article', key: 'code_article', width: 18, example: 'REF-A23' },
        { header: 'Lot', key: 'lot', width: 14, example: 'L2478' },
        { header: 'Date debut planification', key: 'date_debut_planification', width: 20, example: '2026-03-03' },
        { header: 'Identifiant lot', key: 'identifiant_lot', width: 18, example: 'L2478-2026' },
        { header: 'Quantite facturee semaine', key: 'quantite_facturee_semaine', width: 24, example: '400' },
        { header: 'Lundi planifie', key: 'lundi_planifie', width: 14, example: '100' },
        { header: 'Lundi emballe', key: 'lundi_emballe', width: 14, example: '0' },
        { header: 'Mardi planifie', key: 'mardi_planifie', width: 14, example: '100' },
        { header: 'Mardi emballe', key: 'mardi_emballe', width: 14, example: '0' },
        { header: 'Mercredi planifie', key: 'mercredi_planifie', width: 16, example: '100' },
        { header: 'Mercredi emballe', key: 'mercredi_emballe', width: 16, example: '0' },
        { header: 'Jeudi planifie', key: 'jeudi_planifie', width: 14, example: '100' },
        { header: 'Jeudi emballe', key: 'jeudi_emballe', width: 14, example: '0' },
        { header: 'Vendredi planifie', key: 'vendredi_planifie', width: 16, example: '0' },
        { header: 'Vendredi emballe', key: 'vendredi_emballe', width: 16, example: '0' },
        { header: 'Samedi planifie', key: 'samedi_planifie', width: 14, example: '0' },
        { header: 'Samedi emballe', key: 'samedi_emballe', width: 14, example: '0' },
        { header: 'Stock actuel', key: 'stock_actuel', width: 12, example: '800' },
        { header: 'Stock emballe precedent', key: 'stock_emballe_precedent', width: 22, example: '0' },
        { header: 'Commentaire', key: 'commentaire', width: 30, example: 'Import planning' }
      ];

      const buffer = await importService.generateTemplate(columns, 'Planning');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=template_planning.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error('Erreur template planning:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
    * Template affectations
    */
  async getTemplateAffectations(req, res) {
    try {
      const columns = [
        { header: 'Code_article', key: 'code_article', width: 18, example: 'ART-001' },
        { header: 'Lot', key: 'lot', width: 14, example: 'L001' },
        { header: 'Matricule', key: 'matricule', width: 14, example: 'EMP001' },
        { header: 'Poste_description', key: 'poste_description', width: 22, example: 'Assemblage' },
        { header: 'Date_debut', key: 'date_debut', width: 22, example: '2026-02-21 08:00:00' },
        { header: 'Date_fin', key: 'date_fin', width: 22, example: '2026-02-21 17:00:00' },
        { header: 'Heure_supp', key: 'heure_supp', width: 12, example: '0' },
        { header: 'Quantite_produite', key: 'quantite_produite', width: 18, example: '50' }
      ];

      const buffer = await importService.generateTemplate(columns, 'Affectations');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=template_affectations_simplifie.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error('Erreur template affectations:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
    * Template semaines
    */
  async getTemplateSemaines(req, res) {
    try {
      const columns = [
        { header: 'Code semaine', key: 'code_semaine', width: 15, example: 'S01' },
        { header: 'NumÃ©ro semaine', key: 'numero_semaine', width: 15, example: '1' },
        { header: 'AnnÃ©e', key: 'annee', width: 12, example: '2026' },
        { header: 'Mois', key: 'mois', width: 10, example: '1' },
        { header: 'Date dÃ©but', key: 'date_debut', width: 15, example: '2026-01-01' },
        { header: 'Date fin', key: 'date_fin', width: 15, example: '2026-01-07' }
      ];

      const buffer = await importService.generateTemplate(columns, 'Semaines');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=template_semaines.xlsx');
      res.send(buffer);

    } catch (error) {
      console.error('Erreur template semaines:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
    * Template personnel
    */
  async getTemplatePersonnel(req, res) {
    try {
      const columns = [
        { header: 'Nom_prenom', key: 'nom_prenom', width: 25, example: 'Jean Martin' },
        { header: 'Matricule', key: 'matricule', width: 14, example: 'EMP001' },
        { header: 'Qr_code', key: 'qr_code', width: 20, example: 'QR-EMP001' },
        { header: 'Date_embauche', key: 'date_embauche', width: 15, example: '2024-01-15' },
        { header: 'Email', key: 'email', width: 28, example: 'jean.martin@taskflow.tn' },
        { header: 'Date_naissance', key: 'date_naissance', width: 15, example: '1995-06-10' },
        { header: 'Adresse', key: 'adresse', width: 30, example: 'Rue 1, Tunis' },
        { header: 'Ville', key: 'ville', width: 16, example: 'Tunis' },
        { header: 'Code_postal', key: 'code_postal', width: 14, example: '1000' },
        { header: 'Telephone', key: 'telephone', width: 16, example: '98765432' },
        { header: 'Poste', key: 'poste', width: 18, example: 'Operateur' },
        { header: 'Statut', key: 'statut', width: 12, example: 'actif' },
        { header: 'Type_contrat', key: 'type_contrat', width: 14, example: 'CDI' },
        { header: 'Date_fin_contrat', key: 'date_fin_contrat', width: 18, example: '' },
        { header: 'Site_affectation', key: 'site_affectation', width: 20, example: 'Unite 1' },
        { header: 'Numero_CNSS', key: 'numero_cnss', width: 18, example: 'CNSS123456' },
        { header: 'Commentaire', key: 'commentaire', width: 35, example: 'Import initial' }
      ];

      const buffer = await importService.generateTemplate(columns, 'Personnel');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=template_personnel.xlsx');
      res.send(buffer);

    } catch (error) {
      console.error('Erreur template personnel:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Template defauts produit
   */
  async getTemplateDefautsProduit(req, res) {
    try {
      const columns = [
        { header: 'Code defaut', key: 'code_defaut', width: 20, example: 'DF-001' },
        { header: 'Description', key: 'description', width: 40, example: 'Rayure sur surface' },
        { header: 'Cout minimum', key: 'cout_min', width: 15, example: '5.50' },
        { header: 'Commentaire', key: 'commentaire', width: 40, example: 'Verifier poste finition' }
      ];

      const buffer = await importService.generateTemplate(columns, 'Defauts Produit');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=template_defauts_produit.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error('Erreur template defauts produit:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Template defauts process
   */
  async getTemplateDefautsProcess(req, res) {
    try {
      const columns = [
        { header: 'Date defaut', key: 'date_defaut', width: 18, example: '2026-02-17 08:30:00' },
        { header: 'ID Article', key: 'id_article', width: 12, example: '1' },
        { header: 'Code article', key: 'code_article', width: 20, example: 'ART-001' },
        { header: 'Code defaut', key: 'code_defaut', width: 20, example: 'DF-001' },
        { header: 'Description defaut', key: 'description_defaut', width: 40, example: 'Rayure detectee au controle final' },
        { header: 'ID Poste', key: 'id_poste', width: 10, example: '2' },
        { header: 'Gravite', key: 'gravite', width: 14, example: 'Majeure' },
        { header: 'Quantite concernee', key: 'quantite_concernee', width: 18, example: '10' },
        { header: 'Impact production', key: 'impact_production', width: 18, example: '15' },
        { header: 'Commentaire', key: 'commentaire', width: 40, example: 'Arret partiel ligne 2' }
      ];

      const buffer = await importService.generateTemplate(columns, 'Defauts Process');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=template_defauts_process.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error('Erreur template defauts process:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Template horaires
   */
  async getTemplateHoraires(req, res) {
    try {
      const columns = [
        { header: 'Date', key: 'date', width: 14, example: '2026-02-17' },
        { header: 'Jour semaine', key: 'jour_semaine', width: 14, example: 'Mardi' },
        { header: 'Heure debut', key: 'heure_debut', width: 12, example: '08:00:00' },
        { header: 'Heure fin', key: 'heure_fin', width: 12, example: '17:00:00' },
        { header: 'Pause debut', key: 'pause_debut', width: 12, example: '12:00:00' },
        { header: 'Pause fin', key: 'pause_fin', width: 12, example: '13:00:00' },
        { header: 'Heure supp debut', key: 'heure_supp_debut', width: 15, example: '17:30:00' },
        { header: 'Heure supp fin', key: 'heure_supp_fin', width: 13, example: '19:00:00' },
        { header: 'Est ouvert', key: 'est_ouvert', width: 10, example: '1' },
        { header: 'Est jour ferie', key: 'est_jour_ferie', width: 14, example: '0' },
        { header: 'Type chome', key: 'type_chome', width: 18, example: 'non_chome' },
        { header: 'Description', key: 'description', width: 30, example: 'Horaire normal' },
        { header: 'Commentaire', key: 'commentaire', width: 35, example: 'RAS' }
      ];

      const buffer = await importService.generateTemplate(columns, 'Horaires');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=template_horaires.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error('Erreur template horaires:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Template types machine
   */
  async getTemplateTypesMachine(req, res) {
    try {
      const columns = [
        { header: 'Type machine', key: 'type_machine', width: 35, example: 'Presse hydraulique' }
      ];

      const buffer = await importService.generateTemplate(columns, 'Types Machine');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=template_types_machine.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error('Erreur template types machine:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Template defauts type machine
   */
  async getTemplateDefautsTypeMachine(req, res) {
    try {
      const columns = [
        { header: 'Type_machine', key: 'type_machine', width: 30, example: 'Presse hydraulique' },
        { header: 'Code_defaut', key: 'code_defaut', width: 18, example: 'DF-TM-001' },
        { header: 'Nom_defaut', key: 'nom_defaut', width: 28, example: 'Surchauffe moteur' },
        { header: 'Description_defaut', key: 'description_defaut', width: 40, example: 'Temperature anormale du moteur principal' }
      ];

      const buffer = await importService.generateTemplate(columns, 'Defauts Type Machine');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=template_defauts_type_machine.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error('Erreur template defauts type machine:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Template machines
   */
  async getTemplateMachines(req, res) {
    try {
      const columns = [
        { header: 'Code', key: 'code', width: 18, example: 'MCH-001' },
        { header: 'Nom', key: 'nom', width: 28, example: 'Presse hydraulique A' },
        { header: 'Type machine', key: 'type_machine', width: 28, example: 'Presse hydraulique' },
        { header: 'Statut operationnel', key: 'statut_operationnel', width: 20, example: 'operationnel' },
        { header: 'Site affectation', key: 'site_affectation', width: 22, example: 'Unite 1' },
        { header: 'Date installation', key: 'date_installation', width: 18, example: '2024-01-20' },
        { header: 'Numero serie', key: 'numero_serie', width: 20, example: 'SN-12345' },
        { header: 'Description', key: 'description', width: 34, example: 'Machine principale ligne 1' },
        { header: 'Notes', key: 'notes', width: 34, example: 'Controle trimestriel' }
      ];

      const buffer = await importService.generateTemplate(columns, 'Machines');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=template_machines.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error('Erreur template machines:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Template interventions
   */
  async getTemplateInterventions(req, res) {
    try {
      const columns = [
        { header: 'Type machine', key: 'type_machine', width: 28, example: 'Presse hydraulique' },
        { header: 'Code machine', key: 'code_machine', width: 18, example: 'MCH-001' },
        { header: 'Demandeur ID', key: 'demandeur_id', width: 14, example: '1' },
        { header: 'Description panne', key: 'description_panne', width: 40, example: 'Arret soudain de la machine' },
        { header: 'Priorite', key: 'priorite', width: 12, example: 'NORMALE' },
        { header: 'Impact production', key: 'impact_production', width: 18, example: 'Partiel' },
        { header: 'Statut', key: 'statut', width: 14, example: 'EN_ATTENTE' },
        { header: 'Technicien ID', key: 'technicien_id', width: 14, example: '' },
        { header: 'Commentaire', key: 'commentaire', width: 30, example: 'Controle urgent' }
      ];

      const buffer = await importService.generateTemplate(columns, 'Interventions');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=template_interventions.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error('Erreur template interventions:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Template pointage (XLSX)
   */
  async getTemplatePointage(req, res) {
    try {
      const columns = [
        { header: 'Matricule.', key: 'matricule', width: 14, example: '33' },
        { header: 'Nom.', key: 'nom', width: 28, example: 'Abdelaoui Sabrine' },
        { header: 'Date.', key: 'date', width: 14, example: '19/02/2026' },
        { header: 'Début.', key: 'debut', width: 12, example: '07:30' },
        { header: 'Fin.', key: 'fin', width: 12, example: '15:30' },
        { header: 'Entrée.', key: 'entree', width: 12, example: '07:35' },
        { header: 'Sortie.', key: 'sortie', width: 12, example: '16:58' },
        { header: 'Retard.', key: 'retard', width: 14, example: '00:05' },
        { header: 'Départ anticipé.', key: 'depart_anticipe', width: 16, example: '' },
        { header: 'Absent.', key: 'absent', width: 10, example: 'False' },
        { header: 'H Sup.', key: 'h_sup', width: 10, example: '0' },
        { header: 'Présence Planning.', key: 'presence_planning', width: 18, example: '08:00' },
        { header: 'Département', key: 'departement', width: 16, example: 'Cadre' },
        { header: 'Présence réelle.', key: 'presence_reelle', width: 16, example: '09:23' },
        { header: 'Commentaire', key: 'commentaire', width: 30, example: 'Import RH' }
      ];

      const buffer = await importService.generateTemplate(columns, 'Pointage');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=template_pointage.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error('Erreur template pointage:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Import pointage depuis fichier XLSX/CSV
   * Upsert par couple (ID_Personnel, Date)
   */
  async importPointage(req, res) {
    const connection = await db.getConnection();

    const normalizeKey = (key) =>
      String(key || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

    const normalizeRow = (row) => {
      const normalized = {};
      Object.entries(row || {}).forEach(([k, v]) => {
        normalized[normalizeKey(k)] = v;
      });
      return normalized;
    };

    const getCell = (row, keys) => {
      for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
          return row[key];
        }
      }
      return null;
    };

    const isRowEmpty = (row) => Object.values(row || {}).every((value) => {
      if (value === null || value === undefined) return true;
      return String(value).trim() === '';
    });

    const toDateOrNull = (value) => {
      if (value === null || value === undefined || value === '') return null;
      if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return formatDateForAPI(value);
      }
      const raw = String(value).trim();
      const ymd = raw.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
      if (ymd) {
        return `${ymd[1]}-${String(Number(ymd[2])).padStart(2, '0')}-${String(Number(ymd[3])).padStart(2, '0')}`;
      }
      const dmy = raw.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
      if (dmy) {
        const yyyy = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
        return `${yyyy}-${String(Number(dmy[2])).padStart(2, '0')}-${String(Number(dmy[1])).padStart(2, '0')}`;
      }
      const parsed = new Date(raw);
      if (!Number.isNaN(parsed.getTime())) return formatDateForAPI(parsed);
      return null;
    };

    const normalizeTime = (value) => {
      if (value === null || value === undefined || value === '') return null;
      if (value instanceof Date && !Number.isNaN(value.getTime())) {
        const hh = String(value.getHours()).padStart(2, '0');
        const mm = String(value.getMinutes()).padStart(2, '0');
        const ss = String(value.getSeconds()).padStart(2, '0');
        return `${hh}:${mm}:${ss}`;
      }
      const raw = String(value).trim();
      const hhmm = raw.match(/^(\d{1,2}):(\d{2})$/);
      if (hhmm) {
        const h = Number(hhmm[1]);
        const m = Number(hhmm[2]);
        if (h <= 23 && m <= 59) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
      }
      const hhmmss = raw.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
      if (hhmmss) {
        const h = Number(hhmmss[1]);
        const m = Number(hhmmss[2]);
        const s = Number(hhmmss[3]);
        if (h <= 23 && m <= 59 && s <= 59) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      }
      return null;
    };

    const parseTimeToSeconds = (value) => {
      const match = /^(\d{2}):(\d{2}):(\d{2})$/.exec(String(value || ''));
      if (!match) return null;
      return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
    };

    const secondsToTime = (seconds) => {
      const safe = Math.max(0, Math.floor(Number(seconds) || 0));
      const h = Math.floor(safe / 3600);
      const m = Math.floor((safe % 3600) / 60);
      const s = safe % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const toTinyInt = (value, defaultValue = 0) => {
      if (value === null || value === undefined || value === '') return defaultValue;
      const raw = String(value).trim().toLowerCase();
      if (['1', 'true', 'oui', 'yes', 'vrai'].includes(raw)) return 1;
      if (['0', 'false', 'non', 'no', 'faux'].includes(raw)) return 0;
      const num = parseInt(raw, 10);
      return Number.isNaN(num) ? defaultValue : (num > 0 ? 1 : 0);
    };

    try {
      await connection.beginTransaction();

      if (!req.file) {
        return res.status(400).json({ error: 'Fichier requis' });
      }

      const data = await importService.readExcel(req.file.buffer);
      const [pointageColumnsRows] = await connection.query('SHOW COLUMNS FROM pointage');
      const pointageColumns = new Set((pointageColumnsRows || []).map((c) => c.Field));

      const errors = [];
      const resultats = [];

      for (let i = 0; i < data.length; i += 1) {
        const rowNumber = i + 2;
        const row = normalizeRow(data[i]);
        if (isRowEmpty(row)) continue;

        const dateValue = toDateOrNull(getCell(row, ['date']));
        const idPersonnelRaw = getCell(row, ['id personnel', 'id_personnel', 'id operateur', 'id_operateur']);
        const matriculeValue = getCell(row, ['matricule']);
        const nomValue = getCell(row, ['nom', 'nom prenom', 'nom_prenom']);

        const absentRaw = getCell(row, ['absent']);
        const absentFlag = toTinyInt(absentRaw, 0) === 1;
        const statutRaw = String(getCell(row, ['statut']) || '').trim().toLowerCase();
        const statut = absentFlag || ['absent', 'abs', 'a'].includes(statutRaw) ? 'absent' : 'present';

        const entreeInput = normalizeTime(getCell(row, ['entree', 'arrivee', 'heure entree', 'heure_entree']));
        const sortieInput = normalizeTime(getCell(row, ['sortie', 'depart', 'heure sortie', 'heure_sortie']));
        const debutInput = normalizeTime(getCell(row, ['debut', 'heure debut', 'heure_debut']));
        const finInput = normalizeTime(getCell(row, ['fin', 'heure fin', 'heure_fin']));
        const retardInput = normalizeTime(getCell(row, ['retard']));
        const departAnticipeInput = normalizeTime(getCell(row, ['depart anticipe', 'depart_anticipe']));
        const presenceReelleInput = normalizeTime(getCell(row, ['presence reelle', 'presence_reelle']));
        const hSupRaw = getCell(row, ['h sup', 'h_sup', 'heures sup']);
        const commentaire = getCell(row, ['commentaire', 'note']);
        const estValide = toTinyInt(getCell(row, ['est valide', 'est_valide']), 0);

        if (!dateValue) {
          errors.push(`Ligne ${rowNumber}: Date valide requise`);
          continue;
        }

        let personnelId = null;
        let matricule = matriculeValue ? String(matriculeValue).trim() : null;
        let nom = nomValue ? String(nomValue).trim() : '';

        if (idPersonnelRaw) {
          const parsed = parseInt(String(idPersonnelRaw), 10);
          if (!Number.isNaN(parsed) && parsed > 0) {
            personnelId = parsed;
          }
        }

        if (!personnelId && matricule) {
          const [pers] = await connection.query(
            'SELECT ID, Nom_prenom FROM personnel WHERE Matricule = ? LIMIT 1',
            [matricule]
          );
          if (pers.length > 0) {
            personnelId = pers[0].ID;
            if (!nom) nom = pers[0].Nom_prenom || '';
          }
        }

        if (!personnelId) {
          errors.push(`Ligne ${rowNumber}: ID_Personnel ou Matricule valide requis`);
          continue;
        }

        if (!matricule || !nom) {
          const [persById] = await connection.query(
            'SELECT Matricule, Nom_prenom FROM personnel WHERE ID = ? LIMIT 1',
            [personnelId]
          );
          if (persById.length > 0) {
            matricule = matricule || persById[0].Matricule;
            nom = nom || persById[0].Nom_prenom || '';
          }
        }

        const [horaire] = await connection.query(
          'SELECT Heure_debut, Heure_fin FROM horaires WHERE Date = ? LIMIT 1',
          [dateValue]
        );
        const debut = debutInput || (horaire[0]?.Heure_debut || '08:00:00');
        const fin = finInput || (horaire[0]?.Heure_fin || '17:00:00');

        let entree = null;
        let sortie = null;
        let absent = 0;
        let retard = null;
        let departAnticipe = null;
        let presenceReelle = '00:00:00';
        let hSup = null;

        if (statut === 'absent') {
          absent = 1;
          retard = retardInput;
          departAnticipe = departAnticipeInput;
          presenceReelle = presenceReelleInput || '00:00:00';
        } else {
          entree = entreeInput;
          sortie = sortieInput;
          absent = 0;

          const entreeSec = parseTimeToSeconds(entree);
          const sortieSec = parseTimeToSeconds(sortie);
          const debutSec = parseTimeToSeconds(debut);
          const finSec = parseTimeToSeconds(fin);

          if (retardInput) {
            retard = retardInput;
          } else if (entreeSec !== null && debutSec !== null && entreeSec > debutSec) {
            retard = secondsToTime(entreeSec - debutSec);
          }
          if (departAnticipeInput) {
            departAnticipe = departAnticipeInput;
          } else if (sortieSec !== null && finSec !== null && sortieSec < finSec) {
            departAnticipe = secondsToTime(finSec - sortieSec);
          }
          if (presenceReelleInput) {
            presenceReelle = presenceReelleInput;
          } else if (entreeSec !== null && sortieSec !== null && sortieSec >= entreeSec) {
            presenceReelle = secondsToTime(sortieSec - entreeSec);
          }
        }

        if (hSupRaw !== null && hSupRaw !== undefined && String(hSupRaw).trim() !== '') {
          const parsedSup = parseFloat(String(hSupRaw).replace(',', '.'));
          hSup = Number.isNaN(parsedSup) ? null : parsedSup;
        }

        const payload = {
          ID_Personnel: personnelId,
          Matricule: matricule || '',
          Nom: nom || '',
          Date: dateValue,
          Debut: debut,
          Fin: fin,
          Entree: entree,
          Sortie: sortie,
          Retard: retard,
          Depart_anticipe: departAnticipe,
          Presence_reelle: presenceReelle,
          H_sup: hSup,
          Absent: absent,
          Commentaire: commentaire ? String(commentaire) : null,
          Est_valide: estValide
        };

        const filteredPayload = Object.fromEntries(
          Object.entries(payload).filter(([k]) => pointageColumns.has(k))
        );

        const [existing] = await connection.query(
          'SELECT ID FROM pointage WHERE ID_Personnel = ? AND Date = ? LIMIT 1',
          [personnelId, dateValue]
        );

        if (existing.length > 0) {
          const updateKeys = Object.keys(filteredPayload).filter((k) => !['ID_Personnel', 'Date'].includes(k));
          if (updateKeys.length > 0) {
            const setClause = updateKeys.map((k) => `${k} = ?`).join(', ');
            const params = updateKeys.map((k) => filteredPayload[k]);
            let sql = `UPDATE pointage SET ${setClause}`;
            if (pointageColumns.has('Date_modification')) {
              sql += ', Date_modification = NOW()';
            }
            sql += ' WHERE ID = ?';
            params.push(existing[0].ID);
            await connection.query(sql, params);
          }
          resultats.push({ ligne: rowNumber, id: existing[0].ID, action: 'updated' });
        } else {
          const insertKeys = Object.keys(filteredPayload);
          const insertValues = insertKeys.map((k) => filteredPayload[k]);
          const placeholders = insertKeys.map(() => '?');

          let sql = `INSERT INTO pointage (${insertKeys.join(', ')}`;
          let valuesSql = `${placeholders.join(', ')}`;
          if (pointageColumns.has('Date_creation')) {
            sql += ', Date_creation';
            valuesSql += ', NOW()';
          }
          sql += `) VALUES (${valuesSql})`;

          const [insert] = await connection.query(sql, insertValues);
          resultats.push({ ligne: rowNumber, id: insert.insertId, action: 'created' });
        }
      }

      if (errors.length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'Erreurs de validation', details: errors });
      }

      await connection.commit();

      await logAction({
        ID_Utilisateur: req.user?.ID,
        Username: req.user?.Username,
        Action: 'IMPORT',
        Table_concernee: 'pointage',
        Nouvelle_valeur: { count: resultats.length }
      });

      return res.json({
        success: true,
        message: `${resultats.length} lignes de pointage importees`,
        data: resultats
      });
    } catch (error) {
      await connection.rollback();
      console.error('Erreur import pointage:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  }

  /**
   * Import commandes
   */
  async importCommandes(req, res) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      if (!req.file) {
        return res.status(400).json({ error: 'Fichier requis' });
      }

      const data = await importService.readExcel(req.file.buffer);
      const errors = [];
      const resultats = [];

      const normalizeKey = (key) =>
        String(key || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, ' ')
          .trim();

      const normalizeRow = (row) => {
        const normalized = {};
        Object.entries(row || {}).forEach(([k, v]) => {
          normalized[normalizeKey(k)] = v;
        });
        return normalized;
      };

      const getCell = (row, keys) => {
        for (const key of keys) {
          if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
            return row[key];
          }
        }
        return null;
      };

      const isRowEmpty = (row) => Object.values(row || {}).every((value) => {
        if (value === null || value === undefined) return true;
        return String(value).trim() === '';
      });

      const toDateOrNull = (value) => {
        if (value === null || value === undefined || value === '') return null;
        if (value instanceof Date && !Number.isNaN(value.getTime())) {
          const yyyy = value.getFullYear();
          const mm = String(value.getMonth() + 1).padStart(2, '0');
          const dd = String(value.getDate()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
        }
        if (typeof value === 'number' && Number.isFinite(value)) {
          if (value > 20000 && value < 80000) {
            const excelEpoch = new Date(Date.UTC(1899, 11, 30));
            const ms = value * 24 * 60 * 60 * 1000;
            return formatDateForAPI(new Date(excelEpoch.getTime() + ms));
          }
          const d = new Date(value);
          if (!Number.isNaN(d.getTime())) return formatDateForAPI(d);
          return null;
        }
        const raw = String(value).trim();
        const numericRaw = raw.replace(',', '.');
        if (/^\d+(\.\d+)?$/.test(numericRaw)) {
          const num = Number(numericRaw);
          if (Number.isFinite(num) && num > 20000 && num < 80000) {
            const excelEpoch = new Date(Date.UTC(1899, 11, 30));
            const ms = num * 24 * 60 * 60 * 1000;
            const d = new Date(excelEpoch.getTime() + ms);
            if (!Number.isNaN(d.getTime())) {
              const yyyy = d.getUTCFullYear();
              const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
              const dd = String(d.getUTCDate()).padStart(2, '0');
              return `${yyyy}-${mm}-${dd}`;
            }
          }
        }

        const ymd = raw.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})(?:[ T].*)?$/);
        if (ymd) {
          const yyyy = ymd[1];
          const mm = String(Number(ymd[2])).padStart(2, '0');
          const dd = String(Number(ymd[3])).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
        }
        const dmy = raw.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})(?:[ T].*)?$/);
        if (dmy) {
          const yyyy = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
          const mm = String(Number(dmy[2])).padStart(2, '0');
          const dd = String(Number(dmy[1])).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
        }
        const d = new Date(raw);
        if (!Number.isNaN(d.getTime())) return formatDateForAPI(d);
        return null;
      };

      const toIntOrNull = (value) => {
        if (value === null || value === undefined || value === '') return null;
        const n = parseInt(String(value).trim(), 10);
        return Number.isNaN(n) ? null : n;
      };

      // Adapter l'INSERT au schema reel de la table commandes
      const [commandeColumnsRows] = await connection.query('SHOW COLUMNS FROM commandes');
      const commandeColumns = new Set(
        (commandeColumnsRows || []).map((c) => String(c.Field || '').toLowerCase())
      );
      const hasPrioriteColumn = commandeColumns.has('priorite');
      const hasUniteProductionColumn = commandeColumns.has('unite_production');

      for (let i = 0; i < data.length; i += 1) {
        const rowNumber = i + 2;
        const row = normalizeRow(data[i]);
        if (isRowEmpty(row)) continue;

        const dateDebut = toDateOrNull(getCell(row, [
          'echeance de debut', 'echeance debut', 'echance de debut',
          'date debut', 'date_debut', 'date d but', 'date'
        ]));
        const codeArticleRaw = getCell(row, [
          'article reference interne', 'article reference',
          'code article', 'code_article'
        ]);
        const quantite = toIntOrNull(getCell(row, [
          'quantite a produire', 'quantite produire',
          'quantite', 'quantité', 'quantit'
        ]));
        const prioriteRaw = getCell(row, ['priorite', 'priorité', 'priorit']);

        const codeArticle = codeArticleRaw ? String(codeArticleRaw).trim() : '';
        const prioriteRawNorm = String(prioriteRaw || 'normale').trim().toLowerCase();
        const prioriteMap = {
          basse: 'basse',
          low: 'basse',
          normale: 'normale',
          normal: 'normale',
          moyenne: 'normale',
          medium: 'normale',
          haute: 'haute',
          high: 'haute',
          urgente: 'urgente',
          urgent: 'urgente'
        };
        const prioriteValue = prioriteMap[prioriteRawNorm] || 'normale';
        const prioritesValides = ['basse', 'normale', 'haute', 'urgente'];
        if (!dateDebut) errors.push(`Ligne ${rowNumber}: Date debut valide requise`);
        if (!codeArticle) errors.push(`Ligne ${rowNumber}: Code article requis`);
        if (!quantite || quantite <= 0) errors.push(`Ligne ${rowNumber}: Quantite valide requise`);
        if (!dateDebut || !codeArticle || !quantite || quantite <= 0 || !prioritesValides.includes(prioriteValue)) continue;

        let semaineId = null;
        const semaineCode = getCell(row, ['semaine', 'code semaine', 'code_semaine']);
        if (semaineCode) {
          const [semaines] = await connection.query(
            'SELECT ID FROM semaines WHERE Code_semaine = ? LIMIT 1',
            [String(semaineCode).trim()]
          );
          semaineId = semaines[0]?.ID || null;
        }

        // Si Semaine absente (ou non trouvée), déduire depuis Date_debut.
        if (!semaineId && dateDebut) {
          const [semainesByDate] = await connection.query(
            `SELECT ID
             FROM semaines
             WHERE ? BETWEEN Date_debut AND Date_fin
             ORDER BY Date_debut DESC
             LIMIT 1`,
            [dateDebut]
          );
          semaineId = semainesByDate[0]?.ID || null;
        }

        const [articles] = await connection.query(
          'SELECT ID FROM articles WHERE Code_article = ? LIMIT 1',
          [codeArticle]
        );

        const lot = getCell(row, ['numero d ordre', 'numero ordre', 'num order', 'lot']) || null;
        const origine = getCell(row, ['origine']) || 'Import Excel';
        const uniteProduction = getCell(row, ['unite de production nom', 'unite production nom', 'unite production', 'unite_production']) || null;

        const insertColumns = ['Date_debut', 'Code_article', 'Lot', 'Quantite', 'Origine'];
        const insertValues = [dateDebut, codeArticle, lot, quantite, origine];

        if (hasPrioriteColumn) {
          insertColumns.push('priorite');
          insertValues.push(prioriteValue);
        }
        if (hasUniteProductionColumn) {
          insertColumns.push('Unite_production');
          insertValues.push(uniteProduction);
        }

        insertColumns.push('ID_Semaine', 'ID_Article', 'Date_creation');
        insertValues.push(semaineId, articles[0]?.ID || null);

        const placeholders = insertColumns.map((col) => (col === 'Date_creation' ? 'NOW()' : '?'));
        const sql = `INSERT INTO commandes (${insertColumns.join(', ')}) VALUES (${placeholders.join(', ')})`;
        const [insert] = await connection.query(sql, insertValues);

        resultats.push({ id: insert.insertId, code: codeArticle });
      }

      if (errors.length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'Erreurs de validation', details: errors });
      }

      await connection.commit();

      // Audit
      await logAction({
        ID_Utilisateur: req.user?.ID,
        Username: req.user?.Username,
        Action: 'IMPORT',
        Table_concernee: 'commandes',
        Nouvelle_valeur: { count: resultats.length }
      });

      res.json({
        success: true,
        message: `${resultats.length} commandes importÃ©es`,
        data: resultats
      });

    } catch (error) {
      await connection.rollback();
      console.error('Erreur import commandes:', error);
      const knownInputError =
        typeof error?.message === 'string' &&
        (
          error.message.includes('Fichier vide') ||
          error.message.includes('Format non supporte') ||
          error.message.includes('en-tetes')
        );
      res.status(knownInputError ? 400 : 500).json({ error: error.message });
    } finally {
      connection.release();
    }
  }

  /**
   * Import planning hebdomadaire
   */
  async importPlanning(req, res) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      if (!req.file) {
        return res.status(400).json({ error: 'Fichier requis' });
      }

      const data = await importService.readExcel(req.file.buffer);

      const schema = {
        'Semaine': { required: true },
        'Code article': { required: true },
        'Lundi planifie': { required: false, type: 'number' },
        'Mardi planifie': { required: false, type: 'number' },
        'Mercredi planifie': { required: false, type: 'number' },
        'Jeudi planifie': { required: false, type: 'number' },
        'Vendredi planifie': { required: false, type: 'number' },
        'Samedi planifie': { required: false, type: 'number' }
      };

      const { validData, errors } = importService.validateData(data, schema);
      if (errors.length > 0) {
        return res.status(400).json({ error: 'Erreurs de validation', details: errors });
      }

      const resultats = [];

      for (const row of validData) {
        const [semaines] = await connection.query(
          'SELECT ID FROM semaines WHERE Code_semaine = ? LIMIT 1',
          [row['Semaine']]
        );
        if (semaines.length === 0) {
          continue;
        }

        const [commandes] = await connection.query(
          `SELECT ID FROM commandes
           WHERE Code_article = ? AND (? IS NULL OR Lot = ?)
           LIMIT 1`,
          [row['Code article'], row['Lot'] || null, row['Lot'] || null]
        );
        if (commandes.length === 0) {
          continue;
        }

        const lundiPlanifie = parseInt(row['Lundi planifie'] || 0, 10) || 0;
        const mardiPlanifie = parseInt(row['Mardi planifie'] || 0, 10) || 0;
        const mercrediPlanifie = parseInt(row['Mercredi planifie'] || 0, 10) || 0;
        const jeudiPlanifie = parseInt(row['Jeudi planifie'] || 0, 10) || 0;
        const vendrediPlanifie = parseInt(row['Vendredi planifie'] || 0, 10) || 0;
        const samediPlanifie = parseInt(row['Samedi planifie'] || 0, 10) || 0;

        const lundiEmballe = parseInt(row['Lundi emballe'] || 0, 10) || 0;
        const mardiEmballe = parseInt(row['Mardi emballe'] || 0, 10) || 0;
        const mercrediEmballe = parseInt(row['Mercredi emballe'] || 0, 10) || 0;
        const jeudiEmballe = parseInt(row['Jeudi emballe'] || 0, 10) || 0;
        const vendrediEmballe = parseInt(row['Vendredi emballe'] || 0, 10) || 0;
        const samediEmballe = parseInt(row['Samedi emballe'] || 0, 10) || 0;

        const payload = [
          row['Date debut planification'] || null,
          row['Identifiant lot'] || `${row['Lot'] || row['Code article']}-${row['Semaine']}`,
          parseInt(row['Quantite facturee semaine'] || 0, 10) || 0,
          parseInt(row['Stock actuel'] || 0, 10) || 0,
          parseInt(row['Stock emballe precedent'] || 0, 10) || 0,
          lundiPlanifie, lundiEmballe,
          mardiPlanifie, mardiEmballe,
          mercrediPlanifie, mercrediEmballe,
          jeudiPlanifie, jeudiEmballe,
          vendrediPlanifie, vendrediEmballe,
          samediPlanifie, samediEmballe,
          row['Commentaire'] || null
        ];

        const [existing] = await connection.query(
          'SELECT ID FROM planning_hebdo WHERE ID_Semaine_planifiee = ? AND ID_Commande = ? LIMIT 1',
          [semaines[0].ID, commandes[0].ID]
        );

        if (existing.length > 0) {
          await connection.query(
            `UPDATE planning_hebdo SET
              Date_debut_planification = ?,
              Identifiant_lot = ?,
              Quantite_facturee_semaine = ?,
              Stock_actuel = ?, Stock_embale_precedent = ?,
              Lundi_planifie = ?, Lundi_emballe = ?,
              Mardi_planifie = ?, Mardi_emballe = ?,
              Mercredi_planifie = ?, Mercredi_emballe = ?,
              Jeudi_planifie = ?, Jeudi_emballe = ?,
              Vendredi_planifie = ?, Vendredi_emballe = ?,
              Samedi_planifie = ?, Samedi_emballe = ?,
              Commentaire = ?, Date_modification = NOW()
             WHERE ID = ?`,
            [...payload, existing[0].ID]
          );
          resultats.push({ id: existing[0].ID, action: 'updated' });
        } else {
          const [insert] = await connection.query(
            `INSERT INTO planning_hebdo (
              ID_Semaine_planifiee, ID_Commande,
              Date_debut_planification, Identifiant_lot, Quantite_facturee_semaine,
              Stock_actuel, Stock_embale_precedent,
              Lundi_planifie, Lundi_emballe,
              Mardi_planifie, Mardi_emballe,
              Mercredi_planifie, Mercredi_emballe,
              Jeudi_planifie, Jeudi_emballe,
              Vendredi_planifie, Vendredi_emballe,
              Samedi_planifie, Samedi_emballe,
              Commentaire, Date_creation
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [semaines[0].ID, commandes[0].ID, ...payload]
          );
          resultats.push({ id: insert.insertId, action: 'created' });
        }
      }

      await connection.commit();

      await logAction({
        ID_Utilisateur: req.user?.ID,
        Username: req.user?.Username,
        Action: 'IMPORT',
        Table_concernee: 'planning_hebdo',
        Nouvelle_valeur: { count: resultats.length }
      });

      res.json({
        success: true,
        message: `${resultats.length} lignes planning importees`,
        data: resultats
      });
    } catch (error) {
      await connection.rollback();
      console.error('Erreur import planning:', error);
      res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  }

  /**
   * Import affectations (ID optionnel)
   * - Si ID fourni: update de la ligne existante
   * - Si ID absent: creation d'une nouvelle affectation
   */
  async importAffectations(req, res) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      if (!req.file) {
        return res.status(400).json({ error: 'Fichier requis' });
      }

      const data = await importService.readExcel(req.file.buffer);
      const errors = [];
      const resultats = [];

      const normalizeKey = (key) =>
        String(key || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, ' ')
          .trim();

      const normalizeRow = (row) => {
        const normalized = {};
        Object.entries(row || {}).forEach(([k, v]) => {
          normalized[normalizeKey(k)] = v;
        });
        return normalized;
      };

      const getCell = (row, keys) => {
        for (const key of keys) {
          if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
            return row[key];
          }
        }
        return null;
      };

      const isRowEmpty = (row) => Object.values(row || {}).every((value) => {
        if (value === null || value === undefined) return true;
        return String(value).trim() === '';
      });

      const toIntOrNull = (value) => {
        if (value === null || value === undefined || value === '') return null;
        const n = parseInt(String(value).trim(), 10);
        return Number.isNaN(n) ? null : n;
      };

      const toFloatOrNull = (value) => {
        if (value === null || value === undefined || value === '') return null;
        const n = parseFloat(String(value).trim().replace(',', '.'));
        return Number.isNaN(n) ? null : n;
      };

      const toDateTimeOrNull = (value) => {
        if (value === null || value === undefined || value === '') return null;
        if (value instanceof Date && !Number.isNaN(value.getTime())) {
          const yyyy = value.getFullYear();
          const mm = String(value.getMonth() + 1).padStart(2, '0');
          const dd = String(value.getDate()).padStart(2, '0');
          const hh = String(value.getHours()).padStart(2, '0');
          const mi = String(value.getMinutes()).padStart(2, '0');
          const ss = String(value.getSeconds()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
        }
        if (typeof value === 'number' && Number.isFinite(value) && value > 20000 && value < 80000) {
          const excelEpoch = new Date(Date.UTC(1899, 11, 30));
          const ms = value * 24 * 60 * 60 * 1000;
          const d = new Date(excelEpoch.getTime() + ms);
          if (!Number.isNaN(d.getTime())) return formatDateTimeForDB(d);
        }
        const raw = String(value).trim();

        // Parse DD/MM/YYYY or DD/MM/YY HH:MM(:SS) format
        const dateMatch = raw.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
        if (dateMatch) {
          const day = parseInt(dateMatch[1], 10);
          const month = parseInt(dateMatch[2], 10);
          let year = parseInt(dateMatch[3], 10);
          if (year < 100) year += 2000;
          const hour = parseInt(dateMatch[4], 10);
          const minute = parseInt(dateMatch[5], 10);
          const second = parseInt(dateMatch[6] || '0', 10);

          const d = new Date(year, month - 1, day, hour, minute, second);
          if (!Number.isNaN(d.getTime())) {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const hh = String(d.getHours()).padStart(2, '0');
            const mi = String(d.getMinutes()).padStart(2, '0');
            const ss = String(d.getSeconds()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
          }
        }

        const d = new Date(raw);
        if (!Number.isNaN(d.getTime())) return formatDateTimeForDB(d);
        return null;
      };

      const [tableColumnsRows] = await connection.query('SHOW COLUMNS FROM affectations');
      const tableColumns = new Set((tableColumnsRows || []).map((c) => String(c.Field || '').toLowerCase()));
      const hasDateCreation = tableColumns.has('date_creation');
      const hasDateModification = tableColumns.has('date_modification');

      for (let i = 0; i < data.length; i += 1) {
        const rowNumber = i + 2;
        const row = normalizeRow(data[i]);
        if (isRowEmpty(row)) continue;

        try {
          const affectationId = toIntOrNull(getCell(row, ['id']));

          let idCommande = toIntOrNull(getCell(row, ['id commande', 'id_commande']));
          const codeArticle = String(getCell(row, ['code article', 'code_article']) || '').trim();
          const lot = String(getCell(row, ['lot']) || '').trim();

          if (!idCommande && codeArticle) {
            const [commandes] = await connection.query(
              `SELECT ID, ID_Article
               FROM commandes
               WHERE Code_article = ?
                 AND (? = '' OR Lot = ?)
               ORDER BY Date_creation DESC, ID DESC
               LIMIT 1`,
              [codeArticle, lot, lot]
            );
            idCommande = commandes[0]?.ID || null;
          }

          let idOperateur = toIntOrNull(getCell(row, ['id operateur', 'id_operateur', 'id personnel', 'id_personnel']));
          const operateurNom = String(getCell(row, ['operateur nom', 'operateur_nom', 'nom prenom', 'nom_prenom']) || '').trim();
          const matricule = String(getCell(row, ['matricule']) || '').trim();

          if (!idOperateur && (matricule || operateurNom)) {
            const [personnel] = await connection.query(
              `SELECT ID
               FROM personnel
               WHERE (? <> '' AND Matricule = ?)
                  OR (? <> '' AND Nom_prenom = ?)
               ORDER BY ID DESC
               LIMIT 1`,
              [matricule, matricule, operateurNom, operateurNom]
            );
            idOperateur = personnel[0]?.ID || null;
          }

          let idPoste = toIntOrNull(getCell(row, ['id poste', 'id_poste']));
          const posteDescription = String(getCell(row, ['poste description', 'poste_description', 'poste']) || '').trim();

          if (!idPoste && posteDescription) {
            const [postes] = await connection.query(
              'SELECT ID FROM postes WHERE Description = ? LIMIT 1',
              [posteDescription]
            );
            idPoste = postes[0]?.ID || null;
          }

          let idSemaine = toIntOrNull(getCell(row, ['id semaine', 'id_semaine']));
          const semaineCode = String(getCell(row, ['semaine', 'code semaine', 'code_semaine']) || '').trim();

          if (!idSemaine && semaineCode) {
            const [semaines] = await connection.query(
              'SELECT ID FROM semaines WHERE Code_semaine = ? LIMIT 1',
              [semaineCode]
            );
            idSemaine = semaines[0]?.ID || null;
          }

          const dateDebutParsed = toDateTimeOrNull(getCell(row, ['date debut', 'date_debut']));
          const dateFinParsed = toDateTimeOrNull(getCell(row, ['date fin', 'date_fin']));

          // Auto-resolution of ID_Semaine from Date_debut if still missing
          if (!idSemaine && dateDebutParsed) {
            const [semRows] = await connection.query(
              'SELECT ID FROM semaines WHERE ? BETWEEN Date_debut AND Date_fin LIMIT 1',
              [dateDebutParsed.split(' ')[0]]
            );
            if (semRows.length > 0) {
              idSemaine = semRows[0].ID;
            }
          }

          let idArticle = toIntOrNull(getCell(row, ['id article', 'id_article']));
          if (!idArticle && codeArticle) {
            const [articles] = await connection.query(
              'SELECT ID FROM articles WHERE Code_article = ? LIMIT 1',
              [codeArticle]
            );
            idArticle = articles[0]?.ID || null;
          }
          if (!idArticle && idCommande) {
            const [commandes] = await connection.query(
              'SELECT ID_Article FROM commandes WHERE ID = ? LIMIT 1',
              [idCommande]
            );
            idArticle = commandes[0]?.ID_Article || null;
          }

          let dureeCalculated = toIntOrNull(getCell(row, ['duree']));
          if (!dureeCalculated && dateDebutParsed && dateFinParsed) {
            const start = new Date(dateDebutParsed);
            const end = new Date(dateFinParsed);
            if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
              try {
                // Calculer la durée en prenant en compte les horaires, pauses et jours fériés
                dureeCalculated = await affectationService.calculateDurationWithHoraires(
                  connection,
                  start,
                  end
                );
              } catch (durationError) {
                console.warn(`⚠️ Erreur calcul durée ligne ${rowNumber}:`, durationError.message);
                // Fallback: calcul simple en minutes
                const diffMs = end.getTime() - start.getTime();
                dureeCalculated = Math.max(0, Math.floor(diffMs / (1000 * 60)));
              }
            }
          }

          const payload = {
            ID_Commande: idCommande,
            ID_Operateur: idOperateur,
            ID_Poste: idPoste,
            ID_Article: idArticle,
            ID_Semaine: idSemaine,
            Date_debut: dateDebutParsed,
            Date_fin: dateFinParsed,
            Duree: dureeCalculated,
            Heure_supp: toFloatOrNull(getCell(row, ['heure supp', 'heure_supp', 'heures supp'])),
            Quantite_produite: toIntOrNull(getCell(row, ['quantite produite', 'quantite_produite'])),
            Commentaire: getCell(row, ['commentaire'])
          };

          console.log(`[AFFECTATIONS IMPORT] Ligne ${rowNumber} - ID_Commande: ${idCommande}, ID_Semaine: ${idSemaine}, Duree: ${dureeCalculated}`);

          if (affectationId) {
            const [existing] = await connection.query(
              'SELECT * FROM affectations WHERE ID = ?',
              [affectationId]
            );
            if (existing.length === 0) {
              throw new Error(`Affectation ID ${affectationId} introuvable`);
            }

            const updateFields = Object.entries(payload).filter(([, value]) => value !== null && value !== undefined);
            if (updateFields.length === 0) {
              resultats.push({ ligne: rowNumber, id: affectationId, action: 'skipped' });
              continue;
            }

            const setClause = updateFields.map(([key]) => `${key} = ?`).join(', ');
            const values = updateFields.map(([, value]) => value);

            let sql = `UPDATE affectations SET ${setClause}`;
            if (hasDateModification) sql += ', Date_modification = NOW()';
            sql += ' WHERE ID = ?';

            await connection.query(sql, [...values, affectationId]);
            resultats.push({ ligne: rowNumber, id: affectationId, action: 'updated' });
          } else {
            if (!payload.ID_Commande || !payload.ID_Operateur || !payload.ID_Poste || !payload.ID_Article) {
              const missing = [];
              if (!payload.ID_Commande) missing.push(`Commande (Article: ${codeArticle || 'non fourni'}, Lot: ${lot || 'non fourni'}) introuvable`);
              if (!payload.ID_Operateur) missing.push(`Personnel (Matricule: ${matricule || 'non fourni'}, Nom: ${operateurNom || 'non fourni'}) introuvable`);
              if (!payload.ID_Poste) missing.push(`Poste (Description: ${posteDescription || 'non fourni'}) introuvable`);
              if (!payload.ID_Article) missing.push(`Article (Code: ${codeArticle || 'non fourni'}) introuvable`);
              throw new Error(`Données obligatoires manquantes ou invalides : ${missing.join(' | ')}`);
            }

            if (!payload.Date_debut) {
              const { getLocalDateTime } = require('../utils/datetime');
              payload.Date_debut = formatDateTimeForDB(getLocalDateTime());
            }

            // Fix for check_dates constraint: Date_fin must be > Date_debut
            if (payload.Date_fin) {
              const start = new Date(payload.Date_debut);
              const end = new Date(payload.Date_fin);
              if (end <= start) {
                if (end.getTime() === start.getTime()) {
                  // If exactly equal, add 1 minute to satisfy the > constraint
                  end.setMinutes(end.getMinutes() + 1);
                  payload.Date_fin = formatDateTimeForDB(end);
                } else {
                  throw new Error(`La date de fin (${payload.Date_fin}) ne peut pas être avant la date de début (${payload.Date_debut})`);
                }
              }
            }

            const insertColumns = [];
            const insertValues = [];
            Object.entries(payload).forEach(([key, value]) => {
              if (value !== null && value !== undefined) {
                insertColumns.push(key);
                insertValues.push(value);
              }
            });

            let sql = `INSERT INTO affectations (${insertColumns.join(', ')}`;
            let valuesSql = insertColumns.map(() => '?').join(', ');
            if (hasDateCreation) {
              sql += ', Date_creation';
              valuesSql += ', NOW()';
            }
            sql += `) VALUES (${valuesSql})`;

            const [insert] = await connection.query(sql, insertValues);
            resultats.push({ ligne: rowNumber, id: insert.insertId, action: 'created' });
          }
        } catch (importError) {
          console.error(`[AFFECTATIONS IMPORT] Erreur ligne ${rowNumber}:`, importError.message);
          errors.push(`Ligne ${rowNumber}: ${importError.message}`);
        }
      }

      if (errors.length > 0) {
        console.warn('[AFFECTATIONS IMPORT] Erreurs de validation:', errors);
        await connection.rollback();
        return res.status(400).json({ error: 'Erreurs de validation', details: errors });
      }

      await connection.commit();

      await logAction({
        ID_Utilisateur: req.user?.ID,
        Username: req.user?.Username,
        Action: 'IMPORT',
        Table_concernee: 'affectations',
        Nouvelle_valeur: { count: resultats.length }
      });

      return res.json({
        success: true,
        message: `${resultats.length} affectations importees`,
        data: resultats
      });
    } catch (error) {
      await connection.rollback();
      console.error('Erreur import affectations:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  }

  /**
   * Import types machine depuis fichier Excel/CSV
   */
  async importTypesMachine(req, res) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      if (!req.file) {
        return res.status(400).json({ error: 'Fichier requis' });
      }

      const data = await importService.readExcel(req.file.buffer);
      const errors = [];
      const resultats = [];

      const normalizeKey = (key) =>
        String(key || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, ' ')
          .trim();

      const normalizeRow = (row) => {
        const normalized = {};
        Object.entries(row || {}).forEach(([k, v]) => {
          normalized[normalizeKey(k)] = v;
        });
        return normalized;
      };

      const isRowEmpty = (row) => Object.values(row || {}).every((value) => {
        if (value === null || value === undefined) return true;
        return String(value).trim() === '';
      });

      const getCell = (row, keys) => {
        for (const key of keys) {
          if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
            return row[key];
          }
        }
        return null;
      };

      for (let i = 0; i < data.length; i += 1) {
        const rowNumber = i + 2;
        const row = normalizeRow(data[i]);
        if (isRowEmpty(row)) continue;

        const typeMachine = String(
          getCell(row, ['type machine', 'type_machine']) || ''
        ).trim();

        if (!typeMachine) {
          errors.push(`Ligne ${rowNumber}: Type machine requis`);
          continue;
        }

        try {
          const [existing] = await connection.query(
            'SELECT ID FROM types_machine WHERE Type_machine = ? LIMIT 1',
            [typeMachine]
          );

          if (existing.length > 0) {
            await connection.query(
              'UPDATE types_machine SET Type_machine = ? WHERE ID = ?',
              [typeMachine, existing[0].ID]
            );
            resultats.push({ id: existing[0].ID, type_machine: typeMachine, action: 'updated' });
          } else {
            const [insert] = await connection.query(
              'INSERT INTO types_machine (Type_machine) VALUES (?)',
              [typeMachine]
            );
            resultats.push({ id: insert.insertId, type_machine: typeMachine, action: 'created' });
          }
        } catch (importError) {
          errors.push(`Ligne ${rowNumber}: ${importError.message}`);
        }
      }

      if (errors.length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'Erreurs de validation', details: errors });
      }

      await connection.commit();

      await logAction({
        ID_Utilisateur: req.user?.ID,
        Username: req.user?.Username,
        Action: 'IMPORT',
        Table_concernee: 'types_machine',
        Nouvelle_valeur: { count: resultats.length }
      });

      return res.json({
        success: true,
        message: `${resultats.length} types machine importes`,
        data: resultats
      });
    } catch (error) {
      await connection.rollback();
      console.error('Erreur import types machine:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  }

  /**
   * Import defauts type machine depuis fichier Excel/CSV
   */
  async importDefautsTypeMachine(req, res) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      if (!req.file) {
        return res.status(400).json({ error: 'Fichier requis' });
      }

      const data = await importService.readExcel(req.file.buffer);
      const errors = [];
      const resultats = [];

      const normalizeKey = (key) =>
        String(key || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, ' ')
          .trim();

      const normalizeRow = (row) => {
        const normalized = {};
        Object.entries(row || {}).forEach(([k, v]) => {
          normalized[normalizeKey(k)] = v;
        });
        return normalized;
      };

      const isRowEmpty = (row) => Object.values(row || {}).every((value) => {
        if (value === null || value === undefined) return true;
        return String(value).trim() === '';
      });

      const getCell = (row, keys) => {
        for (const key of keys) {
          if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
            return row[key];
          }
        }
        return null;
      };

      for (let i = 0; i < data.length; i += 1) {
        const rowNumber = i + 2;
        const row = normalizeRow(data[i]);
        if (isRowEmpty(row)) continue;

        const idTypeRaw = getCell(row, ['id type machine', 'id_type_machine', 'id type']);
        const typeMachineRaw = getCell(row, ['type machine', 'type_machine']);
        const codeDefaut = String(getCell(row, ['code defaut', 'code_defaut']) || '').trim();
        const nomDefaut = String(getCell(row, ['nom defaut', 'nom_defaut']) || '').trim();
        const descriptionDefaut = String(getCell(row, ['description defaut', 'description_defaut']) || '').trim() || null;

        if (!codeDefaut || !nomDefaut) {
          errors.push(`Ligne ${rowNumber}: Code_defaut et Nom_defaut sont requis`);
          continue;
        }

        let typeMachineId = null;
        if (idTypeRaw !== null && idTypeRaw !== undefined && String(idTypeRaw).trim() !== '') {
          const parsedId = parseInt(String(idTypeRaw).trim(), 10);
          if (Number.isNaN(parsedId) || parsedId <= 0) {
            errors.push(`Ligne ${rowNumber}: ID_Type_machine invalide`);
            continue;
          }
          typeMachineId = parsedId;
        } else if (typeMachineRaw) {
          const typeMachineNom = String(typeMachineRaw).trim();
          const [typeRows] = await connection.query(
            'SELECT ID FROM types_machine WHERE Type_machine = ? LIMIT 1',
            [typeMachineNom]
          );
          if (typeRows.length === 0) {
            errors.push(`Ligne ${rowNumber}: Type_machine introuvable (${typeMachineNom})`);
            continue;
          }
          typeMachineId = typeRows[0].ID;
        } else {
          errors.push(`Ligne ${rowNumber}: ID_Type_machine ou Type_machine requis`);
          continue;
        }

        const [typeExists] = await connection.query(
          'SELECT ID FROM types_machine WHERE ID = ? LIMIT 1',
          [typeMachineId]
        );
        if (typeExists.length === 0) {
          errors.push(`Ligne ${rowNumber}: Type machine ID ${typeMachineId} introuvable`);
          continue;
        }

        try {
          const [existing] = await connection.query(
            `SELECT ID
             FROM defauts_par_type_machine
             WHERE ID_Type_machine = ? AND Code_defaut = ?
             LIMIT 1`,
            [typeMachineId, codeDefaut]
          );

          if (existing.length > 0) {
            await connection.query(
              `UPDATE defauts_par_type_machine
               SET Nom_defaut = ?, Description_defaut = ?
               WHERE ID = ?`,
              [nomDefaut, descriptionDefaut, existing[0].ID]
            );
            resultats.push({
              id: existing[0].ID,
              id_type_machine: typeMachineId,
              code_defaut: codeDefaut,
              action: 'updated'
            });
          } else {
            const [insert] = await connection.query(
              `INSERT INTO defauts_par_type_machine (
                ID_Type_machine, Code_defaut, Nom_defaut, Description_defaut
              ) VALUES (?, ?, ?, ?)`,
              [typeMachineId, codeDefaut, nomDefaut, descriptionDefaut]
            );
            resultats.push({
              id: insert.insertId,
              id_type_machine: typeMachineId,
              code_defaut: codeDefaut,
              action: 'created'
            });
          }
        } catch (importError) {
          errors.push(`Ligne ${rowNumber}: ${importError.message}`);
        }
      }

      if (errors.length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'Erreurs de validation', details: errors });
      }

      await connection.commit();

      await logAction({
        ID_Utilisateur: req.user?.ID,
        Username: req.user?.Username,
        Action: 'IMPORT',
        Table_concernee: 'defauts_par_type_machine',
        Nouvelle_valeur: { count: resultats.length }
      });

      return res.json({
        success: true,
        message: `${resultats.length} defauts type machine importes`,
        data: resultats
      });
    } catch (error) {
      await connection.rollback();
      console.error('Erreur import defauts type machine:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  }

  /**
   * Import machines depuis fichier Excel/CSV
   * La colonne type machine attend le nom du type
   */
  async importMachines(req, res) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      if (!req.file) {
        return res.status(400).json({ error: 'Fichier requis' });
      }

      const data = await importService.readExcel(req.file.buffer);
      const errors = [];
      const resultats = [];

      const normalizeKey = (key) =>
        String(key || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, ' ')
          .trim();

      const normalizeRow = (row) => {
        const normalized = {};
        Object.entries(row || {}).forEach(([k, v]) => {
          normalized[normalizeKey(k)] = v;
        });
        return normalized;
      };

      const getCell = (row, keys) => {
        for (const key of keys) {
          if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
            return row[key];
          }
        }
        return null;
      };

      const isRowEmpty = (row) => Object.values(row || {}).every((value) => {
        if (value === null || value === undefined) return true;
        return String(value).trim() === '';
      });

      const toDateOrNull = (value) => {
        if (value === null || value === undefined || value === '') return null;
        if (value instanceof Date && !Number.isNaN(value.getTime())) return formatDateForAPI(value);
        const raw = String(value).trim();
        const ymd = raw.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
        if (ymd) return `${ymd[1]}-${String(Number(ymd[2])).padStart(2, '0')}-${String(Number(ymd[3])).padStart(2, '0')}`;
        const dmy = raw.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
        if (dmy) {
          const yyyy = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
          return `${yyyy}-${String(Number(dmy[2])).padStart(2, '0')}-${String(Number(dmy[1])).padStart(2, '0')}`;
        }
        const parsed = new Date(raw);
        return Number.isNaN(parsed.getTime()) ? null : formatDateForAPI(parsed);
      };

      // Mapping des valeurs pour Statut_operationnel acceptées par la DB
      const statutMapping = {
        'operationnel': 'en_production',
        'en_maintenance': 'maintenance',
        'hors_service': 'en_panne'
      };
      
      const statutsAutorises = new Set(Object.keys(statutMapping));

      for (let i = 0; i < data.length; i += 1) {
        const rowNumber = i + 2;
        const row = normalizeRow(data[i]);

        if (isRowEmpty(row)) continue;

        const code = String(getCell(row, ['code', 'code interne', 'code_interne']) || '').trim();
        const nom = String(getCell(row, ['nom', 'nom machine', 'nom_machine']) || '').trim();
        const typeMachineNom = String(getCell(row, ['type machine', 'type_machine']) || '').trim();
        const statutRaw = String(getCell(row, ['statut operationnel', 'statut_operationnel']) || 'operationnel').trim();
        const statutMapped = statutMapping[statutRaw] || statutRaw;
        const site = String(getCell(row, ['site affectation', 'site_affectation']) || '').trim();
        const dateInstallation = toDateOrNull(getCell(row, ['date installation', 'date_installation']));
        const numeroSerie = String(getCell(row, ['numero serie', 'numero_serie']) || '').trim() || null;
        const description = String(getCell(row, ['description']) || '').trim() || null;
        const notes = String(getCell(row, ['notes', 'commentaire']) || '').trim() || null;

        if (!code || !nom || !typeMachineNom) {
          errors.push(`Ligne ${rowNumber}: Code, nom et type machine sont requis`);
          continue;
        }

        if (!statutsAutorises.has(statutRaw)) {
          errors.push(`Ligne ${rowNumber}: Statut operationnel invalide (${statutRaw})`);
          continue;
        }

        const [typeRows] = await connection.query(
          'SELECT ID FROM types_machine WHERE Type_machine = ? LIMIT 1',
          [typeMachineNom]
        );

        if (typeRows.length === 0) {
          errors.push(`Ligne ${rowNumber}: Type machine introuvable (${typeMachineNom})`);
          continue;
        }

        const typeMachineId = typeRows[0].ID;

        try {
          const [existing] = await connection.query(
            'SELECT ID FROM machines WHERE Code_interne = ? LIMIT 1',
            [code]
          );

          if (existing.length > 0) {
            await connection.query(
              `UPDATE machines
               SET Type_machine_id = ?, Nom_machine = ?, Statut_operationnel = ?, Site_affectation = ?,
                   Date_installation = ?, Numero_serie = ?, Description = ?, Commentaire = ?, Date_modification = NOW()
               WHERE ID = ?`,
              [typeMachineId, nom, statutMapped, site || null, dateInstallation, numeroSerie, description, notes, existing[0].ID]
            );
            resultats.push({ id: existing[0].ID, code, action: 'updated' });
          } else {
            const [insert] = await connection.query(
              `INSERT INTO machines (
                 Type_machine_id, Code_interne, Nom_machine, Statut_operationnel, Site_affectation,
                 Date_installation, Numero_serie, Description, Commentaire, Statut, Date_creation
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'actif', NOW())`,
              [typeMachineId, code, nom, statutMapped, site || null, dateInstallation, numeroSerie, description, notes]
            );
            resultats.push({ id: insert.insertId, code, action: 'created' });
          }
        } catch (importError) {
          errors.push(`Ligne ${rowNumber}: ${importError.message}`);
        }
      }

      if (errors.length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'Erreurs de validation', details: errors });
      }

      await connection.commit();

      await logAction({
        ID_Utilisateur: req.user?.ID,
        Username: req.user?.Username,
        Action: 'IMPORT',
        Table_concernee: 'machines',
        Nouvelle_valeur: { count: resultats.length }
      });

      return res.json({
        success: true,
        message: `${resultats.length} machines importees`,
        data: resultats
      });
    } catch (error) {
      await connection.rollback();
      console.error('Erreur import machines:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  }

  /**
   * Import interventions depuis fichier Excel/CSV
   */
  async importInterventions(req, res) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      if (!req.file) {
        return res.status(400).json({ error: 'Fichier requis' });
      }

      const data = await importService.readExcel(req.file.buffer);
      const errors = [];
      const resultats = [];

      const normalizeKey = (key) =>
        String(key || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, ' ')
          .trim();

      const normalizeRow = (row) => {
        const normalized = {};
        Object.entries(row || {}).forEach(([k, v]) => {
          normalized[normalizeKey(k)] = v;
        });
        return normalized;
      };

      const getCell = (row, keys) => {
        for (const key of keys) {
          if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
            return row[key];
          }
        }
        return null;
      };

      const isRowEmpty = (row) => Object.values(row || {}).every((value) => {
        if (value === null || value === undefined) return true;
        return String(value).trim() === '';
      });

      const statutsAutorises = new Set(['EN_ATTENTE', 'AFFECTEE', 'EN_COURS', 'EN_PAUSE', 'TERMINEE', 'ANNULEE', 'REPORTEE']);
      const prioritesAutorisees = new Set(['URGENTE', 'HAUTE', 'NORMALE', 'BASSE']);
      const impactsAutorises = new Set(['Aucun', 'Mineur', 'Partiel', 'Total']);

      for (let i = 0; i < data.length; i += 1) {
        const rowNumber = i + 2;
        const row = normalizeRow(data[i]);
        if (isRowEmpty(row)) continue;

        const typeMachineNom = String(getCell(row, ['type machine', 'type_machine']) || '').trim();
        const codeMachine = String(getCell(row, ['code machine', 'code_machine']) || '').trim();
        const demandeurId = Number(getCell(row, ['demandeur id', 'demandeur_id']));
        const descriptionPanne = String(getCell(row, ['description panne', 'description_panne']) || '').trim();
        const priorite = String(getCell(row, ['priorite']) || 'NORMALE').trim().toUpperCase();
        const impact = String(getCell(row, ['impact production', 'impact_production']) || 'Partiel').trim();
        const statut = String(getCell(row, ['statut']) || 'EN_ATTENTE').trim().toUpperCase();
        const technicienRaw = getCell(row, ['technicien id', 'technicien_id']);
        const technicienId = technicienRaw ? Number(technicienRaw) : null;
        const commentaire = String(getCell(row, ['commentaire']) || '').trim() || null;

        if (!typeMachineNom || !codeMachine || !Number.isInteger(demandeurId) || demandeurId <= 0 || !descriptionPanne) {
          errors.push(`Ligne ${rowNumber}: Type machine, code machine, demandeur ID et description panne sont requis`);
          continue;
        }

        if (!prioritesAutorisees.has(priorite)) {
          errors.push(`Ligne ${rowNumber}: Priorite invalide (${priorite})`);
          continue;
        }

        if (!statutsAutorises.has(statut)) {
          errors.push(`Ligne ${rowNumber}: Statut invalide (${statut})`);
          continue;
        }

        if (!impactsAutorises.has(impact)) {
          errors.push(`Ligne ${rowNumber}: Impact production invalide (${impact})`);
          continue;
        }

        const [typeRows] = await connection.query(
          'SELECT ID FROM types_machine WHERE Type_machine = ? LIMIT 1',
          [typeMachineNom]
        );
        if (typeRows.length === 0) {
          errors.push(`Ligne ${rowNumber}: Type machine introuvable (${typeMachineNom})`);
          continue;
        }

        const [machineRows] = await connection.query(
          'SELECT ID FROM machines WHERE Code_interne = ? LIMIT 1',
          [codeMachine]
        );
        if (machineRows.length === 0) {
          errors.push(`Ligne ${rowNumber}: Machine introuvable (${codeMachine})`);
          continue;
        }

        try {
          const [insert] = await connection.query(
            `INSERT INTO demande_intervention (
              ID_Type_machine, ID_Machine, Date_heure_demande, Demandeur, Description_panne,
              Priorite, Impact_production, Statut, ID_Technicien, Commentaire, Date_creation
            ) VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
              typeRows[0].ID,
              machineRows[0].ID,
              demandeurId,
              descriptionPanne,
              priorite,
              impact,
              statut,
              technicienId,
              commentaire
            ]
          );
          resultats.push({ id: insert.insertId, code_machine: codeMachine, action: 'created' });
        } catch (importError) {
          errors.push(`Ligne ${rowNumber}: ${importError.message}`);
        }
      }

      if (errors.length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'Erreurs de validation', details: errors });
      }

      await connection.commit();

      await logAction({
        ID_Utilisateur: req.user?.ID,
        Username: req.user?.Username,
        Action: 'IMPORT',
        Table_concernee: 'demande_intervention',
        Nouvelle_valeur: { count: resultats.length }
      });

      return res.json({
        success: true,
        message: `${resultats.length} interventions importees`,
        data: resultats
      });
    } catch (error) {
      await connection.rollback();
      console.error('Erreur import interventions:', error);
      return res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  }

  /**
    * Template articles
    */
  async getTemplateArticles(req, res) {
    try {
      const columns = [
        { header: 'Code article', key: 'code_article', width: 18, example: 'REF-A23' },
        { header: 'Client', key: 'client', width: 25, example: 'Client ABC' },
        { header: 'Temps theorique', key: 'temps_theorique', width: 15, example: '10.5' },
        { header: 'Temps reel', key: 'temps_reel', width: 15, example: '11.2' },
        { header: 'Indice revision', key: 'indice_revision', width: 16, example: 'A1' },
        { header: 'Date revision', key: 'date_revision', width: 15, example: '2026-02-10' },
        { header: 'Nombre postes', key: 'nombre_postes', width: 14, example: '3' },
        { header: 'Lien dossier client', key: 'lien_dossier_client', width: 30, example: 'https://drive.exemple/client' },
        { header: 'Lien photo', key: 'lien_photo', width: 30, example: 'https://drive.exemple/photo' },
        { header: 'Lien dossier technique', key: 'lien_dossier_technique', width: 32, example: 'https://drive.exemple/tech' },
        { header: 'Ctrl elect disponible', key: 'ctrl_elect_disponible', width: 18, example: '1' },
        { header: 'Commentaire', key: 'commentaire', width: 30, example: 'Article valide pour serie' },
        { header: 'Valide', key: 'valide', width: 10, example: '1' },
        { header: 'Statut', key: 'statut', width: 20, example: 'normale' }
      ];

      const buffer = await importService.generateTemplate(columns, 'Articles');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=template_articles.xlsx');
      res.send(buffer);

    } catch (error) {
      console.error('Erreur template articles:', error);
      res.status(500).json({ error: error.message });
    }
  }
  /**
    * Import articles
    */
  async importArticles(req, res) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      if (!req.file) {
        return res.status(400).json({ error: 'Fichier requis' });
      }

      const data = await importService.readExcel(req.file.buffer);
      const errors = [];
      const resultats = [];

      const normalizeKey = (key) =>
        String(key || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, ' ')
          .trim();

      const normalizeRow = (row) => {
        const normalized = {};
        Object.entries(row || {}).forEach(([k, v]) => {
          normalized[normalizeKey(k)] = v;
        });
        return normalized;
      };

      const isRowEmpty = (row) => Object.values(row || {}).every((value) => {
        if (value === null || value === undefined) return true;
        return String(value).trim() === '';
      });

      const getCell = (row, keys) => {
        for (const key of keys) {
          if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
            return row[key];
          }
        }
        return null;
      };

      const toIntOrNull = (value, fieldLabel, rowNumber) => {
        if (value === null || value === undefined || value === '') return null;
        const n = parseInt(String(value).trim(), 10);
        if (Number.isNaN(n)) {
          errors.push(`Ligne ${rowNumber}: ${fieldLabel} doit etre un nombre entier`);
          return null;
        }
        return n;
      };

      const toFloatOrNull = (value, fieldLabel, rowNumber) => {
        if (value === null || value === undefined || value === '') return null;
        const normalized = String(value).replace(',', '.').trim();
        const n = parseFloat(normalized);
        if (Number.isNaN(n)) {
          errors.push(`Ligne ${rowNumber}: ${fieldLabel} doit etre un nombre`);
          return null;
        }
        return n;
      };

      const toDateOrNull = (value) => {
        if (value === null || value === undefined || value === '') return null;

        if (value instanceof Date && !Number.isNaN(value.getTime())) {
          return value.toISOString().split('T')[0];
        }

        if (typeof value === 'number' && Number.isFinite(value)) {
          // Excel serial date (days since 1899-12-30)
          if (value > 20000 && value < 80000) {
            const excelEpoch = new Date(Date.UTC(1899, 11, 30));
            const ms = value * 24 * 60 * 60 * 1000;
            const date = new Date(excelEpoch.getTime() + ms);
            return date.toISOString().split('T')[0];
          }
          const maybeTs = new Date(value);
          if (!Number.isNaN(maybeTs.getTime())) {
            return maybeTs.toISOString().split('T')[0];
          }
          return null;
        }

        if (typeof value === 'object') {
          const nested = value.result ?? value.text ?? value.richText ?? null;
          if (nested !== null) return toDateOrNull(nested);
          return null;
        }

        const raw = String(value).trim();
        if (!raw || ['-', 'n/a', 'na', 'null'].includes(raw.toLowerCase())) return null;

        const dmy = raw.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
        if (dmy) {
          const day = Number(dmy[1]);
          const month = Number(dmy[2]);
          const year = Number(dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3]);
          const date = new Date(Date.UTC(year, month - 1, day));
          if (!Number.isNaN(date.getTime())) return date.toISOString().split('T')[0];
          return null;
        }

        const ymd = raw.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
        if (ymd) {
          const year = Number(ymd[1]);
          const month = Number(ymd[2]);
          const day = Number(ymd[3]);
          const date = new Date(Date.UTC(year, month - 1, day));
          if (!Number.isNaN(date.getTime())) return date.toISOString().split('T')[0];
          return null;
        }

        const parsed = new Date(raw);
        if (!Number.isNaN(parsed.getTime())) {
          return parsed.toISOString().split('T')[0];
        }
        return null;
      };

      const normalizeBooleanTinyInt = (value, defaultValue = 0) => {
        if (value === null || value === undefined || value === '') return defaultValue;
        const raw = String(value).trim().toLowerCase();
        if (['1', 'true', 'oui', 'yes', 'vrai'].includes(raw)) return 1;
        if (['0', 'false', 'non', 'no', 'faux'].includes(raw)) return 0;
        const n = parseInt(raw, 10);
        if (!Number.isNaN(n)) return n > 0 ? 1 : 0;
        return defaultValue;
      };

      const normalizeStatut = (value) => {
        if (!value) return 'normale';
        const raw = String(value).trim().toLowerCase();
        if (raw === 'nouveau') return 'nouveau';
        if (['passage de revision', 'passage de révision'].includes(raw)) return 'passage de révision';
        if (raw === 'normale') return 'normale';
        if (['obsolete', 'obsolète'].includes(raw)) return 'obsolète';
        return 'normale';
      };

      for (let i = 0; i < data.length; i += 1) {
        const rowNumber = i + 2;
        const row = normalizeRow(data[i]);
        if (isRowEmpty(row)) continue;

        try {
          const codeArticleRaw = getCell(row, ['code article', 'code_article', 'code']);
          const codeArticle = codeArticleRaw ? String(codeArticleRaw).trim() : '';
          if (!codeArticle) {
            errors.push(`Ligne ${rowNumber}: Code article requis`);
            continue;
          }

          const client = getCell(row, ['client']);
          const tempsTheorique = toFloatOrNull(getCell(row, ['temps theorique', 'temps_theorique']), 'Temps theorique', rowNumber);
          const tempsReel = toFloatOrNull(getCell(row, ['temps reel', 'temps_reel']), 'Temps reel', rowNumber);
          const indiceRevision = getCell(row, ['indice revision', 'indice_revision']);
          const dateRevision = toDateOrNull(getCell(row, ['date revision', 'date_revision']));
          const nombrePostes = toIntOrNull(getCell(row, ['nombre postes', 'nombre_postes']), 'Nombre postes', rowNumber);
          const lienDossierClient = getCell(row, ['lien dossier client', 'lien_dossier_client']);
          const lienPhoto = getCell(row, ['lien photo', 'lien_photo']);
          const lienDossierTechnique = getCell(row, ['lien dossier technique', 'lien_dossier_technique']);
          const ctrlElect = normalizeBooleanTinyInt(getCell(row, ['ctrl elect disponible', 'ctrl_elect_disponible']), 0);
          const commentaire = getCell(row, ['commentaire']);
          const valide = normalizeBooleanTinyInt(getCell(row, ['valide']), 1);
          const statut = normalizeStatut(getCell(row, ['statut']));

          const [existing] = await connection.query(
            'SELECT ID FROM articles WHERE Code_article = ? LIMIT 1',
            [codeArticle]
          );

          const payload = [
            client || null,
            tempsTheorique,
            tempsReel,
            indiceRevision || null,
            dateRevision || null,
            nombrePostes,
            lienDossierClient || null,
            lienPhoto || null,
            lienDossierTechnique || null,
            ctrlElect,
            commentaire || null,
            valide,
            statut
          ];

          if (existing.length > 0) {
            await connection.query(
              `UPDATE articles SET
                 Client = ?, Temps_theorique = ?, Temps_reel = ?,
                 Indice_revision = ?, Date_revision = ?, Nombre_postes = ?,
                 Lien_dossier_client = ?, Lien_photo = ?, Lien_dossier_technique = ?,
                 Ctrl_elect_disponible = ?, Commentaire = ?, valide = ?, statut = ?
                WHERE ID = ?`,
              [...payload, existing[0].ID]
            );
            resultats.push({ id: existing[0].ID, code: codeArticle, action: 'updated' });
          } else {
            const [result] = await connection.query(
              `INSERT INTO articles (
                 Code_article, Client, Temps_theorique, Temps_reel,
                 Indice_revision, Date_revision, Nombre_postes,
                 Lien_dossier_client, Lien_photo, Lien_dossier_technique,
                 Ctrl_elect_disponible, Commentaire, valide, statut
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [codeArticle, ...payload]
            );
            resultats.push({ id: result.insertId, code: codeArticle, action: 'created' });
          }
        } catch (importError) {
          console.error('Erreur import article:', importError);
        }
      }

      if (errors.length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'Erreurs de validation', details: errors });
      }

      await connection.commit();

      await logAction({
        ID_Utilisateur: req.user?.ID,
        Username: req.user?.Username,
        Action: 'IMPORT',
        Table_concernee: 'articles',
        Nouvelle_valeur: { count: resultats.length }
      });

      res.json({
        success: true,
        message: `${resultats.length} articles importes`,
        data: resultats
      });

    } catch (error) {
      await connection.rollback();
      console.error('Erreur import articles:', error);
      res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  }
  /**
    * Import personnel
    */
  async importPersonnel(req, res) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      if (!req.file) {
        return res.status(400).json({ error: 'Fichier requis' });
      }

      const data = await importService.readExcel(req.file.buffer);
      const resultats = [];
      const errors = [];

      const normalizeKey = (key) =>
        String(key || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, ' ')
          .trim();

      const normalizeRow = (row) => {
        const normalized = {};
        Object.entries(row || {}).forEach(([k, v]) => {
          normalized[normalizeKey(k)] = v;
        });
        return normalized;
      };

      const isRowEmpty = (row) => Object.values(row || {}).every((value) => {
        if (value === null || value === undefined) return true;
        return String(value).trim() === '';
      });

      const getCell = (row, keys) => {
        for (const key of keys) {
          if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
            return row[key];
          }
        }
        return null;
      };

      const toDateOrNull = (value) => {
        if (value === null || value === undefined || value === '') return null;

        if (value instanceof Date && !Number.isNaN(value.getTime())) {
          return value.toISOString().split('T')[0];
        }

        if (typeof value === 'number' && Number.isFinite(value)) {
          if (value > 20000 && value < 80000) {
            const excelEpoch = new Date(Date.UTC(1899, 11, 30));
            const ms = value * 24 * 60 * 60 * 1000;
            const date = new Date(excelEpoch.getTime() + ms);
            return date.toISOString().split('T')[0];
          }
          const maybeTs = new Date(value);
          if (!Number.isNaN(maybeTs.getTime())) return maybeTs.toISOString().split('T')[0];
          return null;
        }

        const raw = String(value).trim();
        if (!raw || ['-', 'n/a', 'na', 'null'].includes(raw.toLowerCase())) return null;

        const dmy = raw.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
        if (dmy) {
          const day = Number(dmy[1]);
          const month = Number(dmy[2]);
          const year = Number(dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3]);
          const date = new Date(Date.UTC(year, month - 1, day));
          if (!Number.isNaN(date.getTime())) return date.toISOString().split('T')[0];
        }

        const ymd = raw.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
        if (ymd) {
          const year = Number(ymd[1]);
          const month = Number(ymd[2]);
          const day = Number(ymd[3]);
          const date = new Date(Date.UTC(year, month - 1, day));
          if (!Number.isNaN(date.getTime())) return date.toISOString().split('T')[0];
        }

        const parsed = new Date(raw);
        if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
        return null;
      };

      for (let i = 0; i < data.length; i += 1) {
        const rowNumber = i + 2;
        const row = normalizeRow(data[i]);
        if (isRowEmpty(row)) continue;

        const nomPrenomRaw = getCell(row, ['nom prenom', 'nom_prenom', 'nom et prenom']);
        const matriculeRaw = getCell(row, ['matricule']);
        const dateEmbaucheRaw = getCell(row, ['date embauche', 'date_embauche']);

        const Nom_prenom = nomPrenomRaw ? String(nomPrenomRaw).trim() : '';
        const Matricule = matriculeRaw ? String(matriculeRaw).trim() : '';
        const Date_embauche = toDateOrNull(dateEmbaucheRaw);

        if (!Nom_prenom) errors.push(`Ligne ${rowNumber}: Nom_prenom requis`);
        if (!Matricule) errors.push(`Ligne ${rowNumber}: Matricule requis`);
        if (!Date_embauche) errors.push(`Ligne ${rowNumber}: Date_embauche valide requise`);
        if (!Nom_prenom || !Matricule || !Date_embauche) continue;

        const Qr_code = getCell(row, ['qr code', 'qr_code']) || null;
        const Email = getCell(row, ['email']) || null;
        const Date_naissance = toDateOrNull(getCell(row, ['date naissance', 'date_naissance']));
        const Adresse = getCell(row, ['adresse']) || null;
        const Ville = getCell(row, ['ville']) || null;
        const Code_postal = getCell(row, ['code postal', 'code_postal']) || null;
        const Telephone = getCell(row, ['telephone', 'tel', 'telephone']) || null;
        const Poste = getCell(row, ['poste']) || 'Operateur';
        const StatutRaw = getCell(row, ['statut']);
        const Statut = String(StatutRaw || 'actif').toLowerCase() === 'inactif' ? 'inactif' : 'actif';
        const Type_contrat = getCell(row, ['type contrat', 'type_contrat']) || 'CDI';
        const Date_fin_contrat = toDateOrNull(getCell(row, ['date fin contrat', 'date_fin_contrat']));
        const Site_affectation = getCell(row, ['site affectation', 'site_affectation', 'site']) || null;
        const Numero_CNSS = getCell(row, ['numero cnss', 'numero_cnss', 'cnss']) || null;
        const Commentaire = getCell(row, ['commentaire']) || null;

        try {
          const [existing] = await connection.query(
            'SELECT ID FROM personnel WHERE Matricule = ? LIMIT 1',
            [Matricule]
          );

          const payload = [
            Nom_prenom,
            Matricule,
            Qr_code,
            Date_embauche,
            Email,
            Date_naissance,
            Adresse,
            Ville,
            Code_postal,
            Telephone,
            Poste,
            Statut,
            Type_contrat,
            Date_fin_contrat,
            Site_affectation,
            Numero_CNSS,
            Commentaire
          ];

          if (existing.length > 0) {
            await connection.query(
              `UPDATE personnel SET
                 Nom_prenom = ?, Matricule = ?, Qr_code = ?, Date_embauche = ?, Email = ?,
                 Date_naissance = ?, Adresse = ?, Ville = ?, Code_postal = ?, Telephone = ?,
                 Poste = ?, Statut = ?, Type_contrat = ?, Date_fin_contrat = ?,
                 Site_affectation = ?, Numero_CNSS = ?, Commentaire = ?, Date_modification = NOW()
                WHERE ID = ?`,
              [...payload, existing[0].ID]
            );
            resultats.push({ id: existing[0].ID, matricule: Matricule, action: 'updated' });
          } else {
            const [insert] = await connection.query(
              `INSERT INTO personnel (
                 Nom_prenom, Matricule, Qr_code, Date_embauche, Email,
                 Date_naissance, Adresse, Ville, Code_postal, Telephone,
                 Poste, Statut, Type_contrat, Date_fin_contrat,
                 Site_affectation, Numero_CNSS, Commentaire, Date_creation
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
              payload
            );
            resultats.push({ id: insert.insertId, matricule: Matricule, action: 'created' });
          }
        } catch (importError) {
          errors.push(`Ligne ${rowNumber}: ${importError.message}`);
        }
      }

      if (errors.length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'Erreurs de validation', details: errors });
      }

      await connection.commit();

      await logAction({
        ID_Utilisateur: req.user?.ID,
        Username: req.user?.Username,
        Action: 'IMPORT',
        Table_concernee: 'personnel',
        Nouvelle_valeur: { count: resultats.length }
      });

      res.json({
        success: true,
        message: `${resultats.length} employÃ©s importÃ©s`,
        data: resultats
      });

    } catch (error) {
      await connection.rollback();
      console.error('Erreur import personnel:', error);
      res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  }

  /**
   * Import defauts produit
   */
  async importDefautsProduit(req, res) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      if (!req.file) {
        return res.status(400).json({ error: 'Fichier requis' });
      }

      const data = await importService.readExcel(req.file.buffer);
      const schema = {
        'Code defaut': { required: true },
        'Description': { required: true },
        'Cout minimum': { required: false, type: 'number' }
      };

      const { validData, errors } = importService.validateData(data, schema);
      if (errors.length > 0) {
        return res.status(400).json({ error: 'Erreurs de validation', details: errors });
      }

      const resultats = [];
      for (const row of validData) {
        try {
          const [existing] = await connection.query(
            'SELECT ID FROM liste_defauts_produit WHERE Code_defaut = ?',
            [row['Code defaut']]
          );

          if (existing.length > 0) {
            await connection.query(
              `UPDATE liste_defauts_produit SET
                Description = ?,
                Cout_min = ?,
                Commentaire = ?,
                Date_modification = NOW()
              WHERE Code_defaut = ?`,
              [
                row['Description'],
                row['Cout minimum'] ? parseFloat(row['Cout minimum']) : null,
                row['Commentaire'] || null,
                row['Code defaut']
              ]
            );
            resultats.push({ code: row['Code defaut'], action: 'updated' });
          } else {
            await connection.query(
              `INSERT INTO liste_defauts_produit (
                Code_defaut, Description, Cout_min, Commentaire, Date_creation
              ) VALUES (?, ?, ?, ?, NOW())`,
              [
                row['Code defaut'],
                row['Description'],
                row['Cout minimum'] ? parseFloat(row['Cout minimum']) : null,
                row['Commentaire'] || null
              ]
            );
            resultats.push({ code: row['Code defaut'], action: 'created' });
          }
        } catch (importError) {
          console.error('Erreur import defaut produit (ligne):', importError);
        }
      }

      await connection.commit();

      await logAction({
        ID_Utilisateur: req.user?.ID,
        Username: req.user?.Username,
        Action: 'IMPORT',
        Table_concernee: 'liste_defauts_produit',
        Nouvelle_valeur: { count: resultats.length }
      });

      res.json({
        success: true,
        message: `${resultats.length} defauts produit importes`,
        data: resultats
      });
    } catch (error) {
      await connection.rollback();
      console.error('Erreur import defauts produit:', error);
      res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  }

  /**
   * Import defauts process
   */
  async importDefautsProcess(req, res) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      if (!req.file) {
        return res.status(400).json({ error: 'Fichier requis' });
      }

      const data = await importService.readExcel(req.file.buffer);
      const schema = {
        'ID Article': { required: true, type: 'number' },
        'Code article': { required: true },
        'Code defaut': { required: true },
        'Description defaut': { required: true }
      };

      const { validData, errors } = importService.validateData(data, schema);
      if (errors.length > 0) {
        return res.status(400).json({ error: 'Erreurs de validation', details: errors });
      }

      const gravitesAutorisees = ['Mineure', 'Majeure', 'Critique', 'Bloquante'];
      const resultats = [];

      for (const row of validData) {
        try {
          const graviteValue = gravitesAutorisees.includes(row['Gravite'])
            ? row['Gravite']
            : 'Mineure';

          await connection.query(
            `INSERT INTO defauts_process (
              Date_defaut, ID_Article, Code_article, Code_defaut, Description_defaut,
              ID_Poste, Gravite, Quantite_concernee, Impact_production, Commentaire, Date_creation
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
              row['Date defaut'] || new Date(),
              parseInt(row['ID Article'], 10),
              row['Code article'],
              row['Code defaut'],
              row['Description defaut'],
              row['ID Poste'] ? parseInt(row['ID Poste'], 10) : null,
              graviteValue,
              row['Quantite concernee'] ? parseInt(row['Quantite concernee'], 10) : 1,
              row['Impact production'] ? parseInt(row['Impact production'], 10) : null,
              row['Commentaire'] || null
            ]
          );

          resultats.push({
            code_article: row['Code article'],
            code_defaut: row['Code defaut'],
            action: 'created'
          });
        } catch (importError) {
          console.error('Erreur import defaut process (ligne):', importError);
        }
      }

      await connection.commit();

      await logAction({
        ID_Utilisateur: req.user?.ID,
        Username: req.user?.Username,
        Action: 'IMPORT',
        Table_concernee: 'defauts_process',
        Nouvelle_valeur: { count: resultats.length }
      });

      res.json({
        success: true,
        message: `${resultats.length} defauts process importes`,
        data: resultats
      });
    } catch (error) {
      await connection.rollback();
      console.error('Erreur import defauts process:', error);
      res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  }

  /**
   * Import horaires depuis fichier Excel/CSV
   */
  async importHorairesFile(req, res) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      if (!req.file) {
        return res.status(400).json({ error: 'Fichier requis' });
      }

      const data = await importService.readExcel(req.file.buffer);
      const joursAutorises = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
      const resultats = [];
      const errors = [];

      const normalizeKey = (key) =>
        String(key || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, ' ')
          .trim();

      const normalizeRow = (row) => {
        const normalized = {};
        Object.entries(row || {}).forEach(([k, v]) => {
          normalized[normalizeKey(k)] = v;
        });
        return normalized;
      };

      const getCell = (row, keys) => {
        for (const key of keys) {
          if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
            return row[key];
          }
        }
        return null;
      };

      const isRowEmpty = (row) => Object.values(row || {}).every((value) => {
        if (value === null || value === undefined) return true;
        return String(value).trim() === '';
      });

      const toDateOrNull = (value) => {
        if (value === null || value === undefined || value === '') return null;

        if (value instanceof Date && !Number.isNaN(value.getTime())) {
          return value.toISOString().split('T')[0];
        }

        if (typeof value === 'object') {
          const nested = value.result ?? value.text ?? null;
          if (nested !== null) return toDateOrNull(nested);
        }

        if (typeof value === 'number' && Number.isFinite(value)) {
          if (value > 20000 && value < 80000) {
            const excelEpoch = new Date(Date.UTC(1899, 11, 30));
            const ms = value * 24 * 60 * 60 * 1000;
            return new Date(excelEpoch.getTime() + ms).toISOString().split('T')[0];
          }
          const d = new Date(value);
          if (!Number.isNaN(d.getTime())) return d.toISOString().split('T')[0];
          return null;
        }

        const raw = String(value).trim();
        if (!raw || ['-', 'n/a', 'na', 'null'].includes(raw.toLowerCase())) return null;

        const dmy = raw.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
        if (dmy) {
          const day = Number(dmy[1]);
          const month = Number(dmy[2]);
          const year = Number(dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3]);
          const date = new Date(Date.UTC(year, month - 1, day));
          if (!Number.isNaN(date.getTime())) return date.toISOString().split('T')[0];
        }

        const ymd = raw.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
        if (ymd) {
          const year = Number(ymd[1]);
          const month = Number(ymd[2]);
          const day = Number(ymd[3]);
          const date = new Date(Date.UTC(year, month - 1, day));
          if (!Number.isNaN(date.getTime())) return date.toISOString().split('T')[0];
        }

        const parsed = new Date(raw);
        if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
        return null;
      };

      const toTimeOrNull = (value) => {
        if (value === null || value === undefined || value === '') return null;

        if (value instanceof Date && !Number.isNaN(value.getTime())) {
          const hh = String(value.getUTCHours()).padStart(2, '0');
          const mm = String(value.getUTCMinutes()).padStart(2, '0');
          const ss = String(value.getUTCSeconds()).padStart(2, '0');
          return `${hh}:${mm}:${ss}`;
        }

        if (typeof value === 'number' && Number.isFinite(value)) {
          // Excel time as fraction of day: 0.5 => 12:00:00
          const secondsInDay = 24 * 60 * 60;
          const totalSeconds = Math.round((value % 1) * secondsInDay);
          const hh = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
          const mm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
          const ss = String(totalSeconds % 60).padStart(2, '0');
          return `${hh}:${mm}:${ss}`;
        }

        if (typeof value === 'object') {
          const nested = value.result ?? value.text ?? null;
          if (nested !== null) return toTimeOrNull(nested);
        }

        const raw = String(value).trim();
        const isoDateTime = raw.match(/^\d{4}-\d{2}-\d{2}[T\s](\d{1,2}:\d{2})(:\d{2})?$/);
        if (isoDateTime) {
          const time = isoDateTime[1];
          const sec = isoDateTime[2] || ':00';
          const [h, m] = time.split(':');
          return `${h.padStart(2, '0')}:${m}${sec}`;
        }
        const hhmm = raw.match(/^(\d{1,2}):(\d{2})$/);
        if (hhmm) return `${hhmm[1].padStart(2, '0')}:${hhmm[2]}:00`;
        const hhmmss = raw.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
        if (hhmmss) return `${hhmmss[1].padStart(2, '0')}:${hhmmss[2]}:${hhmmss[3]}`;
        return raw;
      };

      const toBoolTinyInt = (value, defaultValue = 0) => {
        if (value === null || value === undefined || value === '') return defaultValue;
        const raw = String(value).trim().toLowerCase();
        if (['1', 'true', 'oui', 'yes', 'vrai'].includes(raw)) return 1;
        if (['0', 'false', 'non', 'no', 'faux'].includes(raw)) return 0;
        const n = parseInt(raw, 10);
        if (!Number.isNaN(n)) return n > 0 ? 1 : 0;
        return defaultValue;
      };

      for (let i = 0; i < data.length; i += 1) {
        const rowNumber = i + 2;
        const row = normalizeRow(data[i]);
        if (isRowEmpty(row)) continue;

        const dateValue = toDateOrNull(getCell(row, ['date']));
        const estOuvertValue = toBoolTinyInt(getCell(row, ['est ouvert', 'est_ouvert']), 1);
        let heureDebut = toTimeOrNull(getCell(row, ['heure debut', 'heure_debut']));
        let heureFin = toTimeOrNull(getCell(row, ['heure fin', 'heure_fin']));

        // Closed/holiday rows may not carry shift hours in source files.
        if (estOuvertValue === 0 && (!heureDebut || !heureFin)) {
          heureDebut = heureDebut || '00:00:00';
          heureFin = heureFin || '00:00:00';
        }

        if (!dateValue) errors.push(`Ligne ${rowNumber}: Date valide requise`);
        if (!heureDebut) errors.push(`Ligne ${rowNumber}: Heure debut requise`);
        if (!heureFin) errors.push(`Ligne ${rowNumber}: Heure fin requise`);
        if (!dateValue || !heureDebut || !heureFin) continue;

        try {
          const [existing] = await connection.query('SELECT ID FROM horaires WHERE Date = ?', [dateValue]);

          const jourRaw = getCell(row, ['jour semaine', 'jour_semaine']);
          const jourValue = joursAutorises.includes(jourRaw) ? jourRaw : null;
          const typeValueRaw = String(getCell(row, ['type chome', 'type_chome']) || '').trim().toLowerCase();
          let typeValue = 'non_chomé';
          if (['chome_paye', 'chomé_payé', 'chomã©_payã©', 'chome paye'].includes(typeValueRaw)) typeValue = 'chomé_payé';
          if (['chome_non_paye', 'chomé_non_payé', 'chomã©_non_payã©', 'chome non paye'].includes(typeValueRaw)) typeValue = 'chomé_non_payé';
          if (['non_chome', 'non_chomé', 'non_chomã©', 'non chome'].includes(typeValueRaw)) typeValue = 'non_chomé';

          const payload = [
            jourValue,
            heureDebut,
            heureFin,
            toTimeOrNull(getCell(row, ['pause debut', 'pause_debut'])),
            toTimeOrNull(getCell(row, ['pause fin', 'pause_fin'])),
            toTimeOrNull(getCell(row, ['heure supp debut', 'heure_supp_debut'])),
            toTimeOrNull(getCell(row, ['heure supp fin', 'heure_supp_fin'])),
            estOuvertValue,
            toBoolTinyInt(getCell(row, ['est jour ferie', 'est_jour_ferie']), 0),
            typeValue,
            getCell(row, ['description']) || null,
            getCell(row, ['commentaire']) || null
          ];

          if (existing.length > 0) {
            await connection.query(
              `UPDATE horaires SET
                Jour_semaine = COALESCE(?, Jour_semaine),
                Heure_debut = ?, Heure_fin = ?,
                Pause_debut = ?, Pause_fin = ?,
                Heure_supp_debut = ?, Heure_supp_fin = ?,
                Est_ouvert = ?, Est_jour_ferie = ?,
                Type_chome = ?, Description = ?, Commentaire = ?,
                Date_modification = NOW()
              WHERE Date = ?`,
              [...payload, dateValue]
            );
            resultats.push({ date: dateValue, action: 'updated' });
          } else {
            await connection.query(
              `INSERT INTO horaires (
                Date, Jour_semaine, Heure_debut, Heure_fin,
                Pause_debut, Pause_fin, Heure_supp_debut, Heure_supp_fin,
                Est_ouvert, Est_jour_ferie, Type_chome, Description, Commentaire, Date_creation
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
              [dateValue, jourValue || 'Lundi', ...payload.slice(1)]
            );
            resultats.push({ date: dateValue, action: 'created' });
          }
        } catch (importError) {
          errors.push(`Ligne ${rowNumber}: ${importError.message}`);
        }
      }

      if (errors.length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'Erreurs de validation', details: errors });
      }

      await connection.commit();

      await logAction({
        ID_Utilisateur: req.user?.ID,
        Username: req.user?.Username,
        Action: 'IMPORT',
        Table_concernee: 'horaires',
        Nouvelle_valeur: { count: resultats.length }
      });

      res.json({
        success: true,
        message: `${resultats.length} horaires importes`,
        data: resultats
      });
    } catch (error) {
      await connection.rollback();
      console.error('Erreur import horaires:', error);
      res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  }
}

module.exports = new ImportController();

