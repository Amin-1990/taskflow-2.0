const express = require('express');
const router = express.Router();
const mobileAppController = require('../controllers/mobileApp.controller');

router.get('/version', mobileAppController.getVersion);
router.get('/latest.apk', mobileAppController.downloadLatestApk);

module.exports = router;
