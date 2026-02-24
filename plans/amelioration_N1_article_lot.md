# Amélioration N°1: Résolution du Problème ID_Commande et Affichage Article + Lot

## Problème Identifié

L'enregistrement d'affectation n'était pas sauvegardé car `ID_Commande` était obligatoire dans le backend, mais le frontend ne l'envoyait pas.

### Analyse du Problème

1. **Contrainte Backend**: Le contrôleur [`affectation.controller.js`](backend/src/controllers/affectation.controller.js) exige `ID_Commande` comme champ obligatoire
2. **Données Frontend**: Le formulaire mobile ne collecte pas directement `ID_Commande`
3. **Solution Initiale**: Interpréter `ID_Commande` depuis la combinaison: Semaine + Code Article + Unité de production

### Complexité Découverte

Dans la même semaine et la même unité, une commande peut contenir **deux enregistrements** avec le même code article mais des **lots différents**.

**Exemple**:
| ID | Semaine | Unité | Code_Article | Lot |
|----|---------|-------|--------------|-----|
| 1  | S08     | Unité 1 | AL-9920-X  | LOT-A |
| 2  | S08     | Unité 1 | AL-9920-X  | LOT-B |

Cela signifie que le code article seul ne suffit pas pour identifier de manière unique une commande.

---

## Solution Proposée

### Combinaison Article + Lot dans un Seul Champ

Afficher **Code Article + Lot** combinés dans le champ de sélection pour permettre une identification unique de la commande.

#### Format d'Affichage
```
AL-9920-X | LOT-A
AL-9920-X | LOT-B
GBX-X5 | LOT-C
```

---

## Modifications Requises

### 1. Backend - Nouvel Endpoint

**Fichier**: `backend/src/controllers/commande.controller.js`

```javascript
// GET /api/commandes/articles-lots-filtres
// Retourne les articles avec leurs lots filtrés par semaine ET unité
exports.getArticlesLotsFiltres = async (req, res) => {
  const { semaineId, unite } = req.query;
  
  const [rows] = await db.query(`
    SELECT DISTINCT 
      c.ID as commandeId,
      c.Code_article,
      c.Lot,
      a.ID as articleId,
      CONCAT(c.Code_article, ' | ', c.Lot) as displayLabel
    FROM commandes c
    LEFT JOIN articles a ON c.ID_Article = a.ID
    WHERE c.ID_Semaine = ? AND c.Unite_production = ?
    ORDER BY c.Code_article, c.Lot
  `, [semaineId, unite]);
  
  res.json({ success: true, data: rows });
};
```

### 2. Backend - Modification createAffectation

**Fichier**: `backend/src/controllers/affectation.controller.js`

Rendre `ID_Commande` optionnel et le déduire automatiquement si non fourni:

```javascript
// Si ID_Commande non fourni, le déduire depuis les autres champs
if (!ID_Commande && ID_Semaine && ID_Article && Unite_production) {
  const [commande] = await db.query(`
    SELECT ID FROM commandes 
    WHERE ID_Semaine = ? AND ID_Article = ? AND Unite_production = ?
    LIMIT 1
  `, [ID_Semaine, ID_Article, Unite_production]);
  
  if (commande.length > 0) {
    ID_Commande = commande[0].ID;
  }
}
```

### 3. Mobile - Modèle ArticleLot

**Fichier**: `lib/domain/models/article_lot.dart` (nouveau)

```dart
class ArticleLot extends Equatable {
  const ArticleLot({
    required this.commandeId,
    required this.codeArticle,
    required this.lot,
    required this.articleId,
  });
  
  final String commandeId;
  final String codeArticle;
  final String lot;
  final String? articleId;
  
  // Format: "AL-9920-X | LOT-A"
  String get displayLabel => '$codeArticle | $lot';
  
  factory ArticleLot.fromJson(Map<String, dynamic> json) {
    return ArticleLot(
      commandeId: (json['commandeId'] ?? json['ID'] ?? '').toString(),
      codeArticle: (json['Code_article'] ?? '').toString(),
      lot: (json['Lot'] ?? '').toString(),
      articleId: json['articleId']?.toString(),
    );
  }
  
  @override
  List<Object?> get props => [commandeId, codeArticle, lot];
}
```

### 4. Mobile - Service

**Fichier**: `lib/data/remote/services/task_service.dart`

```dart
Future<List<ArticleLot>> getArticlesLotsFiltres(String semaineId, String unite) async {
  final response = await _dio.get<Map<String, dynamic>>(
    '/api/commandes/articles-lots-filtres',
    queryParameters: {'semaineId': semaineId, 'unite': unite},
  );
  
  final body = response.data ?? {};
  final data = body['data'];
  if (data is! List) return [];
  
  return data.whereType<Map<String, dynamic>>()
      .map(ArticleLot.fromJson)
      .toList();
}
```

### 5. Mobile - Provider

**Fichier**: `lib/features/operator/task/controllers/new_task_provider.dart`

Remplacer `Article` par `ArticleLot` dans le state:

```dart
class NewTaskState {
  // ...
  final List<ArticleLot> availableArticlesLots;
  final ArticleLot? selectedArticleLot;
  // ...
}
```

### 6. Mobile - UI

**Fichier**: `lib/features/operator/task/views/new_task_page.dart`

Le champ Article affiche maintenant:
```
┌─────────────────────────────────────────────────────┐
│ ARTICLE / LOT                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 📷 │ AL-9920-X | LOT-A                  │ ▼  │ │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## Flux de Données Mis à Jour

```mermaid
flowchart TD
    A[User sélectionne Semaine] --> B[User sélectionne Unité]
    B --> C[API: getArticlesLotsFiltres]
    C --> D[Liste Article + Lot]
    D --> E[User sélectionne Article|Lot]
    E --> F[commandeId récupéré]
    F --> G[User sélectionne Poste]
    G --> H[User sélectionne Opérateur]
    H --> I[Submit avec ID_Commande]
```

---

## Avantages de cette Solution

1. **Identification Unique**: Chaque combinaison Article + Lot est unique
2. **ID_Commande Disponible**: Le `commandeId` est directement récupéré depuis la sélection
3. **UX Claire**: L'utilisateur voit explicitement quel lot il sélectionne
4. **Pas de Ambiguïté**: Plus de confusion entre deux commandes avec le même article

---

## Fichiers à Modifier

### Backend
| Fichier | Action |
|---------|--------|
| `backend/src/controllers/commande.controller.js` | Ajouter endpoint `getArticlesLotsFiltres` |
| `backend/src/routes/commande.routes.js` | Ajouter route |
| `backend/src/controllers/affectation.controller.js` | Rendre ID_Commande optionnel |

### Mobile
| Fichier | Action |
|---------|--------|
| `lib/domain/models/article_lot.dart` | Créer nouveau modèle |
| `lib/data/remote/services/task_service.dart` | Ajouter méthode |
| `lib/data/repositories/task_repository.dart` | Ajouter méthode |
| `lib/features/operator/task/controllers/new_task_provider.dart` | Modifier state |
| `lib/features/operator/task/views/new_task_page.dart` | Modifier UI |

---

## Tests Recommandés

1. **Cas Normal**: Semaine avec articles uniques
2. **Cas Multiple**: Semaine avec même article, lots différents
3. **Cas Vide**: Aucune commande pour la combinaison semaine/unité
4. **Cas Lot Null**: Commande sans lot spécifié
