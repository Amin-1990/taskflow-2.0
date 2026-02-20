/**
 * Script de test de l'API indicateurs
 * Vérifie que le endpoint /api/indicateurs répond sans erreur 500
 */

const db = require('./src/config/database');
const indicateursService = require('./src/services/indicateurs.service');

async function testIndicateurs() {
  console.log('🧪 Test du service indicateurs...\n');

  try {
    console.log('1️⃣ Test getIndicateursProduction...');
    const production = await indicateursService.getIndicateursProduction('jour');
    console.log('✅ Production OK');
    console.log(JSON.stringify(production, null, 2));

    console.log('\n2️⃣ Test getIndicateursQualite...');
    const qualite = await indicateursService.getIndicateursQualite('jour');
    console.log('✅ Qualité OK');
    console.log(JSON.stringify(qualite, null, 2));

    console.log('\n3️⃣ Test getIndicateursMaintenance...');
    const maintenance = await indicateursService.getIndicateursMaintenance('jour');
    console.log('✅ Maintenance OK');
    console.log(JSON.stringify(maintenance, null, 2));

    console.log('\n4️⃣ Test getIndicateursRH...');
    const rh = await indicateursService.getIndicateursRH('jour');
    console.log('✅ RH OK');
    console.log(JSON.stringify(rh, null, 2));

    console.log('\n5️⃣ Test getAllIndicateurs...');
    const all = await indicateursService.getAllIndicateurs('jour');
    console.log('✅ Tous les indicateurs OK');
    console.log(JSON.stringify(all, null, 2));

    console.log('\n\n✅ TOUS LES TESTS RÉUSSIS!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testIndicateurs();
