const express = require('express');
const router = express.Router();
const importController = require('../controllers/import.controller');
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const { requirePermission } = require('../middleware/authorization.middleware');

// Templates
router.get('/template/commandes', authMiddleware, requirePermission('IMPORT_READ'), importController.getTemplateCommandes);
router.get('/template/planning', authMiddleware, requirePermission('IMPORT_READ'), importController.getTemplatePlanning);
router.get('/template/semaines', authMiddleware, requirePermission('IMPORT_READ'), importController.getTemplateSemaines);
router.get('/template/articles', authMiddleware, requirePermission('IMPORT_READ'), importController.getTemplateArticles);
router.get('/template/personnel', authMiddleware, requirePermission('IMPORT_READ'), importController.getTemplatePersonnel);
router.get('/template/pointage', authMiddleware, requirePermission('IMPORT_READ'), importController.getTemplatePointage);
router.get('/template/machines', authMiddleware, requirePermission('IMPORT_READ'), importController.getTemplateMachines);
router.get('/template/interventions', authMiddleware, requirePermission('IMPORT_READ'), importController.getTemplateInterventions);
router.get('/template/defauts-produit', authMiddleware, requirePermission('IMPORT_READ'), importController.getTemplateDefautsProduit);
router.get('/template/defauts-process', authMiddleware, requirePermission('IMPORT_READ'), importController.getTemplateDefautsProcess);
router.get('/template/defauts-type-machine', authMiddleware, requirePermission('IMPORT_READ'), importController.getTemplateDefautsTypeMachine);
router.get('/template/horaires', authMiddleware, requirePermission('IMPORT_READ'), importController.getTemplateHoraires);
router.get('/template/affectations', authMiddleware, requirePermission('IMPORT_READ'), importController.getTemplateAffectations);
router.get('/template/types-machine', authMiddleware, requirePermission('IMPORT_READ'), importController.getTemplateTypesMachine);

// Imports
router.post('/commandes', authMiddleware, requirePermission('IMPORT_WRITE'), upload.single('file'), importController.importCommandes);
router.post('/planning', authMiddleware, requirePermission('IMPORT_WRITE'), upload.single('file'), importController.importPlanning);
router.post('/articles', authMiddleware, requirePermission('IMPORT_WRITE'), upload.single('file'), importController.importArticles);
router.post('/personnel', authMiddleware, requirePermission('IMPORT_WRITE'), upload.single('file'), importController.importPersonnel);
router.post('/pointage', authMiddleware, requirePermission('IMPORT_WRITE'), upload.single('file'), importController.importPointage);
router.post('/machines', authMiddleware, requirePermission('IMPORT_WRITE'), upload.single('file'), importController.importMachines);
router.post('/interventions', authMiddleware, requirePermission('IMPORT_WRITE'), upload.single('file'), importController.importInterventions);
router.post('/defauts-produit', authMiddleware, requirePermission('IMPORT_WRITE'), upload.single('file'), importController.importDefautsProduit);
router.post('/defauts-process', authMiddleware, requirePermission('IMPORT_WRITE'), upload.single('file'), importController.importDefautsProcess);
router.post('/defauts-type-machine', authMiddleware, requirePermission('IMPORT_WRITE'), upload.single('file'), importController.importDefautsTypeMachine);
router.post('/horaires', authMiddleware, requirePermission('IMPORT_WRITE'), upload.single('file'), importController.importHorairesFile);
router.post('/affectations', authMiddleware, requirePermission('IMPORT_WRITE'), upload.single('file'), importController.importAffectations);
router.post('/types-machine', authMiddleware, requirePermission('IMPORT_WRITE'), upload.single('file'), importController.importTypesMachine);

module.exports = router;
