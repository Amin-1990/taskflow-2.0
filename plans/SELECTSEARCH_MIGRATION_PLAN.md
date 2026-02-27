# Plan de Migration vers SelectSearch

## Vue d'ensemble
Remplacer tous les `datalist` et `select` basiques par le composant `SelectSearch` pour offrir une expérience utilisateur cohérente et fluide avec recherche intégrée.

---

## Priorité HAUTE (Listes longues, recherche fréquente)

### 1. Planning.tsx - Articles
**Statut:** 📋 À faire
**Fichier:** `frontend/src/pages/production/Planning.tsx`
**Champ actuel:** datalist
**Type de données:** Articles (liste longue)
**Complexité:** Moyenne

**Modifications nécessaires:**
- Importer SelectSearch et SelectSearchOption
- Identifier l'état de sélection actuel
- Remplacer le datalist par SelectSearch
- Adapter le callback `onSelect` pour mettre à jour l'état

---

### 2. CommandeForm.tsx - Article
**Statut:** 📋 À faire
**Fichier:** `frontend/src/components/forms/CommandeForm.tsx` (supposé)
**Champ actuel:** select
**Type de données:** Articles
**Complexité:** Moyenne

**Modifications nécessaires:**
- Importer SelectSearch
- Récupérer la liste des articles (probablement via une API)
- Remplacer le select par SelectSearch
- Adapter la validation de formulaire

---

### 3. Interventions.tsx - Machine
**Statut:** 📋 À faire
**Fichier:** `frontend/src/pages/production/Interventions.tsx`
**Champ actuel:** select
**Type de données:** Machines (liste potentiellement longue)
**Complexité:** Moyenne

**Modifications nécessaires:**
- Importer SelectSearch
- Charger la liste des machines
- Remplacer le select par SelectSearch
- Adapter les callbacks

---

### 4. Machines.tsx - Type Machine
**Statut:** 📋 À faire
**Fichier:** `frontend/src/pages/master/Machines.tsx`
**Champ actuel:** select
**Type de données:** Types de machines (liste longue)
**Complexité:** Faible

**Modifications nécessaires:**
- Importer SelectSearch
- Remplacer le select par SelectSearch
- Adapter la logique de sélection

---

### 5. Pointage.tsx - Poste
**Statut:** 📋 À faire
**Fichier:** `frontend/src/pages/production/Pointage.tsx`
**Champ actuel:** select
**Type de données:** Postes (liste courte à moyenne)
**Complexité:** Faible

**Modifications nécessaires:**
- Importer SelectSearch
- Charger la liste des postes
- Remplacer le select par SelectSearch

---

### 6. PersonnelDashboard.tsx - Poste
**Statut:** 📋 À faire
**Fichier:** `frontend/src/pages/personnel/PersonnelDashboard.tsx`
**Champ actuel:** select
**Type de données:** Postes
**Complexité:** Faible

**Modifications nécessaires:**
- Importer SelectSearch
- Remplacer le select par SelectSearch
- Adapter le callback de filtrage

---

## Priorité MOYENNE (Filtres et recherches)

### 7. Semaines.tsx - Année/Mois
**Statut:** 📋 À faire
**Fichier:** `frontend/src/pages/master/Semaines.tsx`
**Champ actuel:** select
**Type de données:** Années/Mois
**Complexité:** Faible

**Modifications nécessaires:**
- Importer SelectSearch
- Remplacer les select par SelectSearch
- Adapter la génération des options

---

### 8. Planning.tsx - Semaine
**Statut:** 📋 À faire
**Fichier:** `frontend/src/pages/production/Planning.tsx`
**Champ actuel:** select
**Type de données:** Semaines (liste courte)
**Complexité:** Faible

**Modifications nécessaires:**
- Importer SelectSearch
- Charger les semaines
- Remplacer le select par SelectSearch

---

### 9. Planning.tsx - Unité Production
**Statut:** 📋 À faire
**Fichier:** `frontend/src/pages/production/Planning.tsx`
**Champ actuel:** select
**Type de données:** Unités de production (liste courte)
**Complexité:** Faible

