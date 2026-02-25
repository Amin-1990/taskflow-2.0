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
const { requirePermission } = require('../middleware/authorization.middleware');

// Routes specifiques d abord
router.get(
  '/statistiques/qualite',
  authMiddleware,
  requirePermission('DEFAUTS_PROCESS_READ'),
  validate,
  defautController.getStatistiquesQualite
);

router.get(
  '/dashboard/aujourdhui',
  authMiddleware,
  requirePermission('DEFAUTS_PROCESS_READ'),
  validate,
  defautController.getDashboardAujourdhui
);

// Filtres
router.get(
  '/article/:articleId',
  authMiddleware,
  requirePermission('DEFAUTS_PROCESS_READ'),
  defautByArticleValidator,
  validate,
  defautController.getDefautsByArticle
);

router.get(
  '/poste/:posteId',
  authMiddleware,
  requirePermission('DEFAUTS_PROCESS_READ'),
  defautByPosteValidator,
  validate,
  defautController.getDefautsByPoste
);

router.get(
  '/gravite/:gravite',
  authMiddleware,
  requirePermission('DEFAUTS_PROCESS_READ'),
  validate,
  defautController.getDefautsByGravite
);

router.get(
  '/date/:date',
  authMiddleware,
  requirePermission('DEFAUTS_PROCESS_READ'),
  validate,
  defautController.getDefautsByDate
);

router.get(
  '/periode/recherche',
  authMiddleware,
  requirePermission('DEFAUTS_PROCESS_READ'),
  validate,
  defautController.getDefautsByPeriode
);

router.get(
  '/export/xlsx',
  authMiddleware,
  requirePermission('DEFAUTS_PROCESS_READ'),
  validate,
  defautController.exportDefautsProcessXlsx
);

// Liste
router.get('/', authMiddleware, requirePermission('DEFAUTS_PROCESS_READ'), defautController.getAllDefauts);

// POST
router.post(
  '/',
  authMiddleware,
  requirePermission('DEFAUTS_PROCESS_WRITE'),
  createDefautValidator,
  validate,
  defautController.createDefaut
);

// PUT
router.put(
  '/:id',
  authMiddleware,
  requirePermission('DEFAUTS_PROCESS_WRITE'),
  updateDefautValidator,
  validate,
  defautController.updateDefaut
);

// DELETE
router.delete(
  '/:id',
  authMiddleware,
  requirePermission('DEFAUTS_PROCESS_WRITE'),
  defautIdValidator,
  validate,
  defautController.deleteDefaut
);

// Route parametree en dernier
router.get(
  '/:id',
  authMiddleware,
  requirePermission('DEFAUTS_PROCESS_READ'),
  defautIdValidator,
  validate,
  defautController.getDefautById
);

module.exports = router;
