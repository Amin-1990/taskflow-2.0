# Guide d'Intégration - Nouvelle Fonctionnalité d'Affectation

## 🎯 Vue d'Ensemble

Ce guide couvre l'intégration complète de la nouvelle fonctionnalité d'affectation en cascade pour TaskFlow Mobile.

---

## 🔧 Installation & Configuration

### Backend

#### 1. Vérifier les dépendances
```bash
cd backend
npm install
```

#### 2. Vérifier la structure de la base de données
Les tables suivantes doivent exister:
- `commandes` (ID, Code_article, Unite_production, ID_Semaine, ID_Article, ID_Operateur, ID_Poste)
- `semaines` (ID, Code_semaine, Numero_semaine, Annee)
- `articles` (ID, Code_article, Client)
- `personnel` (ID, Nom_prenom, Matricule, Poste, Site_affectation)
- `postes` (ID, Description)
- `affectations` (ID, ID_Commande, ID_Operateur, ID_Poste, ID_Article, ID_Semaine)

#### 3. Lancer le serveur
```bash
npm start
# ou
node src/index.js
```

### Mobile

#### 1. Vérifier les dépendances
```bash
cd taskflow_mobile
flutter pub get
```

#### 2. Vérifier que les modèles existants sont importés
Les modèles suivants doivent être disponibles:
- `Article` (id, code, name, client)
- `Workstation` / `Poste` (id, name, code, isActive)
- `Operateur` (id, firstName, lastName, matricule, isActive)
- `Semaine` (maintenant avec id, codeSemaine, numeroSemaine, annee)
- `Unite` (id, nom) - **Nouveau**

#### 3. Vérifier la configuration API
Dans `lib/data/remote/services/task_service.dart`, les endpoints sont :
- Base URL: `${apiBaseUrl}/api/commandes`
- Endpoints:
  - `/semaines-disponibles` → `GET`
  - `/articles-filtres?semaineId=X&unite=Y` → `GET`
  - `/unites` → `GET`

#### 4. Lancer l'app mobile
```bash
flutter run
```

---

## 📡 API Endpoints

### 1. Semaines Disponibles
```
GET /api/commandes/semaines-disponibles
Authorization: Bearer {token}

Response (200 OK):
{
  "success": true,
  "data": [
    {
      "id": "1",
      "codeSemaine": "S08",
      "numeroSemaine": 8,
      "annee": 2026,
      "label": "S8 - 2026"
    },
    {
      "id": "2",
      "codeSemaine": "S09",
      "numeroSemaine": 9,
      "annee": 2026,
      "label": "S9 - 2026"
    }
  ]
}
```

### 2. Unités de Production
```
GET /api/commandes/unites
Authorization: Bearer {token}

Response (200 OK):
{
  "success": true,
  "data": [
    "Unité 1",
    "Unité 2",
    "Atelier A"
  ]
}
```

### 3. Articles Filtrés
```
GET /api/commandes/articles-filtres?semaineId=1&unite=Unité%201
Authorization: Bearer {token}

Response (200 OK):
{
  "success": true,
  "data": [
    {
      "id": "10",
      "codeArticle": "AL-9920-X"
    },
    {
      "id": "11",
      "codeArticle": "GBX-X5"
    }
  ]
}

Error (400 Bad Request):
{
  "success": false,
  "error": "Les paramètres semaineId et unite sont requis"
}
```

---

## 🏗️ Architecture

### Backend Flow
```
Route: GET /api/commandes/semaines-disponibles
  ↓
Controller: getSemainesAvecCommandes()
  ↓
Query: SELECT DISTINCT s.* FROM semaines s
       INNER JOIN commandes c ON c.ID_Semaine = s.ID
  ↓
Format: { id, codeSemaine, numeroSemaine, annee, label }
  ↓
Response: { success: true, data: [...] }
```

### Mobile Flow
```
Page: NewTaskPage
  ↓
Provider: newTaskProvider (StateNotifier)
  ↓
Repository: taskRepository
  ↓
Service: taskService
  ↓
Dio Client: HTTP Request
  ↓
Backend API
```

### State Management (Riverpod)
```
newTaskProvider
  ├─ loadInitialData()
  │  ├─ getSemainesAvecCommandes() → state.semaines
  │  ├─ getAvailableWorkstations() → state.postes
  │  └─ getOperators() → state.operateurs
  │
  ├─ selectSemaine(semaine)
  │  ├─ Set state.selectedSemaine
  │  ├─ Reset state.selectedUnite, state.selectedArticle
  │  └─ Load state.unites via _loadUnitesForSemaine()
  │
  ├─ selectUnite(unite)
  │  ├─ Set state.selectedUnite
  │  ├─ Reset state.selectedArticle
  │  └─ Load state.articles via _loadArticlesFiltres()
  │
  ├─ selectArticle(article) → Set state.selectedArticle
  ├─ selectPoste(poste) → Set state.selectedPoste
  ├─ selectOperateur(operateur) → Set state.selectedOperateur
  │
  └─ submit()
     ├─ Validate all fields (isValid)
     └─ POST /api/affectations
```

---

## 🧪 Tests

### Test des Endpoints Backend

```bash
cd backend
node test-new-endpoints.js
```

Script test inclus dans `backend/test-new-endpoints.js`

### Test Unitaire (Jest)

```bash
cd backend
npm test -- new-assignment-endpoints.test.js
```

Tests inclus dans `backend/src/tests/new-assignment-endpoints.test.js`

### Test Mobile (Flutter)

```bash
cd taskflow_mobile
flutter test
```

---

## 📱 UI Components

