const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation.middleware');
const {
  createDefautValidator,
  updateDefautValidator,
  defautIdValidator,
  defautByArticleValidator,
  defautByPosteValidator
} = require('../validators');
const defautController = require('../controllers/defautProcess.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Routes specifiques d abord
router.get(
  '/statistiques/qualite',
  authMiddleware,
  validate,
  defautController.getStatistiquesQualite
);

router.get(
  '/dashboard/aujourdhui',
  authMiddleware,
  validate,
  defautController.getDashboardAujourdhui
);

// Filtres
router.get(
  '/article/:articleId',
  authMiddleware,
  defautByArticleValidator,
  validate,
  defautController.getDefautsByArticle
);

router.get(
  '/poste/:posteId',
  authMiddleware,
  defautByPosteValidator,
  validate,
  defautController.getDefautsByPoste
);

router.get(
  '/gravite/:gravite',
  authMiddleware,
  validate,
  defautController.getDefautsByGravite
);

router.get(
  '/date/:date',
  authMiddleware,
  validate,
  defautController.getDefautsByDate
);

router.get(
  '/periode/recherche',
  authMiddleware,
  validate,
  defautController.getDefautsByPeriode
);

router.get(
  '/export/xlsx',
  authMiddleware,
  validate,
  defautController.exportDefautsProcessXlsx
);

// Liste
router.get('/', authMiddleware, defautController.getAllDefauts);

// POST
router.post(
  '/',
  authMiddleware,
  createDefautValidator,
  validate,
  defautController.createDefaut
);

// PUT
router.put(
  '/:id',
  authMiddleware,
  updateDefautValidator,
  validate,
  defautController.updateDefaut
);

// DELETE
router.delete(
  '/:id',
  authMiddleware,
  defautIdValidator,
  validate,
  defautController.deleteDefaut
);

// Route parametree en dernier
router.get(
  '/:id',
  authMiddleware,
  defautIdValidator,
  validate,
  defautController.getDefautById
);

module.exports = router;
