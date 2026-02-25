/**
 * Routes Indicateurs
 *
 * GET /api/indicateurs              - Tous les indicateurs
 * GET /api/indicateurs/production   - Indicateurs production
 * GET /api/indicateurs/qualite      - Indicateurs qualite
 * GET /api/indicateurs/maintenance  - Indicateurs maintenance
 * GET /api/indicateurs/rh           - Indicateurs RH
 *
 * Query param: periode=['jour', 'semaine', 'mois', 'annee']
 */

const express = require('express');
const router = express.Router();
const indicateursController = require('../controllers/indicateurs.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

// Point d'entree unique
router.get('/', indicateursController.getAll);

// Par module
router.get('/production', indicateursController.getProduction);
router.get('/qualite', indicateursController.getQualite);
router.get('/maintenance', indicateursController.getMaintenance);
router.get('/rh', indicateursController.getRH);

module.exports = router;
