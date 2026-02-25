const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation.middleware');
const { idValidator, userIdValidator, sessionListQueryValidator } = require('../validators');
const sessionController = require('../controllers/session.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/authorization.middleware');

router.use(authMiddleware);

router.get('/statistiques/resume', requirePermission('SESSIONS_READ'), validate, sessionController.getStatistiques);
router.delete('/expirees', requirePermission('SESSIONS_WRITE'), validate, sessionController.nettoyerSessionsExpirees);

router.get('/utilisateur/:userId', requirePermission('SESSIONS_READ'), userIdValidator, validate, sessionController.getSessionsByUser);
router.post('/deconnecter/toutes/:userId', requirePermission('SESSIONS_WRITE'), userIdValidator, validate, sessionController.deconnecterToutesSessions);

router.get('/:id', requirePermission('SESSIONS_READ'), idValidator, validate, sessionController.getSessionById);
router.get('/', requirePermission('SESSIONS_READ'), sessionListQueryValidator, validate, sessionController.getAllSessions);

router.patch('/:id/activite', requirePermission('SESSIONS_WRITE'), idValidator, validate, sessionController.updateActivite);
router.patch('/:id/deconnecter', requirePermission('SESSIONS_WRITE'), idValidator, validate, sessionController.deconnecterSession);

module.exports = router;
