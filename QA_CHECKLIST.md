# Checklist QA - Nouvelle Fonctionnalité d'Affectation

## 📋 Contrôle de Qualité du Code

### Backend Endpoints

#### GET /api/commandes/semaines-disponibles
- [ ] Endpoint créé dans `commande.controller.js`
- [ ] Route enregistrée dans `commande.routes.js`
- [ ] Authentification requise
- [ ] Query SQL correct (DISTINCT, INNER JOIN)
- [ ] Tri par année DESC, numéro semaine DESC
- [ ] Format réponse : `{ id, codeSemaine, numeroSemaine, annee, label }`
- [ ] Label généré correctement : `S{numero} - {annee}`
- [ ] Gestion des erreurs (500)
- [ ] Logs console (`console.error`)

#### GET /api/commandes/articles-filtres
- [ ] Endpoint créé dans `commande.controller.js`
- [ ] Route enregistrée dans `commande.routes.js`
- [ ] Authentification requise
- [ ] Paramètres requis : `semaineId`, `unite`
- [ ] Validation paramètres (400 si manquant)
- [ ] Query SQL filtre par semaine ET unité
- [ ] Format réponse : `{ id, codeArticle }`
- [ ] Gestion des erreurs (400, 500)
- [ ] Logs console

#### GET /api/commandes/unites
- [ ] Endpoint existant et fonctionnel
- [ ] Authentification requise
- [ ] Retourne liste distincte des unités
- [ ] Format réponse : array de strings

---

### Mobile Models

#### Semaine.dart
- [ ] Propriétés : `id`, `codeSemaine`, `numeroSemaine`, `annee`
- [ ] Getter `label` → `S{numero} - {annee}`
- [ ] Extends Equatable
- [ ] Factory `fromJson()` gère les clés alternatives
- [ ] Méthode `toJson()`
- [ ] Props pour Equatable : `[id, codeSemaine, numeroSemaine, annee]`

#### Unite.dart (Nouveau)
- [ ] Propriétés : `id`, `nom`
- [ ] Extends Equatable
- [ ] Factory `fromJson()`
- [ ] Méthode `toJson()`
- [ ] Props pour Equatable : `[id, nom]`

---

### Mobile Services

#### TaskService.dart
- [ ] Import `Unite` model
- [ ] Méthode `getSemainesAvecCommandes()`
  - [ ] Appelle `GET /api/commandes/semaines-disponibles`
  - [ ] Parse la réponse
  - [ ] Retourne `List<Semaine>`
  - [ ] Gère les erreurs (DioException)
  
- [ ] Méthode `getUnitesProduction()`
  - [ ] Appelle `GET /api/commandes/unites`
  - [ ] Parse la réponse (array de strings)
  - [ ] Retourne `List<Unite>`
  - [ ] Gère les erreurs
  
- [ ] Méthode `getArticlesFiltres(semaineId, unite)`
  - [ ] Appelle `GET /api/commandes/articles-filtres?...`
  - [ ] Passe les paramètres correctement
  - [ ] Parse la réponse
  - [ ] Retourne `List<Article>`
  - [ ] Gère les erreurs

---

### Mobile Repository

#### TaskRepository.dart
- [ ] Import `Unite` model
- [ ] Cache variables (`_cachedWeeks`, etc.)
- [ ] Méthode `getSemainesAvecCommandes()`
  - [ ] Appelle `_service.getSemainesAvecCommandes()`
  - [ ] Mise en cache des résultats
  - [ ] Fallback offline (mock data)
  - [ ] Gestion DioException
  
- [ ] Méthode `getUnitesProduction()`
  - [ ] Appelle `_service.getUnitesProduction()`
  - [ ] Fallback offline
  - [ ] Gestion DioException
  
- [ ] Méthode `getArticlesFiltres(semaineId, unite)`
  - [ ] Validation des paramètres
  - [ ] Appelle `_service.getArticlesFiltres()`
  - [ ] Mise en cache
  - [ ] Fallback offline
  - [ ] Gestion DioException

---

### Mobile Provider (State Management)

#### NewTaskState
- [ ] Propriété `semaines: List<Semaine>`
- [ ] Propriété `unites: List<Unite>`
- [ ] Propriété `articles: List<Article>`
- [ ] Propriété `postes: List<Workstation>`
- [ ] Propriété `operateurs: List<Operateur>`
- [ ] Propriété `selectedSemaine: Semaine?`
- [ ] Propriété `selectedUnite: Unite?`
- [ ] Propriété `selectedArticle: Article?`
- [ ] Propriété `selectedPoste: Workstation?`
- [ ] Propriété `selectedOperateur: Operateur?`
- [ ] Getter `isValid` valide les 5 champs
- [ ] Factory `initial()`
- [ ] Méthode `copyWith()` pour tous les champs

