const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation.middleware');
const authMiddleware = require('../middleware/auth.middleware');
const echelonsController = require('../controllers/echelons.controller');
const {
  echelonReferenceIdValidator,
  historiqueEchelonIdValidator,
  personnelIdForHistoriqueValidator,
  echelonReferenceFilterValidator,
  createEchelonReferenceValidator,
  updateEchelonReferenceValidator,
  createHistoriqueEchelonValidator,
  updateHistoriqueEchelonValidator,
  closeHistoriqueEchelonValidator
} = require('../validators');

router.get(
  '/reference',
  authMiddleware,
  echelonReferenceFilterValidator,
  validate,
  echelonsController.getAllEchelonsReference
);

router.get(
  '/reference/:id',
  authMiddleware,
  echelonReferenceIdValidator,
  validate,
  echelonsController.getEchelonReferenceById
);

router.post(
  '/reference',
  authMiddleware,
  createEchelonReferenceValidator,
  validate,
  echelonsController.createEchelonReference
);

router.put(
  '/reference/:id',
  authMiddleware,
  updateEchelonReferenceValidator,
  validate,
  echelonsController.updateEchelonReference
);

router.delete(
  '/reference/:id',
  authMiddleware,
  echelonReferenceIdValidator,
  validate,
  echelonsController.deleteEchelonReference
);

router.get(
  '/historique/personnel/:idPersonnel',
  authMiddleware,
  personnelIdForHistoriqueValidator,
  validate,
  echelonsController.getHistoriqueByPersonnel
);

router.get(
  '/historique/personnel/:idPersonnel/actuel',
  authMiddleware,
  personnelIdForHistoriqueValidator,
  validate,
  echelonsController.getCurrentEchelonByPersonnel
);

router.get(
  '/historique/:id',
  authMiddleware,
  historiqueEchelonIdValidator,
  validate,
  echelonsController.getHistoriqueById
);

router.post(
  '/historique',
  authMiddleware,
  createHistoriqueEchelonValidator,
  validate,
  echelonsController.createHistoriqueEchelon
);

router.put(
  '/historique/:id',
  authMiddleware,
  updateHistoriqueEchelonValidator,
  validate,
  echelonsController.updateHistoriqueEchelon
);

router.patch(
  '/historique/:id/cloturer',
  authMiddleware,
  closeHistoriqueEchelonValidator,
  validate,
  echelonsController.closeHistoriqueEchelon
);

router.delete(
  '/historique/:id',
  authMiddleware,
  historiqueEchelonIdValidator,
  validate,
  echelonsController.deleteHistoriqueEchelon
);

module.exports = router;
