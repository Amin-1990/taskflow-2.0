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
router.get('/template/defauts-produit', authMiddleware, importController.getTemplateDefautsProduit);
router.get('/template/defauts-process', authMiddleware, importController.getTemplateDefautsProcess);
router.get('/template/horaires', authMiddleware, importController.getTemplateHoraires);

// Imports
router.post('/commandes', authMiddleware, upload.single('file'), importController.importCommandes);
router.post('/planning', authMiddleware, upload.single('file'), importController.importPlanning);
router.post('/articles', authMiddleware, upload.single('file'), importController.importArticles);
router.post('/personnel', authMiddleware, upload.single('file'), importController.importPersonnel);
router.post('/pointage', authMiddleware, upload.single('file'), importController.importPointage);
router.post('/defauts-produit', authMiddleware, upload.single('file'), importController.importDefautsProduit);
router.post('/defauts-process', authMiddleware, upload.single('file'), importController.importDefautsProcess);
router.post('/horaires', authMiddleware, upload.single('file'), importController.importHorairesFile);

module.exports = router;
