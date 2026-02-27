# Diagnostic: "Aucune production en cours" malgré une affectation existante

## 🔍 Problème Identifié

L'endpoint `/api/affectations/operateur/:id/en-cours` ne retourne aucune affectation même si la table `affectations` contient une affectation active (sans `Date_fin`).

## 🧪 Cause Probable

### Scénario 1: L'`operatorId` envoyé ne correspond pas

**Code Frontend**:
```dart
final operatorId = ref.read(authProvider).user?.id ?? 'OP-782';
```

**Problèmes possibles**:
1. `authProvider.user?.id` retourne `null` → Fallback à `'OP-782'`
2. L'ID `'OP-782'` n'existe pas dans `affectations.ID_Operateur`
3. Type mismatch: Frontend envoie **string**, Backend stocke **entier**

### Scénario 2: La requête SQL ne match rien

**Requête Backend**:
```sql
SELECT * FROM affectations
WHERE ID_Operateur = ? AND Date_fin IS NULL
ORDER BY Date_debut DESC
```

**Problèmes possibles**:
1. `ID_Operateur` = `'OP-782'` n'existe pas
2. `Date_fin` n'est pas NULL (affectation marquée comme terminée)
3. L'opérateur n'a pas d'affectation en cours

---

## 🔧 Diagnostic Étape par Étape

### Étape 1: Vérifier les données en base

**Exécuter en Base de Données**:
```sql
-- 1. Voir les affectations actives (sans date fin)
SELECT * FROM affectations WHERE Date_fin IS NULL LIMIT 10;

-- 2. Voir les IDs uniques des opérateurs avec affectations actives
SELECT DISTINCT ID_Operateur FROM affectations WHERE Date_fin IS NULL;

-- 3. Voir la structure de la table personnel
SELECT * FROM personnel LIMIT 5;

-- 4. Vérifier si l'ID utilisateur connecté existe
SELECT * FROM personnel WHERE ID = ?;  -- Remplacer ? par l'ID utilisateur
```

### Étape 2: Vérifier l'ID envoyé par le Frontend

**Ajouter un Log en Frontend** (`finish_task_provider.dart`):
```dart
final operatorId = ref.read(authProvider).user?.id ?? 'OP-782';
debugPrint('🔍 operatorId utilisé: $operatorId');  // ← LOG AJOUTÉ
debugPrint('🔍 user: ${ref.read(authProvider).user}');  // ← LOG AJOUTÉ
```

**Ajouter un Log en Backend** (`affectation.controller.js`):
```javascript
exports.getAffectationsEnCoursByOperateur = async (req, res) => {
  const { id } = req.params;
  console.log('🔍 Recherche affectation pour ID_Operateur:', id);  // ← LOG AJOUTÉ
  
  const affectations = await affectationService.getAffectationsEnCours(id);
  console.log('🔍 Affectations trouvées:', affectations.length);  // ← LOG AJOUTÉ
  // ... suite ...
};
```

### Étape 3: Tester l'endpoint manuellement

**Via Postman ou cURL**:
```bash
# Remplacer {operatorId} par un ID réel de la base de données
GET /api/affectations/operateur/{operatorId}/en-cours

# Exemple si ID = 1:
GET /api/affectations/operateur/1/en-cours
```

---

## ✅ Solutions Proposées

### Solution 1: Utiliser le matricule au lieu de l'ID

Si `user.id` n'est pas fiable, utiliser le **matricule**:

**Frontend (`finish_task_provider.dart`)**:
```dart
final operatorId = ref.read(authProvider).user?.matricule ?? 'OP-782';
```

**Backend** - Modifier la requête SQL:
```javascript
async getAffectationsEnCours(operateurId) {
  const [affectations] = await db.query(
    `SELECT a.* FROM affectations a
     LEFT JOIN personnel p ON a.ID_Operateur = p.ID
     WHERE p.Matricule = ? AND a.Date_fin IS NULL
     ORDER BY a.Date_debut DESC`,
    [operateurId]
  );
  return affectations;
}
```

### Solution 2: Vérifier et corriger les types

**Vérifier que les IDs dans `affectations` sont des entiers**:

```sql
SELECT * FROM affectations LIMIT 1;
-- Vérifier que ID_Operateur est bien un INT
```

Si les IDs sont des entiers, convertir en Frontend:

```dart
final operatorId = (ref.read(authProvider).user?.id != null)
    ? int.tryParse(ref.read(authProvider).user!.id) ?? 1
    : 1;
```

### Solution 3: Ajouter un endpoint alternatif

Créer un endpoint qui récupère l'affectation **sans** passer l'opérateur:

```javascript
// GET /api/affectations/moi/en-cours
// Récupère l'affectation en cours de l'utilisateur authentifié
exports.getMonAffectationEnCours = async (req, res) => {
  const userId = req.user?.id;  // Depuis le token JWT
  const affectations = await affectationService.getAffectationsEnCours(userId);
  // ...
};
```

---

## 📋 Checklist Diagnostic

- [ ] Vérifier la table `affectations` - Y a-t-il des lignes avec `Date_fin IS NULL`?
- [ ] Vérifier les IDs - L'`ID_Operateur` correspond-il à un ID réel?
- [ ] Tester l'endpoint manuellement avec le bon ID
- [ ] Ajouter des logs pour voir quel `operatorId` est envoyé
- [ ] Vérifier que `authProvider.user?.id` retourne une valeur valide
- [ ] Vérifier que le type de l'ID match entre Frontend et Backend

---

## 🎯 Recommandation

**Solution la plus robuste**: Utiliser le **matricule** au lieu de l'ID, car:
- ✅ Le matricule est utilisateur-facing (OP-782, etc.)
- ✅ Plus stable et lisible
- ✅ Moins de risque de confusion d'IDs

**Ou créer un endpoint "moi"** qui n'a pas besoin de passer l'ID:
- ✅ Utilise l'authentification JWT pour identifier l'utilisateur
- ✅ Plus sûr (pas d'injection)
- ✅ Plus simple côté frontend
