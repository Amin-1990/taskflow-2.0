const { body, param } = require('express-validator');

/**
 * Validateur pour créer une machine
 */
exports.createMachineValidator = [
  body('Type_machine_id')
    .notEmpty().withMessage('Type machine requis')
    .isInt({ min: 1 }).withMessage('Type machine doit être un entier positif')
    .toInt(),
  
  body('Nom_machine')
    .notEmpty().withMessage('Nom machine requis')
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Nom machine doit faire 1-100 caractères'),
  
  body('Numero_serie')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Numéro série max 50 caractères'),
  
  body('Code_interne')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Code interne max 50 caractères'),
  
  body('Description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description max 500 caractères'),
  
  body('Marque')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Marque max 50 caractères'),
  
  body('Modele')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Modèle max 50 caractères'),
  
  body('Annee_fabrication')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() }).withMessage('Année fabrication invalide')
    .toInt(),
  
  body('Date_installation')
    .optional()
    .isISO8601().withMessage('Date installation invalide (format: YYYY-MM-DD)'),
  
  body('Fournisseur')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Fournisseur max 50 caractères'),
  
  body('Constructeur')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Constructeur max 50 caractères'),
  
  body('Site_affectation')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Site affectation max 50 caractères'),
  
  body('Emplacement_detail')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Emplacement détail max 100 caractères'),
  
  body('Puissance_kw')
    .optional()
    .isDecimal().withMessage('Puissance doit être un nombre décimal')
    .toFloat(),
  
  body('Consommation_air_m3h')
    .optional()
    .isDecimal().withMessage('Consommation air doit être un nombre décimal')
    .toFloat(),
  
  body('Poids_kg')
    .optional()
    .isDecimal().withMessage('Poids doit être un nombre décimal')
    .toFloat(),
  
  body('Dimensions_lxhxp')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Dimensions max 50 caractères'),
  
  body('Vitesse_moteur_trmin')
    .optional()
    .isInt({ min: 0 }).withMessage('Vitesse moteur doit être un entier positif')
    .toInt(),
  
  body('Capacite_production')
    .optional()
    .isDecimal().withMessage('Capacité production doit être un nombre décimal')
    .toFloat(),
  
  body('Frequence_maintenance_preventive')
    .optional()
    .isInt({ min: 1 }).withMessage('Fréquence maintenance doit être un entier positif')
    .toInt(),
  
  body('Duree_maintenance_moyenne_min')
    .optional()
    .isInt({ min: 0 }).withMessage('Durée maintenance doit être un entier positif')
    .toInt(),
  
  body('Statut_operationnel')
    .optional()
    .isIn(['operationnel', 'en_maintenance', 'hors_service'])
    .withMessage('Statut opérationnel invalide'),
  
  body('Date_derniere_maintenance')
    .optional()
    .isISO8601().withMessage('Date dernière maintenance invalide'),
  
  body('Date_prochaine_maintenance')
    .optional()
    .isISO8601().withMessage('Date prochaine maintenance invalide'),
  
  body('Lien_manuel_pdf')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Lien manuel PDF max 255 caractères'),
  
  body('Lien_fiche_technique')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Lien fiche technique max 255 caractères'),
  
  body('Lien_photo')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Lien photo max 255 caractères'),
  
  body('Lien_plan')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Lien plan max 255 caractères'),
  
  body('Date_achat')
    .optional()
    .isISO8601().withMessage('Date achat invalide'),
  
  body('Prix_achat')
    .optional()
    .isDecimal().withMessage('Prix achat doit être un nombre décimal')
    .toFloat(),
  
  body('Duree_garantie_mois')
    .optional()
    .isInt({ min: 0 }).withMessage('Durée garantie doit être un entier positif')
    .toInt(),
  
  body('Date_fin_garantie')
    .optional()
    .isISO8601().withMessage('Date fin garantie invalide'),
  
  body('Amortissement_ans')
    .optional()
    .isInt({ min: 1 }).withMessage('Amortissement doit être un entier positif')
    .toInt(),
  
  body('Valeur_residuelle')
    .optional()
    .isDecimal().withMessage('Valeur résiduelle doit être un nombre décimal')
    .toFloat(),
  
  body('Qr_code')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('QR code max 100 caractères'),
  
  body('Code_barre')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Code barre max 50 caractères'),
  
  body('Commentaire')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Commentaire max 500 caractères'),
  
  body('Statut')
    .optional()
    .isIn(['actif', 'inactif'])
    .withMessage('Statut invalide (actif, inactif)')
];

/**
 * Validateur pour modifier une machine
 */
exports.updateMachineValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID machine invalide')
    .toInt(),
  ...exports.createMachineValidator.map(v => {
    // Rendre tous les champs optionnels pour UPDATE
    if (v._args && v._args[0] === 'Type_machine_id') {
      return body('Type_machine_id')
        .optional()
        .isInt({ min: 1 }).withMessage('Type machine doit être un entier positif')
        .toInt();
    }
    if (v._args && v._args[0] === 'Nom_machine') {
      return body('Nom_machine')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 }).withMessage('Nom machine doit faire 1-100 caractères');
    }
    return v;
  })
];

/**
 * Validateur pour récupérer une machine par ID
 */
exports.machineIdValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID machine invalide')
    .toInt()
];

/**
 * Validateur pour récupérer par code interne
 */
exports.machineCodeValidator = [
  param('code')
    .notEmpty().withMessage('Code requis')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Code invalide')
];

/**
 * Validateur pour filtrer par site
 */
exports.machineBySiteValidator = [
  param('site')
    .notEmpty().withMessage('Site requis')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Site invalide')
];

/**
 * Validateur pour filtrer par type
 */
exports.machineByTypeValidator = [
  param('typeId')
    .isInt({ min: 1 }).withMessage('ID type invalide')
    .toInt()
];

/**
 * Validateur pour filtrer par statut opérationnel
 */
exports.machineByStatutValidator = [
  param('statut')
    .isIn(['operationnel', 'en_maintenance', 'hors_service'])
    .withMessage('Statut invalide')
];
