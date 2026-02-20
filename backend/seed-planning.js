/**
 * Seed script: Populate planning_hebdo table with sample data for week 8, 2026
 */

require('dotenv').config();
const db = require('./src/config/database');

async function seed() {
  const connection = await db.getConnection();
  
  try {
    console.log('🌱 Démarrage du seed pour planning_hebdo...\n');
    
    // Trouver la semaine 8 de 2026
    const [semaines] = await connection.query(
      'SELECT ID FROM semaines WHERE Numero_semaine = 8 AND Annee = 2026 LIMIT 1'
    );
    
    if (semaines.length === 0) {
      console.error('❌ Semaine 8/2026 non trouvée');
      process.exit(1);
    }
    
    const semaineId = semaines[0].ID;
    console.log(`✓ Semaine trouvée: ID ${semaineId}\n`);
    
    // Créer 5 plannings de test
    const plannings = [
      {
        lundi: 100, mardi: 120, mercredi: 110, jeudi: 130, vendredi: 140, samedi: 80,
        lundi_emb: 95, mardi_emb: 115, mercredi_emb: 105, jeudi_emb: 125, vendredi_emb: 135, samedi_emb: 75
      },
      {
        lundi: 80, mardi: 90, mercredi: 85, jeudi: 95, vendredi: 100, samedi: 50,
        lundi_emb: 75, mardi_emb: 85, mercredi_emb: 80, jeudi_emb: 90, vendredi_emb: 95, samedi_emb: 45
      },
      {
        lundi: 150, mardi: 160, mercredi: 155, jeudi: 170, vendredi: 180, samedi: 120,
        lundi_emb: 145, mardi_emb: 155, mercredi_emb: 150, jeudi_emb: 165, vendredi_emb: 175, samedi_emb: 115
      }
    ];
    
    let count = 0;
    for (let i = 0; i < plannings.length; i++) {
      const p = plannings[i];
      
      await connection.query(`
        INSERT INTO planning_hebdo (
          ID_Semaine_planifiee,
          Lundi_planifie, Lundi_emballe,
          Mardi_planifie, Mardi_emballe,
          Mercredi_planifie, Mercredi_emballe,
          Jeudi_planifie, Jeudi_emballe,
          Vendredi_planifie, Vendredi_emballe,
          Samedi_planifie, Samedi_emballe,
          Saisie_par, Commentaire, Date_creation
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        semaineId,
        p.lundi, p.lundi_emb,
        p.mardi, p.mardi_emb,
        p.mercredi, p.mercredi_emb,
        p.jeudi, p.jeudi_emb,
        p.vendredi, p.vendredi_emb,
        p.samedi, p.samedi_emb,
        'ADMIN', `Planification test ${i + 1}`
      ]);
      
      count++;
    }
    
    console.log(`✅ ${count} lignes de planning créées\n`);
    
    // Vérification
    console.log('📊 Vérification des données:');
    const [verify] = await connection.query(`
      SELECT 
        ID,
        ID_Semaine_planifiee,
        ID_Commande,
        Lundi_planifie,
        Mardi_planifie,
        Mercredi_planifie,
        Total_planifie_semaine,
        Total_emballe_semaine,
        Commentaire
      FROM planning_hebdo 
      WHERE ID_Semaine_planifiee = ?
      ORDER BY ID
    `, [semaineId]);
    
    console.table(verify);
    
    console.log(`\n✅ Seed terminé avec succès!`);
    
  } catch (error) {
    console.error('\n❌ Erreur lors du seed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    connection.release();
    process.exit(0);
  }
}

seed();
