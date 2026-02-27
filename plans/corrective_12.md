# Corrective 12 - Liste des Corrections

Ce fichier recense toutes les corrections à apporter au projet TaskFlow 2.0.

---

## Correction N°1: Ajout des Affectations en Modale

### Problème
Dans la page **Gestion des affectations**, l'ajout d'une nouvelle affectation se fait actuellement en ajoutant une ligne directement dans le tableau (mode inline editing). L'utilisateur souhaite que l'ajout se fasse via une **modale**.

### Fichiers Concernés
- `frontend/src/pages/production/AffectationsGestion.tsx`
- `frontend/src/components/common/SelectSearch.tsx` (à créer)

### Recommandations UX

#### Problème avec les datalists
Les listes **datalist** HTML ne sont pas pratiques (peu de contrôle UX, compatibilité limitée).

#### Solution recommandée: SelectSearch personnalisé
Créer un composant réutilisable `SelectSearch` avec:
- Zone de saisie avec recherche intégrée
- Liste dropdown des résultats filtrés en temps réel
- Navigation clavier (flèches, entrée, échap)
- Affichage de l'élément sélectionné

Pour **Semaine, Opérateur, Poste, Article**: Utiliser le nouveau composant SelectSearch

### Détails de l'Implémentation

1. **Créer le composant SelectSearch** (`frontend/src/components/common/SelectSearch.tsx`)
   - Input avec recherche en temps réel
   - Dropdown avec résultats filtrés
   - Gestion du clic extérieur pour fermer
   - Support du clavier

2. **Modifier AffectationsGestion.tsx**
   - Ajouter états `isModalOpen` et `newAffectation`
   - Remplacer bouton `addRow` par `openAddModal`
   - Ajouter le composant Modal avec formulaire
   - Utiliser SelectSearch pour **tous les champs** (Semaine, Opérateur, Poste, Article)

### Plan Détaillé
Voir le fichier: `plans/affectation_modal_add_plan.md`

### Statut
- [ ] À implémenter

---

## Correction N°2: Composant SelectSearch Réutilisable

### Problème
Les champs de saisie avec recherche (Opérateur, Semaine, Article, Poste) utilisent actuellement des datalists et des inputs basiques, ce qui offre une expérience utilisateur limitée:
- Pas de navigation clavier fluide
- Pas de dropdown visuel clairement stylisé
- Expérience incohérente entre les différents champs

### Solution
Créer un composant réutilisable `SelectSearch` pour remplacer tous les champs de sélection avec recherche.

### Fichiers Concernés
- `frontend/src/components/common/SelectSearch.tsx` (nouveau)
- `frontend/src/pages/production/AffectationsGestion.tsx` (modifié)

### Détails de l'Implémentation

**1. Composant SelectSearch** (`SelectSearch.tsx`):
- Input avec recherche en temps réel et icône chevron
- Dropdown avec résultats filtrés (max 20 par défaut)
- Navigation clavier:
  - Flèches haut/bas pour naviguer les résultats
  - Entrée pour sélectionner l'élément en surbrillance
  - Échap pour fermer le dropdown
  - Espace ou Entrée pour ouvrir le dropdown
- Gestion du clic extérieur pour fermer automatiquement
- Support du disabled
- Affichage du label avec astérisque si requis
- Message "Aucun résultat" si recherche sans match

**2. Intégration dans AffectationsGestion**:
- Remplacement de tous les champs datalist par SelectSearch
- Dans le tableau: Opérateur, Semaine, Article, Poste
- Dans la modale: Opérateur, Semaine, Article, Poste
- Suppression des états `opQuery`, `artQuery`, `posteQuery` (plus nécessaires)
- Simplification du code de gestion des champs

### Avantages
- Meilleure UX avec navigation clavier fluide
- Réutilisable dans d'autres pages
- Code plus propre et maintenable
- Comportement cohérent sur tous les champs

### Statut
- [x] Implémentée

---

## Correction N°3: Fix Chargement des Articles pour SelectSearch

### Problème
Le champ Article du SelectSearch n'affichait pas de résultats quand on sélectionnait une semaine dans la modale ou dans le tableau.

### Cause Racine
La variable d'état `weekCmds` (cache des articles par semaine) n'était chargée que pour les semaines des affectations existantes dans le tableau (`rows`). Lors de l'ajout d'une nouvelle affectation via modale, la semaine sélectionnée n'était jamais dans `rows`, donc les articles n'étaient jamais chargés.

### Solution
Création d'une fonction dédiée `loadArticlesForWeek(weekId)` qui:
1. Charge les articles pour une semaine spécifique via l'API
2. Vérifie d'abord si les données sont en cache (évite les appels redondants)
3. Met à jour `weekCmds` avec les articles récupérés
4. Est appelée automatiquement quand on sélectionne une semaine

### Détails de l'Implémentation

**Nouvelle Fonction:**
```typescript
const loadArticlesForWeek = async (weekId: number) => {
    if (weekCmds[weekId]) return; // Cache check
    try {
        const res = await commandesApi.getBySemaine(weekId);
        // Mappe les données et met à jour le cache
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

**Intégration:**
- Dans la modale: Appel lors du `onSelect` du SelectSearch Semaine
- Dans le tableau: Appel lors du `onSelect` du SelectSearch Semaine
- Résultat: Le SelectSearch Article peut maintenant afficher les résultats

### Avantages
- Chargement des articles on-demand (au lieu de pré-charger tous)
- Cache pour éviter les appels API redondants
- Fonctionne à la fois en modale et dans le tableau
- Meilleure performance (chargement lazy)

### Fichiers Modifiés
- `frontend/src/pages/production/AffectationsGestion.tsx`
  - Ajout fonction `loadArticlesForWeek` 
  - Modification selectSearch Semaine (modale)
  - Modification selectSearch Semaine (tableau)

### Statut
- [x] Fixée

---

## Prochaines Étapes Recommandées

### Priorité HAUTE - Pages de Production
1. **Planning.tsx** - Articles (datalist → SelectSearch)
2. **Pointage.tsx** - Poste (select → SelectSearch)
3. **CommandeForm.tsx** - Article (select → SelectSearch)
4. **Interventions.tsx** - Machine (select → SelectSearch)
5. **Machines.tsx** - Type Machine (select → SelectSearch)
6. **PersonnelDashboard.tsx** - Poste (select → SelectSearch)

### Priorité MOYENNE - Filtres
7. **Semaines.tsx** - Année/Mois (select → SelectSearch)
8. **Planning.tsx** - Semaine, Unité production (select → SelectSearch)
9. **SuiviRealisation.tsx** - Semaine (select → SelectSearch)
10. **AnalyseCharge.tsx** - Semaine (select → SelectSearch)

**Voir le fichier:** `SELECTSEARCH_MIGRATION_PLAN.md` pour le plan détaillé d'implémentation.

---

*Ce fichier sera mis à jour avec les prochaines demandes de corrections.*
