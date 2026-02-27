# Plan: Ajout des Affectations en Modale

## Contexte

Dans la page **Gestion des affectations** (`frontend/src/pages/production/AffectationsGestion.tsx`), l'ajout d'une nouvelle affectation se fait actuellement en ajoutant une ligne directement dans le tableau (mode inline editing).

**Objectif**: Remplacer ce comportement par l'ouverture d'une modale pour saisir les informations de la nouvelle affectation.

## Recommandations UX: Composants de Sélection avec Recherche

### Problème initial
Les **datalists** HTML ne sont pas pratiques (peu de contrôle UX, compatibilité limitée).

### Solutions recommandées

#### Option 1: Créer un composant SelectSearch personnalisé (RECOMMANDÉ)
Créez un composant réutilisable `SelectSearch` avec:
- Zone de saisie avec recherche intégrée
- Liste dropdown des résultats filtrés en temps réel
- Navigation clavier (flèches, entrée, échap)
- Affichage de l'élément sélectionné

Structure recommandée:
```tsx
interface SelectSearchProps {
  value: number | null;
  onChange: (id: number) => void;
  options: { id: number; label: string }[];
  placeholder: string;
  label: string;
}
```

#### Option 2: Utiliser des selects HTML simples (PLUS SIMPLE)
Pour les champs avec peu d'options (ex: Semaines), utiliser des selects HTML standard:
```tsx
<select 
  value={newAffectation.ID_Semaine || ''} 
  onChange={(e) => ...}
  className="w-full rounded-lg border border-gray-300 px-3 py-2"
>
  <option value="">Sélectionner une semaine</option>
  {weeks.map((w) => <option key={w.id} value={w.id}>{w.label}</option>)}
</select>
```

#### Option 3: Ajouter un package externe (select2, react-select)
- Nécessite installer un nouveau package
- Plus de configuration

## Solution Proposée (Hybride)

### Pour tous les champs: SelectSearch personnalisé
Car ces listes peuvent être longues et nécessitent une recherche.

## Implémentation

### 1. Créer le composant SelectSearch

**Fichier à créer**: `frontend/src/components/common/SelectSearch.tsx`

```tsx
import { type FunctionComponent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { ChevronDown, Search } from 'lucide-preact';

interface Option {
  id: number;
  label: string;
}

interface SelectSearchProps {
  value: number | null;
  onChange: (id: number) => void;
  options: Option[];
  placeholder: string;
  label: string;
  disabled?: boolean;
}

export const SelectSearch: FunctionComponent<SelectSearchProps> = ({
  value,
  onChange,
  options,
  placeholder,
  label,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.id === value);
  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: number) => {
    onChange(id);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <div className={`relative ${disabled ? 'opacity-50' : ''}`}>
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? search : selectedOption?.label || ''}
          onChange={(e) => {
            setSearch((e.target as HTMLInputElement).value);
            setIsOpen(true);
          }}
          onFocus={() => !disabled && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10"
        />
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
        >
          <ChevronDown className={`h-4 w-4 text-gray-400 transition ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      
      {isOpen && !disabled && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">Aucun résultat</div>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option.id)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                  option.id === value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SelectSearch;
```

### 2. Modifier AffectationsGestion.tsx

1. **Importer le composant**:
```tsx
import SelectSearch from '../../components/common/SelectSearch';
```

2. **Ajouter les états**:
```typescript
const [isModalOpen, setIsModalOpen] = useState(false);
const [newAffectation, setNewAffectation] = useState<EditableAffectation | null>(null);
```

3. **Modifier le bouton Ajouter**:
```typescript
const openAddModal = () => {
  setNewAffectation(newRow(filters.commandeId || rows[0]?.ID_Commande || 0));
  setIsModalOpen(true);
};

// Dans le JSX:
<ActionButton onClick={openAddModal} icon={Plus}>Ajouter</ActionButton>
```

4. **Ajouter la Modal avec les champs**:

```tsx
<Modal
  isOpen={isModalOpen}
  title="Nouvelle Affectation"
  onClose={() => setIsModalOpen(false)}
  size="lg"
>
  {newAffectation && (
    <div className="space-y-4">
      {/* Opérateur - SelectSearch */}
      <SelectSearch
        label="Opérateur *"
        value={newAffectation.ID_Operateur}
        onChange={(id) => setNewAffectation((prev) => prev ? { ...prev, ID_Operateur: id } : null)}
        options={operateurs}
        placeholder="Rechercher un opérateur..."
      />

      {/* Semaine - SelectSearch */}
      <SelectSearch
        label="Semaine *"
        value={newAffectation.ID_Semaine}
        onChange={(id) => setNewAffectation((prev) => prev ? { ...prev, ID_Semaine: id, ID_Article: null } : null)}
        options={weeks.map((w) => ({ id: w.id, label: w.label }))}
        placeholder="Rechercher une semaine..."
      />

      {/* Article - SelectSearch (dépend de la semaine) */}
      <SelectSearch
        label="Article *"
        value={newAffectation.ID_Article}
        onChange={(id) => setNewAffectation((prev) => prev ? { ...prev, ID_Article: id } : null)}
        options={articlesForRow(newAffectation)}
        placeholder={newAffectation.ID_Semaine ? "Rechercher un article..." : "Choisir d'abord une semaine"}
        disabled={!newAffectation.ID_Semaine}
      />

      {/* Poste - SelectSearch */}
      <SelectSearch
        label="Poste *"
        value={newAffectation.ID_Poste}
        onChange={(id) => setNewAffectation((prev) => prev ? { ...prev, ID_Poste: id } : null)}
        options={postes}
        placeholder="Rechercher un poste..."
      />

      {/* Date début */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Date de début *</label>
        <input
          type="datetime-local"
          value={toInputDateTime(newAffectation.Date_debut)}
          onChange={(e) => setNewAffectation((prev) => prev ? { ...prev, Date_debut: fromInputDateTime((e.target as HTMLInputElement).value) || prev.Date_debut } : null)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      {/* Boutons */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          onClick={() => setIsModalOpen(false)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          onClick={async () => {
            if (!newAffectation.ID_Commande || !newAffectation.ID_Operateur || !newAffectation.ID_Poste || !newAffectation.ID_Article) {
              showToast.error('Veuillez remplir tous les champs obligatoires');
              return;
            }
            const success = await saveRow(newAffectation);
            if (success) {
              setIsModalOpen(false);
              setNewAffectation(null);
              await loadData();
              showToast.success('Affectation ajoutée avec succès');
            } else {
              showToast.error('Erreur lors de la création');
            }
          }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Enregistrer
        </button>
      </div>
    </div>
  )}
</Modal>
```

## Fichiers à Modifier/Créer

| Fichier | Action |
|---------|--------|
| `frontend/src/components/common/SelectSearch.tsx` | **Créer** - Nouveau composant |
| `frontend/src/pages/production/AffectationsGestion.tsx` | Modifier - Ajouter la modale |

## Priorité

**Haute** - Amélioration de l'expérience utilisateur pour la création d'affectations
