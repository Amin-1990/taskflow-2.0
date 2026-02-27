import { type FunctionComponent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { ChevronDown } from 'lucide-preact';

export interface SelectSearchOption {
  id: number | string;
  label: string;
  [key: string]: any;
}

interface SelectSearchProps {
  options: SelectSearchOption[];
  selectedId?: number | string | null;
  onSelect: (option: SelectSearchOption) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  maxResults?: number;
}

export const SelectSearch: FunctionComponent<SelectSearchProps> = ({
  options,
  selectedId,
  onSelect,
  placeholder = 'Rechercher...',
  label,
  required = false,
  disabled = false,
  maxResults = 20,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === selectedId);

  const filtered = options
    .filter((opt) =>
      searchTerm === '' || opt.label.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .slice(0, maxResults);

  // Reset highlighted index when filtered results change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filtered.length]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % filtered.length || 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev === 0 ? filtered.length - 1 : prev - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[highlightedIndex]) {
          handleSelect(filtered[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const handleSelect = (option: SelectSearchOption) => {
    onSelect(option);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(0);
  };

  const handleInputChange = (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    setSearchTerm(value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={isOpen ? searchTerm : selectedOption?.label || ''}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          />
          <ChevronDown
            className={`absolute right-3 w-4 h-4 text-gray-400 pointer-events-none transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>

        {/* Dropdown */}
        {isOpen && filtered.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 z-10 mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg"
          >
            {filtered.map((option, index) => (
              <div
                key={option.id}
                onClick={() => handleSelect(option)}
                className={`cursor-pointer px-3 py-2 text-sm transition-colors ${
                  index === highlightedIndex
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-100 text-gray-800'
                }`}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {isOpen && filtered.length === 0 && searchTerm && (
          <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-lg border border-gray-300 bg-white px-3 py-4 text-center text-sm text-gray-500 shadow-lg">
            Aucun resultat pour "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectSearch;
