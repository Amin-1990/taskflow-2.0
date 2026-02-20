const db = require('../config/database');
const exportService = require('../services/export.service');

class ExportController {
  
  // ===========================================
  // TEST - PREMIER EXCEL
  // ===========================================
  
  /**
   * Test simple : génère un fichier Excel de test
   */
  async testExcel(req, res) {
    try {
      const testData = [
        { ID: 1, Nom: 'Jean Martin', Poste: 'Operateur' },
        { ID: 2, Nom: 'Marie Lambert', Poste: 'Technicien' },
        { ID: 3, Nom: 'Pierre Durand', Poste: 'Responsable' }
      ];
      
      const buffer = await exportService.toExcel(testData, 'Test');
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=test.xlsx');
      res.send(buffer);
      
    } catch (error) {
      console.error('Erreur testExcel:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * Test simple : génère un fichier PDF de test
   */
  async testPDF(req, res) {
    try {
      const testData = [
        { ID: 1, Nom: 'Jean Martin', Poste: 'Operateur' },
        { ID: 2, Nom: 'Marie Lambert', Poste: 'Technicien' },
        { ID: 3, Nom: 'Pierre Durand', Poste: 'Responsable' }
      ];
      
      const doc = await exportService.tableToPDF(testData, 'Test PDF');
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=test.pdf');
      doc.pipe(res);
      doc.end();
      
    } catch (error) {
      console.error('Erreur testPDF:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  // ===========================================
  // EXPORT PLANNING
  // ===========================================
  
  /**
    * Exporte le planning d'une semaine (Excel - défaut)
    */
  async exportPlanning(req, res) {
    try {
      const { semaineId } = req.params;
      
      const [planning] = await db.query(`
        SELECT 
          c.Code_article as 'Code Article',
          c.Lot,
          p.Lundi_planifie as 'Lundi',
          p.Mardi_planifie as 'Mardi',
          p.Mercredi_planifie as 'Mercredi',
          p.Jeudi_planifie as 'Jeudi',
          p.Vendredi_planifie as 'Vendredi',
          p.Samedi_planifie as 'Samedi',
          p.Total_planifie_semaine as 'Total Prévu'
        FROM planning_hebdo p
        JOIN commandes c ON p.ID_Commande = c.ID
        WHERE p.ID_Semaine_planifiee = ?
      `, [semaineId]);
      
      const [semaine] = await db.query('SELECT * FROM semaines WHERE ID = ?', [semaineId]);
      const nomSemaine = semaine[0]?.Code_semaine || `Semaine ${semaineId}`;
      
      const buffer = await exportService.toExcel(planning, nomSemaine);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=planning_${nomSemaine}.xlsx`);
      res.send(buffer);
      
    } catch (error) {
      console.error('Erreur exportPlanning:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
    * Exporte le planning d'une semaine en PDF
    */
  async exportPlanningPDF(req, res) {
    try {
      const { id: semaineId } = req.params;
      
      const [planning] = await db.query(`
        SELECT 
          c.Code_article as 'Code Article',
          c.Lot,
          p.Lundi_planifie as 'Lundi',
          p.Mardi_planifie as 'Mardi',
          p.Mercredi_planifie as 'Mercredi',
          p.Jeudi_planifie as 'Jeudi',
          p.Vendredi_planifie as 'Vendredi',
          p.Samedi_planifie as 'Samedi',
          p.Total_planifie_semaine as 'Total Prévu'
        FROM planning_hebdo p
        JOIN commandes c ON p.ID_Commande = c.ID
        WHERE p.ID_Semaine_planifiee = ?
      `, [semaineId]);
      
      const [semaine] = await db.query('SELECT * FROM semaines WHERE ID = ?', [semaineId]);
      const nomSemaine = semaine[0]?.Code_semaine || `Semaine ${semaineId}`;
      
      const doc = await exportService.planningToPDF(planning, nomSemaine);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=planning_${nomSemaine}.pdf`);
      doc.pipe(res);
      doc.end();
      
    } catch (error) {
      console.error('Erreur exportPlanningPDF:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
    * Exporte le planning d'une semaine en Excel
    */
  async exportPlanningExcel(req, res) {
    try {
      const { id: semaineId } = req.params;
      
      const [planning] = await db.query(`
        SELECT 
          c.Code_article as 'Code Article',
          c.Lot,
          p.Lundi_planifie as 'Lundi',
          p.Mardi_planifie as 'Mardi',
          p.Mercredi_planifie as 'Mercredi',
          p.Jeudi_planifie as 'Jeudi',
          p.Vendredi_planifie as 'Vendredi',
          p.Samedi_planifie as 'Samedi',
          p.Total_planifie_semaine as 'Total Prévu'
        FROM planning_hebdo p
        JOIN commandes c ON p.ID_Commande = c.ID
        WHERE p.ID_Semaine_planifiee = ?
      `, [semaineId]);
      
      const [semaine] = await db.query('SELECT * FROM semaines WHERE ID = ?', [semaineId]);
      const nomSemaine = semaine[0]?.Code_semaine || `Semaine ${semaineId}`;
      
      const buffer = await exportService.planningToExcel(planning, nomSemaine);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=planning_${nomSemaine}.xlsx`);
      res.send(buffer);
      
    } catch (error) {
      console.error('Erreur exportPlanningExcel:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  // ===========================================
  // EXPORT POINTAGE
  // ===========================================
  
  /**
    * Exporte le pointage d'une période
    */
  async exportPointage(req, res) {
    try {
      const { debut, fin } = req.query;
      
      const [pointages] = await db.query(`
        SELECT 
          p.Date,
          pers.Nom_prenom as 'Employé',
          p.Entree as 'Arrivée',
          p.Sortie as 'Départ',
          p.Retard,
          p.H_sup as 'Heures Sup'
        FROM pointage p
        JOIN personnel pers ON p.ID_Personnel = pers.ID
        WHERE p.Date BETWEEN ? AND ?
        ORDER BY p.Date, pers.Nom_prenom
      `, [debut, fin]);
      
      const buffer = await exportService.toExcel(pointages, `Pointage ${debut}_${fin}`);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=pointage_${debut}_${fin}.xlsx`);
      res.send(buffer);
      
    } catch (error) {
      console.error('Erreur exportPointage:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  // ===========================================
  // EXPORT COMMANDES
  // ===========================================
  
  /**
    * Exporte les commandes en XLSX
    */
  async exportCommandesXLSX(req, res) {
    try {
      // Récupérer les paramètres de filtrage optionnels
      const { statut, priorite, date_debut, date_fin } = req.query;
      
      let query = `
        SELECT 
          c.ID,
          c.Numero as 'Numéro',
          c.Code_article as 'Code Article',
          a.Nom_article as 'Article',
          c.Lot as 'Lot',
          c.Quantite as 'Quantité',
          c.Quantite_produite as 'Produite',
          c.Quantite_emballe as 'Emballée',
          c.Statut as 'Statut',
          c.Priorite as 'Priorité',
          c.Date_creation as 'Créée le',
          c.Date_fin_prevue as 'Fin prévue',
          c.Taux_conformite as 'Conformité %'
        FROM commandes c
        LEFT JOIN articles a ON c.ID_Article = a.ID
        WHERE 1=1
      `;
      
      const params = [];
      
      // Filtres optionnels
      if (statut) {
        query += ` AND c.Statut = ?`;
        params.push(statut);
      }
      
      if (priorite) {
        query += ` AND c.Priorite = ?`;
        params.push(priorite);
      }
      
      if (date_debut) {
        query += ` AND c.Date_creation >= ?`;
        params.push(date_debut);
      }
      
      if (date_fin) {
        query += ` AND c.Date_creation <= ?`;
        params.push(date_fin);
      }
      
      query += ` ORDER BY c.Date_creation DESC`;
      
      const [commandes] = await db.query(query, params);
      
      const buffer = await exportService.toExcel(commandes, 'Commandes');
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=commandes.xlsx');
      res.send(buffer);
      
    } catch (error) {
      console.error('Erreur exportCommandesXLSX:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ExportController();
