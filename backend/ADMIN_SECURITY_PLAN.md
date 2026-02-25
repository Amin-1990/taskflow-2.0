# Plan de correction securite et systeme administrateur

## Objectif
Mettre en place un backend robuste pour:
- authentification
- gestion des comptes
- sessions
- permissions et roles
- administration securisee

## Correctifs implantes
1. JWT securise
- `JWT_SECRET` obligatoire (plus de fallback faible).
- verification JWT + verification session + verification coherence `decoded.id === session.ID_Utilisateur`.

2. Sessions durcies
- retrait des endpoints par token en URL.
- masquage de `Token_session` dans les reponses API.
- suppression des updates sur colonnes non presentes dans le schema (`Date_modification`, `Date_creation` dans `sessions`).

3. Autorisation RBAC
- middleware `authorization.middleware.js`.
- priorite au refus explicite (`utilisateurs_permissions.Type = REFUSER`).
- cumul permissions directes + permissions via roles.

4. Module administrateur complet
- nouvelle API `/api/admin` avec permissions granulaires:
  - dashboard
  - utilisateurs (lecture, creation, edition, statut, reset password, roles, permissions)
  - roles (lecture, creation, edition, mapping permissions)
  - permissions (lecture)
  - sessions (lecture, revoke)
  - audit (lecture)

5. Audit et sessions proteges
- routes `audit` et `sessions` soumises aux permissions (`AUDIT_READ`, `AUDIT_WRITE`, `SESSION_MANAGE`).
- creation manuelle de logs: acteur derive du token authentifie, plus de spoofing d'identite par payload.

6. Validation parametres
- ajout `userIdValidator` pour les routes `:userId`.

## Permissions admin introduites
- `ADMIN_ACCESS`
- `ADMIN_DASHBOARD_READ`
- `ADMIN_USERS_READ`
- `ADMIN_USERS_WRITE`
- `ADMIN_ROLES_READ`
- `ADMIN_ROLES_WRITE`
- `ADMIN_PERMISSIONS_READ`
- `ADMIN_PERMISSIONS_WRITE`
- `SESSION_MANAGE`
- `AUDIT_READ`
- `AUDIT_WRITE`

## Seed SQL
Executer:
- `backend/sql/admin_security_seed.sql`

Ce script:
- cree les permissions admin/security
- cree le role `SUPER_ADMIN`
- assigne les permissions au role
- fournit la requete d'affectation du role a un utilisateur existant

## API administrateur
Base: `/api/admin`

- `GET /dashboard`
- `GET /users`
- `GET /users/:id`
- `POST /users`
- `PATCH /users/:id`
- `PATCH /users/:id/status`
- `PATCH /users/:id/password-reset`
- `PATCH /users/:id/expire-sessions`
- `PUT /users/:id/roles`
- `PUT /users/:id/permissions`
- `GET /roles`
- `POST /roles`
- `PATCH /roles/:id`
- `PUT /roles/:id/permissions`
- `GET /permissions`
- `GET /sessions`
- `PATCH /sessions/:id/revoke`
- `GET /audit`

## Recommandations suivantes
1. Ajouter un endpoint "me/permissions" pour le frontend.
2. Ajouter rate limiting sur `login` et `refresh-token`.
3. Ajouter lock automatique apres N echecs (`Tentatives_echec`).
4. Stocker les sessions avec hash de token plutot que token brut.
5. Ajouter tests integration securite (RBAC, session hijack, audit spoofing).
