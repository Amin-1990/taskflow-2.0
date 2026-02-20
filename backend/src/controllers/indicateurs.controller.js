/**
 * Contrôleur Indicateurs
 * 
 * Expose l'API REST pour accéder au service centralisé d'indicateurs
 */

const indicateurs = require('../services/indicateurs.service');

const PERIODES_VALIDES = ['jour', 'semaine', 'mois', 'annee'];

class IndicateursController {
  /**
   * GET /api/indicateurs
   * Récupère TOUS les indicateurs pour une période donnée
   */
  async getAll(req, res) {
    try {
      const { periode = 'jour' } = req.query;

      // Validation de la période
      if (!PERIODES_VALIDES.includes(periode)) {
        return res.status(400).json({
          error: 'Période invalide',
          valides: PERIODES_VALIDES,
          recu: periode
        });
      }

      const data = await indicateurs.getAllIndicateurs(periode);

      return res.json({
        success: true,
        data,
        meta: {
          periode,
          timestamp: new Date().toISOString(),
          modules: ['production', 'qualite', 'maintenance', 'rh']
        }
      });
    } catch (error) {
      console.error('Erreur getAllIndicateurs:', error);
      return res.status(500).json({
        error: 'Erreur lors de la récupération des indicateurs',
        message: error.message
      });
    }
  }

  /**
   * GET /api/indicateurs/production
   * Récupère les indicateurs de production
   */
  async getProduction(req, res) {
    try {
      const { periode = 'jour' } = req.query;

      if (!PERIODES_VALIDES.includes(periode)) {
        return res.status(400).json({
          error: 'Période invalide',
          valides: PERIODES_VALIDES
        });
      }

      const data = await indicateurs.getIndicateursProduction(periode);

      return res.json({
        success: true,
        data,
        meta: {
          module: 'production',
          periode,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Erreur getProduction:', error);
      return res.status(500).json({
        error: 'Erreur production',
        message: error.message
      });
    }
  }

  /**
   * GET /api/indicateurs/qualite
   * Récupère les indicateurs de qualité
   */
  async getQualite(req, res) {
    try {
      const { periode = 'jour' } = req.query;

      if (!PERIODES_VALIDES.includes(periode)) {
        return res.status(400).json({
          error: 'Période invalide',
          valides: PERIODES_VALIDES
        });
      }

      const data = await indicateurs.getIndicateursQualite(periode);

      return res.json({
        success: true,
        data,
        meta: {
          module: 'qualite',
          periode,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Erreur getQualite:', error);
      return res.status(500).json({
        error: 'Erreur qualité',
        message: error.message
      });
    }
  }

  /**
   * GET /api/indicateurs/maintenance
   * Récupère les indicateurs de maintenance
   */
  async getMaintenance(req, res) {
    try {
      const { periode = 'jour' } = req.query;

      if (!PERIODES_VALIDES.includes(periode)) {
        return res.status(400).json({
          error: 'Période invalide',
          valides: PERIODES_VALIDES
        });
      }

      const data = await indicateurs.getIndicateursMaintenance(periode);

      return res.json({
        success: true,
        data,
        meta: {
          module: 'maintenance',
          periode,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Erreur getMaintenance:', error);
      return res.status(500).json({
        error: 'Erreur maintenance',
        message: error.message
      });
    }
  }

  /**
   * GET /api/indicateurs/rh
   * Récupère les indicateurs RH
   */
  async getRH(req, res) {
    try {
      const { periode = 'jour' } = req.query;

      if (!PERIODES_VALIDES.includes(periode)) {
        return res.status(400).json({
          error: 'Période invalide',
          valides: PERIODES_VALIDES
        });
      }

      const data = await indicateurs.getIndicateursRH(periode);

      return res.json({
        success: true,
        data,
        meta: {
          module: 'rh',
          periode,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Erreur getRH:', error);
      return res.status(500).json({
        error: 'Erreur RH',
        message: error.message
      });
    }
  }
}

module.exports = new IndicateursController();
