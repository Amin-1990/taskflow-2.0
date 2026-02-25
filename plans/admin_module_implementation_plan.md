# Plan d'Implementation Technique - Module Administration

## 1. Objectif
Implementer les recommandations UX/RBAC du module administration en conservant la logique de securite existante:
- Priorite `REFUSER` utilisateur > `ACCORDER` direct > permission via role actif.
- Principe du moindre privilege par defaut.

Ce plan est structure en sprints avec livrables verificables.

## 2. Etat actuel (resume)
- Backend solide sur RBAC, audit, JWT, sessions.
- Frontend admin fonctionnel mais minimal (`AdminPanel` monolithique), sans pagination/filtres avances.
- CRUD admin de base disponible (users/roles/permissions/sessions/audit), y compris suppressions sensibles.

## 3. Decisions d'architecture
1. Decouper l'UI admin en pages dediees:
- `AdminUsersPage`
- `AdminRolesPage`
- `AdminPermissionsPage`
- `AdminSessionsPage`
- `AdminAuditPage`
- `AdminAuthoritiesMatrixPage`

2. Standardiser les reponses liste cote backend:
- `data`
- `pagination: { page, limit, total, totalPages }`
- `filtersApplied`

3. Centraliser les permissions par module/action (mapping frontend):
- `USERS_READ`, `USERS_WRITE`, `ROLES_READ`, etc.

4. Introduire un endpoint dedie pour acces effectif (matrice), au lieu de recalculer en frontend.

## 4. Backlog priorise

### P0 (impact immediat, faible risque)
- Pagination + recherche + filtres sur listes users/roles/permissions/sessions/audit.
- Retrait des IDs bruts dans les tables UI (conserver en tooltip optionnelle).
- Confirmations obligatoires pour actions destructrices.
- Remplacement des prompts CSV par formulaires/selects multi-choix.

### P1 (impact fort, complexite moyenne)
- Permissions regroupees par module avec compteur d'utilisation.
- Exports CSV (users, sessions, audit, matrice).
- Tri colonnes (ASC/DESC) sur principales listes.

### P2 (fonction cle, complexite moyenne/elevee)
- Page "Matrice Autorites" (vue par utilisateur + vue par role).
- Edition inline des permissions directes.
- Legendes de source d'acces (role/direct/refuse).

### P3 (evolution avancee)
- Diff avant/apres dans audit pour modifications.
- Permission sets (groupes de permissions reutilisables).
- Delegation d'administration avec perimetre.

## 5. Plan par sprint

## Sprint 1 (2 semaines)
Objectif: rendre l'admin exploitable au quotidien.

### Backend
- Ajouter pagination/filtres aux endpoints:
  - `GET /admin/users`
  - `GET /admin/roles`
  - `GET /admin/permissions`
  - `GET /admin/sessions`
  - `GET /admin/audit`
- Query params standard:
  - `page`, `limit`, `search`, `sortBy`, `sortDir`
  - filtres specifiques (`status`, `roleId`, `module`, `from`, `to`, etc.)
- Ajouter validation des query params.

### Frontend
- Decouper `AdminPanel` en pages + composants table reutilisables.
- Ajouter barre de recherche + filtres simples.
- Ajouter pagination 10/25/50/100 + compteur ("1-25 sur N").
- Ajouter modales de confirmation:
  - suppression user/role/permission
  - revocation session
- Conserver toasts succes/erreur.

### Criteres d'acceptation
- Toutes les listes admin paginent correctement.
- Aucune action destructrice sans confirmation.
- Temps de chargement stable sur 5k enregistrements (mock ou base test).

## Sprint 2 (2-3 semaines)
Objectif: lisibilite metier et gouvernance des permissions.

### Backend
- `GET /admin/permissions` enrichi:
  - groupement par module/categorie
  - `roles_count` par permission
  - flag `used_by_system_role`
- Endpoint export CSV:
  - `GET /admin/users/export`
  - `GET /admin/sessions/export`
  - `GET /admin/audit/export`

