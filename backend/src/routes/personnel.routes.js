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
const { requirePermission } = require('../middleware/authorization.middleware');

// Routes de recherche spécifiques D'ABORD
router.get(
  '/recherche',
  authMiddleware,
  requirePermission('PERSONNEL_READ'),
  personnelController.searchPersonnel
);

router.get(
  '/matricule/:matricule',
  authMiddleware,
  requirePermission('PERSONNEL_READ'),
  personnelMatriculeValidator,
  validate,
  personnelController.getPersonnelByMatricule
);

router.get(
  '/statut/:statut',
  authMiddleware,
  requirePermission('PERSONNEL_READ'),
  personnelByStatutValidator,
  validate,
  personnelController.getPersonnelByStatut
);

router.get(
  '/poste/:poste',
  authMiddleware,
  requirePermission('PERSONNEL_READ'),
  personnelByPosteValidator,
  validate,
  personnelController.getPersonnelByPoste
);

router.get(
  '/site/:site',
  authMiddleware,
  requirePermission('PERSONNEL_READ'),
  personnelBySiteValidator,
  validate,
  personnelController.getPersonnelBySite
);

// Route avec paramètre
router.get(
  '/:id',
  authMiddleware,
  requirePermission('PERSONNEL_READ'),
  personnelIdValidator,
  validate,
  personnelController.getPersonnelById
);

// Liste (pas de validation)
router.get('/', authMiddleware, requirePermission('PERSONNEL_READ'), personnelController.getAllPersonnel);

// POST
router.post(
  '/',
  authMiddleware,
  requirePermission('PERSONNEL_WRITE'),
  createPersonnelValidator,
  validate,
  personnelController.createPersonnel
);

// PUT
router.put(
  '/:id',
  authMiddleware,
  requirePermission('PERSONNEL_WRITE'),
  updatePersonnelValidator,
  validate,
  personnelController.updatePersonnel
);

// PATCH
router.patch(
  '/:id/statut',
  authMiddleware,
  requirePermission('PERSONNEL_WRITE'),
  changeStatutValidator,
  validate,
  personnelController.changeStatut
);

// DELETE
router.delete(
  '/:id',
  authMiddleware,
  requirePermission('PERSONNEL_WRITE'),
  personnelIdValidator,
  validate,
  personnelController.deletePersonnel
);

module.exports = router;
