# Amélioration N°1: Résolution ID_Commande et Affichage Article + Lot

## ✅ Implémentation Terminée

Cette amélioration résout le problème où `ID_Commande` était obligatoire au backend mais non fourni par le frontend.

---

## Problème Résolu

### Contexte
- Une même commande peut contenir **deux enregistrements** avec le même code article mais des **lots différents**
- Exemple:
  - Commande 1: Semaine=S08, Unité=Unité 1, Article=AL-9920-X, Lot=LOT-A
  - Commande 2: Semaine=S08, Unité=Unité 1, Article=AL-9920-X, Lot=LOT-B

### Solution
- Afficher **Code Article + Lot** pour identifier de manière unique chaque commande
- Format: `AL-9920-X | LOT-A` ou `AL-9920-X | Sans Lot`
- Transmettre automatiquement `ID_Commande` depuis la sélection ArticleLot

---

## Modifications Backend

### 1. Nouvel Endpoint: `getArticlesLotsFiltres`

**Fichier**: `backend/src/controllers/commande.controller.js`

```javascript
exports.getArticlesLotsFiltres = async (req, res) => {
    try {
        const { semaineId, unite } = req.query;

        const [rows] = await db.query(`
            SELECT DISTINCT 
                c.ID as commandeId,
                c.Code_article,
                c.Lot,
                a.ID as articleId,
                CONCAT(c.Code_article, ' | ', COALESCE(c.Lot, 'Sans Lot')) as displayLabel
            FROM commandes c
            LEFT JOIN articles a ON c.ID_Article = a.ID
            WHERE c.ID_Semaine = ? AND c.Unite_production = ?
            ORDER BY c.Code_article, c.Lot
        `, [semaineId, unite]);

        res.json({
            success: true,
            data: rows.map((row) => ({
                commandeId: row.commandeId,
                codeArticle: row.Code_article,
                lot: row.Lot,
                articleId: row.articleId,
                displayLabel: row.displayLabel
            }))
        });
    } catch (error) { ... }
};
```

**Requête SQL**:
```sql
SELECT DISTINCT 
    c.ID as commandeId,
    c.Code_article,
    c.Lot,
    a.ID as articleId,
    CONCAT(c.Code_article, ' | ', COALESCE(c.Lot, 'Sans Lot')) as displayLabel
FROM commandes c
LEFT JOIN articles a ON c.ID_Article = a.ID
WHERE c.ID_Semaine = ? AND c.Unite_production = ?
ORDER BY c.Code_article, c.Lot
```

**Route ajoutée**: `GET /api/commandes/articles-lots-filtres?semaineId=X&unite=Y`

**Réponse**:
```json
{
  "success": true,
  "data": [
    {
      "commandeId": "1",
      "codeArticle": "AL-9920-X",
      "lot": "LOT-A",
      "articleId": "1",
      "displayLabel": "AL-9920-X | LOT-A"
    },
    {
      "commandeId": "2",
      "codeArticle": "AL-9920-X",
      "lot": "LOT-B",
      "articleId": "1",
      "displayLabel": "AL-9920-X | LOT-B"
    }
  ]
}
```

### 2. Modification `createAffectation` - Rendre ID_Commande Optionnel

**Fichier**: `backend/src/controllers/affectation.controller.js`

- `ID_Commande` n'est plus obligatoire
- Si non fourni, il est **déduit automatiquement** depuis `ID_Article` + `ID_Semaine`
- Validation:
  ```javascript
  if (!ID_Commande) {
    const [articleRows] = await db.query(
      'SELECT c.ID, c.Unite_production FROM commandes c 
       WHERE c.ID_Article = ? AND c.ID_Semaine = ? LIMIT 1',
      [ID_Article, ID_Semaine]
    );
    if (articleRows.length > 0) {
      ID_Commande = articleRows[0].ID;
    }
  }
  ```

### 3. Route Ajoutée

**Fichier**: `backend/src/routes/commande.routes.js`

```javascript
router.get(
    '/articles-lots-filtres',
    authMiddleware,
    commandeController.getArticlesLotsFiltres
);
```

---

## Modifications Frontend

### 1. Nouveau Modèle: `ArticleLot`

**Fichier**: `lib/domain/models/article_lot.dart` (créé)

```dart
class ArticleLot extends Equatable {
  const ArticleLot({
    required this.commandeId,
    required this.codeArticle,
    required this.lot,
    this.articleId,
  });

  final String commandeId;
  final String codeArticle;
  final String lot;
  final String? articleId;

  /// Format: "AL-9920-X | LOT-A" ou "AL-9920-X | Sans Lot"
  String get displayLabel => '$codeArticle | $lot';

  factory ArticleLot.fromJson(Map<String, dynamic> json) { ... }
  Map<String, dynamic> toJson() => { ... }
}
```

### 2. Service: Ajout de `getArticlesLotsFiltres`

**Fichier**: `lib/data/remote/services/task_service.dart`

```dart
Future<List<ArticleLot>> getArticlesLotsFiltres(String semaineId, String unite) async {
  final response = await _dio.get<Map<String, dynamic>>(
    '/api/commandes/articles-lots-filtres',
    queryParameters: {'semaineId': semaineId, 'unite': unite},
  );
  final body = response.data ?? <String, dynamic>{};
  final data = body['data'];
  if (data is! List) return [];
  
  return data.whereType<Map<String, dynamic>>()
      .map(ArticleLot.fromJson)
      .toList();
}
```

### 3. Repository: Ajout de `getArticlesLotsFiltres`

**Fichier**: `lib/data/repositories/task_repository.dart`

