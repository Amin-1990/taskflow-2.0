# Correction du bug: H_sup devient 0 après enregistrement

## Problème identifié

La logique actuelle dans [`calculerChampsPointageEtendu`](backend/src/controllers/pointage.controller.js:82) est incorrecte:

```javascript
const shouldRecalculate = !existingValues.Retard || !existingValues.Depart_anticipe || 
                         !existingValues.Presence_reelle || existingValues.H_sup === null;
```

**Problème**: Si UN SEUL champ est null (ex: Retard est null), TOUS les champs sont recalculés, y compris H_sup qui écrase la valeur enregistrée.

## Solution corrigée

Chaque champ doit être traité indépendamment:

```javascript
const calculerChampsPointageEtendu = ({ entree, sortie, horaire, existingValues }) => {
  // Valeurs par défaut
  let retard = null;
  let departAnticipe = null;
  let presenceReelle = '00:00:00';
  let heuresSupp = 0;

  // Si des valeurs existent en base, les utiliser comme base
  if (existingValues) {
    retard = existingValues.Retard;
    departAnticipe = existingValues.Depart_anticipe;
    presenceReelle = existingValues.Presence_reelle;
    heuresSupp = existingValues.H_sup;
  }

  // Vérifier si jour chômé, férié ou fermé - dans ce cas tout est à 0
  if (horaire) {
    const estJourFerie = horaire.Est_jour_ferie === 1;
    const estFerme = horaire.Est_ouvert === 0;
    const estChome = horaire.Type_chome && horaire.Type_chome !== 'non_chomé';
    
    if (estJourFerie || estFerme || estChome) {
      return { retard: null, departAnticipe: null, presenceReelle: '00:00:00', heuresSupp: 0 };
    }
  }

  // Si les champs sont null, les calculer automatiquement
  // Retard: seulement si null en base
  if (retard === null || retard === undefined || retard === '') {
    const entreeSec = parseTimeToSeconds(entree);
    const debutSec = parseTimeToSeconds(horaire?.Heure_debut || '08:00:00');
    if (entreeSec !== null && debutSec !== null && entreeSec > debutSec) {
      retard = secondsToTime(entreeSec - debutSec);
    }
  }

  // Depart_anticipe: seulement si null en base
  if (departAnticipe === null || departAnticipe === undefined || departAnticipe === '') {
    const sortieSec = parseTimeToSeconds(sortie);
    const finSec = parseTimeToSeconds(horaire?.Heure_fin || '17:00:00');
    if (sortieSec !== null && finSec !== null && sortieSec < finSec) {
      departAnticipe = secondsToTime(finSec - sortieSec);
    }
  }

  // Presence_reelle: seulement si null en base
  if (presenceReelle === null || presenceReelle === undefined || presenceReelle === '' || presenceReelle === '00:00:00') {
    const entreeSec = parseTimeToSeconds(entree);
    const sortieSec = parseTimeToSeconds(sortie);
    if (entreeSec !== null && sortieSec !== null && sortieSec >= entreeSec) {
      const pauseDebutSec = parseTimeToSeconds(horaire?.Pause_debut);
      const pauseFinSec = parseTimeToSeconds(horaire?.Pause_fin);
      let pauseDuree = 0;
      if (pauseDebutSec !== null && pauseFinSec !== null && pauseFinSec > pauseDebutSec) {
        pauseDuree = pauseFinSec - pauseDebutSec;
      }
      presenceReelle = secondsToTime(sortieSec - entreeSec - pauseDuree);
    }
  }

  // Heures_sup: seulement si null en base (pas de calcul automatique!)
  // H_sup est saisi manuellement par l'utilisateur, on ne le recalcule pas automatiquement
  // unless it's explicitly null
  if (heuresSupp === null || heuresSupp === undefined) {
    // Calcul automatique des heures supplémentaires seulement si pas de valeur enregistrée
    const sortieSec = parseTimeToSeconds(sortie);
    const finSec = parseTimeToSeconds(horaire?.Heure_fin || '17:00:00');
    const pauseFinSec = parseTimeToSeconds(horaire?.Pause_fin);
    
    if (sortieSec !== null && finSec !== null && pauseFinSec !== null) {
      if (sortieSec > pauseFinSec) {
        heuresSupp = (sortieSec - pauseFinSec) / 3600;
      }
    }
  }

  return { retard, departAnticipe, presenceReelle, heuresSupp };
};
```

## Résumé du changement

| Avant | Après |
|-------|-------|
| Si UN champ null → recalculer TOUT | Chaque champ traité indépendamment |
| H_sup toujours recalculé | H_sup seulement si null en base |

La clé est que **H_sup ne doit JAMAIS être écrasé** par un calcul automatique - il doit être préservé s'il a été saisi manuellement.
