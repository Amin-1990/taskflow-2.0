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

// Routes spécifiques D'ABORD

// NEW: Routes d'export
router.get(
  '/:id/export/pdf',
  authMiddleware,
  planningIdValidator,
  validate,
  planningController.exportPlanningPDF
);

router.get(
  '/:id/export/excel',
  authMiddleware,
  planningIdValidator,
  validate,
  planningController.exportPlanningExcel
);

// NEW: Route para planning by numero_semaine + annee (query params)
router.get(
  '/semaine',
  authMiddleware,
  planningController.getPlanningBySemaineParams
);

// NEW: Vue consolidee grille hebdomadaire (avec filtre unite de production)
router.get(
  '/grille/semaine',
  authMiddleware,
  planningController.getPlanningGrilleSemaine
);

// NEW: Route pour semaines-annee (query params)
router.get(
  '/semaines-annee',
  authMiddleware,
  planningController.getInfosSemainesAnnee
);

router.post(
  '/generer/semaine/:semaineId',
  authMiddleware,
  planningBySemaineValidator,
  validate,
  planningController.genererPlanningFromCommandes
);

router.get(
  '/synthese/semaine/:semaineId',
  authMiddleware,
  planningBySemaineValidator,
  validate,
  planningController.getSyntheseSemaine
);

router.get(
  '/semaine/:semaineId',
  authMiddleware,
  planningBySemaineValidator,
  validate,
  planningController.getPlanningBySemaine
);

router.get(
  '/commande/:commandeId',
  authMiddleware,
  planningByCommandeValidator,
  validate,
  planningController.getPlanningByCommande
);

router.get(
  '/lot/:identifiant',
  authMiddleware,
  planningByLotValidator,
  validate,
  planningController.getPlanningByLot
);

// Conflits et suggestions AVANT la route :id générique
router.get(
  '/:id/conflits',
  authMiddleware,
  planningIdValidator,
  validate,
  planningController.obtenirConflits
);

router.get(
  '/:id/suggestions',
  authMiddleware,
  planningIdValidator,
  validate,
  planningController.obtenirSuggestions
);

// Route avec paramètre
router.get(
  '/:id',
  authMiddleware,
  planningIdValidator,
  validate,
  planningController.getPlanningById
);

// Liste (pas de validation)
router.get('/', authMiddleware, planningController.getAllPlannings);

// POST
router.post(
  '/',
  authMiddleware,
  createPlanningValidator,
  validate,
  planningController.createPlanning
);

// PUT
router.put(
  '/:id',
  authMiddleware,
  updatePlanningValidator,
  validate,
  planningController.updatePlanning
);

// PATCH
router.patch(
  '/:id/jour/:jour',
  authMiddleware,
  planningIdValidator,
  validate,
  planningController.updateJour
);

// DELETE
router.delete(
  '/:id',
  authMiddleware,
  planningIdValidator,
  validate,
  planningController.deletePlanning
);

module.exports = router;