### Frontend
- Page permissions en groupes (accordeon par module).
- Affichage "libelle lisible" prioritaire, code technique en secondaire.
- Tri colonnes et filtres avances (module, type, date).
- Boutons export CSV par page.

### Criteres d'acceptation
- L'admin peut retrouver une permission par libelle sans connaitre le code technique.
- Export CSV reflecte exactement les filtres actifs.

## Sprint 3 (3-4 semaines)
Objectif: matrice des autorites (fonction phare).

### Backend
- Nouveau endpoint matrice:
  - `GET /admin/authorities/matrix?mode=user|role&userId=&roleId=&search=&page=&limit=`
- Nouveau endpoint calcul acces effectif:
  - `GET /admin/authorities/effective?userId=`
- Endpoint edition inline:
  - `PATCH /admin/authorities/user/:id` (upsert permission directe ACCORDER/REFUSER/REMOVE)
- Reponse inclut source d'acces:
  - `source: ROLE | DIRECT_ALLOW | DIRECT_DENY | NONE`

### Frontend
- Page matrice avec 2 vues:
  - Vue par utilisateur
  - Vue par role
- Cellules colorees (accorde/refuse/herite/none).
- Modification inline d'une cellule + confirmation selon criticite.
- Legende interactive.

### Criteres d'acceptation
- La matrice affiche un acces effectif coherent avec le middleware backend.
- Toute modification inline est visible immediatement et auditee.

## Sprint 4 (3-4 semaines)
Objectif: audit avance + extension RBAC.

### Backend
- Enrichir audit avec diff `before/after` standardise.
- Job de revocation automatique permissions expirees (si necessaire).
- Permission sets:
  - CRUD sets
  - assignation a user/role
- Base pour delegation admin (scope par entite/departement/site).

### Frontend
- Visualisation diff avant/apres en modal detail audit.
- UI permission sets (creation et application rapide).
- Ecran delegation (version MVP).

### Criteres d'acceptation
- Les actions critiques affichent un diff lisible.
- Les permission sets reduisent le temps de configuration des droits.

## 6. Impacts DB recommandes

### Index recommandés
- `utilisateurs(Username, Email, Est_actif, Est_verrouille, Date_creation)`
- `sessions(ID_Utilisateur, Est_active, Date_expiration, Date_connexion, IP_address)`
- `logs_audit(ID_Utilisateur, Action, Table_concernee, Date_action)`
- `permissions(Categorie, Code_permission)`
- `utilisateurs_permissions(ID_Utilisateur, ID_Permission, Type, Expiration)`

### Evolutions schema (P3+)
- Table `permission_sets`
- Table `permission_set_items`
- Table `user_permission_sets`
- Table `admin_delegations` (scope)

## 7. Risques et mitigations
1. Regressions sur autorisation
- Mitigation: tests unitaires middleware + tests d'integration sur endpoints admin.

2. Performance matrice
- Mitigation: endpoint dedie pre-agrege + pagination + index SQL.

3. Complexite UX
- Mitigation: composants reutilisables (table, filtres, modales, badge access).

4. Incoherence des noms de permissions
- Mitigation: dictionnaire central "permission labels" unique.

## 8. Plan de test minimum

### Backend
- Tests unitaires:
  - priorite `REFUSER`
  - expiration permission directe
- Tests integration:
  - 403 attendu sans permission
  - 200 attendu avec combinaison role/direct
  - suppression securisee role systeme/user courant

### Frontend
- Tests UI:
  - pagination, tri, filtres, confirmations
  - mise a jour inline matrice
- Tests E2E:
  - scenario super admin complet
  - scenario admin partiel (acces limite)

## 9. Definition of Done (DoD)
- Aucun endpoint admin sans validation d'entree.
- Chaque action sensible est auditee.
- Toutes les pages admin utilisent pagination/recherche/filtres.
- Aucun ID technique expose par defaut dans l'UI.
- 0 erreur critique console sur parcours admin principal.

## 10. Prochaine action immediate
Demarrer Sprint 1 par:
1. Contrat API pagine (backend).
2. Refactor `AdminPanel` en pages dediees.
3. Modales de confirmation + remplacement des prompts CSV.

