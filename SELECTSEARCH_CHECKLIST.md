# SelectSearch Implementation Checklist

## Phase 1 ✅ - AffectationsGestion.tsx (TERMINÉE)

### Composant
- [x] SelectSearch.tsx créé
- [x] Interface SelectSearchOption définie
- [x] Navigation clavier implémentée
- [x] Click outside gestion

### Intégration AffectationsGestion
- [x] Import SelectSearch et SelectSearchOption
- [x] Modal - Operateur (SelectSearch)
- [x] Modal - Semaine (SelectSearch)
- [x] Modal - Article (SelectSearch)
- [x] Modal - Poste (SelectSearch)
- [x] Tableau - Operateur (SelectSearch)
- [x] Tableau - Semaine (SelectSearch)
- [x] Tableau - Article (SelectSearch)
- [x] Tableau - Poste (SelectSearch)
- [x] loadArticlesForWeek() fonction
- [x] Pas d'erreurs TypeScript
- [x] Modal agrandie (xl)

---

## Phase 2 - Priorité HAUTE

### [ ] 1. Planning.tsx - Articles
- [ ] Localisé les imports SelectSearch
- [ ] Trouvé l'API pour charger les articles
- [ ] Identifié l'état de sélection
- [ ] Remplacé le datalist
- [ ] Testé la recherche
- [ ] Validé TypeScript

**Responsable:** 
**Date de début:** 
**Date de fin:** 

---

### [ ] 2. Pointage.tsx - Poste
- [ ] Importé SelectSearch
- [ ] Chargé la liste des postes
- [ ] Remplacé le select
- [ ] Adapté le callback
- [ ] Validé TypeScript

**Responsable:** 
**Date de début:** 
**Date de fin:** 

---

### [ ] 3. CommandeForm.tsx - Article
- [ ] Importé SelectSearch
- [ ] Récupéré les articles
- [ ] Remplacé le select
- [ ] Adapté la validation
- [ ] Validé TypeScript

**Responsable:** 
**Date de début:** 
**Date de fin:** 

---

### [ ] 4. Interventions.tsx - Machine
- [ ] Importé SelectSearch
- [ ] Chargé les machines
- [ ] Remplacé le select
- [ ] Adapté les callbacks
- [ ] Validé TypeScript

**Responsable:** 
**Date de début:** 
**Date de fin:** 

---

### [ ] 5. Machines.tsx - Type Machine
- [ ] Importé SelectSearch
- [ ] Remplacé le select
- [ ] Adapté la sélection
- [ ] Validé TypeScript

**Responsable:** 
**Date de début:** 
**Date de fin:** 

---

### [ ] 6. PersonnelDashboard.tsx - Poste
- [ ] Importé SelectSearch
- [ ] Remplacé le select
- [ ] Adapté le callback
- [ ] Validé TypeScript

**Responsable:** 
**Date de début:** 
**Date de fin:** 

---

## Phase 3 - Priorité MOYENNE

### [ ] 7. Semaines.tsx - Année/Mois
- [ ] Importé SelectSearch
- [ ] Remplacé les select
- [ ] Adapté les options
- [ ] Validé TypeScript

**Responsable:** 
**Date de début:** 
**Date de fin:** 

---

### [ ] 8. Planning.tsx - Semaine & Unité Production
- [ ] Importé SelectSearch
- [ ] Chargé les semaines
- [ ] Chargé les unités
- [ ] Remplacé les select
- [ ] Validé TypeScript

**Responsable:** 
**Date de début:** 
**Date de fin:** 

---

### [ ] 9. SuiviRealisation.tsx - Semaine
- [ ] Importé SelectSearch
- [ ] Chargé les semaines
- [ ] Remplacé le select
- [ ] Validé TypeScript

**Responsable:** 
**Date de début:** 
**Date de fin:** 

---

### [ ] 10. AnalyseCharge.tsx - Semaine
- [ ] Importé SelectSearch
- [ ] Chargé les semaines
- [ ] Remplacé le select
- [ ] Validé TypeScript

**Responsable:** 
**Date de début:** 
**Date de fin:** 

---

## Template de Validation Finale

Pour **chaque** fichier implémenté:

```
✓ Composant SelectSearch importé
✓ Options correctement formatées (id, label)
✓ onSelect callback fonctionne
✓ Affichage du label avec astérisque si requis
✓ Pas d'erreurs TypeScript (get_diagnostics)
✓ Pas de nouveau appels API inutiles
✓ Recherche case-insensitive fonctionne
✓ Navigation clavier (↑↓, Entrée, Échap)
✓ Click outside ferme le dropdown
✓ Aucune régression visuelle
```

---

## Notes de Développement

### Import Standard
```typescript
import SelectSearch, { type SelectSearchOption } from '../../components/common/SelectSearch';
```

### Format d'Options
```typescript
const options: SelectSearchOption[] = items.map((item) => ({
  id: item.ID,
  label: item.Nom || item.Description || item.Code,
}));
```

### Utilisation Standard
```typescript
<SelectSearch
  options={options}
  selectedId={selectedId}
  onSelect={(opt) => setSelectedId(opt.id as number)}
  label="Nom du champ"
  required
  maxResults={20}
/>
```

### Validation TypeScript
```bash
# Vérifier les erreurs
get_diagnostics c:/Users/Amine/taskflow-2.0/frontend/src/pages/production/MonPage.tsx
```

---

## Statistiques

| Métrique | Avant | Après |
|----------|-------|-------|
| Datalists | 1+ | 0 |
| Selects basiques | 10+ | 0 |
| Composants SelectSearch | 0 | 10+ |
| Pages migratées | 0/11 | 1/11 |
| % Complété | 0% | 9% |
