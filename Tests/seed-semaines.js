/**
 * Seed script: Populate semaines table with 2026 weeks
 */

require('dotenv').config();
const db = require('./src/config/database');

async function seed() {
  const connection = await db.getConnection();
  
  try {
    console.log('🌱 Démarrage du seed pour année 2026...\n');
    
    const annee = 2026;
    let semaineCount = 0;
    
    // Boucle sur les 52 semaines de l'année
    for (let numeroSemaine = 1; numeroSemaine <= 52; numeroSemaine++) {
      // Calculer la date de début (lundi) et fin (dimanche) de la semaine
      // ISO 8601: semaine 1 = contient le 4 janvier
      const yearStart = new Date(Date.UTC(annee, 0, 4));
      const daysToFirstMonday = yearStart.getDay() === 0 ? 6 : yearStart.getDay() - 1;
      const firstMonday = new Date(yearStart);
      firstMonday.setDate(firstMonday.getDate() - daysToFirstMonday);
      
      const datDebut = new Date(firstMonday);
      datDebut.setDate(datDebut.getDate() + (numeroSemaine - 1) * 7);
      
      const dateFin = new Date(datDebut);
      dateFin.setDate(dateFin.getDate() + 6);
      
      const mois = datDebut.getMonth() + 1;
      const codeSemaine = `S${String(numeroSemaine).padStart(2, '0')}`;
      
      // Convertir les dates au format MySQL (YYYY-MM-DD)
      const dateDebutStr = datDebut.toISOString().split('T')[0];
      const dateFinStr = dateFin.toISOString().split('T')[0];
      
      // Insérer la semaine
      await connection.query(`
        INSERT INTO semaines (Code_semaine, Numero_semaine, Annee, Mois, Date_debut, Date_fin)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [codeSemaine, numeroSemaine, annee, mois, dateDebutStr, dateFinStr]);
      
      semaineCount++;
      
      // Afficher la progression tous les 10 semaines
      if (numeroSemaine % 10 === 0) {
        console.log(`  ✓ ${numeroSemaine} semaines traitées...`);
      }
    }
    
    console.log(`\n✅ ${semaineCount} semaines créées pour l'année ${annee}\n`);
    
    // Vérification
    console.log('📊 Vérification des données:\n');
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
      WHERE Annee = 2026
      ORDER BY Numero_semaine
      LIMIT 10
    `);
    
    console.table(verify);
    
    const [count] = await connection.query(
      'SELECT COUNT(*) as total FROM semaines WHERE Annee = 2026'
    );
    console.log(`\n✅ Total: ${count[0].total} semaines pour 2026`);
    
  } catch (error) {
    console.error('\n❌ Erreur lors du seed:', error.message);
    process.exit(1);
  } finally {
    connection.release();
    process.exit(0);
  }
}

seed();
