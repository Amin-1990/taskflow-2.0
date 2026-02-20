const express = require('express');
const router = express.Router();

// Importer les routes
const authRoutes = require('./auth.routes');  // ✅ NOUVEAU - Routes d'authentification
const exportRoutes = require('./export.routes');
const importRoutes = require('./import.routes'); 
const posteRoutes = require('./poste.routes');
const typeMachineRoutes = require('./typeMachine.routes');
const articleRoutes = require('./article.routes');
const personnelRoutes = require('./personnel.routes');
const commandeRoutes = require('./commande.routes');
const machineRoutes = require('./machine.routes');
const pointageRoutes = require('./pointage.routes');
const demandeInterventionRoutes = require('./demandeIntervention.routes');
const defautProcessRoutes = require('./defautProcess.routes');
const planningHebdoRoutes = require('./planningHebdo.routes');
const articleMachineTestRoutes = require('./articleMachineTest.routes');
const listeDefautsProduitRoutes = require('./listeDefautsProduit.routes');
const defautTypeMachineRoutes = require('./defautTypeMachine.routes');
const affectationRoutes = require('./affectation.routes');
const horaireRoutes = require('./horaire.routes');
const sessionRoutes = require('./session.routes');
const auditRoutes = require('./audit.routes');
const indicateursRoutes = require('./indicateurs.routes');
const semainesRoutes = require('./semaines.routes');
const filtresRoutes = require('./filtres.routes');
const echelonsRoutes = require('./echelons.routes');

// Route de santé (publique)
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    database: process.env.DB_NAME,
    timezone: process.env.DB_TIMEZONE
  });
});

// ✅ ROUTES PUBLIQUES (accessible sans authentification)
router.use('/auth', authRoutes);

// ⚠️ POUR L'INSTANT - Routes non protégées (seront sécurisées à l'étape 2)
// Dans l'étape suivante, on ajoutera authMiddleware sur chaque route
router.use('/postes', posteRoutes);
router.use('/export', exportRoutes); 
router.use('/import', importRoutes);
router.use('/types-machine', typeMachineRoutes);
router.use('/articles', articleRoutes);
router.use('/personnel', personnelRoutes);
router.use('/commandes', commandeRoutes);
router.use('/machines', machineRoutes);
router.use('/pointage', pointageRoutes);
router.use('/interventions', demandeInterventionRoutes);
router.use('/defauts-process', defautProcessRoutes);
router.use('/planning', planningHebdoRoutes);
router.use('/articles-machines-test', articleMachineTestRoutes);
router.use('/defauts-produit', listeDefautsProduitRoutes);
router.use('/defauts-type-machine', defautTypeMachineRoutes);
router.use('/affectations', affectationRoutes);
router.use('/horaires', horaireRoutes);
router.use('/sessions', sessionRoutes);
router.use('/audit', auditRoutes);
router.use('/indicateurs', indicateursRoutes);
router.use('/semaines', semainesRoutes);
router.use('/filtres', filtresRoutes);
router.use('/echelons', echelonsRoutes);

module.exports = router;