#### NewTaskNotifier
- [ ] Méthode `loadInitialData()`
  - [ ] Charge semaines avec commandes
  - [ ] Charge postes
  - [ ] Charge opérateurs
  - [ ] Sélectionne la première semaine
  - [ ] Charge les unités pour cette semaine
  
- [ ] Méthode `selectSemaine(Semaine)`
  - [ ] Met à jour `selectedSemaine`
  - [ ] Reset `selectedUnite`, `selectedArticle`
  - [ ] Appelle `_loadUnitesForSemaine()`
  
- [ ] Méthode `selectUnite(Unite)`
  - [ ] Met à jour `selectedUnite`
  - [ ] Reset `selectedArticle`
  - [ ] Appelle `_loadArticlesFiltres()`
  
- [ ] Méthode `selectArticle(Article)`
  - [ ] Met à jour `selectedArticle`
  
- [ ] Méthode `selectPoste(Workstation)`
  - [ ] Met à jour `selectedPoste`
  
- [ ] Méthode `selectOperateur(Operateur)`
  - [ ] Met à jour `selectedOperateur`
  - [ ] Met à jour `operatorId`
  
- [ ] Méthode `submit()`
  - [ ] Valide `isValid`
  - [ ] Appelle `createAffectation()`
  - [ ] Retourne `Task?`
  - [ ] Gère les erreurs
  
- [ ] Méthode `_loadUnitesForSemaine()`
  - [ ] Appelle `_repository.getUnitesProduction()`
  - [ ] Met à jour `state.unites`
  
- [ ] Méthode `_loadArticlesFiltres()`
  - [ ] Appelle `_repository.getArticlesFiltres()`
  - [ ] Met à jour `state.articles`

---

### Mobile Widgets

#### SelectionField<T>
- [ ] Propriété `label: String`
- [ ] Propriété `value: T?`
- [ ] Propriété `displayText: Function(T) -> String`
- [ ] Propriété `onTap: VoidCallback`
- [ ] Propriété `onScanQr: Future<void> Function()?`
- [ ] Propriété `enableQrScan: bool`
- [ ] Propriété `error: String?`
- [ ] Design constants
  - [ ] `borderRadius = 12.0`
  - [ ] `borderWidth = 2.0`
  - [ ] `borderColor = #2A7BFF`
  - [ ] `backgroundColor = #1A2C4B`
  - [ ] `textColor = #E8EEF8`
  - [ ] `fieldHeight = 56.0`
- [ ] Layout
  - [ ] Label (haut)
  - [ ] Container avec bordure
  - [ ] QR icon (optionnel, gauche)
  - [ ] Texte sélection (centre)
  - [ ] Flèche dropdown (droite)
  - [ ] Message erreur (bas)
- [ ] Comportement
  - [ ] Clique sur le champ ouvre une modale
  - [ ] QR scan optionnel
  - [ ] Affiche les erreurs
  - [ ] Désactivé si valeur invalide

#### SelectionModal<T>
- [ ] Propriété `title: String`
- [ ] Propriété `items: List<T>`
- [ ] Propriété `displayText: Function(T) -> String`
- [ ] Propriété `onSelect: Function(T)`
- [ ] Propriété `selectedValue: T?`
- [ ] Barre de recherche
  - [ ] Filtre en temps réel
  - [ ] Case-insensitive
- [ ] Liste
  - [ ] Radio buttons
  - [ ] Sélection visuelle
- [ ] Comportement
  - [ ] Clique item → sélectionne et ferme
  - [ ] Radio button → sélectionne et ferme
  - [ ] Message "Aucun résultat" si vide
  - [ ] Bouton Fermer

---

### Mobile Views

#### NewTaskPage
- [ ] Structure UI
  - [ ] AppBar avec titre "NOUVELLE AFFECTATION"
  - [ ] Section TIMELINE
    - [ ] Semaine de Production (SelectionField)
  - [ ] Section DETAILS DE LA TACHE
    - [ ] Unité (SelectionField)
    - [ ] Article / Référence (SelectionField)
    - [ ] Poste de Travail (SelectionField)
  - [ ] Section PERSONNEL
    - [ ] Opérateur (Badge) (SelectionField)
- [ ] Suppression
  - [ ] ❌ Section "RECENT" supprimée
  - [ ] ❌ Import `RecentTaskTile` supprimé
  - [ ] ❌ Import `scanner_button` supprimé
- [ ] Affichage des erreurs
  - [ ] Message d'erreur visible (rouge)
  - [ ] Validation en temps réel
- [ ] Bouton Confirmer
  - [ ] Désactivé si formulaire incomplet
  - [ ] Spinner si en cours de submission
  - [ ] Affiche message de succès
  - [ ] Redirige vers dashboard

