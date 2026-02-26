#!/usr/bin/env node

/**
 * Script pour créer les permissions ADMIN_ROLES manquantes
 * Usage: node scripts/create-admin-roles-perms.js
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const db = require('../src/config/database');

const createMissingPermissions = async () => {
  try {
    console.log('🔧 Création des permissions ADMIN_ROLES manquantes...\n');

    // Vérifier si les permissions existent
    const [existing] = await db.query(
      "SELECT Code_permission FROM permissions WHERE Code_permission IN ('ADMIN_ROLES_READ', 'ADMIN_ROLES_WRITE')"
    );

    console.log(`✓ ${existing.length} permissions ADMIN_ROLES trouvées:`);
    existing.forEach(p => console.log(`  - ${p.Code_permission}`));

    // Créer les permissions manquantes
    const missing = [];
    if (!existing.find(p => p.Code_permission === 'ADMIN_ROLES_READ')) {
      missing.push('ADMIN_ROLES_READ');
    }
    if (!existing.find(p => p.Code_permission === 'ADMIN_ROLES_WRITE')) {
      missing.push('ADMIN_ROLES_WRITE');
    }

    if (missing.length > 0) {
      console.log(`\n⚠️  Permissions manquantes: ${missing.join(', ')}`);
      
      for (const perm of missing) {
        await db.query(
          `INSERT INTO permissions (Code_permission, Nom_permission, Description, Categorie, Date_creation)
           VALUES (?, ?, ?, 'ADMIN', NOW())
           ON DUPLICATE KEY UPDATE Nom_permission = VALUES(Nom_permission)`,
          [perm, perm.replace(/_/g, ' '), `Permission ${perm} pour l'administration des rôles`]
        );
        console.log(`✓ Créée: ${perm}`);
      }
    }

    // Assigner les permissions à l'utilisateur 1
    console.log('\n📋 Attribution des permissions à utilisateur ID=1...');
    
    const [perms] = await db.query(
      "SELECT ID FROM permissions WHERE Code_permission IN ('ADMIN_ROLES_READ', 'ADMIN_ROLES_WRITE')"
    );

    for (const perm of perms) {
      await db.query(
        `INSERT INTO matrice_autorisation (ID_Utilisateur, ID_Permission, Valeur)
         VALUES (1, ?, 1)
         ON DUPLICATE KEY UPDATE Valeur = 1`,
        [perm.ID]
      );
      console.log(`✓ Attribution permission ID=${perm.ID}`);
    }

    console.log('\n✅ Terminé!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
};

createMissingPermissions();
