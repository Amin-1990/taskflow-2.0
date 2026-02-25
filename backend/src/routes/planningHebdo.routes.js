const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation.middleware');
const {
  createPlanningValidator,
  updatePlanningValidator,
  planningIdValidator,
  planningBySemaineValidator,
  planningByCommandeValidator,
  planningByLotValidator,
  updateRealisationValidator
} = require('../validators');
const planningController = require('../controllers/planningHebdo.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/authorization.middleware');

// Routes spécifiques D'ABORD

// NEW: Routes d'export
router.get(
  '/:id/export/pdf',
  authMiddleware,
  requirePermission('PLANNING_READ'),
  planningIdValidator,
  validate,
  planningController.exportPlanningPDF
);

router.get(
  '/:id/export/excel',
  authMiddleware,
  requirePermission('PLANNING_READ'),
  planningIdValidator,
  validate,
  planningController.exportPlanningExcel
);

// NEW: Route para planning by numero_semaine + annee (query params)
router.get(
  '/semaine',
  authMiddleware,
  requirePermission('PLANNING_READ'),
  planningController.getPlanningBySemaineParams
);

// NEW: Vue consolidee grille hebdomadaire (avec filtre unite de production)
router.get(
  '/grille/semaine',
  authMiddleware,
  requirePermission('PLANNING_READ'),
  planningController.getPlanningGrilleSemaine
);

// NEW: Route pour semaines-annee (query params)
router.get(
  '/semaines-annee',
  authMiddleware,
  requirePermission('PLANNING_READ'),
  planningController.getInfosSemainesAnnee
);

router.post(
  '/generer/semaine/:semaineId',
  authMiddleware,
  requirePermission('PLANNING_WRITE'),
  planningBySemaineValidator,
  validate,
  planningController.genererPlanningFromCommandes
);

router.get(
  '/synthese/semaine/:semaineId',
  authMiddleware,
  requirePermission('PLANNING_READ'),
  planningBySemaineValidator,
  validate,
  planningController.getSyntheseSemaine
);

router.get(
  '/semaine/:semaineId',
  authMiddleware,
  requirePermission('PLANNING_READ'),
  planningBySemaineValidator,
  validate,
  planningController.getPlanningBySemaine
);

router.get(
  '/commande/:commandeId',
  authMiddleware,
  requirePermission('PLANNING_READ'),
  planningByCommandeValidator,
  validate,
  planningController.getPlanningByCommande
);

router.get(
  '/lot/:identifiant',
  authMiddleware,
  requirePermission('PLANNING_READ'),
  planningByLotValidator,
  validate,
  planningController.getPlanningByLot
);

// Conflits et suggestions AVANT la route :id générique
router.get(
  '/:id/conflits',
  authMiddleware,
  requirePermission('PLANNING_READ'),
  planningIdValidator,
  validate,
  planningController.obtenirConflits
);

router.get(
  '/:id/suggestions',
  authMiddleware,
  requirePermission('PLANNING_READ'),
  planningIdValidator,
  validate,
  planningController.obtenirSuggestions
);

// Route avec paramètre
router.get(
  '/:id',
  authMiddleware,
  requirePermission('PLANNING_READ'),
  planningIdValidator,
  validate,
  planningController.getPlanningById
);

// Liste (pas de validation)
router.get('/', authMiddleware, requirePermission('PLANNING_READ'), planningController.getAllPlannings);

// POST
router.post(
  '/',
  authMiddleware,
  requirePermission('PLANNING_WRITE'),
  createPlanningValidator,
  validate,
  planningController.createPlanning
);

// PUT
router.put(
  '/:id',
  authMiddleware,
  requirePermission('PLANNING_WRITE'),
  updatePlanningValidator,
  validate,
  planningController.updatePlanning
);

// PATCH
router.patch(
  '/:id/jour/:jour',
  authMiddleware,
  requirePermission('PLANNING_WRITE'),
  planningIdValidator,
  validate,
  planningController.updateJour
);

// DELETE
router.delete(
  '/:id',
  authMiddleware,
  requirePermission('PLANNING_WRITE'),
  planningIdValidator,
  validate,
  planningController.deletePlanning
);

module.exports = router;
