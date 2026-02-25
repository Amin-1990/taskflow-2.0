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

router.get('/statistiques/resume', requirePermission('AUDIT_READ'), auditDateRangeRequiredQueryValidator, validate, auditController.getStatistiques);
router.get('/export/fichier', requirePermission('AUDIT_READ'), auditExportQueryValidator, validate, auditController.exportLogs);
router.get('/utilisateur/:userId', requirePermission('AUDIT_READ'), userIdValidator, validate, auditController.getLogsByUser);
router.get('/table/:table', requirePermission('AUDIT_READ'), auditTableParamValidator, validate, auditController.getLogsByTable);
router.get('/action/:action', requirePermission('AUDIT_READ'), auditActionParamValidator, validate, auditController.getLogsByAction);
router.get('/date/:date', requirePermission('AUDIT_READ'), auditDateParamValidator, validate, auditController.getLogsByDate);
router.get('/periode/recherche', requirePermission('AUDIT_READ'), auditPeriodeQueryValidator, validate, auditController.getLogsByPeriode);
router.get('/enregistrement/:table/:id', requirePermission('AUDIT_READ'), auditHistoriqueParamsValidator, validate, auditController.getHistoriqueEnregistrement);
router.get('/:id', requirePermission('AUDIT_READ'), idValidator, validate, auditController.getLogById);
router.get('/', requirePermission('AUDIT_READ'), validate, auditController.getAllLogs);

router.post('/', requirePermission('AUDIT_WRITE'), auditCreateLogValidator, validate, auditController.createLog);
router.delete('/ancien/:jours', requirePermission('AUDIT_WRITE'), auditPurgeDaysParamValidator, validate, auditController.supprimerAnciensLogs);

module.exports = router;
