# Amélioration N°2: Correction Erreur Type Cast dans "Fin d'Affectation"

## Problème Identifié

**Message d'erreur**:
```
type 'List<dynamic>' is not a subtype of type 'Map<String, dynamic>?' in type cast
```

**Localisation**: Fenêtre "Fin d'Affectation" (`finish_task_page.dart`)

## Clarification Terminologique

> **Note importante**: "Fin de Production" = "Fin d'Affectation"
> 
> Il s'agit de la **mise d'une date de fin** à une affectation, pas de la fin de la production elle-même.
> L'affectation représente l'assignation d'un opérateur à une tâche/commande.

## Analyse du Problème

### Code Problématique

**Fichier**: [`task_service.dart`](taskflow_mobile/lib/data/remote/services/task_service.dart) - Lignes 16-25

```dart
Future<Task?> getCurrentTask(String operatorId) async {
  final response = await _dio.get<Map<String, dynamic>>(
      '/api/affectations/operateur/$operatorId/en-cours');
  final body = response.data ?? <String, dynamic>{};
  final data = (body['data'] as Map<String, dynamic>?) ?? body;  // ❌ ERREUR ICI
  if (data.isEmpty) {
    return null;
  }
  return Task.fromJson(data);
}
```

### Cause Racine

Le backend retourne potentiellement `body['data']` comme une **List** au lieu d'un **Map**, ce qui provoque l'erreur de cast.

**Scénarios possibles**:
1. L'API retourne un tableau vide `[]` quand aucune affectation en cours
2. L'API retourne un tableau avec un seul élément `[{...}]`
3. L'API retourne `null` pour `data`

### Réponse API Attendue vs Actuelle

**Attendu**:
```json
{
  "success": true,
  "data": {
    "ID": 123,
    "ID_Operateur": 1,
    ...
  }
}
```

**Actuel (problématique)**:
```json
{
  "success": true,
  "data": []  // ou [{...}] - Liste au lieu de Map
}
```

---

## Solution Proposée

### Modification du Service

**Fichier**: `lib/data/remote/services/task_service.dart`

```dart
Future<Task?> getCurrentTask(String operatorId) async {
  final response = await _dio.get<Map<String, dynamic>>(
      '/api/affectations/operateur/$operatorId/en-cours');
  final body = response.data ?? <String, dynamic>{};
  
  // Gérer les différents formats de réponse
  final rawData = body['data'];
  
  // Cas 1: data est null ou vide
  if (rawData == null) {
    return null;
  }
  
  // Cas 2: data est une liste
  if (rawData is List) {
    if (rawData.isEmpty) {
      return null;
    }
    // Prendre le premier élément si c'est une liste non vide
    final firstItem = rawData.first;
    if (firstItem is Map<String, dynamic>) {
      return Task.fromJson(firstItem);
    }
    return null;
  }
  
  // Cas 3: data est un Map
  if (rawData is Map<String, dynamic>) {
    if (rawData.isEmpty) {
      return null;
    }
    return Task.fromJson(rawData);
  }
  
  // Cas 4: data est le body lui-même (pas de clé 'data')
  if (body.isNotEmpty && body.containsKey('ID')) {
    return Task.fromJson(body);
  }
  
  return null;
}
```

### Gestion Robuste des Erreurs

Ajouter également un try-catch pour gérer les erreurs de parsing:

```dart
Future<Task?> getCurrentTask(String operatorId) async {
  try {
    final response = await _dio.get<Map<String, dynamic>>(
        '/api/affectations/operateur/$operatorId/en-cours');
    final body = response.data ?? <String, dynamic>{};
    
    // ... logique de parsing robuste ...
    
  } on DioException catch (e) {
    print('Erreur réseau: ${e.message}');
    return null;
  } catch (e) {
    print('Erreur parsing: $e');
    return null;
  }
}
```

---

## Vérification Backend

### Endpoint Concerné

**Fichier**: `backend/src/controllers/affectation.controller.js`

**Endpoint**: `GET /api/affectations/operateur/:id/en-cours`

Vérifier que le backend retourne bien un objet unique et non une liste:

```javascript
exports.getAffectationsEnCoursByOperateur = async (req, res) => {
  try {
    const { id } = req.params;
    const affectations = await affectationService.getAffectationsEnCours(id);
    
    // Si une seule affectation, retourner l'objet directement
    if (affectations.length === 1) {
      res.json({
        success: true,
        data: affectations[0]  // Objet unique, pas de tableau
      });
    } else if (affectations.length === 0) {
      res.json({
        success: true,
        data: null  // null au lieu de tableau vide
      });
    } else {
      // Plusieurs affectations (ne devrait pas arriver)
      res.json({
        success: true,
        data: affectations[0]  // Retourner la première
      });
    }
  } catch (error) {
    // ...
  }
};
```

---

## Tests Recommandés

1. **Aucune affectation en cours**: L'API retourne `data: null`
2. **Une affectation en cours**: L'API retourne `data: {...}`
3. **Erreur réseau**: Le service retourne `null` sans crash
4. **Format inattendu**: Le service gère gracieusement l'erreur

---

## Fichiers à Modifier

| Fichier | Action |
|---------|--------|
| `lib/data/remote/services/task_service.dart` | Modifier `getCurrentTask()` |
| `backend/src/controllers/affectation.controller.js` | Vérifier format de réponse |

---

## Priorité

**Haute** - Cette erreur empêche l'utilisation de la fonctionnalité "Fin de Production".
