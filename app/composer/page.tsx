// app/composer/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import toast from 'react-hot-toast';
import {
    FaWhatsapp,
    FaArrowRight,
    FaArrowLeft,
    FaUndoAlt,
    FaCheck,
    FaSearch,
    FaUtensils,
    FaEdit,
    FaStickyNote,
    FaReceipt
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

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

interface Ingredient {
    id: number;
    name: string;
    price: number;
    category: string;
    subcategory: string;
    is_available: number;
    image?: string;
    description?: string;
}

function ComposerContent() {
    const searchParams = useSearchParams();
    const dishIdParam = searchParams.get('dishId');
    const categoryParam = searchParams.get('category');

    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);

    // Selected Dish
    const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);

    // Filter in Step 1
    const [selectedCatFilter, setSelectedCatFilter] = useState<number | null>(
        categoryParam ? parseInt(categoryParam) : null
    );
    const [dishSearchQuery, setDishSearchQuery] = useState('');

    // Flow Step: 1 = Choix du plat, 2 = Personnalisation (Suppléments + Sauces + Prix + Commande)
    const [currentStep, setCurrentStep] = useState<1 | 2>(1);

    // Supplement category filter in Step 2
    const [suppCategoryFilter, setSuppCategoryFilter] = useState<string>('auto');

    // Selected extras
    const [selectedSupplements, setSelectedSupplements] = useState<Ingredient[]>([]);
    const [selectedSauces, setSelectedSauces] = useState<Ingredient[]>([]);
    const [specialNote, setSpecialNote] = useState('');

    const [whatsapp, setWhatsapp] = useState('');
    const [siteName, setSiteName] = useState('300FOOD');

    // Fetch initial data
    const loadData = useCallback(async () => {
        try {
            const [menuRes, ingRes, settingsRes] = await Promise.all([
                fetch('/api/menu'),
                fetch('/api/ingredients'),
                fetch('/api/public-settings')
            ]);

            const menuData = await menuRes.json();
            const ingData = await ingRes.json();
            const settingsData = await settingsRes.json();

            if (menuData.items && Array.isArray(menuData.items)) {
                setMenuItems(menuData.items.filter((item: MenuItem) => item.is_available === 1));
            }
            if (menuData.categories && Array.isArray(menuData.categories)) {
                setCategories(menuData.categories);
            }

            if (Array.isArray(ingData)) {
                setIngredients(ingData.filter(i => i.is_available === 1));
            }

            if (settingsData.whatsapp) setWhatsapp(settingsData.whatsapp);
            if (settingsData.site_name) setSiteName(settingsData.site_name);

            setLoading(false);
        } catch (error) {
            console.error('Error loading composer data:', error);
            toast.error('Erreur lors du chargement des données');
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handle preselection if dishId is in searchParams
    useEffect(() => {
        if (!loading && dishIdParam && menuItems.length > 0 && !selectedDish) {
            const foundDish = menuItems.find(item => item.id === parseInt(dishIdParam));
            if (foundDish) {
                setSelectedDish(foundDish);
                setCurrentStep(2);
                toast.success(`Plat "${foundDish.name}" sélectionné !`);
            }
        }
    }, [loading, dishIdParam, menuItems, selectedDish]);

    // Map Category Name to Dish Key (pizza, burger, sandwich, plat, tacos, crepe)
    const getDishCategoryKey = useCallback((catName: string = '') => {
        const lower = catName.toLowerCase();
        if (lower.includes('pizz')) return 'pizza';
        if (lower.includes('burger')) return 'burger';
        if (lower.includes('sandwich')) return 'sandwich';
        if (lower.includes('plat') || lower.includes('assiette') || lower.includes('poulet') || lower.includes('repas')) return 'plat';
        if (lower.includes('taco')) return 'tacos';
        if (lower.includes('crep') || lower.includes('crêp')) return 'crepe';
        return 'sandwich';
    }, []);

    const dishCategoryKey = useMemo(() => {
        if (!selectedDish) return 'sandwich';
        return getDishCategoryKey(selectedDish.category_name || '');
    }, [selectedDish, getDishCategoryKey]);

    useEffect(() => {
        if (selectedDish) {
            setSuppCategoryFilter(dishCategoryKey);
        }
    }, [selectedDish, dishCategoryKey]);

    // Base Categories (Exclude Boissons, Desserts, Suppléments, Sauces)
    const baseCategories = useMemo(() => {
        return categories.filter(cat => {
            const lower = (cat.name || '').toLowerCase();
            return !lower.includes('boisson') && 
                   !lower.includes('drink') && 
                   !lower.includes('dessert') && 
                   !lower.includes('suppl') && 
                   !lower.includes('extra') && 
                   !lower.includes('sauce');
        });
    }, [categories]);

    // Base Dishes (Exclude Boissons, Desserts, Suppléments, Sauces)
    const baseDishes = useMemo(() => {
        return menuItems.filter(item => {
            const lower = (item.category_name || '').toLowerCase();
            return !lower.includes('boisson') && 
                   !lower.includes('drink') && 
                   !lower.includes('dessert') && 
                   !lower.includes('suppl') && 
                   !lower.includes('extra') && 
                   !lower.includes('sauce');
        });
    }, [menuItems]);

    // Filtered menu dishes for Step 1
    const filteredDishes = useMemo(() => {
        let list = [...baseDishes];
        if (selectedCatFilter) {
            list = list.filter(item => item.category_id === selectedCatFilter);
        }
        if (dishSearchQuery.trim()) {
            const query = dishSearchQuery.toLowerCase();
            list = list.filter(
                item =>
                    item.name.toLowerCase().includes(query) ||
                    item.description?.toLowerCase().includes(query) ||
                    item.category_name?.toLowerCase().includes(query)
            );
        }
        return list;
    }, [baseDishes, selectedCatFilter, dishSearchQuery]);

    // All Supplements & Extras (from ingredients table + menu supplements category)
    const allSupplements = useMemo(() => {
        // 1. From menu_items in category Suppléments
        const menuSupps = menuItems.filter(item => {
            const cat = (item.category_name || '').toLowerCase();
            return cat.includes('suppl') || cat.includes('extra') || cat.includes('garnitur') || cat.includes('fromage');
        }).map(item => {
            const lowerName = item.name.toLowerCase();
            let catType = 'all';
            if (lowerName.includes('pizza') || (item.description || '').toLowerCase().includes('pizza')) catType = 'pizza';
            else if (lowerName.includes('burger') || (item.description || '').toLowerCase().includes('burger')) catType = 'burger';
            else if (lowerName.includes('sandwich') || (item.description || '').toLowerCase().includes('sandwich')) catType = 'sandwich';
            else if (lowerName.includes('plat') || (item.description || '').toLowerCase().includes('plat')) catType = 'plat';
            else if (lowerName.includes('tacos') || (item.description || '').toLowerCase().includes('tacos')) catType = 'tacos';

            return {
                id: -(item.id),
                name: item.name,
                price: item.price,
                category: catType,
                subcategory: 'supplement',
                is_available: item.is_available,
                image: item.image,
                description: item.description
            };
        });

        // 2. From ingredients table (viandes & supplements)
        const ingSupps = ingredients.filter(i => i.subcategory === 'supplement' || i.subcategory === 'viande' || i.category === 'supplement');

        const combined = [...menuSupps, ...ingSupps];
        const uniqueMap = new Map<string, Ingredient>();
        combined.forEach(s => {
            const key = `${s.name.trim().toLowerCase()}_${s.category}`;
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, s);
            }
        });
        return Array.from(uniqueMap.values());
    }, [menuItems, ingredients]);

    // Filtered supplements based on the chosen dish type or manual tab
    const visibleSupplements = useMemo(() => {
        if (suppCategoryFilter === 'all') {
            return allSupplements;
        }
        return allSupplements.filter(s =>
            s.category === suppCategoryFilter ||
            s.category === 'all' ||
            s.category === 'supplement' ||
            s.category === 'general'
        );
    }, [allSupplements, suppCategoryFilter]);

    // Available Sauces
    const availableSauces = useMemo(() => {
        const allSauces = ingredients.filter(i => i.subcategory === 'sauce');
        const uniqueMap = new Map<string, Ingredient>();
        allSauces.forEach(s => {
            const key = s.name.trim().toLowerCase();
            if (!uniqueMap.has(key)) uniqueMap.set(key, s);
        });
        return Array.from(uniqueMap.values());
    }, [ingredients]);

    // Calculate total price: Dish Base Price + Selected Supplements
    const calculateTotal = useCallback(() => {
        let total = selectedDish ? selectedDish.price : 0;
        selectedSupplements.forEach(s => total += s.price);
        selectedSauces.forEach(sa => total += sa.price);
        return total;
    }, [selectedDish, selectedSupplements, selectedSauces]);

    // Toggle supplement
    const toggleSupplement = (supp: Ingredient) => {
        setSelectedSupplements(prev =>
            prev.find(s => s.id === supp.id)
                ? prev.filter(s => s.id !== supp.id)
                : [...prev, supp]
        );
    };

    // Toggle sauce
    const toggleSauce = (sauce: Ingredient) => {
        setSelectedSauces(prev => {
            if (prev.find(s => s.id === sauce.id)) {
                return prev.filter(s => s.id !== sauce.id);
            }
            if (prev.length >= 3) {
                toast.error('Maximum 3 sauces gratuites');
                return prev;
            }
            return [...prev, sauce];
        });
    };

    // Select dish action
    const handleSelectDish = (dish: MenuItem) => {
        setSelectedDish(dish);
        setSelectedSupplements([]);
        setSelectedSauces([]);
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast.success(`Plat choisi : ${dish.name}`);
    };

    // Reset action
    const resetAll = () => {
        setSelectedDish(null);
        setSelectedSupplements([]);
        setSelectedSauces([]);
        setSpecialNote('');
        setCurrentStep(1);
        toast.success('Réinitialisé');
    };

    // Parse image helper
    const getDishThumbnail = (imageStr?: string) => {
        if (!imageStr) return null;
        try {
            const parsed = JSON.parse(imageStr);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
            return imageStr;
        } catch {
            return imageStr;
        }
    };

    // Send WhatsApp Order
    const sendWhatsAppOrder = () => {
        if (!selectedDish) {
            toast.error('Veuillez choisir un plat');
            setCurrentStep(1);
            return;
        }

        let message = `Bonjour ${siteName} ! Je souhaite commander un plat personnalisé :\n\n`;
        message += `🍽️ *PLAT CHOISI : ${selectedDish.name.toUpperCase()}*\n`;
        message += `💰 *Prix de base :* ${selectedDish.price} DA\n`;
        if (selectedDish.description) {
            message += `ℹ️ *Description :* ${selectedDish.description}\n`;
        }

        if (selectedSupplements.length > 0) {
            message += `\n🧀 *Suppléments & Extras ajoutés :*\n`;
            selectedSupplements.forEach(s => {
                message += `  • ${s.name} (+${s.price} DA)\n`;
            });
        }

        if (selectedSauces.length > 0) {
            message += `\n🥫 *Sauces gratuites :* ${selectedSauces.map(s => s.name.replace('Sauce ', '')).join(', ')}\n`;
        }

        if (specialNote.trim()) {
            message += `\n📝 *Instructions spéciales :* ${specialNote.trim()}\n`;
        }

        message += `\n━━━━━━━━━━━━━━━\n`;
        message += `💵 *PRIX TOTAL : ${calculateTotal()} DA*\n`;
        message += `━━━━━━━━━━━━━━━\n\n`;
        message += `Merci de valider et préparer ma commande !`;

        const whatsappNumber = whatsapp || process.env.NEXT_PUBLIC_WHATSAPP || '213600000000';
        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const suppTabs = [
        { id: 'pizza', name: 'Pizza 🍕' },
        { id: 'burger', name: 'Burger 🍔' },
        { id: 'sandwich', name: 'Sandwich 🥪' },
        { id: 'plat', name: 'Plats 🍽️' },
        { id: 'tacos', name: 'Tacos 🌮' },
        { id: 'all', name: 'Tous ✨' }
    ];

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col pb-24 lg:pb-12">
            <Navbar />

            {/* Header Banner */}
            <section className="bg-gradient-to-br from-dark via-gray-900 to-dark pt-20 pb-6 md:pt-24 md:pb-8 px-4 text-center text-white relative">
                <div className="max-w-3xl mx-auto">
                    <span className="text-yellow-400 font-bold text-xs uppercase tracking-widest bg-yellow-400/10 border border-yellow-400/20 px-3.5 py-1 rounded-full inline-flex items-center gap-1.5 mb-2">
                        👨‍🍳 Atelier Personnalisation
                    </span>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black font-heading mt-1">
                        {currentStep === 1 ? 'Choisissez votre Plat' : 'Personnalisez votre Plat'}
                    </h1>
                    <p className="text-gray-300 text-xs sm:text-sm mt-1 max-w-lg mx-auto">
                        {currentStep === 1 
                            ? 'Sélectionnez un plat ci-dessous pour y ajouter vos suppléments et sauces.' 
                            : `Ajoutez des suppléments et garnitures à votre ${selectedDish?.name || 'plat'}.`}
                    </p>
                </div>
            </section>

            {loading ? (
                <div className="text-center py-20 flex-1 flex flex-col items-center justify-center">
                    <div className="text-5xl animate-bounce mb-3">🍔</div>
                    <p className="text-gray-500 font-medium text-sm">Chargement du menu...</p>
                </div>
            ) : (
                <section className="py-4 md:py-6 px-3 sm:px-6 max-w-4xl mx-auto w-full flex-1 flex flex-col">
                    
                    {/* ================= STEP 1 : VERTICAL DISHES LIST ================= */}
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            {/* Search & Category Pills */}
                            <div className="space-y-2.5 bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-sm">
                                {/* Search bar */}
                                <div className="relative">
                                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher un plat (Burger, Pizza, Sandwich, Tacos...)"
                                        value={dishSearchQuery}
                                        onChange={(e) => setDishSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                    {dishSearchQuery && (
                                        <button
                                            onClick={() => setDishSearchQuery('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                                        >
                                            Effacer
                                        </button>
                                    )}
                                </div>

                                {/* Categories pills */}
                                <div className="flex overflow-x-auto gap-1.5 sm:gap-2 pb-1 scrollbar-hide">
                                    <button
                                        onClick={() => setSelectedCatFilter(null)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                                            selectedCatFilter === null
                                                ? 'bg-dark text-white shadow-sm'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        🍽️ Tous ({baseDishes.length})
                                    </button>
                                    {baseCategories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCatFilter(cat.id)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                                                selectedCatFilter === cat.id
                                                    ? 'bg-primary text-white shadow-sm'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            <span>{cat.icon}</span>
                                            <span>{cat.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dishes List (VERTICAL) */}
                            {filteredDishes.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                                    <span className="text-3xl mb-1 block">🔍</span>
                                    <h4 className="font-bold text-gray-700 text-sm">Aucun plat trouvé</h4>
                                    <p className="text-xs text-gray-400 mt-0.5">Essayez un autre mot-clé ou changez de filtre.</p>
                                    <button
                                        onClick={() => { setDishSearchQuery(''); setSelectedCatFilter(null); }}
                                        className="mt-2 text-xs text-primary font-bold hover:underline"
                                    >
                                        Réinitialiser
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2.5 sm:space-y-3">
                                    {filteredDishes.map((dish) => {
                                        const thumb = getDishThumbnail(dish.image);

                                        return (
                                            <div
                                                key={dish.id}
                                                onClick={() => handleSelectDish(dish)}
                                                className="group bg-white border border-gray-100 hover:border-primary/50 p-3 sm:p-4 rounded-2xl transition-all cursor-pointer shadow-sm hover:shadow-md flex items-center justify-between gap-3 sm:gap-4"
                                            >
                                                {/* Left: Thumbnail & Details */}
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    {thumb ? (
                                                        <img
                                                            src={thumb}
                                                            alt={dish.name}
                                                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-gray-100 shrink-0 group-hover:scale-105 transition-transform"
                                                        />
                                                    ) : (
                                                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-2xl sm:text-3xl shrink-0 border border-orange-100">
                                                            {dish.category_icon || '🍽️'}
                                                        </div>
                                                    )}

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="text-[9px] sm:text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                                {dish.category_icon} {dish.category_name}
                                                            </span>
                                                            {dish.is_popular === 1 && (
                                                                <span className="text-[9px] sm:text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full">
                                                                    🔥 Top
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h3 className="font-bold text-dark text-sm sm:text-base mt-0.5 group-hover:text-primary transition-colors truncate">
                                                            {dish.name}
                                                        </h3>
                                                        {dish.description && (
                                                            <p className="text-[11px] sm:text-xs text-gray-400 line-clamp-1 mt-0.5">
                                                                {dish.description}
                                                            </p>
                                                        )}
                                                        <span className="font-black text-primary text-sm sm:text-base font-heading mt-1 block">
                                                            {dish.price} DA
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Right: Action Button */}
                                                <button
                                                    type="button"
                                                    className="shrink-0 bg-dark group-hover:bg-primary text-white text-xs sm:text-sm font-bold px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                                                >
                                                    <span>Personnaliser</span>
                                                    <FaArrowRight className="text-xs" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ================= STEP 2 : CUSTOMIZE (SUPPLEMENTS + SAUCES + RECAP + WHATSAPP) ================= */}
                    {currentStep === 2 && selectedDish && (
                        <div className="space-y-4 sm:space-y-6">
                            
                            {/* Selected Dish Card Banner */}
                            <div className="bg-gradient-to-r from-dark to-gray-900 text-white p-4 sm:p-5 rounded-2xl shadow-md flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    {getDishThumbnail(selectedDish.image) ? (
                                        <img
                                            src={getDishThumbnail(selectedDish.image)!}
                                            alt={selectedDish.name}
                                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-white/20 shrink-0"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white/10 flex items-center justify-center text-2xl shrink-0">
                                            {selectedDish.category_icon || '🍽️'}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <span className="text-[10px] uppercase font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">
                                            {selectedDish.category_name}
                                        </span>
                                        <h3 className="font-bold text-sm sm:text-base text-white truncate mt-0.5">
                                            {selectedDish.name}
                                        </h3>
                                        <p className="text-xs text-yellow-400 font-bold font-heading">
                                            Prix de base : {selectedDish.price} DA
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setCurrentStep(1)}
                                    className="shrink-0 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-1 border border-white/10"
                                >
                                    <FaEdit /> <span>Changer</span>
                                </button>
                            </div>

                            {/* 🧀 Section 1: Suppléments & Extras */}
                            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div>
                                        <h3 className="font-bold text-dark text-base sm:text-lg flex items-center gap-2">
                                            <span>🧀</span> Suppléments & Extras
                                        </h3>
                                        <p className="text-gray-400 text-xs mt-0.5">
                                            Ajoutez vos suppléments préférés adaptés à votre plat.
                                        </p>
                                    </div>

                                    {/* Category switcher pills */}
                                    <div className="flex overflow-x-auto gap-1 pb-1 scrollbar-hide">
                                        {suppTabs.map(tab => (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() => setSuppCategoryFilter(tab.id)}
                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 ${
                                                    suppCategoryFilter === tab.id
                                                        ? 'bg-primary text-white shadow-xs'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                            >
                                                {tab.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Supplements grid */}
                                {visibleSupplements.length === 0 ? (
                                    <div className="text-center py-6 bg-gray-50 rounded-xl text-gray-400 text-xs">
                                        Aucun supplément dans cette catégorie.
                                        <button onClick={() => setSuppCategoryFilter('all')} className="block mx-auto mt-1 font-bold text-primary">
                                            Voir tous les suppléments
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {visibleSupplements.map(s => {
                                            const isSelected = selectedSupplements.some(item => item.id === s.id);
                                            return (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    onClick={() => toggleSupplement(s)}
                                                    className={`p-3 rounded-xl border-2 text-left transition-all flex items-center justify-between gap-2 ${
                                                        isSelected
                                                            ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-xs'
                                                            : 'border-gray-100 bg-white hover:border-gray-200'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border text-[10px] transition-colors shrink-0 ${
                                                            isSelected
                                                                ? 'bg-primary border-primary text-white font-bold'
                                                                : 'border-gray-300 bg-gray-50 text-transparent'
                                                        }`}>
                                                            <FaCheck />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="font-bold text-dark text-xs sm:text-sm block truncate">{s.name}</span>
                                                            <span className="text-[10px] text-gray-400 truncate block">
                                                                {s.description || 'Extra gourmand'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className="font-bold text-primary text-xs bg-primary/10 px-2 py-0.5 rounded-lg shrink-0">
                                                        +{s.price} DA
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* 🥫 Section 2: Sauces (Gratuit, max 3) */}
                            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-dark text-base sm:text-lg flex items-center gap-2">
                                            <span>🥫</span> Sauces Gratuites
                                        </h3>
                                        <p className="text-gray-400 text-xs mt-0.5">
                                            Choisissez jusqu'à 3 sauces pour votre plat.
                                        </p>
                                    </div>
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                        selectedSauces.length === 3 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-700'
                                    }`}>
                                        {selectedSauces.length} / 3
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {availableSauces.map(sa => {
                                        const isSelected = selectedSauces.some(item => item.id === sa.id);
                                        return (
                                            <button
                                                key={sa.id}
                                                type="button"
                                                onClick={() => toggleSauce(sa)}
                                                className={`p-2.5 rounded-xl border-2 text-center transition-all flex items-center justify-between gap-1 text-xs ${
                                                    isSelected
                                                        ? 'border-primary bg-primary text-white font-bold shadow-xs'
                                                        : 'border-gray-100 bg-white hover:border-gray-200 text-gray-700'
                                                }`}
                                            >
                                                <span className="truncate">{sa.name.replace('Sauce ', '')}</span>
                                                <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-green-600 font-bold'}`}>
                                                    0 DA
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 📝 Section 3: Notes & Instructions */}
                            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                                <label className="block text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                    <FaStickyNote className="text-yellow-500" />
                                    Instructions spéciales (Optionnel) :
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ex: Sans oignons, bien cuit, sauce à part..."
                                    value={specialNote}
                                    onChange={(e) => setSpecialNote(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>

                            {/* 📋 Section 4: Récapitulatif & Commande WhatsApp */}
                            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-md space-y-3">
                                <h4 className="font-bold text-gray-800 text-sm pb-2 border-b border-gray-100 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5"><FaReceipt className="text-primary" /> Récapitulatif du Plat</span>
                                    <button onClick={resetAll} className="text-xs text-gray-400 hover:text-red-500 font-normal flex items-center gap-1">
                                        <FaUndoAlt /> Tout recommencer
                                    </button>
                                </h4>

                                <div className="space-y-1.5 text-xs text-gray-600">
                                    <div className="flex justify-between font-bold text-dark">
                                        <span>🍽️ {selectedDish.name}</span>
                                        <span>{selectedDish.price} DA</span>
                                    </div>
                                    {selectedSupplements.map(s => (
                                        <div key={s.id} className="flex justify-between pl-3 text-gray-500">
                                            <span>+ {s.name}</span>
                                            <span className="text-primary font-semibold">+{s.price} DA</span>
                                        </div>
                                    ))}
                                    {selectedSauces.length > 0 && (
                                        <div className="flex justify-between pl-3 text-gray-500">
                                            <span>Sauces: {selectedSauces.map(s => s.name.replace('Sauce ', '')).join(', ')}</span>
                                            <span className="text-green-600 font-semibold">Gratuit</span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-3 border-t-2 border-gray-200 flex justify-between items-center text-lg sm:text-xl font-black font-heading text-dark">
                                    <span>PRIX TOTAL</span>
                                    <span className="text-2xl text-primary">{calculateTotal()} DA</span>
                                </div>

                                <button
                                    onClick={sendWhatsAppOrder}
                                    className="w-full bg-green-500 hover:bg-green-600 text-white py-3.5 sm:py-4 px-4 rounded-xl font-bold text-base sm:text-lg flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-green-500/25 hover:scale-[1.01]"
                                >
                                    <FaWhatsapp className="text-2xl sm:text-3xl" />
                                    <span>Commander sur WhatsApp ({calculateTotal()} DA)</span>
                                </button>
                            </div>

                        </div>
                    )}

                </section>
            )}

            {/* MOBILE FLOATING BOTTOM BAR (Only on Step 2) */}
            {!loading && currentStep === 2 && selectedDish && (
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-dark/95 backdrop-blur-md border-t border-white/10 p-3 px-4 flex items-center justify-between text-white lg:hidden shadow-2xl">
                    <div className="min-w-0 pr-2">
                        <p className="text-[10px] text-gray-400 truncate">Total avec suppléments</p>
                        <p className="text-base font-black font-heading text-yellow-400">
                            {calculateTotal()} DA
                        </p>
                    </div>

                    <button
                        onClick={sendWhatsAppOrder}
                        className="bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 shrink-0"
                    >
                        <FaWhatsapp className="text-lg" />
                        <span>Commander</span>
                    </button>
                </div>
            )}

            <Footer />
        </main>
    );
}

export default function ComposerPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-5xl animate-bounce mb-3">👨‍🍳</div>
                    <p className="text-gray-500 font-medium">Chargement...</p>
                </div>
            </main>
        }>
            <ComposerContent />
        </Suspense>
    );
}
