const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation.middleware');
const { idValidator } = require('../validators');
const sessionController = require('../controllers/session.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Routes spécifiques D'ABORD
router.get(
  '/statistiques/resume',
  authMiddleware,
  validate,
  sessionController.getStatistiques
);

router.delete(
  '/expirees',
  authMiddleware,
  validate,
  sessionController.nettoyerSessionsExpirees
);

// Routes par utilisateur
router.get(
  '/utilisateur/:userId',
  authMiddleware,
  idValidator,
  validate,
  sessionController.getSessionsByUser
);

router.post(
  '/deconnecter/toutes/:userId',
  authMiddleware,
  idValidator,
  validate,
  sessionController.deconnecterToutesSessions
);

// Routes par token
router.get(
  '/token/:token',
  authMiddleware,
  validate,
  sessionController.getSessionByToken
);

router.get(
  '/verifier/:token',
  authMiddleware,
  validate,
  sessionController.verifierToken
);

// Route avec paramètre
router.get(
  '/:id',
  authMiddleware,
  idValidator,
  validate,
  sessionController.getSessionById
);

// Liste (pas de validation)
router.get('/', authMiddleware, sessionController.getAllSessions);

// POST
router.post(
  '/',
  authMiddleware,
  validate,
  sessionController.createSession
);

// Actions sur les sessions
router.patch(
  '/:id/activite',
  authMiddleware,
  idValidator,
  validate,
  sessionController.updateActivite
);

router.patch(
  '/:id/deconnecter',
  authMiddleware,
  idValidator,
  validate,
  sessionController.deconnecterSession
);

module.exports = router;