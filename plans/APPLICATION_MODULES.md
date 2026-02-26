# TaskFlow 2.0 - Modules et Pages

## Vue d'ensemble de l'application

L'application TaskFlow 2.0 est une application de gestion de production industrielle avec les modules suivants :

---

## 1. Authentication / Authentification

**Route** : `/login`

**Fonctionnalités** :
- Login avec username/password
- Logout
- Rafraîchissement de token
- Profil utilisateur

**Statut Frontend** : ✅ Implementé

---

## 2. Dashboard / Tableau de bord

**Route** : `/`

**Fonctionnalités** :
- Vue d'ensemble des indicateurs clés
- Statistiques de production
- Alertes et notifications
- Accès rapide aux modules

**Statut Frontend** : ✅ Implementé

---

## 3. Module Production

### 3.1 Gestion des Commandes

**Route** : `/production/commandes`

**Sous-pages** :
- Liste des commandes
- Détail d'une commande
- Nouvelle commande
- Planification et facturation
- Analyse de production

**Fonctionnalités CRUD** :
- Créer commande
- Modifier commande
- Supprimer commande
- Dupliquer commande
- Changer statut commande

**Statut Frontend** : ✅ Implementé

### 3.2 Planning de Production

**Route** : `/production/planning`

**Sous-pages** :
- Planning hebdomadaire (vue chronologique)
- Planning manuel
- Analyse de charge

**Fonctionnalités** :
- Affectation des opérateurs aux postes
- Visualisation du planning
- Gestion des semaines
- Suivi de réalisation

**Statut Frontend** : ✅ Partiellement implementé

### 3.3 Affectations

**Routes** :
- `/production/affectations` (gestion)
- `/production/affectations/temps` (vue temps)
- `/production/affectations/chrono` (vue chronologique)

**Fonctionnalités** :
- Affectation des opérateurs aux machines/commandes
- Gestion des temps de travail
- Suivi chronologique

**Statut Frontend** : ✅ Partiellement implementé

---

## 4. Module Personnel / RH

### 4.1 Gestion du Personnel

**Route** : `/personnel`

**Sous-pages** :
- Liste du personnel
- Création employé
- Modification employé
- Dashboard RH
- Statistiques personnel

**Fonctionnalités CRUD** :
- Créer employé
- Modifier employé
- Supprimer employé
- Import/Export personnel

**Statut Frontend** : ✅ Implementé

### 4.2 Postes

**Route** : `/personnel/postes`

**Fonctionnalités** :
- Liste des postes
- Créer/Modifier/Supprimer poste

**Statut Frontend** : ✅ Implementé

### 4.3 Horaires

**Route** : `/personnel/horaires`

**Fonctionnalités** :
- Gestion des horaires de travail
- Planification hebdomadaire
- Suivi des présences

**Statut Frontend** : ✅ Implementé

### 4.4 Pointage

**Route** : `/personnel/pointage`

**Fonctionnalités** :
- Enregistrement des pointages
- Validation des heures
- Suivi des absences

**Statut Frontend** : ✅ Implementé

---

## 5. Module Maintenance

### 5.1 Machines

**Route** : `/maintenance/machines`

**Sous-pages** :
- Liste des machines
- Détail machine
- Nouvelle machine
- Dashboard maintenance

**Fonctionnalités CRUD** :
- Créer machine
- Modifier machine
- Supprimer machine

**Statut Frontend** : ✅ Implementé

### 5.2 Types de Machines

**Route** : `/maintenance/types-machine`

**Fonctionnalités** :
- Gestion des types de machines
- Défauts par type de machine

**Statut Frontend** : ✅ Implementé

### 5.3 Interventions / Demandes d'Intervention

**Route** : `/maintenance/interventions`

**Sous-pages** :
- Liste des interventions
- Détail intervention
- Nouvelle intervention
- Dashboard maintenance

**Fonctionnalités CRUD** :
- Créer intervention
- Modifier intervention
- Supprimer intervention
- Clôturer intervention

**Statut Frontend** : ✅ Implementé

### 5.4 Défauts

**Routes** :
- `/maintenance/defauts/process` (défauts process)
- `/maintenance/defauts/produit` (défauts produit)

**Fonctionnalités** :
- Gestion des défauts de processus
- Gestion des défauts produit

**Statut Frontend** : ❌ Non implementé

---

## 6. Module Qualité

### 6.1 Référentiel des Défauts

**Route** : `/qualite/defauts`

**Fonctionnalités** :
- Liste des types de défauts
- Créer/Modifier/Supprimer défaut

**Statut Frontend** : ✅ Implementé

### 6.2 Non-Conformités

**Route** : `/qualite/non-conformites`

**Fonctionnalités** :
- Enregistrement des non-conformités
- Suivi des anomalies
- Analyse qualité

**Statut Frontend** : ✅ Implementé

---

## 7. Module Articles / Catalogue

**Route** : `/articles`

**Sous-pages** :
- Liste des articles
- Détail article
- Gestion articles

**Fonctionnalités CRUD** :
- Créer article
- Modifier article
- Supprimer article

**Articles-Machines-Test** :
- Association articles-machines pour tests

**Statut Frontend** : ✅ Implementé

---

## 8. Module Semaines

**Route** : `/semaines`

**Fonctionnalités** :
- Gestion des semaines de production
- Planification des semaines
- Semaines fermées/ouvertes

**Statut Frontend** : ✅ Implementé

---

## 9. Module Indicateurs / Tableaux de bord

**Route** : `/indicateurs`

**Fonctionnalités** :
- Indicateurs de production
- Indicateurs de qualité
- Indicateurs de maintenance