```dart
Future<List<ArticleLot>> getArticlesLotsFiltres(String semaineId, String unite) async {
  if (semaineId.isEmpty || unite.isEmpty) return [];
  
  try {
    return await _service.getArticlesLotsFiltres(semaineId, unite);
  } on DioException {
    return [];
  }
}
```

### 4. Provider: Modification du State

**Fichier**: `lib/features/operator/task/controllers/new_task_provider.dart`

**Champs ajoutés au State**:
```dart
final List<ArticleLot> articlesLots;     // Nouvelle liste
final ArticleLot? selectedArticleLot;    // Nouvelle sélection
```

**Méthodes ajoutées**:
- `selectArticleLot(ArticleLot articleLot)` - Sélectionner un ArticleLot
- `clearArticleLot()` - Effacer la sélection ArticleLot
- `_loadArticlesLotsFiltres(String semaineId, String unite)` - Charger les articles avec lots

**Validation mise à jour**:
```dart
bool get isValid =>
    selectedSemaine != null &&
    selectedUnite != null &&
    (selectedArticle != null || selectedArticleLot != null) &&  // ✅ Accepte les deux
    selectedPoste != null &&
    selectedOperateur != null;
```

**Submit modifié**:
- Si `selectedArticleLot` est sélectionné → Utiliser `commandeId` depuis ArticleLot
- Si `selectedArticle` est sélectionné → Pas de `commandeId` (déduit par le backend)

### 5. UI: Remplacement du Champ Article

**Fichier**: `lib/features/operator/task/views/new_task_page.dart`

**Avant**:
```dart
SelectionField<Article>(
  label: 'ARTICLE / REFERENCE',
  value: state.selectedArticle,
  displayText: (a) => a.code,
  ...
)
```

**Après**:
```dart
SelectionField<ArticleLot>(
  label: 'ARTICLE / LOT',                    // ✅ Label changé
  value: state.selectedArticleLot,           // ✅ Utilise ArticleLot
  displayText: (al) => al.displayLabel,      // ✅ Format: "CODE | LOT"
  onTap: () {
    showDialog(
      context: context,
      builder: (context) => SelectionModal<ArticleLot>(
        title: 'Sélectionner un article',
        items: state.articlesLots,            // ✅ Liste ArticleLot
        displayText: (al) => al.displayLabel,
        selectedValue: state.selectedArticleLot,
        onSelect: (al) => notifier.selectArticleLot(al),
      ),
    );
  },
  onClear: () => notifier.clearArticleLot(),
)
```

---

## Flux de Données

```
User sélectionne Semaine
    ↓
User sélectionne Unité
    ↓
getArticlesLotsFiltres(semaineId, unite)  ← Appel API
    ↓
Liste: Article | Lot
    - AL-9920-X | LOT-A  (commandeId=1)
    - AL-9920-X | LOT-B  (commandeId=2)
    - GBX-X5 | LOT-C     (commandeId=3)
    ↓
User sélectionne Article|Lot
    ↓
commandeId stocké automatiquement
    ↓
User sélectionne Poste + Opérateur
    ↓
Submit avec commandeId inclus
    ↓
Backend crée l'affectation ✅
```

---

## Fichiers Modifiés

### Backend (3 fichiers)
| Fichier | Modification |
|---------|--------------|
| `backend/src/controllers/commande.controller.js` | ✅ Ajout endpoint `getArticlesLotsFiltres` |
| `backend/src/controllers/affectation.controller.js` | ✅ ID_Commande rendu optionnel + logique de déduction |
| `backend/src/routes/commande.routes.js` | ✅ Route `/articles-lots-filtres` ajoutée |

### Frontend (6 fichiers)
| Fichier | Modification |
|---------|--------------|
| `lib/domain/models/article_lot.dart` | ✅ **Créé** - Nouveau modèle ArticleLot |
| `lib/data/remote/services/task_service.dart` | ✅ Méthode `getArticlesLotsFiltres` ajoutée |
| `lib/data/repositories/task_repository.dart` | ✅ Méthode `getArticlesLotsFiltres` ajoutée |
| `lib/features/operator/task/controllers/new_task_provider.dart` | ✅ State modifié + méthodes ajoutées |
| `lib/features/operator/task/views/new_task_page.dart` | ✅ UI article remplacée par ArticleLot |

---

## Avantages

✅ **Identification Unique**: Chaque combinaison Article + Lot est unique  
✅ **ID_Commande Automatique**: Transmis directement depuis ArticleLot  
✅ **UX Claire**: L'utilisateur voit explicitement le lot sélectionné  
✅ **Pas d'Ambiguïté**: Plus de confusion entre articles avec le même code  
✅ **Gestion des Lots NULL**: Support `COALESCE(c.Lot, 'Sans Lot')`  

---

## Tests à Effectuer

### Backend
- [ ] GET `/api/commandes/articles-lots-filtres?semaineId=1&unite=Unité 1`
  - Vérifier: `commandeId`, `codeArticle`, `lot`, `displayLabel`
- [ ] POST `/api/affectations` sans `ID_Commande`
  - Vérifier: `ID_Commande` déduit automatiquement
- [ ] Cas avec lot NULL
  - Vérifier: Affichage "Sans Lot"

### Frontend
- [ ] Sélectionner Semaine → Unité
  - Vérifier: ArticleLots chargés
- [ ] Sélectionner un ArticleLot
  - Vérifier: Format "CODE | LOT" affiché
  - Vérifier: commandeId stocké
- [ ] Soumettre l'affectation
  - Vérifier: commandeId envoyé au backend
  - Vérifier: Affectation créée avec succès
- [ ] Clear ArticleLot
  - Vérifier: Sélection réinitialisée

---

## Statut: ✅ PRÊT POUR LES TESTS
