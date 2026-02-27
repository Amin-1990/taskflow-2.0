/**
 * Script de test pour le service centralisé des indicateurs
 * 
 * Utilisation: node test-indicateurs.js
 */

require('dotenv').config();

const indicateurs = require('./src/services/indicateurs.service');

async function testAllIndicateurs() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  🧪 TEST SERVICE INDICATEURS CENTRALISÉ               ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    console.log('📊 Récupération de tous les indicateurs (période: jour)...\n');
    const result = await indicateurs.getAllIndicateurs('jour');
    
    console.log('✅ Réponse reçue avec succès:\n');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('\n' + '='.repeat(60));
    console.log('RÉSUMÉ');
    console.log('='.repeat(60));
    
    if (result.production) {
      console.log('\n📦 PRODUCTION');
      console.log(`  - Commandes: ${result.production.commandes?.total || 0}`);
      console.log(`  - Taux rendement: ${result.production.taux_rendement}%`);
      console.log(`  - Taux avancement: ${result.production.taux_avancement}%`);
    }
    
    if (result.qualite) {
      console.log('\n✨ QUALITÉ');
      console.log(`  - Taux conformité: ${result.qualite.taux_conformite}%`);
      console.log(`  - Taux qualité: ${result.qualite.taux_qualite}%`);
    }
    
    if (result.maintenance) {
      console.log('\n🔧 MAINTENANCE');
      console.log(`  - Machines: ${result.maintenance.machines?.total || 0}`);
      console.log(`  - Disponibilité: ${result.maintenance.disponibilite}%`);
      console.log(`  - Interventions: ${result.maintenance.interventions?.total || 0}`);
    }
    
    if (result.rh) {
      console.log('\n👥 RESSOURCES HUMAINES');
      console.log(`  - Personnel actif: ${result.rh.personnel?.actif || 0}`);
      console.log(`  - Taux présence: ${result.rh.taux_presence}%`);
      console.log(`  - Taux absence: ${result.rh.taux_absence}%`);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    process.exit(1);
  }
}

async function testByPeriode() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  🧪 TEST PAR PÉRIODE                                   ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const periodes = ['jour', 'semaine', 'mois', 'annee'];
  
  for (const periode of periodes) {
    try {
      console.log(`📅 Teste période: ${periode}`);
      const result = await indicateurs.getAllIndicateurs(periode);
      
      console.log(`   ✅ Production: ${result.production?.commandes?.total || 0} commandes`);
      console.log(`   ✅ Qualité: ${result.qualite?.taux_conformite}% conformité`);
      console.log(`   ✅ Maintenance: ${result.maintenance?.machines?.total || 0} machines`);
      console.log(`   ✅ RH: ${result.rh?.personnel?.actif || 0} personnel actif\n`);
    } catch (error) {
      console.error(`   ❌ Erreur pour ${periode}:`, error.message);
    }
  }
}

async function testIndividualModules() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  🧪 TEST MODULES INDIVIDUELS                           ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    console.log('📦 Production...');
    const prod = await indicateurs.getIndicateursProduction('jour');
    console.log('   ✅', JSON.stringify(prod).length, 'bytes\n');

    console.log('✨ Qualité...');
    const qual = await indicateurs.getIndicateursQualite('jour');
    console.log('   ✅', JSON.stringify(qual).length, 'bytes\n');

    console.log('🔧 Maintenance...');
    const maint = await indicateurs.getIndicateursMaintenance('jour');
    console.log('   ✅', JSON.stringify(maint).length, 'bytes\n');

    console.log('👥 RH...');
    const rh = await indicateurs.getIndicateursRH('jour');
    console.log('   ✅', JSON.stringify(rh).length, 'bytes\n');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

async function main() {
  await testAllIndicateurs();
  await testByPeriode();
  await testIndividualModules();
  
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  ✅ TOUS LES TESTS COMPLÉTÉS                           ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
}

main().catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});
