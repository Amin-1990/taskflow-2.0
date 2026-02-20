import { h } from 'preact';
import type { FunctionalComponent } from 'preact';
import { useState, useCallback } from 'preact/hooks';

interface PersonnelSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const PersonnelSearch: FunctionalComponent<PersonnelSearchProps> = ({
  value,
  onChange,
  placeholder = 'Rechercher par Nom, Matricule ou Email...'
}) => {
  const [inputValue, setInputValue] = useState(value);

  const handleChange = useCallback((e: Event) => {
    const target = e.target as HTMLInputElement;
    const nextValue = target.value;
    setInputValue(nextValue);
    onChange(nextValue);
  }, [onChange]);

  const handleClear = useCallback(() => {
    setInputValue('');
    onChange('');
  }, [onChange]);

  return h('div', { class: 'w-full' },
    h('div', { class: 'flex items-center rounded-lg border border-gray-300 bg-white shadow-sm' },
      h('span', { class: 'px-3 text-gray-400' }, '🔍'),
      h('input', {
        type: 'text',
        placeholder,
        value: inputValue,
        onChange: handleChange,
        class: 'w-full bg-transparent py-2.5 pr-2 text-sm text-gray-700 outline-none'
      }),
      inputValue && h('button', {
        type: 'button',
        onClick: handleClear,
        class: 'px-3 text-gray-400 hover:text-gray-700',
        title: 'Effacer'
      }, '✕')
    )
  );
};

export default PersonnelSearch;
