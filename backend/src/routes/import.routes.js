const express = require('express');
const router = express.Router();
const importController = require('../controllers/import.controller');
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Templates
router.get('/template/commandes', authMiddleware, importController.getTemplateCommandes);
router.get('/template/planning', authMiddleware, importController.getTemplatePlanning);
router.get('/template/semaines', authMiddleware, importController.getTemplateSemaines);
router.get('/template/articles', authMiddleware, importController.getTemplateArticles);
router.get('/template/personnel', authMiddleware, importController.getTemplatePersonnel);
router.get('/template/pointage', authMiddleware, importController.getTemplatePointage);
router.get('/template/machines', authMiddleware, importController.getTemplateMachines);
router.get('/template/interventions', authMiddleware, importController.getTemplateInterventions);
router.get('/template/defauts-produit', authMiddleware, importController.getTemplateDefautsProduit);
router.get('/template/defauts-process', authMiddleware, importController.getTemplateDefautsProcess);
router.get('/template/defauts-type-machine', authMiddleware, importController.getTemplateDefautsTypeMachine);
router.get('/template/horaires', authMiddleware, importController.getTemplateHoraires);
router.get('/template/affectations', authMiddleware, importController.getTemplateAffectations);
router.get('/template/types-machine', authMiddleware, importController.getTemplateTypesMachine);

// Imports
router.post('/commandes', authMiddleware, upload.single('file'), importController.importCommandes);
router.post('/planning', authMiddleware, upload.single('file'), importController.importPlanning);
router.post('/articles', authMiddleware, upload.single('file'), importController.importArticles);
router.post('/personnel', authMiddleware, upload.single('file'), importController.importPersonnel);
router.post('/pointage', authMiddleware, upload.single('file'), importController.importPointage);
router.post('/machines', authMiddleware, upload.single('file'), importController.importMachines);
router.post('/interventions', authMiddleware, upload.single('file'), importController.importInterventions);
router.post('/defauts-produit', authMiddleware, upload.single('file'), importController.importDefautsProduit);
router.post('/defauts-process', authMiddleware, upload.single('file'), importController.importDefautsProcess);
router.post('/defauts-type-machine', authMiddleware, upload.single('file'), importController.importDefautsTypeMachine);
router.post('/horaires', authMiddleware, upload.single('file'), importController.importHorairesFile);
router.post('/affectations', authMiddleware, upload.single('file'), importController.importAffectations);
router.post('/types-machine', authMiddleware, upload.single('file'), importController.importTypesMachine);

module.exports = router;
