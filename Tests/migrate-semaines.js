/**
 * Migration script: Update semaines table
 * Adds Numero_semaine, Annee, and Mois columns
 */

require('dotenv').config();
const db = require('./src/config/database');

async function migrate() {
  const connection = await db.getConnection();
  
  try {
    console.log('🔄 Démarrage de la migration...\n');
    
    // 1. Ajouter les colonnes
    console.log('1️⃣  Ajout des colonnes manquantes...');
    
    // Vérifier si les colonnes existent avant de les ajouter
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'semaines' AND TABLE_SCHEMA = DATABASE()
    `);
    
    const columnNames = columns.map(col => col.COLUMN_NAME);
    const columnsToAdd = [];
    
    if (!columnNames.includes('Numero_semaine')) {
      columnsToAdd.push('ADD COLUMN Numero_semaine INT DEFAULT NULL AFTER Code_semaine');
    }
    if (!columnNames.includes('Annee')) {
      columnsToAdd.push('ADD COLUMN Annee INT DEFAULT NULL AFTER Numero_semaine');
    }
    if (!columnNames.includes('Mois')) {
      columnsToAdd.push('ADD COLUMN Mois INT DEFAULT NULL AFTER Annee');
    }
    
    if (columnsToAdd.length > 0) {
      await connection.query(`ALTER TABLE semaines ${columnsToAdd.join(', ')}`);
      console.log(`   ✅ ${columnsToAdd.length} colonne(s) ajoutée(s)\n`);
    } else {
      console.log('   ℹ️  Les colonnes existent déjà\n');
    }
    
    // 2. Remplir Annee et Mois
    console.log('2️⃣  Remplissage des colonnes Annee et Mois...');
    await connection.query(`
      UPDATE semaines 
      SET 
        Annee = YEAR(Date_debut),
        Mois = MONTH(Date_debut)
      WHERE Annee IS NULL OR Mois IS NULL
    `);
    console.log('   ✅ Colonnes Annee et Mois remplies\n');
    
    // 3. Remplir Numero_semaine à partir de Code_semaine
    console.log('3️⃣  Extraction du Numero_semaine depuis Code_semaine...');
    const [rows] = await connection.query('SELECT * FROM semaines WHERE Numero_semaine IS NULL LIMIT 1');
    
    if (rows.length > 0) {
      const sample = rows[0];
      console.log(`   Sample Code_semaine: "${sample.Code_semaine}"`);
      
      // Format détecté: "S01", "S02", etc.
      if (sample.Code_semaine && sample.Code_semaine.startsWith('S')) {
        console.log('   Format détecté: SXX (ex: S01, S02)');
        await connection.query(`
          UPDATE semaines 
          SET Numero_semaine = CAST(SUBSTRING(Code_semaine, 2) AS UNSIGNED)
          WHERE Code_semaine LIKE 'S%' AND Numero_semaine IS NULL
        `);
      } else {
        // Sinon calculer à partir de la date
        console.log('   Format alternative: Calcul à partir de la date');
        await connection.query(`
          UPDATE semaines 
          SET Numero_semaine = WEEK(Date_debut, 3)
          WHERE Numero_semaine IS NULL
        `);
      }
    }
    console.log('   ✅ Numero_semaine rempli\n');
    
    // 4. Créer les index
    console.log('4️⃣  Création des index...');
    try {
      await connection.query(`
        CREATE INDEX idx_semaines_numero_annee ON semaines(Numero_semaine, Annee)
      `);
    } catch (e) {
      if (e.code !== 'ER_DUP_KEYNAME') throw e;
      console.log('   ℹ️  Index idx_semaines_numero_annee existe déjà');
    }
    
    try {
      await connection.query(`
        CREATE INDEX idx_semaines_annee ON semaines(Annee)
      `);
    } catch (e) {
      if (e.code !== 'ER_DUP_KEYNAME') throw e;
      console.log('   ℹ️  Index idx_semaines_annee existe déjà');
    }
    console.log('   ✅ Index créés\n');
    
    // 5. Vérification
    console.log('5️⃣  Vérification des données...\n');
    const [verify] = await connection.query(`
      SELECT 
        ID,
        Code_semaine,
        Numero_semaine,
        Annee,
        Mois,
        Date_debut,
        Date_fin
      FROM semaines 
      ORDER BY Annee DESC, Numero_semaine DESC
      LIMIT 5
    `);
    
    console.log('📊 Dernières semaines:');
    console.table(verify);
    
    console.log('\n✅ Migration terminée avec succès!');
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error.message);
    console.error('   Code:', error.code);
    process.exit(1);
  } finally {
    connection.release();
    process.exit(0);
  }
}

migrate();
