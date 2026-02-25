const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation.middleware');
const {
  createArticleValidator,
  updateArticleValidator,
  articleIdValidator,
  articleCodeValidator,
  articleStatutValidator,
  articleClientValidator,
  toggleValideValidator
} = require('../validators');
const articleController = require('../controllers/article.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/authorization.middleware');

// Routes spécifiques D'ABORD
router.get(
  '/code/:code',
  authMiddleware,
  requirePermission('ARTICLES_READ'),
  articleCodeValidator,
  validate,
  articleController.getArticleByCode
);

router.get(
  '/statut/:statut',
  authMiddleware,
  requirePermission('ARTICLES_READ'),
  articleStatutValidator,
  validate,
  articleController.getArticlesByStatut
);

router.get(
  '/client/:client',
  authMiddleware,
  requirePermission('ARTICLES_READ'),
  articleClientValidator,
  validate,
  articleController.getArticlesByClient
);

// Route avec paramètre
router.get(
  '/:id',
  authMiddleware,
  requirePermission('ARTICLES_READ'),
  articleIdValidator,
  validate,
  articleController.getArticleById
);

// Liste (pas de validation)
router.get('/', authMiddleware, requirePermission('ARTICLES_READ'), articleController.getAllArticles);

// POST
router.post(
  '/',
  authMiddleware,
  requirePermission('ARTICLES_WRITE'),
  createArticleValidator,
  validate,
  articleController.createArticle
);

// PUT
router.put(
  '/:id',
  authMiddleware,
  requirePermission('ARTICLES_WRITE'),
  updateArticleValidator,
  validate,
  articleController.updateArticle
);

// PATCH
router.patch(
  '/:id/valider',
  authMiddleware,
  requirePermission('ARTICLES_WRITE'),
  toggleValideValidator,
  validate,
  articleController.toggleValide
);

// DELETE
router.delete(
  '/:id',
  authMiddleware,
  requirePermission('ARTICLES_WRITE'),
  articleIdValidator,
  validate,
  articleController.deleteArticle
);

module.exports = router;
