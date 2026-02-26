#!/usr/bin/env node

/**
 * Script pour accorder toutes les permissions à TOUS les utilisateurs actifs
 * Usage: node scripts/grant-admin.js
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const db = require('../src/config/database');

const grantAllPermissions = async () => {
  try {
    console.log('🔐 Octroi des permissions à tous les utilisateurs actifs...\n');

    // Toutes les permissions nécessaires
    const allPermissions = [
      'ADMIN_ACCESS',
      'ADMIN_DASHBOARD_READ',
      'ADMIN_USERS_READ',
      'ADMIN_USERS_WRITE',
      'ADMIN_ROLES_READ',
      'ADMIN_ROLES_WRITE',
      'ADMIN_PERMISSIONS_READ',
      'ADMIN_PERMISSIONS_WRITE',
      'SESSION_MANAGE',
      'AUDIT_READ',
      'INDICATEURS_READ',
      'INDICATEURS_WRITE',
      'COMMANDES_READ',
      'COMMANDES_WRITE',
      'PLANNING_READ',
      'PLANNING_WRITE',
      'PERSONNEL_READ',
      'PERSONNEL_WRITE',
      'MACHINES_READ',
      'MACHINES_WRITE',
      'TYPES_MACHINE_READ',
      'TYPES_MACHINE_WRITE',
      'HORAIRES_READ',
      'HORAIRES_WRITE',
      'POINTAGE_READ',
      'POINTAGE_WRITE',
      'AFFECTATIONS_READ',
      'AFFECTATIONS_WRITE',
      'POSTES_READ',
      'POSTES_WRITE',
      'DEFAUTS_TYPE_MACHINE_READ',
      'DEFAUTS_TYPE_MACHINE_WRITE',
      'DEFAUTS_PROCESS_READ',
      'DEFAUTS_PROCESS_WRITE',
      'DEFAUTS_PRODUIT_READ',
      'DEFAUTS_PRODUIT_WRITE',
      'INTERVENTIONS_READ',
      'INTERVENTIONS_WRITE',
      'ARTICLES_READ',
      'ARTICLES_WRITE',
      'CATALOGUE_READ',
      'CATALOGUE_WRITE',
      'QUALITE_DEFauts_READ',
      'QUALITE_DEFauts_WRITE',
      'QUALITE_INDICATEURS_READ',
      'QUALITE_INDICATORS_WRITE'
    ];

    // Récupérer les IDs des permissions
    const placeholders = allPermissions.map(() => '?').join(',');
    const [permissions] = await db.query(
      `SELECT ID, Code_permission FROM permissions WHERE Code_permission IN (${placeholders})`,
      allPermissions
    );

    console.log(`✓ ${permissions.length} permissions trouvées:\n`);
    permissions.forEach((p) => {
      console.log(`  • ${p.Code_permission} (ID: ${p.ID})`);
    });
    console.log('');

    // Récupérer tous les utilisateurs actifs
    const [users] = await db.query('SELECT ID, Username, Email FROM utilisateurs WHERE Est_actif = 1');
    console.log(`✓ ${users.length} utilisateurs actifs trouvés\n`);

    // Assigner les permissions à chaque utilisateur
    let totalAssigned = 0;
    let totalUpdated = 0;

    for (const user of users) {
      console.log(`Traitement de l'utilisateur ${user.ID}: ${user.Username}...`);
      
      for (const perm of permissions) {
        const [result] = await db.query(
          `INSERT INTO matrice_autorisation (ID_Utilisateur, ID_Permission, Valeur)
           VALUES (?, ?, 1)
           ON DUPLICATE KEY UPDATE Valeur = 1`,
          [user.ID, perm.ID]
        );

        if (result.affectedRows === 1) {
          totalAssigned++;
        } else if (result.affectedRows === 2) {
          totalUpdated++;
        }
      }
    }

    console.log(`\n✓ ${totalAssigned} nouvelles permissions assignées`);
    console.log(`✓ ${totalUpdated} permissions mises à jour\n`);

    // Vérifier les utilisateurs
    const [userResults] = await db.query(
      `SELECT 
        u.ID,
        u.Username,
        u.Email,
        COUNT(DISTINCT ma.ID_Permission) as nombre_permissions
       FROM utilisateurs u
       LEFT JOIN matrice_autorisation ma ON u.ID = ma.ID_Utilisateur AND ma.Valeur = 1
       WHERE u.Est_actif = 1
       GROUP BY u.ID, u.Username, u.Email
       ORDER BY u.ID`
    );

    console.log('📋 Résumé des permissions:\n');
    userResults.forEach((user) => {
      console.log(`  Utilisateur ${user.ID}: ${user.Username} - ${user.nombre_permissions} permissions`);
    });

    console.log('\n✅ Toutes les permissions assignées avec succès!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

grantAllPermissions();
