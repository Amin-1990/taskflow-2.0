# Dictionnaire RBAC - Permissions READ/WRITE

## Convention
- Format unique: `MODULE_READ` / `MODULE_WRITE`
- `READ`: accès consultation (GET)
- `WRITE`: création/modification/suppression/actions métier (POST/PUT/PATCH/DELETE)

## Dictionnaire complet par module

| Module | Permission READ | Permission WRITE | Préfixe API principal |
|---|---|---|---|
| ADMIN | `ADMIN_READ` | `ADMIN_WRITE` | `/api/admin` |
| SESSIONS | `SESSIONS_READ` | `SESSIONS_WRITE` | `/api/sessions` |
| AUDIT | `AUDIT_READ` | `AUDIT_WRITE` | `/api/audit` |
| COMMANDES | `COMMANDES_READ` | `COMMANDES_WRITE` | `/api/commandes` |
| PLANNING | `PLANNING_READ` | `PLANNING_WRITE` | `/api/planning` |
| ARTICLES | `ARTICLES_READ` | `ARTICLES_WRITE` | `/api/articles` |
| ARTICLES_MACHINES_TEST | `ARTICLES_MACHINES_TEST_READ` | `ARTICLES_MACHINES_TEST_WRITE` | `/api/articles-machines-test` |
| MACHINES | `MACHINES_READ` | `MACHINES_WRITE` | `/api/machines` |
| TYPES_MACHINE | `TYPES_MACHINE_READ` | `TYPES_MACHINE_WRITE` | `/api/types-machine` |
| INTERVENTIONS | `INTERVENTIONS_READ` | `INTERVENTIONS_WRITE` | `/api/interventions` |
| PERSONNEL | `PERSONNEL_READ` | `PERSONNEL_WRITE` | `/api/personnel` |
| POSTES | `POSTES_READ` | `POSTES_WRITE` | `/api/postes` |
| POINTAGE | `POINTAGE_READ` | `POINTAGE_WRITE` | `/api/pointage` |
| HORAIRES | `HORAIRES_READ` | `HORAIRES_WRITE` | `/api/horaires` |
| AFFECTATIONS | `AFFECTATIONS_READ` | `AFFECTATIONS_WRITE` | `/api/affectations` |
| DEFAUTS_PROCESS | `DEFAUTS_PROCESS_READ` | `DEFAUTS_PROCESS_WRITE` | `/api/defauts-process` |
| DEFAUTS_PRODUIT | `DEFAUTS_PRODUIT_READ` | `DEFAUTS_PRODUIT_WRITE` | `/api/defauts-produit` |
| DEFAUTS_TYPE_MACHINE | `DEFAUTS_TYPE_MACHINE_READ` | `DEFAUTS_TYPE_MACHINE_WRITE` | `/api/defauts-type-machine` |
| INDICATEURS | `INDICATEURS_READ` | `INDICATEURS_WRITE` | `/api/indicateurs` |
| SEMAINES | `SEMAINES_READ` | `SEMAINES_WRITE` | `/api/semaines` |
| ECHELONS | `ECHELONS_READ` | `ECHELONS_WRITE` | `/api/echelons` |
| EXPORT | `EXPORT_READ` | `EXPORT_WRITE` | `/api/export` |
| IMPORT | `IMPORT_READ` | `IMPORT_WRITE` | `/api/import` |

## Modules visibles côté interface (pages ou sections fonctionnelles)
- `ADMIN` (dashboard, utilisateurs, permissions, autorités, sessions, audit)
- `COMMANDES`
- `PLANNING`
- `ARTICLES`
- `MACHINES`
- `TYPES_MACHINE`
- `INTERVENTIONS`
- `PERSONNEL`
- `POSTES`
- `POINTAGE`
- `HORAIRES`
- `AFFECTATIONS`
- `DEFAUTS_PROCESS`
- `DEFAUTS_PRODUIT`
- `DEFAUTS_TYPE_MACHINE`
- `INDICATEURS`
- `SEMAINES`
- `ECHELONS`

## Modules plutôt techniques/transverses (hors matrice UI utilisateur)
- `EXPORT`
- `IMPORT`
- `ARTICLES_MACHINES_TEST` (souvent interne métier/paramétrage avancé)

## Recommandation d'usage
- Appliquer `*_READ` sur tous les endpoints `GET`.
- Appliquer `*_WRITE` sur tous les endpoints `POST`, `PUT`, `PATCH`, `DELETE`.
- Conserver la règle de priorité globale: `REFUSER` direct > `ACCORDER` direct > permissions via rôles > aucun accès.
