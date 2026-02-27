# Article Field Fix - Chargement des Articles pour les Semaines

## Problème
Le champ Article n'affichait pas de résultats quand on sélectionnait une semaine dans la modale d'ajout ou dans le tableau.

## Cause Racine
La variable d'état `weekCmds` qui contient le cache des articles par semaine n'était chargée que pour les semaines présentes dans les `rows` actuels. 

Quand on ouvrait la modale pour ajouter une nouvelle affectation:
1. La `newAffectation` est un nouvel objet, pas dans les `rows`
2. Si on sélectionne une semaine, le `useEffect` qui charge les articles ne déclenche pas
3. `articlesForRow(newAffectation)` retourne un tableau vide car `weekCmds[weekId]` n'existe pas

## Solution Implémentée

### 1. Nouvelle Fonction: `loadArticlesForWeek`
```typescript
const loadArticlesForWeek = async (weekId: number) => {
    if (weekCmds[weekId]) return; // Evite les appels redondants
    try {
        const res = await commandesApi.getBySemaine(weekId);
        setWeekCmds((prev) => {
            const next = { ...prev };
            next[weekId] = ((res.data.data || []) as any[])
                .map((x) => ({ 
                    commandeId: Number(x.ID), 
                    articleId: Number(x.ID_Article), 
                    code: String(x.Code_article || x.Article_code || '') 
                }))
                .filter((x) => x.commandeId > 0 && x.articleId > 0 && x.code);
            return next;
        });
    } catch (e) {
        console.error('Erreur chargement articles:', e);
    }
};
```

**Comportement:**
- Charge les articles pour une semaine donnée via l'API
- Vérifie d'abord si les données sont déjà en cache
- Mappe les colonnes retournées par le backend: `Code_article` ou `Article_code`
- Filtre les articles invalides (sans ID, code ou commande)

### 2. Appel dans la Modale
Quand on sélectionne une semaine, la fonction est appelée:

**Avant (modale):**
```typescript
onSelect={(opt) => setNewAffectation((prev) => prev ? { ...prev, ID_Semaine: opt.id as number, ID_Article: null } : null)}
```

**Après (modale):**
```typescript
onSelect={(opt) => {
  const weekId = opt.id as number;
  void loadArticlesForWeek(weekId);  // ← Charge les articles
  setNewAffectation((prev) => prev ? { ...prev, ID_Semaine: weekId, ID_Article: null } : null);
}}
```

### 3. Appel dans le Tableau
Même chose pour les rows existantes:

**Avant (tableau):**
```typescript
onSelect={(opt) => patchRow(row.ID, { ID_Semaine: opt.id as number, ID_Article: null })}
```

**Après (tableau):**
```typescript
onSelect={(opt) => {
  const weekId = opt.id as number;
  void loadArticlesForWeek(weekId);  // ← Charge les articles
  patchRow(row.ID, { ID_Semaine: weekId, ID_Article: null });
}}
```

## Flux de Données

```
1. Utilisateur sélectionne une semaine
   ↓
2. onSelect déclenche loadArticlesForWeek(weekId)
   ↓
3. API: GET /api/commandes/semaine/:weekId
   ↓
4. Backend retourne les articles pour cette semaine
   ↓
5. Frontend met à jour weekCmds[weekId]
   ↓
6. articlesForRow() peut maintenant retourner les articles
   ↓
7. SelectSearch pour Article affiche les résultats filtrés
```

## Fichier Modifié
- `frontend/src/pages/production/AffectationsGestion.tsx`
  - Ajout de la fonction `loadArticlesForWeek` (L137-151)
  - Modification du onSelect Semaine (modal) (L373-377)
  - Modification du onSelect Semaine (tableau) (L480-484)

## Vérifications
✅ Pas d'erreurs TypeScript
✅ Fonction async gérée avec `void`
✅ Cache pour éviter les appels redondants
✅ Gestion des erreurs avec try/catch
✅ Intégration dans modale et tableau

## Test
1. Ouvrir la page Gestion des affectations
2. Cliquer sur "Ajouter" pour ouvrir la modale
3. Sélectionner une semaine
4. Le champ Article doit maintenant afficher les résultats
5. Même comportement en sélectionnant une semaine dans le tableau