**Modifications nécessaires:**
- Importer SelectSearch
- Remplacer le select par SelectSearch
- Adapter le callback

---

### 10. SuiviRealisation.tsx - Semaine
**Statut:** 📋 À faire
**Fichier:** `frontend/src/pages/production/SuiviRealisation.tsx`
**Champ actuel:** select
**Type de données:** Semaines
**Complexité:** Faible

**Modifications nécessaires:**
- Importer SelectSearch
- Charger les semaines
- Remplacer le select par SelectSearch

---

### 11. AnalyseCharge.tsx - Semaine
**Statut:** 📋 À faire
**Fichier:** `frontend/src/pages/analysis/AnalyseCharge.tsx`
**Champ actuel:** select
**Type de données:** Semaines
**Complexité:** Faible

**Modifications nécessaires:**
- Importer SelectSearch
- Charger les semaines
- Remplacer le select par SelectSearch

---

## Plan d'Implémentation Recommandé

### Phase 1 (Semaine 1) - Prioriser les pages de production
1. ✅ AffectationsGestion.tsx (DONE)
2. Planning.tsx - Articles
3. Pointage.tsx - Poste

### Phase 2 (Semaine 2) - Compléter la priorité HAUTE
4. CommandeForm.tsx - Article
5. Interventions.tsx - Machine
6. Machines.tsx - Type Machine
7. PersonnelDashboard.tsx - Poste

### Phase 3 (Semaine 3) - Priorité MOYENNE
8. Semaines.tsx
9. Planning.tsx (Semaine, Unité production)
10. SuiviRealisation.tsx
11. AnalyseCharge.tsx

---

## Template d'Implémentation

Voici le pattern à suivre pour chaque migration:

### 1. Import
```typescript
import SelectSearch, { type SelectSearchOption } from '../../components/common/SelectSearch';
```

### 2. Préparation des options
```typescript
const options: SelectSearchOption[] = items.map((item) => ({
  id: item.ID,
  label: item.Nom || item.Description || item.Code,
  // Ajouter des propriétés supplémentaires si nécessaire
}));
```

### 3. Remplacement du select
```typescript
// Avant
<select value={selectedId} onChange={(e) => setSelectedId(Number(e.target.value))}>
  <option value="">Sélectionner...</option>
  {items.map((item) => <option key={item.ID} value={item.ID}>{item.Nom}</option>)}
</select>

// Après
<SelectSearch
  options={options}
  selectedId={selectedId}
  onSelect={(opt) => setSelectedId(opt.id as number)}
  placeholder="Rechercher..."
  label="Nom du champ"
  required
  maxResults={20}
/>
```

---

## Bénéfices Attendus

### UX Améliorée
- Navigation clavier fluide (flèches, entrée, échap)
- Recherche en temps réel sur tous les champs
- Visuel cohérent avec dropdown stylisé
- Meilleure accessibilité

### Code Plus Maintenable
- Réutilisation du même composant
- Moins de datalists/selects redondants
- Logique de recherche centralisée
- Comportement prévisible

### Performance
- Recherche client-side (pas d'appels API supplémentaires)
- Cache des données (via l'état existant)
- Filtrage optimisé

---

## Checklist de Validation

Pour chaque migration, vérifier:

- [ ] Composant SelectSearch importé
- [ ] Options correctement formatées
- [ ] `onSelect` callback fonctionne
- [ ] Validation de formulaire adaptée (si applicable)
- [ ] Pas d'erreurs TypeScript
- [ ] Aucun appel API redondant
- [ ] Texte de recherche case-insensitive
- [ ] Affichage du label avec astérisque si requis

---

## Notes Importantes

1. **API Calls**: Vérifier qu'on utilise les données déjà chargées (état) plutôt que de faire de nouveaux appels API
2. **Validation**: Adapter la validation de formulaire si le champ est obligatoire
3. **Disabled State**: Utiliser la prop `disabled` si le champ doit être désactivé conditionnellement
4. **Labels**: Toujours ajouter un label pour l'accessibilité
5. **MaxResults**: Ajuster `maxResults` selon la taille de la liste (20 par défaut)
