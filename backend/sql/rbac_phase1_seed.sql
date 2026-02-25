-- Phase 1 RBAC seed
-- Source de verite: rbac_permission_dictionary.md
-- Regle: aucune permission en dehors de la liste figee.

START TRANSACTION;

INSERT INTO permissions (Code_permission, Nom_permission, Description, Categorie, Date_creation)
VALUES
  ('ADMIN_READ', 'Lecture administration', 'Consulter les ecrans administration', 'ADMIN', NOW()),
  ('ADMIN_WRITE', 'Ecriture administration', 'Modifier les donnees administration', 'ADMIN', NOW()),
  ('SESSIONS_READ', 'Lecture sessions', 'Consulter les sessions', 'SESSIONS', NOW()),
  ('SESSIONS_WRITE', 'Ecriture sessions', 'Revoquer et gerer les sessions', 'SESSIONS', NOW()),
  ('AUDIT_READ', 'Lecture audit', 'Consulter les journaux d audit', 'AUDIT', NOW()),
  ('AUDIT_WRITE', 'Ecriture audit', 'Creer ou purger les journaux d audit', 'AUDIT', NOW()),
  ('COMMANDES_READ', 'Lecture commandes', 'Consulter les commandes', 'COMMANDES', NOW()),
  ('COMMANDES_WRITE', 'Ecriture commandes', 'Creer/modifier/supprimer les commandes', 'COMMANDES', NOW()),
  ('PLANNING_READ', 'Lecture planning', 'Consulter le planning', 'PLANNING', NOW()),
  ('PLANNING_WRITE', 'Ecriture planning', 'Modifier le planning', 'PLANNING', NOW()),
  ('ARTICLES_READ', 'Lecture articles', 'Consulter les articles', 'ARTICLES', NOW()),
  ('ARTICLES_WRITE', 'Ecriture articles', 'Creer/modifier/supprimer les articles', 'ARTICLES', NOW()),
  ('ARTICLES_MACHINES_TEST_READ', 'Lecture articles-machines-test', 'Consulter les associations article-machine-test', 'ARTICLES_MACHINES_TEST', NOW()),
  ('ARTICLES_MACHINES_TEST_WRITE', 'Ecriture articles-machines-test', 'Modifier les associations article-machine-test', 'ARTICLES_MACHINES_TEST', NOW()),
  ('MACHINES_READ', 'Lecture machines', 'Consulter les machines', 'MACHINES', NOW()),
  ('MACHINES_WRITE', 'Ecriture machines', 'Creer/modifier/supprimer les machines', 'MACHINES', NOW()),
  ('TYPES_MACHINE_READ', 'Lecture types machine', 'Consulter les types machine', 'TYPES_MACHINE', NOW()),
  ('TYPES_MACHINE_WRITE', 'Ecriture types machine', 'Creer/modifier/supprimer les types machine', 'TYPES_MACHINE', NOW()),
  ('INTERVENTIONS_READ', 'Lecture interventions', 'Consulter les interventions', 'INTERVENTIONS', NOW()),
  ('INTERVENTIONS_WRITE', 'Ecriture interventions', 'Creer/modifier/supprimer les interventions', 'INTERVENTIONS', NOW()),
  ('PERSONNEL_READ', 'Lecture personnel', 'Consulter le personnel', 'PERSONNEL', NOW()),
  ('PERSONNEL_WRITE', 'Ecriture personnel', 'Creer/modifier/supprimer le personnel', 'PERSONNEL', NOW()),
  ('POSTES_READ', 'Lecture postes', 'Consulter les postes', 'POSTES', NOW()),
  ('POSTES_WRITE', 'Ecriture postes', 'Creer/modifier/supprimer les postes', 'POSTES', NOW()),
  ('POINTAGE_READ', 'Lecture pointage', 'Consulter les pointages', 'POINTAGE', NOW()),
  ('POINTAGE_WRITE', 'Ecriture pointage', 'Modifier/valider les pointages', 'POINTAGE', NOW()),
  ('HORAIRES_READ', 'Lecture horaires', 'Consulter les horaires', 'HORAIRES', NOW()),
  ('HORAIRES_WRITE', 'Ecriture horaires', 'Creer/modifier/supprimer les horaires', 'HORAIRES', NOW()),
  ('AFFECTATIONS_READ', 'Lecture affectations', 'Consulter les affectations', 'AFFECTATIONS', NOW()),
  ('AFFECTATIONS_WRITE', 'Ecriture affectations', 'Creer/modifier/supprimer les affectations', 'AFFECTATIONS', NOW()),
  ('DEFAUTS_PROCESS_READ', 'Lecture defauts process', 'Consulter les defauts process', 'DEFAUTS_PROCESS', NOW()),
  ('DEFAUTS_PROCESS_WRITE', 'Ecriture defauts process', 'Creer/modifier/supprimer les defauts process', 'DEFAUTS_PROCESS', NOW()),
  ('DEFAUTS_PRODUIT_READ', 'Lecture defauts produit', 'Consulter les defauts produit', 'DEFAUTS_PRODUIT', NOW()),
  ('DEFAUTS_PRODUIT_WRITE', 'Ecriture defauts produit', 'Creer/modifier/supprimer les defauts produit', 'DEFAUTS_PRODUIT', NOW()),
  ('DEFAUTS_TYPE_MACHINE_READ', 'Lecture defauts type machine', 'Consulter les defauts type machine', 'DEFAUTS_TYPE_MACHINE', NOW()),
  ('DEFAUTS_TYPE_MACHINE_WRITE', 'Ecriture defauts type machine', 'Creer/modifier/supprimer les defauts type machine', 'DEFAUTS_TYPE_MACHINE', NOW()),
  ('INDICATEURS_READ', 'Lecture indicateurs', 'Consulter les indicateurs', 'INDICATEURS', NOW()),
  ('INDICATEURS_WRITE', 'Ecriture indicateurs', 'Modifier les indicateurs', 'INDICATEURS', NOW()),
  ('SEMAINES_READ', 'Lecture semaines', 'Consulter les semaines', 'SEMAINES', NOW()),
  ('SEMAINES_WRITE', 'Ecriture semaines', 'Creer/modifier/supprimer les semaines', 'SEMAINES', NOW()),
  ('ECHELONS_READ', 'Lecture echelons', 'Consulter les echelons', 'ECHELONS', NOW()),
  ('ECHELONS_WRITE', 'Ecriture echelons', 'Creer/modifier/supprimer les echelons', 'ECHELONS', NOW()),
  ('EXPORT_READ', 'Lecture export', 'Consulter et declencher les exports', 'EXPORT', NOW()),
  ('EXPORT_WRITE', 'Ecriture export', 'Actions d export avancees', 'EXPORT', NOW()),
  ('IMPORT_READ', 'Lecture import', 'Consulter les modeles d import', 'IMPORT', NOW()),
  ('IMPORT_WRITE', 'Ecriture import', 'Executer les imports', 'IMPORT', NOW())
