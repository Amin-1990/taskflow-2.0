const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation.middleware');
const {
  createHoraireValidator,
  updateHoraireValidator,
  horaireIdValidator,
  horaireByDateValidator
} = require('../validators');
const horaireController = require('../controllers/horaire.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/authorization.middleware');

// Routes specifiques
router.post('/import', authMiddleware, requirePermission('HORAIRES_WRITE'), validate, horaireController.importHoraires);
router.get('/export/xlsx', authMiddleware, requirePermission('HORAIRES_READ'), validate, horaireController.exportHorairesXlsx);
router.get('/statistiques/mois/:mois/:annee', authMiddleware, requirePermission('HORAIRES_READ'), validate, horaireController.getStatistiquesMensuelles);

// Routes de recherche
router.get('/date/:date', authMiddleware, requirePermission('HORAIRES_READ'), horaireByDateValidator, validate, horaireController.getHoraireByDate);
router.get('/periode/:debut/:fin', authMiddleware, requirePermission('HORAIRES_READ'), validate, horaireController.getHorairesByPeriode);
router.get('/semaine/:semaineId', authMiddleware, requirePermission('HORAIRES_READ'), validate, horaireController.getHorairesBySemaine);

// Liste
router.get('/', authMiddleware, requirePermission('HORAIRES_READ'), horaireController.getAllHoraires);

// CRUD
router.post('/', authMiddleware, requirePermission('HORAIRES_WRITE'), createHoraireValidator, validate, horaireController.createHoraire);
router.put('/:id', authMiddleware, requirePermission('HORAIRES_WRITE'), updateHoraireValidator, validate, horaireController.updateHoraire);
router.delete('/:id', authMiddleware, requirePermission('HORAIRES_WRITE'), horaireIdValidator, validate, horaireController.deleteHoraire);
router.get('/:id', authMiddleware, requirePermission('HORAIRES_READ'), horaireIdValidator, validate, horaireController.getHoraireById);

module.exports = router;
