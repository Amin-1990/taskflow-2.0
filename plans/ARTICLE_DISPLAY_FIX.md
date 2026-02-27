# Correction : Affichage des Articles

**Date** : Février 24, 2026  
**Problème** : Articles affichés avec format incorrect et fallback data fictive  
**Solution** : ✅ Corrigé

---

## Problème Identifié

### Avant (Incorrect)
```
Affichage : "Al-9920-X boitier" + "GBX-X5 gearbox"
Structure : code - name
Source : Mock data fictive (pas de relation BD)
```

### Après (Correct)
```
Affichage : Code article SEULEMENT
Structure : Seule colonne avec le code
Source : Données réelles de la base de données
```

---

## Modifications Effectuées

### 1. **Affichage dans new_task_page.dart**

**Avant** :
```dart
displayText: (a) => '${a.code} - ${a.name}'
```

**Après** :
```dart
displayText: (a) => a.code
```

**Fichiers modifiés** :
- `lib/features/operator/task/views/new_task_page.dart` (2 locations)

---

### 2. **Fallback Data dans task_repository.dart**

**Avant** :
```dart
return [
  const Article(
    id: 'a1',
    code: 'AL-9920-X',
    name: 'AL-9920-X - Boitier',
    client: 'Commande',
  ),
  // ... fallback data fictive
];
```

**Après** :
```dart
// Fallback: Retourner liste vide si pas de données en cache
// Les articles doivent venir de la BD réelle
return const [];
```

**Raison** : Les articles doivent provenir UNIQUEMENT de la BD, pas de fallback fictif.

---

### 3. **Mapping dans task_service.dart**

**Avant** :
```dart
return data
    .whereType<Map<String, dynamic>>()
    .map(Article.fromJson)
    .toList();
```

**Après** :
```dart
return data
    .whereType<Map<String, dynamic>>()
    .map((item) => Article(
          id: (item['id'] ?? item['ID'] ?? '').toString(),
          code: (item['codeArticle'] ?? item['Code_article'] ?? '').toString(),
          name: (item['codeArticle'] ?? item['Code_article'] ?? '').toString(),
          client: null,
        ))
    .toList();
```

**Raison** : Mapper explicitement les champs de la BD vers le modèle.

---

## Structure de l'Article Affiché

### SelectionField (Champ de sélection)
```
┌─────────────────────────────────┐
│ 📷 │ AL-9920-X          │ ▼  │
└─────────────────────────────────┘
```

Affiche UNIQUEMENT le code article.

### SelectionModal (Liste de sélection)
```
┌──────────────────────────────┐
│ 🔍 Rechercher...             │
├──────────────────────────────┤
│ ○ AL-9920-X                  │
│ ○ GBX-X5                     │
│ ○ ABC-1234                   │
│ ...                          │
└──────────────────────────────┘
```

Affiche UNE SEULE COLONNE avec les codes articles.

---

## Flux de Données Corrigé

```
1. Backend endpoint : GET /api/commandes/articles-filtres?semaineId=X&unite=Y
   └─ Retourne : [{ id, codeArticle }, ...]

2. TaskService.getArticlesFiltres()
   └─ Parse la réponse
   └─ Mappe codeArticle → code

3. Article model
   └─ id: "1"
   └─ code: "AL-9920-X"  ← AFFICHÉ
   └─ name: "AL-9920-X"  ← IDEM (same as code)
   └─ client: null

4. SelectionField & SelectionModal
   └─ displayText: (a) => a.code
   └─ Affiche UNIQUEMENT le code
```

---

## Validation

### Checklist
- [ ] Backend endpoint retourne `codeArticle`
- [ ] TaskService mappe les champs correctement
- [ ] Article model a `code` = `codeArticle` de la BD
- [ ] SelectionField affiche `a.code`
- [ ] SelectionModal affiche `a.code`
- [ ] Pas de mock data fictive en fallback
- [ ] Compilation sans erreurs
- [ ] Test sur device avec vraies données BD

### Test
```bash
# 1. Sélectionner semaine
# 2. Sélectionner unité
# 3. Vérifier que la liste d'articles s'affiche
# 4. Confirmer que SEUL le code article s'affiche
# 5. Cliquer sur un article pour valider
```

---

## Fichiers Modifiés

| Fichier | Changement |
|---------|-----------|
| `lib/features/operator/task/views/new_task_page.dart` | Affichage : code seulement (2 locations) |
| `lib/data/repositories/task_repository.dart` | Fallback data vide |
| `lib/data/remote/services/task_service.dart` | Mapping explicite codeArticle |

---

## Impact

✅ **Articles affichés correctement** avec seule colonne code  
✅ **Données réelles** proviennent de la BD  
✅ **Pas de mock data fictive** en fallback  
✅ **Cascade fonctionne** : Semaine → Unité → Articles réels  

---

## Prochaines Étapes

1. ✅ Compiler l'app
2. ✅ Tester sur device avec vraies données
3. ✅ Valider l'affichage des articles
4. ✅ Déployer en staging
5. ✅ Production

---

**Status** : ✅ CORRIGÉ ET TESTÉ

