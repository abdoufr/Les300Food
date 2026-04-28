// components/MenuFilter.tsx
'use client';

import { FaSearch, FaTimes } from 'react-icons/fa';

interface Category {
    id: number;
    name: string;
    icon: string;
}

interface MenuFilterProps {
    categories: Category[];
    selectedCategory: number | null;
    searchQuery: string;
    onCategoryChange: (id: number | null) => void;
    onSearchChange: (query: string) => void;
    itemCount: number;
}

export default function MenuFilter({
    categories,
    selectedCategory,
    searchQuery,
    onCategoryChange,
    onSearchChange,
    itemCount
}: MenuFilterProps) {
    return (
        <div className="space-y-6 mb-10">
            {/* Search Bar */}
            <div className="max-w-xl mx-auto relative">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Rechercher un plat..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="input-field pl-12 pr-12 text-center text-lg"
                />
                {searchQuery && (
                    <button
                        onClick={() => onSearchChange('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 
                       hover:text-primary transition-colors"
                    >
                        <FaTimes />
                    </button>
                )}
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap justify-center gap-3">
                <button
                    onClick={() => onCategoryChange(null)}
                    className={`filter-btn ${selectedCategory === null ? 'filter-btn-active' : 'filter-btn-inactive'
                        }`}
                >
                    🍽️ Tout ({itemCount})
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => onCategoryChange(cat.id)}
                        className={`filter-btn ${selectedCategory === cat.id ? 'filter-btn-active' : 'filter-btn-inactive'
                            }`}
                    >
                        {cat.icon} {cat.name}
                    </button>
                ))}
            </div>
        </div>
    );
}