### SelectionField Widget
```dart
SelectionField<T>(
  label: 'Libellé du champ',
  value: selectedValue,
  displayText: (item) => item.toString(),
  onTap: () {
    showDialog(
      context: context,
      builder: (context) => SelectionModal<T>(
        title: 'Titre de la modale',
        items: itemList,
        displayText: (item) => item.toString(),
        onSelect: (selected) { /* Handle selection */ },
      ),
    );
  },
  enableQrScan: true,
  onScanQr: () async { /* Scan QR code */ },
  error: validationError,
)
```

### SelectionModal Widget
```dart
SelectionModal<T>(
  title: 'Titre',
  items: itemList,
  displayText: (item) => item.toString(),
  selectedValue: currentSelection,
  onSelect: (selected) { /* Handle selection */ },
)
```

---

## 🔐 Authentification

Tous les endpoints nécessitent un token d'authentification:
```
Authorization: Bearer {jwt_token}
```

Assurez-vous que le token est inclus dans les headers pour tous les appels API.

---

## 🚨 Gestion des Erreurs

### Erreurs Backend
```javascript
// Paramètres manquants
{
  "success": false,
  "error": "Les paramètres semaineId et unite sont requis"
}

// Erreur database
{
  "success": false,
  "error": "Erreur lors de la récupération des articles"
}
```

### Erreurs Mobile
- **Service Exception** : Gérée par le provider (fallback offline)
- **Validation Error** : Affichée dans le UI avec `state.error`
- **Network Error** : Utilise les données en cache

---

## 🔄 Cascade Logic (Étapes Clés)

### Étape 1: Chargement Initial
```dart
loadInitialData() {
  // 1. Charger semaines avec commandes
  final semaines = await getSemainesAvecCommandes();
  
  // 2. Charger postes
  final postes = await getAvailableWorkstations();
  
  // 3. Charger opérateurs
  final operateurs = await getOperators();
  
  // 4. Sélectionner la première semaine
  final selectedSemaine = semaines.first;
  
  // 5. Charger les unités pour cette semaine
  _loadUnitesForSemaine(selectedSemaine.id);
}
```

### Étape 2: Sélection de Semaine
```dart
selectSemaine(Semaine semaine) {
  // 1. Mettre à jour la sélection
  state = state.copyWith(selectedSemaine: semaine);
  
  // 2. Réinitialiser unité et articles
  state = state.copyWith(
    selectedUnite: null,
    selectedArticle: null,
  );
  
  // 3. Charger les unités
  _loadUnitesForSemaine(semaine.id);
}
```

### Étape 3: Sélection d'Unité
```dart
selectUnite(Unite unite) {
  // 1. Mettre à jour la sélection
  state = state.copyWith(selectedUnite: unite);
  
  // 2. Réinitialiser les articles
  state = state.copyWith(selectedArticle: null);
  
  // 3. Charger les articles filtrés
  _loadArticlesFiltres(selectedSemaine.id, unite.nom);
}
```

### Étape 4: Submit
```dart
submit() {
  // 1. Valider
  if (!state.isValid) return null;
  
  // 2. Créer l'affectation
  final task = await createAffectation(
    operatorId: state.selectedOperateur.id,
    articleId: state.selectedArticle.id,
    workstationId: state.selectedPoste.id,
    semaineId: state.selectedSemaine.id,
  );
  
  // 3. Rediriger
  context.go('/operator/dashboard');
}
```

---

## 📋 Checklist de Déploiement

- [ ] Backend API endpoints testés
- [ ] Routes enregistrées dans `commande.routes.js`
- [ ] Models Dart (Semaine, Unite) importés correctement
- [ ] Service methods implémentées dans `task_service.dart`
- [ ] Repository methods implémentées dans `task_repository.dart`
- [ ] Provider refactorisé et testé
- [ ] Widgets (SelectionField, SelectionModal) créés
- [ ] Page NewTaskPage refactorisée
- [ ] Section "RECENT" supprimée
- [ ] Tests unitaires/intégration passent
- [ ] QR Scan logic implémentée (optionnel)
- [ ] Offline mode fonctionne
- [ ] Performance optimisée (pagination, cache)

---

## 🐛 Dépannage

### Le formulaire montre "Aucun article disponible"
**Cause** : La combinaison semaine/unité n'a pas d'articles
**Solution** : Vérifier la base de données pour cette combinaison

### Les dropdown restent vides
**Cause** : Les appels API échouent silencieusement
**Solution** : Vérifier les logs Dart et les tokens d'authentification

### Erreur "Les paramètres semaineId et unite sont requis"
**Cause** : Un paramètre est `null` ou vide
**Solution** : Valider que la sélection a été faite avant l'appel

### Mode offline n'affiche que des données de fallback
**Cause** : Pas de cache disponible
**Solution** : Charger l'app avec Internet d'abord pour remplir le cache

---

## 📚 Ressources

- **Plan Original** : `plans/new_assignment_feature_plan.md`
- **Implémentation Summary** : `IMPLEMENTATION_SUMMARY.md`
- **Code Backend** : `backend/src/controllers/commande.controller.js`
- **Code Mobile** : `taskflow_mobile/lib/features/operator/task/`

---

## ✅ Validation Finale

Pour valider l'implémentation:

1. **Backend** : Tous les endpoints retournent les bonnes données
2. **Mobile** : L'app charge sans erreurs
3. **UI** : Les SelectionFields s'affichent correctement
4. **Cascade** : La cascade semaine → unité → articles fonctionne
5. **Submit** : L'affectation est créée avec succès
6. **Offline** : L'app fonctionne en mode offline avec données en cache

---

Dernière mise à jour : Février 2026
