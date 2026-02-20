const multer = require('multer');
const path = require('path');

// Configuration du stockage en mémoire (pas sur disque)
const storage = multer.memoryStorage();

// Filtre pour n'accepter que les fichiers Excel
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Seuls les fichiers Excel sont acceptés.'), false);
  }
};

// Configuration de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

module.exports = upload;