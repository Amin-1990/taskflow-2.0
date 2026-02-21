const multer = require('multer');
const path = require('path');

// Configuration du stockage en memoire (pas sur disque)
const storage = multer.memoryStorage();

// Filtre pour n'accepter que les fichiers .xlsx et .csv
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/vnd.ms-excel'
  ];
  const ext = path.extname(file.originalname || '').toLowerCase();
  const allowedExtensions = ['.xlsx', '.csv'];

  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorise. Seuls les fichiers .xlsx et .csv sont acceptes.'), false);
  }
};

// Configuration de multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

module.exports = upload;
