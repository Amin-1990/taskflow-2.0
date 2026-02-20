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

// Routes spécifiques D'ABORD
router.get(
  '/releve/mensuel/:mois/:annee',
  authMiddleware,
  validate,
  pointageController.getReleveMensuel
);

router.get(
  '/statistiques/presence',
  authMiddleware,
  validate,
  pointageController.getStatistiquesPresence
);

router.get(
  '/personnel/:id',
  authMiddleware,
  pointageByPersonnelValidator,
  validate,
  pointageController.getPointageByPersonnel
);

// Routes de pointage avec actions
router.post(
  '/arrivee',
  authMiddleware,
  createPointageValidator,
  validate,
  pointageController.pointerArrivee
);

router.post(
  '/depart',
  authMiddleware,
  markSortieValidator,
  validate,
  pointageController.pointerDepart
);

router.post(
  '/absent',
  authMiddleware,
  markAbsenceValidator,
  validate,
  pointageController.signalerAbsent
);

router.post(
  '/ajuster',
  authMiddleware,
  adjustPointageValidator,
  validate,
  pointageController.ajusterPointage
);

// Routes de consultation
router.get(
  '/periode',
  authMiddleware,
  pointageByPeriodeValidator,
  validate,
  pointageController.getPointageByPeriode
);

router.get(
  '/aujourdhui',
  authMiddleware,
  validate,
  pointageController.getPointageAujourdhui
);

// Liste (pas de validation)
router.get('/', authMiddleware, pointageController.getAllPointage);

// PATCH
router.patch(
  '/:id/valider',
  authMiddleware,
  pointageIdValidator,
  validate,
  pointageController.validerPointage
);

module.exports = router;
