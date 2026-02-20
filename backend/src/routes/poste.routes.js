const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation.middleware');
const { idValidator } = require('../validators');
const posteController = require('../controllers/poste.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Routes CRUD pour postes
router.get('/', authMiddleware, posteController.getAllPostes);

router.get(
  '/:id',
  authMiddleware,
  idValidator,
  validate,
  posteController.getPosteById
);

router.post('/', authMiddleware, posteController.createPoste);

router.put(
  '/:id',
  authMiddleware,
  idValidator,
  validate,
  posteController.updatePoste
);

router.delete(
  '/:id',
  authMiddleware,
  idValidator,
  validate,
  posteController.deletePoste
);

module.exports = router;