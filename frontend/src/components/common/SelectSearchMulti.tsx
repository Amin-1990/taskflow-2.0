import { type FunctionComponent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { ChevronDown, X } from 'lucide-preact';

export interface SelectSearchOption {
    id: number | string;
    label: string;
    [key: string]: any;
}

interface SelectSearchMultiProps {
    options: SelectSearchOption[];
    selectedIds: (number | string)[];
    onSelect: (selectedIds: (number | string)[]) => void;
    placeholder?: string;
    label?: string;
    maxResults?: number;
}

export const SelectSearchMulti: FunctionComponent<SelectSearchMultiProps> = ({
    options,
    selectedIds,
    onSelect,
    placeholder = 'Rechercher...',
    label,
    maxResults = 20,
}) => {
    const [isOpen, setIsOpen] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOptions = options.filter((opt) => selectedIds.includes(opt.id));

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
        if (selectedIds.includes(option.id)) {
            onSelect(selectedIds.filter((id) => id !== option.id));
        } else {
            onSelect([...selectedIds, option.id]);
        }
    };

    const handleRemove = (id: number | string) => {
        onSelect(selectedIds.filter((i) => i !== id));
    };

    return (
        <div ref={containerRef} className="relative w-full">
            {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}

            <div className="space-y-2">
                {/* Selected items */}
                {selectedOptions.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                        {selectedOptions.map((opt) => (
                            <div
                                key={opt.id}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-full"
                            >
                                <span>{opt.label}</span>
                                <button
                                    onClick={() => handleRemove(opt.id)}
                                    className="hover:bg-blue-700 rounded-full p-0.5 transition"
                                    title="Retirer"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Search input */}
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.currentTarget.value);
                            setIsOpen(true);
                        }}
                        onFocus={() => setIsOpen(true)}
                        onKeyDown={handleKeyDown}
                        placeholder={selectedOptions.length === 0 ? placeholder : 'Ajouter...'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                    />
                    <ChevronDown
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform ${isOpen ? 'rotate-180' : ''
                            }`}
                    />
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && (
              <div
                ref={dropdownRef}
                className="fixed bg-white border border-gray-300 rounded-lg shadow-2xl z-[9999] max-h-64 overflow-y-auto"
                style={{
                  top: (containerRef.current?.getBoundingClientRect().bottom || 0) + 'px',
                  left: (containerRef.current?.getBoundingClientRect().left || 0) + 'px',
                  width: (containerRef.current?.getBoundingClientRect().width || 0) + 'px',
                }}
              >
                    {filtered.length > 0 ? (
                        <ul className="py-1">
                            {filtered.map((option, index) => {
                                const isSelected = selectedIds.includes(option.id);
                                return (
                                    <li
                                        key={option.id}
                                        onClick={() => handleSelect(option)}
                                        className={`px-4 py-2 cursor-pointer transition ${index === highlightedIndex ? 'bg-blue-100' : ''
                                            } ${isSelected ? 'bg-blue-50 border-l-4 border-blue-600 font-semibold' : 'hover:bg-gray-100'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleSelect(option)}
                                                className="w-4 h-4 rounded cursor-pointer"
                                            />
                                            <span className="flex-1">{option.label}</span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="px-4 py-3 text-center text-gray-500 text-sm">
                            Aucune correspondance
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SelectSearchMulti;
