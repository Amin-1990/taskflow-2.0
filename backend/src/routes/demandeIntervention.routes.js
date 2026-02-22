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

// Routes spécifiques D'ABORD
router.get(
  '/statistiques/dashboard',
  authMiddleware,
  validate,
  demandeController.getStatistiquesMaintenance
);

// Filtres
router.get(
  '/statut/:statut',
  authMiddleware,
  interventionByStatutValidator,
  validate,
  demandeController.getDemandesByStatut
);

router.get(
  '/technicien/:id',
  authMiddleware,
  interventionIdValidator,
  validate,
  demandeController.getDemandesByTechnicien
);

router.get(
  '/machine/:id/historique',
  authMiddleware,
  interventionIdValidator,
  validate,
  demandeController.getHistoriqueMachine
);

router.get(
  '/export/xlsx',
  authMiddleware,
  demandeController.exportInterventionsXLSX
);

// Route avec paramètre
router.get(
  '/:id',
  authMiddleware,
  interventionIdValidator,
  validate,
  demandeController.getDemandeById
);

// Liste (pas de validation)
router.get('/', authMiddleware, demandeController.getAllDemandes);

// POST
router.post(
  '/',
  authMiddleware,
  createInterventionValidator,
  validate,
  demandeController.createDemande
);

router.put(
  '/:id',
  authMiddleware,
  updateInterventionValidator,
  validate,
  demandeController.updateDemande
);

// Actions sur les demandes
router.patch(
  '/:id/affecter',
  authMiddleware,
  assignInterventionValidator,
  validate,
  demandeController.affecterTechnicien
);

router.patch(
  '/:id/demarrer',
  authMiddleware,
  interventionIdValidator,
  validate,
  demandeController.demarrerIntervention
);

router.patch(
  '/:id/terminer',
  authMiddleware,
  completeInterventionValidator,
  validate,
  demandeController.terminerIntervention
);

router.patch(
  '/:id/annuler',
  authMiddleware,
  interventionIdValidator,
  validate,
  demandeController.annulerIntervention
);

router.delete(
  '/:id',
  authMiddleware,
  interventionIdValidator,
  validate,
  demandeController.deleteDemande
);

module.exports = router;
