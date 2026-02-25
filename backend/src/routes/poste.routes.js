const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation.middleware');
const { idValidator, createPosteValidator, updatePosteValidator } = require('../validators');
const posteController = require('../controllers/poste.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/authorization.middleware');

// Routes CRUD pour postes
router.get('/', authMiddleware, requirePermission('POSTES_READ'), posteController.getAllPostes);

router.get(
  '/:id',
  authMiddleware,
  requirePermission('POSTES_READ'),
  idValidator,
  validate,
  posteController.getPosteById
);

router.post(
  '/',
  authMiddleware,
  requirePermission('POSTES_WRITE'),
  createPosteValidator,
  validate,
  posteController.createPoste
);

router.put(
  '/:id',
  authMiddleware,
  requirePermission('POSTES_WRITE'),
  updatePosteValidator,
  validate,
  posteController.updatePoste
);

router.delete(
  '/:id',
  authMiddleware,
  requirePermission('POSTES_WRITE'),
  idValidator,
  validate,
  posteController.deletePoste
);

module.exports = router;
