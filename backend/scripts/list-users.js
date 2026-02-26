#!/usr/bin/env node

/**
 * Script pour lister tous les utilisateurs
 * Usage: node scripts/list-users.js
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const db = require('../src/config/database');

(async () => {
  try {
    const [users] = await db.query(
      'SELECT ID, Username, Email, Est_actif FROM utilisateurs ORDER BY ID'
    );

    console.log('📋 Utilisateurs dans la base de données:\n');
    users.forEach(u => {
      console.log(`  ID: ${u.ID} - ${u.Username} (${u.Email}) - Actif: ${u.Est_actif ? 'Oui' : 'Non'}`);
    });

    // Vérifier les permissions pour chaque utilisateur
    console.log('\n📋 Permissions par utilisateur:\n');
    for (const user of users) {
      const [perms] = await db.query(
        'SELECT COUNT(*) as cnt FROM matrice_autorisation WHERE ID_Utilisateur = ? AND Valeur = 1',
        [user.ID]
      );
      console.log(`  ${user.Username}: ${perms[0].cnt} permissions`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  }
})();
