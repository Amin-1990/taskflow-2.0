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

// Routes spécifiques D'ABORD
router.get(
  '/code/:code',
  authMiddleware,
  articleCodeValidator,
  validate,
  articleController.getArticleByCode
);

router.get(
  '/statut/:statut',
  authMiddleware,
  articleStatutValidator,
  validate,
  articleController.getArticlesByStatut
);

router.get(
  '/client/:client',
  authMiddleware,
  articleClientValidator,
  validate,
  articleController.getArticlesByClient
);

// Route avec paramètre
router.get(
  '/:id',
  authMiddleware,
  articleIdValidator,
  validate,
  articleController.getArticleById
);

// Liste (pas de validation)
router.get('/', authMiddleware, articleController.getAllArticles);

// POST
router.post(
  '/',
  authMiddleware,
  createArticleValidator,
  validate,
  articleController.createArticle
);

// PUT
router.put(
  '/:id',
  authMiddleware,
  updateArticleValidator,
  validate,
  articleController.updateArticle
);

// PATCH
router.patch(
  '/:id/valider',
  authMiddleware,
  toggleValideValidator,
  validate,
  articleController.toggleValide
);

// DELETE
router.delete(
  '/:id',
  authMiddleware,
  articleIdValidator,
  validate,
  articleController.deleteArticle
);

module.exports = router;