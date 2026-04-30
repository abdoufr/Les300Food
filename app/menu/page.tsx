// app/menu/page.tsx
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MenuCard from '@/components/MenuCard';
import MenuFilter from '@/components/MenuFilter';
import { useSearchParams } from 'next/navigation';

interface MenuItem {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    category_name: string;
    category_icon: string;
    category_id: number;
    is_available: number;
    is_popular: number;
}

interface Category {
    id: number;
    name: string;
    icon: string;
}

function MenuContent() {
    const searchParams = useSearchParams();
    const categoryParam = searchParams.get('category');

    const [items, setItems] = useState<MenuItem[]>([]);
    const [allItems, setAllItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(
        categoryParam ? parseInt(categoryParam) : null
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchMenu = useCallback(async () => {
        try {
            const res = await fetch('/api/menu');
            const data = await res.json();
            setAllItems(data.items);
            setCategories(data.categories);
            setLoading(false);
        } catch (error) {
            console.error('Error:', error);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMenu();
    }, [fetchMenu]);

    useEffect(() => {
        let filtered = [...allItems];
        if (selectedCategory) {
            filtered = filtered.filter(item => item.category_id === selectedCategory);
        }
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                item =>
                    item.name.toLowerCase().includes(query) ||
                    item.description?.toLowerCase().includes(query) ||
                    item.category_name.toLowerCase().includes(query)
            );
        }
        setItems(filtered);
    }, [allItems, selectedCategory, searchQuery]);

    const groupedItems = items.reduce((acc: { [key: string]: MenuItem[] }, item) => {
        const key = item.category_name;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});

    return (
        <main className="min-h-screen">
            <Navbar />
            <section className="bg-gradient-to-br from-dark via-gray-900 to-dark pt-28 pb-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 font-heading">
                        Notre <span className="gradient-text">Menu</span> 📋
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Découvrez tous nos plats délicieux et commandez vos favoris!
                    </p>
                </div>
            </section>

            <section className="py-12 px-4 -mt-6">
                <div className="max-w-7xl mx-auto">
                    <div className="glass-card p-6 mb-8">
                        <MenuFilter
                            categories={categories}
                            selectedCategory={selectedCategory}
                            searchQuery={searchQuery}
                            onCategoryChange={setSelectedCategory}
                            onSearchChange={setSearchQuery}
                            itemCount={allItems.length}
                        />
                    </div>

                    {loading ? (
                        <div className="text-center py-20">
                            <div className="text-6xl animate-bounce mb-4">
                                {(() => {
                                    const emojis = ['🍔', '🍕', '🥖', '🍽️'];
                                    return emojis[Math.floor(Date.now() / 1000) % emojis.length];
                                })()}
                            </div>
                            <p className="text-gray-500 text-lg">Chargement du menu...</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="text-6xl mb-4">😕</div>
                            <h3 className="text-xl font-bold text-gray-700 mb-2">Aucun résultat</h3>
                            <button onClick={() => { setSearchQuery(''); setSelectedCategory(null); }} className="btn-primary mt-4">
                                Réinitialiser les filtres
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {Object.entries(groupedItems).map(([categoryName, categoryItems]) => (
                                <div key={categoryName} className="animate-fadeIn">
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="text-3xl">{categoryItems[0]?.category_icon}</span>
                                        <h2 className="text-2xl font-bold font-heading text-dark">{categoryName}</h2>
                                        <div className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent" />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {categoryItems.map((item, index) => (
                                            <MenuCard key={item.id} item={item} index={index} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
            <Footer />
        </main>
    );
}

export default function MenuPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-dark text-white">Chargement...</div>}>
            <MenuContent />
        </Suspense>
    );
}