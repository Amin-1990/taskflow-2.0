# SelectSearchMulti Component

## Description
Composant Preact réutilisable pour la sélection multiple avec recherche et navigation au clavier. Alternative multi-select au composant existant `SelectSearch`.

## Caractéristiques

### Interface Utilisateur
- **Tags colorés** pour les éléments sélectionnés (bleu)
- **Bouton X** sur chaque tag pour suppression rapide
- **Champ de recherche** pour filtrer les options
- **Dropdown scrollable** avec 20 résultats max
- **Checkboxes** dans la liste pour sélection/désélection claire

### Interactions
- **Clic sur checkbox** : ajouter/supprimer l'élément
- **Clic sur item** : basculer la sélection
- **Clic sur X du tag** : supprimer l'élément
- **Clic X du champ** : ouvrir/fermer le dropdown
- **Clic dehors** : fermer le dropdown

### Navigation Clavier
- **Flèche Haut/Bas** : navigation dans la liste
- **Enter** : sélectionner l'élément en surbrillance
- **Escape** : fermer le dropdown
- **Espace/Enter** : ouvrir le dropdown (quand fermé)

### Recherche
- Filtrage en temps réel (case-insensitive)
- Affichage "Aucune correspondance" quand aucun résultat
- Reset de l'index highlight quand les résultats changent

## Props

```typescript
interface SelectSearchMultiProps {
  options: SelectSearchOption[];        // Liste des options disponibles
  selectedIds: (number | string)[];     // IDs des éléments sélectionnés
  onSelect: (ids: (number | string)[]) => void; // Callback de changement
  placeholder?: string;                  // Placeholder du champ (défaut: "Rechercher...")
  label?: string;                        // Label optionnel
  maxResults?: number;                   // Max résultats affichés (défaut: 20)
}

interface SelectSearchOption {
  id: number | string;
  label: string;
  [key: string]: any;  // Propriétés additionnelles
}
```

## Cas d'Usage

### AdminMatrice - Filtrage des modules
```tsx
<SelectSearchMulti
  options={modules.map(m => ({ id: m, label: m }))}
  selectedIds={selectedModules}
  onSelect={setSelectedModules}
  placeholder="Rechercher un module..."
  label="Modules"
/>
```

### Autres cas possibles
- Sélection de rôles multiples
- Sélection de départements
- Sélection de permissions
- Sélection de techniciens
- Sélection de machines

## Style & Design

### Couleurs
- **Tags sélectionnés** : bg-blue-600 text-white
- **Fond tags** : bg-blue-50 border-blue-200
- **Hover item** : bg-gray-100
- **Item sélectionné** : bg-blue-50 border-l-4 border-blue-600
- **Item highlight** : bg-blue-100

### Espacement
- Padding input : px-3 py-2
- Padding dropdown items : px-4 py-2
- Gap entre tags : gap-2
- Max height dropdown : 16rem (64 lignes de 256px)

### Bordures & Ombres
- Input border : border-gray-300 + focus:ring-2 focus:ring-blue-500
- Dropdown shadow : shadow-lg
- Tag border-radius : rounded-full
- Input border-radius : rounded-lg

## Performance

### Optimisations
- useMemo implicite via `selectedOptions` filter
- maxResults limite le rendu dropdown
- useRef pour éviter re-renders des DOM nodes
- Filter appliqué une seule fois au render

### Récalculs
- `selectedOptions` recalculé quand selectedIds ou options changent
- `filtered` recalculé quand searchTerm ou options changent
- `highlightedIndex` reset quand filtered.length change

## Accessibilité

### Éléments
- Input avec label explicit
- Checkbox standard HTML
- Navigation complète au clavier
- Titre sur boutons (title attr)

### Améliorations possibles
- aria-expanded sur input
- aria-selected sur items
- role="listbox" sur dropdown
- role="option" sur items

## Compatibilité

### Preact
- Hooks : useState, useEffect, useRef
- Event handlers : onChange, onFocus, onKeyDown, onClick
- Fragment et JSX supportés

### Navigateurs
- Tous les navigateurs modernes
- CSS Grid/Flexbox supporté
- ES6+ (arrow functions, const/let)

## Fichier
`frontend/src/components/common/SelectSearchMulti.tsx` (~200 lignes)

## Réutilisabilité
✅ Composant complètement réutilisable
✅ Pas de dépendances externes (except Lucide icons)
✅ Styles Tailwind purs
✅ Interface claire et documentée
