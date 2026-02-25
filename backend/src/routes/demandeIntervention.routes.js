const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation.middleware');
const {
  createInterventionValidator,
  updateInterventionValidator,
  interventionIdValidator,
  interventionByStatutValidator,
  assignInterventionValidator,
  completeInterventionValidator
} = require('../validators');
const demandeController = require('../controllers/demandeIntervention.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/authorization.middleware');

// Routes spécifiques D'ABORD
router.get(
  '/statistiques/dashboard',
  authMiddleware,
  requirePermission('INTERVENTIONS_READ'),
  validate,
  demandeController.getStatistiquesMaintenance
);

// Filtres
router.get(
  '/statut/:statut',
  authMiddleware,
  requirePermission('INTERVENTIONS_READ'),
  interventionByStatutValidator,
  validate,
  demandeController.getDemandesByStatut
);

router.get(
  '/technicien/:id',
  authMiddleware,
  requirePermission('INTERVENTIONS_READ'),
  interventionIdValidator,
  validate,
  demandeController.getDemandesByTechnicien
);

router.get(
  '/machine/:id/historique',
  authMiddleware,
  requirePermission('INTERVENTIONS_READ'),
  interventionIdValidator,
  validate,
  demandeController.getHistoriqueMachine
);

router.get(
  '/export/xlsx',
  authMiddleware,
  requirePermission('INTERVENTIONS_READ'),
  demandeController.exportInterventionsXLSX
);

// Route avec paramètre
router.get(
  '/:id',
  authMiddleware,
  requirePermission('INTERVENTIONS_READ'),
  interventionIdValidator,
  validate,
  demandeController.getDemandeById
);

// Liste (pas de validation)
router.get('/', authMiddleware, requirePermission('INTERVENTIONS_READ'), demandeController.getAllDemandes);

// POST
router.post(
  '/',
  authMiddleware,
  requirePermission('INTERVENTIONS_WRITE'),
  createInterventionValidator,
  validate,
  demandeController.createDemande
);

router.put(
  '/:id',
  authMiddleware,
  requirePermission('INTERVENTIONS_WRITE'),
  updateInterventionValidator,
  validate,
  demandeController.updateDemande
);

// Actions sur les demandes
router.patch(
  '/:id/affecter',
  authMiddleware,
  requirePermission('INTERVENTIONS_WRITE'),
  assignInterventionValidator,
  validate,
  demandeController.affecterTechnicien
);

router.patch(
  '/:id/demarrer',
  authMiddleware,
  requirePermission('INTERVENTIONS_WRITE'),
  interventionIdValidator,
  validate,
  demandeController.demarrerIntervention
);

router.patch(
  '/:id/terminer',
  authMiddleware,
  requirePermission('INTERVENTIONS_WRITE'),
  completeInterventionValidator,
  validate,
  demandeController.terminerIntervention
);

router.patch(
  '/:id/annuler',
  authMiddleware,
  requirePermission('INTERVENTIONS_WRITE'),
  interventionIdValidator,
  validate,
  demandeController.annulerIntervention
);

router.delete(
  '/:id',
  authMiddleware,
  requirePermission('INTERVENTIONS_WRITE'),
  interventionIdValidator,
  validate,
  demandeController.deleteDemande
);

module.exports = router;
