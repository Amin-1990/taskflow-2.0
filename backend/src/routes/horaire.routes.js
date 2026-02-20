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

// Routes specifiques
router.post('/import', authMiddleware, validate, horaireController.importHoraires);
router.get('/export/xlsx', authMiddleware, validate, horaireController.exportHorairesXlsx);
router.get('/statistiques/mois/:mois/:annee', authMiddleware, validate, horaireController.getStatistiquesMensuelles);

// Routes de recherche
router.get('/date/:date', authMiddleware, horaireByDateValidator, validate, horaireController.getHoraireByDate);
router.get('/periode/:debut/:fin', authMiddleware, validate, horaireController.getHorairesByPeriode);
router.get('/semaine/:semaineId', authMiddleware, validate, horaireController.getHorairesBySemaine);

// Liste
router.get('/', authMiddleware, horaireController.getAllHoraires);

// CRUD
router.post('/', authMiddleware, createHoraireValidator, validate, horaireController.createHoraire);
router.put('/:id', authMiddleware, updateHoraireValidator, validate, horaireController.updateHoraire);
router.delete('/:id', authMiddleware, horaireIdValidator, validate, horaireController.deleteHoraire);
router.get('/:id', authMiddleware, horaireIdValidator, validate, horaireController.getHoraireById);

module.exports = router;
