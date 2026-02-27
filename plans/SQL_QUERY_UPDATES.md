# Mise à Jour des Requêtes SQL - Champs Semaine et Articles

## Résumé des Modifications

Modifications des requêtes SQL et des mappages de données pour aligner le backend et le frontend selon les spécifications du champ affichage.

---

## 1. Champ SEMAINE - Modification Backend

### Fichier: `backend/src/controllers/commande.controller.js`
**Endpoint**: `GET /api/commandes/semaines-disponibles`

#### Requête SQL modifiée:
```sql
SELECT DISTINCT
    s.ID,
    s.Annee,
    s.Code_semaine,
    s.Numero_semaine
FROM semaines s
INNER JOIN commandes c ON s.ID = c.ID_Semaine
ORDER BY s.Annee DESC, s.Code_semaine DESC
```

#### Modifications:
- ✅ Affichage explicite de `Annee` et `Code_semaine`
- ✅ Tri par `Annee DESC, Code_semaine DESC` (au lieu de `Numero_semaine`)
- ✅ Formatage du label: `${Code_semaine} - ${Annee}` (ex: "S08 - 2026")

#### Réponse API (avant):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "codeSemaine": "S08",
      "numeroSemaine": 8,
      "annee": 2026,
      "label": "S8 - 2026"
    }
  ]
}
```

#### Réponse API (après):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "codeSemaine": "S08",
      "numeroSemaine": 8,
      "annee": 2026,
      "label": "S08 - 2026"
    }
  ]
}
```

---

## 2. Champ ARTICLES - Modification Backend & Frontend

### Fichier: `backend/src/controllers/commande.controller.js`
**Endpoint**: `GET /api/commandes/articles-filtres`

#### Requête SQL modifiée:
```sql
SELECT DISTINCT
    a.ID,
    a.Code_article
FROM articles a
INNER JOIN commandes c ON a.Code_article COLLATE utf8mb4_unicode_ci = c.Code_article
WHERE c.ID_Semaine = ? AND c.Unite_production = ?
ORDER BY a.Code_article
```

#### Modifications:
- ✅ Jointure par `Code_article` (au lieu de `ID_Article`)
- ✅ Utilisation de collation `utf8mb4_unicode_ci` pour compatibilité des caractères spéciaux
- ✅ Filtrage basé sur les commandes de la semaine sélectionnée
- ✅ Tri par `Code_article`
- ✅ Changement du champ de réponse: `codeArticle` → `code`

#### Réponse API (avant):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "codeArticle": "AL-9920-X"
    }
  ]
}
```

#### Réponse API (après):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "AL-9920-X"
    }
  ]
}
```

---

## 3. Mise à Jour Frontend - Task Service

### Fichier: `taskflow_mobile/lib/data/remote/services/task_service.dart`
**Méthode**: `getArticlesFiltres()`

#### Code modifié:
```dart
Future<List<Article>> getArticlesFiltres(String semaineId, String unite) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/api/commandes/articles-filtres',
      queryParameters: {'semaineId': semaineId, 'unite': unite},
    );
    final body = response.data ?? <String, dynamic>{};
    final data = body['data'];
    if (data is! List) {
      return const [];
    }
    return data
        .whereType<Map<String, dynamic>>()
        .map((item) => Article(
              id: (item['id'] ?? item['ID'] ?? '').toString(),
              code: (item['code'] ??           // ✅ Nouveau champ principal
                      item['Code_article'] ??  // Fallback
                      item['codeArticle'] ??   // Fallback
                      '')
                  .toString(),
              name: (item['code'] ??           // ✅ Nouveau champ principal
                      item['Code_article'] ??  // Fallback
                      item['codeArticle'] ??   // Fallback
                      '')
                  .toString(),
              client: null,
            ))
        .toList();
  }
```

#### Améliorations:
- ✅ Support du nouveau champ `code`
- ✅ Fallbacks multiples pour compatibilité rétro-active
- ✅ Extraction correcte du code article depuis la réponse API

---

## 4. Mise à Jour Frontend - Modèle Semaine

### Fichier: `taskflow_mobile/lib/domain/models/semaine.dart`
**Propriété**: `label`

#### Code modifié:
```dart
String get label => '$codeSemaine - $annee';  // ✅ Utilise Code_semaine
```

#### Avant:
```dart
String get label => 'S$numeroSemaine - $annee';  // Affichait "S8 - 2026"
```

#### Après:
```dart
String get label => '$codeSemaine - $annee';     // Affiche "S08 - 2026"
```

---

## 5. Compatibilité et Migration

### Points d'Attention:
1. ✅ Le modèle `Article` accepte plusieurs variantes de clés (`code`, `Code_article`, `codeArticle`)
2. ✅ Le modèle `Semaine` utilise `codeSemaine` qui provient du backend
3. ✅ La collation `utf8mb4_unicode_ci` garantit la compatibilité avec les caractères spéciaux

### Teste de Compatibilité:
- ✅ Backend génère `code` au lieu de `codeArticle`
- ✅ Frontend accepte les deux pour éviter les régressions
- ✅ Affichage unifié: `Code_semaine - Annee` (ex: "S08 - 2026")

---

## Fichiers Modifiés

| Fichier | Type | Modifications |
|---------|------|----------------|
| `backend/src/controllers/commande.controller.js` | Backend | Endpoints `getSemainesAvecCommandes()` et `getArticlesFiltres()` |
| `taskflow_mobile/lib/data/remote/services/task_service.dart` | Frontend | Méthode `getArticlesFiltres()` - Mapping des champs |
| `taskflow_mobile/lib/domain/models/semaine.dart` | Frontend | Propriété `label` - Format d'affichage |

---

## Tests à Effectuer

### Backend:
- [ ] Test endpoint `/api/commandes/semaines-disponibles` - Vérifier le tri et le format du label
- [ ] Test endpoint `/api/commandes/articles-filtres?semaineId=X&unite=Y` - Vérifier les articles retournés
- [ ] Vérifier la collation `utf8mb4_unicode_ci` fonctionne pour les articles avec caractères spéciaux

### Frontend:
- [ ] Sélectionner une semaine - Vérifier affichage "CODE - ANNÉE" (ex: "S08 - 2026")
- [ ] Sélectionner une unité - Vérifier les articles se chargent correctement
- [ ] Vérifier les codes articles s'affichent correctement dans le champ de sélection
- [ ] Tester le complete flow: Semaine → Unité → Articles