ON DUPLICATE KEY UPDATE
  Nom_permission = VALUES(Nom_permission),
  Description = VALUES(Description),
  Categorie = VALUES(Categorie);

INSERT INTO roles (
  Code_role, Nom_role, Description, Niveau_priorite,
  Est_systeme, Est_actif, Date_creation, Date_modification
)
VALUES
  ('LECTURE_SEULE', 'Lecture seule', 'Role lecture seule global (permissions *_READ)', 20, 1, 1, NOW(), NOW()),
  ('FULL_ACCESS', 'Acces complet', 'Role acces complet global (permissions *_READ + *_WRITE)', 90, 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  Nom_role = VALUES(Nom_role),
  Description = VALUES(Description),
  Niveau_priorite = VALUES(Niveau_priorite),
  Est_actif = 1,
  Date_modification = NOW();

INSERT IGNORE INTO roles_permissions (ID_Role, ID_Permission)
SELECT r.ID, p.ID
FROM roles r
JOIN permissions p ON p.Code_permission LIKE '%\\_READ'
WHERE r.Code_role = 'LECTURE_SEULE';

INSERT IGNORE INTO roles_permissions (ID_Role, ID_Permission)
SELECT r.ID, p.ID
FROM roles r
JOIN permissions p
WHERE r.Code_role = 'FULL_ACCESS'
  AND p.Code_permission IN (
    'ADMIN_READ', 'ADMIN_WRITE',
    'SESSIONS_READ', 'SESSIONS_WRITE',
    'AUDIT_READ', 'AUDIT_WRITE',
    'COMMANDES_READ', 'COMMANDES_WRITE',
    'PLANNING_READ', 'PLANNING_WRITE',
    'ARTICLES_READ', 'ARTICLES_WRITE',
    'ARTICLES_MACHINES_TEST_READ', 'ARTICLES_MACHINES_TEST_WRITE',
    'MACHINES_READ', 'MACHINES_WRITE',
    'TYPES_MACHINE_READ', 'TYPES_MACHINE_WRITE',
    'INTERVENTIONS_READ', 'INTERVENTIONS_WRITE',
    'PERSONNEL_READ', 'PERSONNEL_WRITE',
    'POSTES_READ', 'POSTES_WRITE',
    'POINTAGE_READ', 'POINTAGE_WRITE',
    'HORAIRES_READ', 'HORAIRES_WRITE',
    'AFFECTATIONS_READ', 'AFFECTATIONS_WRITE',
    'DEFAUTS_PROCESS_READ', 'DEFAUTS_PROCESS_WRITE',
    'DEFAUTS_PRODUIT_READ', 'DEFAUTS_PRODUIT_WRITE',
    'DEFAUTS_TYPE_MACHINE_READ', 'DEFAUTS_TYPE_MACHINE_WRITE',
    'INDICATEURS_READ', 'INDICATEURS_WRITE',
    'SEMAINES_READ', 'SEMAINES_WRITE',
    'ECHELONS_READ', 'ECHELONS_WRITE',
    'EXPORT_READ', 'EXPORT_WRITE',
    'IMPORT_READ', 'IMPORT_WRITE'
  );

-- Super admin existant: doit avoir exactement les memes permissions que FULL_ACCESS.
INSERT IGNORE INTO roles_permissions (ID_Role, ID_Permission)
SELECT super_role.ID, full_rp.ID_Permission
FROM roles super_role
JOIN roles full_role ON full_role.Code_role = 'FULL_ACCESS'
JOIN roles_permissions full_rp ON full_rp.ID_Role = full_role.ID
WHERE super_role.Code_role = 'SUPER_ADMIN';

COMMIT;
