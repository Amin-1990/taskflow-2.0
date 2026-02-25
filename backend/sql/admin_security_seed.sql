-- RBAC seed for admin/security hardening
-- Execute on MySQL after schema creation.

START TRANSACTION;

INSERT INTO permissions (Code_permission, Nom_permission, Description, Categorie, Date_creation)
VALUES
  ('ADMIN_ACCESS', 'Acces administration', 'Acces au module administration', 'ADMIN', NOW()),
  ('ADMIN_DASHBOARD_READ', 'Lecture dashboard admin', 'Voir les indicateurs d administration', 'ADMIN', NOW()),
  ('ADMIN_USERS_READ', 'Lecture utilisateurs', 'Voir les comptes utilisateurs', 'ADMIN_USERS', NOW()),
  ('ADMIN_USERS_WRITE', 'Gestion utilisateurs', 'Creer/modifier/desactiver des comptes', 'ADMIN_USERS', NOW()),
  ('ADMIN_ROLES_READ', 'Lecture roles', 'Voir les roles', 'ADMIN_ROLES', NOW()),
  ('ADMIN_ROLES_WRITE', 'Gestion roles', 'Creer/modifier roles et affectations', 'ADMIN_ROLES', NOW()),
  ('ADMIN_PERMISSIONS_READ', 'Lecture permissions', 'Voir les permissions', 'ADMIN_PERMISSIONS', NOW()),
  ('ADMIN_PERMISSIONS_WRITE', 'Gestion permissions', 'Affecter/refuser permissions utilisateur', 'ADMIN_PERMISSIONS', NOW()),
  ('SESSION_MANAGE', 'Gestion sessions', 'Consulter/revoquer les sessions', 'SECURITY', NOW()),
  ('AUDIT_READ', 'Lecture audit', 'Consulter les logs d audit', 'SECURITY', NOW()),
  ('AUDIT_WRITE', 'Gestion audit', 'Creer/purger les logs d audit', 'SECURITY', NOW())
ON DUPLICATE KEY UPDATE Nom_permission = VALUES(Nom_permission);

INSERT INTO roles (
  Code_role, Nom_role, Description, Niveau_priorite,
  Est_systeme, Est_actif, Date_creation, Date_modification
)
VALUES
  ('SUPER_ADMIN', 'Super Administrateur', 'Acces total administration et securite', 100, 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE Nom_role = VALUES(Nom_role), Est_actif = 1, Date_modification = NOW();

INSERT IGNORE INTO roles_permissions (ID_Role, ID_Permission)
SELECT r.ID, p.ID
FROM roles r
JOIN permissions p
WHERE r.Code_role = 'SUPER_ADMIN'
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
    'AUDIT_WRITE'
  );

-- Assign SUPER_ADMIN role to one existing user (replace 1 with your admin user ID)
-- INSERT IGNORE INTO utilisateurs_roles (ID_Utilisateur, ID_Role, Date_assignation, Assigne_par)
-- SELECT 1, r.ID, NOW(), 1 FROM roles r WHERE r.Code_role = 'SUPER_ADMIN';

COMMIT;
