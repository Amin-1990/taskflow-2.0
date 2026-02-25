const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation.middleware');
const {
  idValidator,
  userIdValidator,
  auditTableParamValidator,
  auditActionParamValidator,
  auditDateParamValidator,
  auditHistoriqueParamsValidator,
  auditPurgeDaysParamValidator,
  auditDateRangeRequiredQueryValidator,
  auditPeriodeQueryValidator,
  auditExportQueryValidator,
  auditCreateLogValidator
} = require('../validators');
const auditController = require('../controllers/audit.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/authorization.middleware');

router.use(authMiddleware);
router.use(requirePermission('AUDIT_READ'));

router.get('/statistiques/resume', auditDateRangeRequiredQueryValidator, validate, auditController.getStatistiques);
router.get('/export/fichier', auditExportQueryValidator, validate, auditController.exportLogs);
router.get('/utilisateur/:userId', userIdValidator, validate, auditController.getLogsByUser);
router.get('/table/:table', auditTableParamValidator, validate, auditController.getLogsByTable);
router.get('/action/:action', auditActionParamValidator, validate, auditController.getLogsByAction);
router.get('/date/:date', auditDateParamValidator, validate, auditController.getLogsByDate);
router.get('/periode/recherche', auditPeriodeQueryValidator, validate, auditController.getLogsByPeriode);
router.get('/enregistrement/:table/:id', auditHistoriqueParamsValidator, validate, auditController.getHistoriqueEnregistrement);
router.get('/:id', idValidator, validate, auditController.getLogById);
router.get('/', validate, auditController.getAllLogs);

router.post('/', requirePermission('AUDIT_WRITE'), auditCreateLogValidator, validate, auditController.createLog);
router.delete('/ancien/:jours', requirePermission('AUDIT_WRITE'), auditPurgeDaysParamValidator, validate, auditController.supprimerAnciensLogs);

module.exports = router;
