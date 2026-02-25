/**
 * Index centralise de tous les validateurs
 * Utilisation: const { createArticleValidator } = require('../validators');
 */

const commonValidators = require('./common.validators');
const posteValidators = require('./poste.validators');
const articleValidators = require('./article.validators');
const personnelValidators = require('./personnel.validators');
const commandeValidators = require('./commande.validators');
const machineValidators = require('./machine.validators');
const pointageValidators = require('./pointage.validators');
const interventionValidators = require('./intervention.validators');
const defautValidators = require('./defaut.validators');
const planningValidators = require('./planning.validators');
const horaireValidators = require('./horaire.validators');
const authValidators = require('./auth.validators');
const echelonsValidators = require('./echelons.validators');
const adminValidators = require('./admin.validators');
const auditValidators = require('./audit.validators');
const sessionValidators = require('./session.validators');

module.exports = {
  // Common validators
  ...commonValidators,

  // Poste validators
  ...posteValidators,

  // Article validators
  ...articleValidators,

  // Personnel validators
  ...personnelValidators,

  // Commande validators
  ...commandeValidators,

  // Machine validators
  ...machineValidators,

  // Pointage validators
  ...pointageValidators,

  // Intervention validators
  ...interventionValidators,

  // Defaut validators
  ...defautValidators,

  // Planning validators
  ...planningValidators,

  // Horaire validators
  ...horaireValidators,

  // Auth validators
  ...authValidators,

  // Echelons validators
  ...echelonsValidators,

  // Admin validators
  ...adminValidators,

  // Audit validators
  ...auditValidators,

  // Session validators
  ...sessionValidators
};
