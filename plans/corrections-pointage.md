# Corrections pour le système de pointage

## Problèmes identifiés

### Problème 1: La colonne affiche "HH:MM - HH:MM" au lieu des champs calculés

**Cause**: Le code frontend affiche les heures d'entrée et de sortie brutes au lieu des champs calculés.

**Solution**: Modifier l'affichage dans [`frontend/src/pages/personnel/Pointage.tsx`](frontend/src/pages/personnel/Pointage.tsx) pour afficher:
- `Presence_reelle` (présence réelle) au lieu de "Entree - Sortie"
- Ajouter l'affichage des heures supplémentaires si elles existent

### Problème 2: H_sup devient 0 après enregistrement

**Cause**: 
1. L'endpoint `getPointageByPeriode` recalcule toujours les champs (y compris H_sup) en se basant uniquement sur les heures d'entrée/sortie
2. Si l'utilisateur saisit une valeur manuelle de H_sup, elle est bien enregistrée en base
3. Mais lors du prochain chargement, le calcul automatique écrase la valeur enregistrée

**Solution**: Modifier le backend pour:
1. Prioriser la valeur enregistrée en base si elle existe (non null)
2. Ne calculer automatiquement que si la valeur en base est null

---

## Correction 1: Backend - Modifier le calcul pour respecter les valeurs enregistrées

### Fichier: `backend/src/controllers/pointage.controller.js`

Modifier la fonction `calculerChampsPointageEtendu` pour accepter les valeurs existantes:

```javascript
const calculerChampsPointageEtendu = ({ entree, sortie, horaire, existingValues }) => {
  // existingValues contient: { Retard, Depart_anticipe, Presence_reelle, H_sup } de la base
  
  // Si les valeurs existent déjà en base, les utiliser
  if (existingValues) {
    // On recalcule seulement si les champs sont null en base
    const shouldCalculate = !existingValues.Retard || !existingValues.Depart_anticipe || 
                           !existingValues.Presence_reelle || existingValues.H_sup === null;
    
    if (!shouldCalculate) {
      return {
        retard: existingValues.Retard,
        departAnticipe: existingValues.Depart_anticipe,
        presenceReelle: existingValues.Presence_reelle,
        heuresSupp: existingValues.H_sup
      };
    }
  }
  
  // ... reste du calcul automatique
};
```

Modifier `getPointageByPeriode` pour passer les valeurs existantes:

```javascript
// Ajouter les champs calculés à chaque enregistrement
const rowsWithCalculatedFields = rows.map(row => {
  const horaire = horairesMap.get(row.Date);
  const { retard, departAnticipe, presenceReelle, heuresSupp } = calculerChampsPointageEtendu({
    entree: row.Entree,
    sortie: row.Sortie,
    horaire: horaire,
    existingValues: {
      Retard: row.Retard,
      Depart_anticipe: row.Depart_anticipe,
      Presence_reelle: row.Presence_reelle,
      H_sup: row.H_sup
    }
  });
  
  return {
    ...row,
    Retard: retard,
    Depart_anticipe: departAnticipe,
    Presence_reelle: presenceReelle,
    H_sup: heuresSupp
  };
});
```

---

## Correction 2: Frontend - Modifier l'affichage de la colonne

### Fichier: `frontend/src/pages/personnel/Pointage.tsx`

Modifier l'affichage dans la boucle de la table (environ ligne 571-605):

```javascript
{visibleDates.map((date) => {
  const pointage = pointageMap.get(getCellKey(personnel.ID, date));
  const isAbsent = pointage?.Absent === 1;
  const hasRetard = !!pointage?.Retard;
  
  // Modifier cette partie pour afficher Presence_reelle
  const topLine = isAbsent
    ? 'ABS'
    : pointage?.Presence_reelle 
      ? pointage.Presence_reelle.slice(0, 5) + 'h'  // Afficher présence réelle
      : pointage?.Entree && pointage?.Sortie
        ? `${formatTime(pointage.Entree)} - ${formatTime(pointage.Sortie)}`
        : '---';
        
  // Ajouter l'affichage des heures supplémentaires
  const heuresSupp = pointage?.H_sup > 0 ? `+${pointage.H_sup.toFixed(1)}h` : '';
  const retardMinutes = hasRetard ? timeToMinutes(pointage?.Retard) : 0;

  return (
    <td key={date} className="px-1 py-1">
      <button
        onClick={() => openCellModal(personnel, date)}
        className={`w-full min-h-[50px] rounded border px-1 py-1 text-center hover:shadow-sm transition text-[11px] ${isAbsent
            ? 'border-red-200 bg-red-50'
            : hasRetard
              ? 'border-orange-200 bg-orange-50'
              : 'border-gray-200 bg-white hover:bg-gray-50'
          }`}
      >
        <div className={`font-medium ${isAbsent ? 'text-red-700' : 'text-gray-800'}`}>
          {topLine}
        </div>
        <div className="text-[9px] mt-0.5">
          {isAbsent && <span className="text-red-600 font-semibold">ABS</span>}
          {!isAbsent && hasRetard && (
            <span className="text-orange-600 font-semibold">Retard: {retardMinutes} min</span>
          )}
          {!isAbsent && heuresSupp && (
            <span className="text-green-600 font-semibold ml-1">{heuresSupp}</span>
          )}
        </div>
      </button>
    </td>
  );
})}
```

---

## Résumé des fichiers à modifier

| Fichier | Modifications |
|---------|-------------|
| `backend/src/controllers/pointage.controller.js` | Modifier `calculerChampsPointageEtendu` pour respecter les valeurs existantes |
| `frontend/src/pages/personnel/Pointage.tsx` | Modifier l'affichage pour montrer `Presence_reelle` et `H_sup` |
