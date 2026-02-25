const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation.middleware');
const {
  createPointageValidator,
  pointageIdValidator,
  pointageByPersonnelValidator,
  pointageByPeriodeValidator,
  markSortieValidator,
  markAbsenceValidator,
  adjustPointageValidator
} = require('../validators');
const pointageController = require('../controllers/pointage.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/authorization.middleware');

// Routes spécifiques D'ABORD
router.get(
  '/releve/mensuel/:mois/:annee',
  authMiddleware,
  requirePermission('POINTAGE_READ'),
  validate,
  pointageController.getReleveMensuel
);

router.get(
  '/statistiques/presence',
  authMiddleware,
  requirePermission('POINTAGE_READ'),
  validate,
  pointageController.getStatistiquesPresence
);

router.get(
  '/personnel/:id',
  authMiddleware,
  requirePermission('POINTAGE_READ'),
  pointageByPersonnelValidator,
  validate,
  pointageController.getPointageByPersonnel
);

// Routes de pointage avec actions
router.post(
  '/arrivee',
  authMiddleware,
  requirePermission('POINTAGE_WRITE'),
  createPointageValidator,
  validate,
  pointageController.pointerArrivee
);

router.post(
  '/depart',
  authMiddleware,
  requirePermission('POINTAGE_WRITE'),
  markSortieValidator,
  validate,
  pointageController.pointerDepart
);

router.post(
  '/absent',
  authMiddleware,
  requirePermission('POINTAGE_WRITE'),
  markAbsenceValidator,
  validate,
  pointageController.signalerAbsent
);

router.post(
  '/ajuster',
  authMiddleware,
  requirePermission('POINTAGE_WRITE'),
  adjustPointageValidator,
  validate,
  pointageController.ajusterPointage
);

// Routes de consultation
router.get(
  '/periode',
  authMiddleware,
  requirePermission('POINTAGE_READ'),
  pointageByPeriodeValidator,
  validate,
  pointageController.getPointageByPeriode
);

router.get(
  '/aujourdhui',
  authMiddleware,
  requirePermission('POINTAGE_READ'),
  validate,
  pointageController.getPointageAujourdhui
);

// Liste (pas de validation)
router.get('/', authMiddleware, requirePermission('POINTAGE_READ'), pointageController.getAllPointage);

// PATCH
router.patch(
  '/:id/valider',
  authMiddleware,
  requirePermission('POINTAGE_WRITE'),
  pointageIdValidator,
  validate,
  pointageController.validerPointage
);

module.exports = router;
