const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation.middleware');
const { idValidator } = require('../validators');
const auditController = require('../controllers/audit.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Routes spécifiques D'ABORD
router.get(
  '/statistiques/resume',
  authMiddleware,
  validate,
  auditController.getStatistiques
);

router.get(
  '/export/fichier',
  authMiddleware,
  validate,
  auditController.exportLogs
);

router.delete(
  '/ancien/:jours',
  authMiddleware,
  validate,
  auditController.supprimerAnciensLogs
);

// Routes de recherche
router.get(
  '/utilisateur/:userId',
  authMiddleware,
  idValidator,
  validate,
  auditController.getLogsByUser
);

router.get(
  '/table/:table',
  authMiddleware,
  validate,
  auditController.getLogsByTable
);

router.get(
  '/action/:action',
  authMiddleware,
  validate,
  auditController.getLogsByAction
);

router.get(
  '/date/:date',
  authMiddleware,
  validate,
  auditController.getLogsByDate
);

router.get(
  '/periode/recherche',
  authMiddleware,
  validate,
  auditController.getLogsByPeriode
);

router.get(
  '/enregistrement/:table/:id',
  authMiddleware,
  validate,
  auditController.getHistoriqueEnregistrement
);

// Route avec paramètre
router.get(
  '/:id',
  authMiddleware,
  idValidator,
  validate,
  auditController.getLogById
);

// Liste (pas de validation)
router.get('/', authMiddleware, auditController.getAllLogs);

// POST
router.post(
  '/',
  authMiddleware,
  validate,
  auditController.createLog
);

module.exports = router;