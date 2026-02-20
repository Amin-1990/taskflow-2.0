const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation.middleware');
const {
  createPersonnelValidator,
  updatePersonnelValidator,
  personnelIdValidator,
  personnelMatriculeValidator,
  personnelByStatutValidator,
  personnelByPosteValidator,
  personnelBySiteValidator,
  changeStatutValidator
} = require('../validators');
const personnelController = require('../controllers/personnel.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Routes de recherche spécifiques D'ABORD
router.get(
  '/matricule/:matricule',
  authMiddleware,
  personnelMatriculeValidator,
  validate,
  personnelController.getPersonnelByMatricule
);

router.get(
  '/statut/:statut',
  authMiddleware,
  personnelByStatutValidator,
  validate,
  personnelController.getPersonnelByStatut
);

router.get(
  '/poste/:poste',
  authMiddleware,
  personnelByPosteValidator,
  validate,
  personnelController.getPersonnelByPoste
);

router.get(
  '/site/:site',
  authMiddleware,
  personnelBySiteValidator,
  validate,
  personnelController.getPersonnelBySite
);

// Route avec paramètre
router.get(
  '/:id',
  authMiddleware,
  personnelIdValidator,
  validate,
  personnelController.getPersonnelById
);

// Liste (pas de validation)
router.get('/', authMiddleware, personnelController.getAllPersonnel);

// POST
router.post(
  '/',
  authMiddleware,
  createPersonnelValidator,
  validate,
  personnelController.createPersonnel
);

// PUT
router.put(
  '/:id',
  authMiddleware,
  updatePersonnelValidator,
  validate,
  personnelController.updatePersonnel
);

// PATCH
router.patch(
  '/:id/statut',
  authMiddleware,
  changeStatutValidator,
  validate,
  personnelController.changeStatut
);

// DELETE
router.delete(
  '/:id',
  authMiddleware,
  personnelIdValidator,
  validate,
  personnelController.deletePersonnel
);

module.exports = router;