---

## 🧪 Tests Manuels

### Test Backend

#### 1. Semaines Disponibles
```bash
curl -X GET http://localhost:3001/api/commandes/semaines-disponibles \
  -H "Authorization: Bearer {token}"
```
- [ ] Status 200
- [ ] Response contient `semaines.data`
- [ ] Chaque semaine a `id`, `codeSemaine`, `numeroSemaine`, `annee`, `label`
- [ ] Label format `S{X} - {YYYY}`

#### 2. Unités
```bash
curl -X GET http://localhost:3001/api/commandes/unites \
  -H "Authorization: Bearer {token}"
```
- [ ] Status 200
- [ ] Response contient `data` (array)
- [ ] Chaque élément est un string

#### 3. Articles Filtrés
```bash
curl -X GET "http://localhost:3001/api/commandes/articles-filtres?semaineId=1&unite=Unité%201" \
  -H "Authorization: Bearer {token}"
```
- [ ] Status 200
- [ ] Response contient `articles.data`
- [ ] Chaque article a `id`, `codeArticle`
- [ ] Articles filtrés correctement

### Test Mobile

#### 1. Chargement Initial
- [ ] Page s'ouvre sans crash
- [ ] Spinner de chargement visible
- [ ] Après chargement, tous les dropdowns ont des valeurs
- [ ] Première semaine est sélectionnée par défaut

#### 2. Sélection Semaine
- [ ] Clique sur SelectionField semaine ouvre la modale
- [ ] Modale affiche la liste des semaines
- [ ] Recherche fonctionne
- [ ] Sélection met à jour le champ
- [ ] Les unités sont chargées automatiquement

#### 3. Sélection Unité
- [ ] Modale unité s'ouvre
- [ ] Liste des unités affichée
- [ ] Sélection met à jour le champ
- [ ] Articles sont chargés automatiquement
- [ ] Articles affichent les bonnes données

#### 4. Sélection Article
- [ ] Modale article s'ouvre
- [ ] Liste des articles affichée
- [ ] Recherche fonctionne
- [ ] Sélection met à jour le champ

#### 5. Sélection Poste
- [ ] Modale poste s'ouvre
- [ ] Liste des postes affichée
- [ ] Sélection met à jour le champ

#### 6. Sélection Opérateur
- [ ] Modale opérateur s'ouvre
- [ ] Liste des opérateurs affichée
- [ ] Recherche fonctionne
- [ ] Sélection met à jour le champ

#### 7. Submit Formulaire
- [ ] Tous les champs remplis = bouton activé
- [ ] Un champ vide = bouton désactivé
- [ ] Clique Confirmer = spinner visible
- [ ] Après succès, redirection vers dashboard
- [ ] Message de succès affiché

#### 8. Gestion d'Erreurs
- [ ] Aucun article pour une combinaison semaine/unité = message vide
- [ ] Erreur API = message d'erreur affiché
- [ ] Offline = fallback data utilisé
- [ ] Erreur validation = message en rouge

---

## 🔍 Code Review Checklist

- [ ] Aucune variable non utilisée
- [ ] Aucun import inutilisé
- [ ] Noms de variables clairs et cohérents
- [ ] Commentaires à jour
- [ ] Structure de code cohérente
- [ ] Gestion des null-safety correcte
- [ ] Pas de warnings Dart
- [ ] Pas de warnings JavaScript
- [ ] Indentation correcte (2 espaces)
- [ ] Pas de code mort commenté

---

## 📊 Métriques de Performance

- [ ] LoadInitialData < 2 secondes
- [ ] SelectionModal search < 500ms
- [ ] SelectionField tap → modal open < 100ms
- [ ] Submit < 5 secondes
- [ ] Pas de memory leaks (profiler Dart)
- [ ] Pas de jank (60 FPS mantenu)

---

## 🔒 Sécurité

- [ ] Token d'authentification requis pour tous les endpoints
- [ ] Pas de données sensibles en logs
- [ ] Pas de secrets en code
- [ ] Validation côté serveur des paramètres
- [ ] Pas de injection SQL (prepared statements)

---

## 📱 Compatibilité

- [ ] Works on Flutter 3.0+
- [ ] Works on Android 12+
- [ ] Works on iOS 12+
- [ ] Responsive design
- [ ] Dark mode support
- [ ] Language: Français

---

## ✅ Fin de Checklist

**Date de Vérification** : ________________

**Testeur** : ________________

**Résultat Final** : 
- [ ] ✅ APPROVED - Prêt pour la production
- [ ] ⚠️ NEEDS FIXES - Problèmes identifiés
- [ ] ❌ REJECTED - Problèmes critiques

**Notes** : 
```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

---

**Signature** : ________________     **Date** : ________________
