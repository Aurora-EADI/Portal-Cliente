import React, { useState, FormEvent } from 'react';
import { Search } from 'lucide-react';

export interface SearchBarProps {
    placeholder?: string;
    onSearch: (value: string) => void;
    onClear?: () => void;
    showClearButton?: boolean;
    initialValue?: string;
}

export function SearchBar({
    placeholder = 'Buscar...',
    onSearch,
    onClear,
    showClearButton = false,
    initialValue = '',
}: SearchBarProps) {
    const [searchInput, setSearchInput] = useState(initialValue);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSearch(searchInput);
    };

    const handleClear = () => {
        setSearchInput('');
        onSearch('');
        onClear?.();
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    placeholder={placeholder}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
            </div>
            <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
                Buscar
            </button>
            {showClearButton && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                    Limpar
                </button>
            )}
        </form>
    );
}
