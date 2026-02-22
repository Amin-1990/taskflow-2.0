const fs = require('fs');
const path = require('path');

exports.getVersion = (req, res) => {
  const appVersion = process.env.MOBILE_APP_VERSION || '1.0.0';

  const explicitApkUrl = process.env.MOBILE_APP_APK_URL;
  const protocol = req.protocol || 'http';
  const host = req.get('host');
  const fallbackApkUrl = `${protocol}://${host}/api/mobile-app/latest.apk`;

  res.json({
    success: true,
    data: {
      version: appVersion,
      apk_url: explicitApkUrl || fallbackApkUrl,
      mandatory: false,
      notes: process.env.MOBILE_APP_RELEASE_NOTES || 'Corrections et ameliorations de l interface.'
    }
  });
};

exports.downloadLatestApk = (req, res) => {
  const defaultPath = path.join(process.cwd(), 'updates', 'taskflow-mobile-latest.apk');
  const apkPath = process.env.MOBILE_APP_APK_PATH || defaultPath;

  if (!fs.existsSync(apkPath)) {
    return res.status(404).json({
      success: false,
      error: 'APK introuvable. Placez le fichier dans backend/updates/taskflow-mobile-latest.apk ou configurez MOBILE_APP_APK_PATH.'
    });
  }

  return res.download(apkPath, 'taskflow-mobile-latest.apk');
};
