-- ============================================================================
-- Script pour accorder toutes les permissions à TOUS les utilisateurs actifs
-- ============================================================================

-- Assigner toutes les permissions à tous les utilisateurs actifs
INSERT INTO matrice_autorisation (ID_Utilisateur, ID_Permission, Valeur)
SELECT u.ID, p.ID, 1
FROM utilisateurs u
CROSS JOIN permissions p
WHERE u.Est_actif = 1
  AND p.Code_permission IN (
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
  )
ON DUPLICATE KEY UPDATE Valeur = 1;

-- Vérifier que les permissions ont été assignées
SELECT 
  u.ID,
  u.Username,
  u.Email,
  COUNT(ma.ID_Permission) as nombre_permissions,
  GROUP_CONCAT(p.Code_permission SEPARATOR ', ') as permissions_assignees
FROM utilisateurs u
LEFT JOIN matrice_autorisation ma ON u.ID = ma.ID_Utilisateur AND ma.Valeur = 1
LEFT JOIN permissions p ON ma.ID_Permission = p.ID
WHERE u.ID = 1
GROUP BY u.ID, u.Username, u.Email;