**Sous-pages** :
- Dashboard production
- Dashboard maintenance
- Dashboard qualité
- Charts et graphiques

**Statut Frontend** : ✅ Partiellement implementé

---

## 10. Module Administration (Security/RBAC)

**Route** : `/admin`

**Sous-pages** :

### 10.1 Dashboard Admin
- Statistiques globales (utilisateurs, rôles, permissions, sessions, audit)

### 10.2 Gestion des Utilisateurs
- Liste des utilisateurs
- Détail utilisateur (rôles, permissions, sessions)
- Créer utilisateur
- Modifier utilisateur
- Supprimer utilisateur
- Statut utilisateur (actif/inactif/verrouillé)
- Réinitialiser mot de passe
- Gérer les rôles utilisateur
- Gérer les permissions utilisateur
- Expirer les sessions utilisateur

### 10.3 Gestion des Rôles
- Liste des rôles
- Détail rôle (permissions associées)
- Créer rôle
- Modifier rôle
- Supprimer rôle
- Gérer les permissions d'un rôle

### 10.4 Gestion des Permissions
- Liste des permissions (catégorisées)
- Créer permission
- Supprimer permission

### 10.5 Gestion des Sessions
- Liste des sessions actives
- Révocation de session

### 10.6 Audit Logs
- Journal des actions
- Filtres (par utilisateur, action, table, date)
- Export des logs

**Statut Frontend** : ❌ **À implémenter** (c'est le sujet de votre demande)

---

## 11. Module Import/Export

**Routes** :
- `/import` (import de données)
- `/export` (export de données)

**Fonctionnalités** :
- Import CSV/Excel
- Export CSV/Excel
- Modèles d'import

**Statut Frontend** : ❌ Non implementé (endpoints API existants)

---

## 12. Module Filtres

**Route** : `/filtres`

**Fonctionnalités** :
- Filtres sauvegardés
- Préférences utilisateur

**Statut Frontend** : ❌ Non implementé (endpoints API existants)

---

## Matrice des Endpoints API

| Module | Route API | Permissions | Frontend |
|--------|-----------|-------------|----------|
| Auth | `/api/auth/*` | - | ✅ |
| Admin | `/api/admin/*` | ADMIN_* | ❌ **À faire** |
| Commandes | `/api/commandes` | COMMANDES_* | ✅ |
| Planning | `/api/planning` | PLANNING_* | ✅ |
| Affectations | `/api/affectations` | AFFECTATIONS_* | ✅ |
| Personnel | `/api/personnel` | PERSONNEL_* | ✅ |
| Postes | `/api/postes` | POSTES_* | ✅ |
| Horaires | `/api/horaires` | HORAIRES_* | ✅ |
| Pointage | `/api/pointage` | POINTAGE_* | ✅ |
| Machines | `/api/machines` | MACHINES_* | ✅ |
| Types Machine | `/api/types-machine` | TYPES_MACHINE_* | ✅ |
| Interventions | `/api/interventions` | INTERVENTIONS_* | ✅ |
| Défauts Process | `/api/defauts-process` | DEFAUTS_PROCESS_* | ❌ |
| Défauts Produit | `/api/defauts-produit` | DEFAUTS_PRODUIT_* | ❌ |
| Défauts Type Machine | `/api/defauts-type-machine` | DEFAUTS_TYPE_MACHINE_* | ✅ |
| Articles | `/api/articles` | ARTICLES_* | ✅ |
| Articles-Machines-Test | `/api/articles-machines-test` | ARTICLES_MACHINES_TEST_* | ❌ |
| Semaines | `/api/semaines` | SEMAINES_* | ✅ |
| Indicateurs | `/api/indicateurs` | INDICATEURS_* | ✅ |
| Echelons | `/api/echelons` | ECHELONS_* | ❌ |
| Sessions | `/api/sessions` | SESSIONS_* | ❌ |
| Audit | `/api/audit` | AUDIT_* | ❌ |
| Import | `/api/import` | IMPORT_* | ❌ |
| Export | `/api/export` | EXPORT_* | ❌ |
| Filtres | `/api/filtres` | - | ❌ |

---

## Permissions RBAC Existantes

### Catégorie ADMIN
- `ADMIN_ACCESS` - Accès au module admin
- `ADMIN_DASHBOARD_READ` - Lecture dashboard admin
- `ADMIN_USERS_READ` - Lecture utilisateurs
- `ADMIN_USERS_WRITE` - Gestion utilisateurs
- `ADMIN_ROLES_READ` - Lecture rôles
- `ADMIN_ROLES_WRITE` - Gestion rôles
- `ADMIN_PERMISSIONS_READ` - Lecture permissions
- `ADMIN_PERMISSIONS_WRITE` - Gestion permissions

### Catégorie SESSIONS
- `SESSIONS_READ` - Lecture sessions
- `SESSIONS_WRITE` - Gestion sessions

### Catégorie AUDIT
- `AUDIT_READ` - Lecture logs d'audit
- `AUDIT_WRITE` - Écriture audit

### Autres catégories
- COMMANDES, PLANNING, ARTICLES, MACHINES, TYPES_MACHINE, INTERVENTIONS, PERSONNEL, POSTES, POINTAGE, HORAIRES, AFFECTATIONS, DEFAUTS_PROCESS, DEFAUTS_PRODUIT, DEFAUTS_TYPE_MACHINE, INDICATEURS, SEMAINES, ECHELONS, EXPORT, IMPORT

---

## Résumé des statuts

| Statut | Nombre de modules |
|--------|-------------------|
| ✅ Implementé | 10 |
| ❌ Non implementé | 7 |
| **❌ À faire (Admin)** | **1** |

**Note** : Le module Administration est le seul à développer entièrement pour le frontend.