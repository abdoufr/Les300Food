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
    FaStickyNote
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

    // Dish filter in Step 1
    const [selectedCatFilter, setSelectedCatFilter] = useState<number | null>(
        categoryParam ? parseInt(categoryParam) : null
    );
    const [dishSearchQuery, setDishSearchQuery] = useState('');

    // Wizard step state (1: Dish selection, 2: Viandes extra, 3: Supplements, 4: Sauces, 5: Recap)
    const [currentStep, setCurrentStep] = useState(1);

    // Customization states
    const [selectedViandes, setSelectedViandes] = useState<Ingredient[]>([]);
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
                setCurrentStep(2); // Jump directly to customization
                toast.success(`Plat "${foundDish.name}" sélectionné !`);
            }
        }
    }, [loading, dishIdParam, menuItems, selectedDish]);

    // Map Category Name to Ingredient Category Key (e.g. "Burgers" -> "burger")
    const ingredientCategoryKey = useMemo(() => {
        if (!selectedDish) return 'sandwich';
        const lower = (selectedDish.category_name || '').toLowerCase();
        if (lower.includes('burger')) return 'burger';
        if (lower.includes('pizz')) return 'pizza';
        if (lower.includes('taco')) return 'tacos';
        if (lower.includes('sandwich')) return 'sandwich';
        if (lower.includes('crep') || lower.includes('crêp')) return 'crepe';
        return 'sandwich';
    }, [selectedDish]);

    // Filter available ingredients for the selected dish category (or fallback to all)
    const categoryIngredients = useMemo(() => {
        const matching = ingredients.filter(i => i.category === ingredientCategoryKey);
        return matching.length > 0 ? matching : ingredients;
    }, [ingredients, ingredientCategoryKey]);

    const availableViandes = useMemo(() => {
        const catViandes = categoryIngredients.filter(i => i.subcategory === 'viande');
        if (catViandes.length > 0) return catViandes;
        return ingredients.filter(i => i.subcategory === 'viande');
    }, [categoryIngredients, ingredients]);

    const availableSupplements = useMemo(() => {
        const catSupps = categoryIngredients.filter(i => i.subcategory === 'supplement');
        if (catSupps.length > 0) return catSupps;
        return ingredients.filter(i => i.subcategory === 'supplement');
    }, [categoryIngredients, ingredients]);

    const availableSauces = useMemo(() => {
        // Sauces are generally universal; get unique by name
        const allSauces = ingredients.filter(i => i.subcategory === 'sauce');
        const uniqueMap = new Map<string, Ingredient>();
        allSauces.forEach(s => {
            if (!uniqueMap.has(s.name)) uniqueMap.set(s.name, s);
        });
        return Array.from(uniqueMap.values());
    }, [ingredients]);

    // Filtered menu dishes for Step 1
    const filteredDishes = useMemo(() => {
        let list = [...menuItems];
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
    }, [menuItems, selectedCatFilter, dishSearchQuery]);

    // Calculate total price: Dish Base Price + Extra Viandes + Supplements
    const calculateTotal = useCallback(() => {
        let total = selectedDish ? selectedDish.price : 0;
        selectedViandes.forEach(v => total += v.price);
        selectedSupplements.forEach(s => total += s.price);
        selectedSauces.forEach(sa => total += sa.price);
        return total;
    }, [selectedDish, selectedViandes, selectedSupplements, selectedSauces]);

    // Toggle handlers
    const toggleViande = (viande: Ingredient) => {
        setSelectedViandes(prev =>
            prev.find(v => v.id === viande.id)
                ? prev.filter(v => v.id !== viande.id)
                : [...prev, viande]
        );
    };

    const toggleSupplement = (supp: Ingredient) => {
        setSelectedSupplements(prev =>
            prev.find(s => s.id === supp.id)
                ? prev.filter(s => s.id !== supp.id)
                : [...prev, supp]
        );
    };

    const toggleSauce = (sauce: Ingredient) => {
        setSelectedSauces(prev => {
            if (prev.find(s => s.id === sauce.id)) {
                return prev.filter(s => s.id !== sauce.id);
            }
            if (prev.length >= 3) {
                toast.error('Maximum 3 sauces par plat');
                return prev;
            }
            return [...prev, sauce];
        });
    };

    const handleSelectDish = (dish: MenuItem) => {
        setSelectedDish(dish);
        // Reset previously selected extras when changing dish
        setSelectedViandes([]);
        setSelectedSupplements([]);
        setSelectedSauces([]);
        setCurrentStep(2); // Proceed to extras
        toast.success(`Plat choisi : ${dish.name}`);
    };

    const resetAll = () => {
        setSelectedDish(null);
        setSelectedViandes([]);
        setSelectedSupplements([]);
        setSelectedSauces([]);
        setSpecialNote('');
        setCurrentStep(1);
        toast.success('Réinitialisé');
    };

    // Helper to get dish image
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

        if (selectedViandes.length > 0) {
            message += `\n🥩 *Viandes en extra :*\n`;
            selectedViandes.forEach(v => {
                message += `  • ${v.name} (+${v.price} DA)\n`;
            });
        }

        if (selectedSupplements.length > 0) {
            message += `\n🧀 *Suppléments & Fromages :*\n`;
            selectedSupplements.forEach(s => {
                message += `  • ${s.name} (+${s.price} DA)\n`;
            });
        }

        if (selectedSauces.length > 0) {
            message += `\n🥫 *Sauces :* ${selectedSauces.map(s => s.name.replace('Sauce ', '')).join(', ')}\n`;
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

    const steps = [
        { id: 1, title: '1. Plat', subtitle: 'Choisir le plat', icon: '🍽️' },
        { id: 2, title: '2. Viandes', subtitle: 'Extras viandes', icon: '🥩' },
        { id: 3, title: '3. Suppléments', subtitle: 'Fromages & extras', icon: '🧀' },
        { id: 4, title: '4. Sauces', subtitle: 'Sauces au choix', icon: '🥫' },
        { id: 5, title: '5. Récapitulatif', subtitle: 'Valider commande', icon: '📋' }
    ];

    const goNext = () => {
        if (currentStep === 1 && !selectedDish) {
            toast.error('Veuillez d\'abord choisir un plat dans la liste');
            return;
        }
        if (currentStep < 5) setCurrentStep(prev => prev + 1);
    };

    const goPrev = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1);
    };

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            {/* Header Banner */}
            <section className="bg-gradient-to-br from-dark via-gray-900 to-dark pt-24 pb-10 px-4 text-center text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#DE2824_1px,transparent_1px)] [background-size:16px_16px]"></div>
                <div className="max-w-4xl mx-auto relative z-10">
                    <span className="text-yellow-400 font-bold text-xs uppercase tracking-widest bg-yellow-400/10 border border-yellow-400/20 px-4 py-1.5 rounded-full inline-flex items-center gap-2 mb-3">
                        👨‍🍳 Atelier Personnalisation
                    </span>
                    <h1 className="text-3xl md:text-5xl font-black font-heading mt-2">
                        Composez votre <span className="text-yellow-400">Plat Idéal</span>
                    </h1>
                    <p className="text-gray-300 text-sm md:text-base mt-2 max-w-xl mx-auto">
                        Choisissez votre plat préféré dans notre menu, puis personnalisez-le avec vos suppléments, viandes et sauces préférées !
                    </p>
                </div>
            </section>

            {loading ? (
                <div className="text-center py-24 flex-1 flex flex-col items-center justify-center">
                    <div className="text-6xl animate-bounce mb-4">🍔</div>
                    <p className="text-gray-500 text-lg font-medium">Préparation des ingrédients et du menu...</p>
                </div>
            ) : (
                <section className="py-8 px-4 max-w-7xl mx-auto w-full flex-1 flex flex-col">
                    
                    {/* Stepper Navigation Bar */}
                    <div className="mb-8">
                        <div className="flex overflow-x-auto gap-2 sm:gap-4 pb-2 scrollbar-hide justify-start md:justify-center">
                            {steps.map((step) => {
                                const isActive = currentStep === step.id;
                                const isCompleted = currentStep > step.id;
                                const isClickable = step.id === 1 || selectedDish !== null;

                                return (
                                    <button
                                        key={step.id}
                                        onClick={() => {
                                            if (isClickable) setCurrentStep(step.id);
                                            else toast.error('Veuillez d\'abord choisir un plat');
                                        }}
                                        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl transition-all shrink-0 text-left border ${
                                            isActive
                                                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30 scale-105'
                                                : isCompleted
                                                ? 'bg-white text-gray-700 border-green-300 hover:border-green-400 shadow-sm'
                                                : 'bg-white/60 text-gray-400 border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                            isActive
                                                ? 'bg-white text-primary'
                                                : isCompleted
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-100 text-gray-400'
                                        }`}>
                                            {isCompleted ? <FaCheck /> : step.icon}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold leading-tight">{step.title}</span>
                                            <span className={`text-[10px] hidden sm:block ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                                                {step.subtitle}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Main Layout: Summary Panel (Sticky Left) + Interactive Steps (Right) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1">
                        
                        {/* LEFT COLUMN: Sticky Live Summary */}
                        <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex flex-col sticky top-24 z-10 space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                    <FaUtensils className="text-primary" />
                                    Votre Plat Personnalisé
                                </h3>
                                <button
                                    onClick={resetAll}
                                    className="text-gray-400 hover:text-red-500 transition-colors text-xs flex items-center gap-1 bg-gray-50 hover:bg-red-50 px-2.5 py-1.5 rounded-lg border border-gray-100"
                                    title="Réinitialiser tout"
                                >
                                    <FaUndoAlt /> Réinitialiser
                                </button>
                            </div>

                            {/* Summary Card */}
                            <div className="bg-gradient-to-br from-dark to-gray-900 rounded-2xl p-5 text-white shadow-inner space-y-3.5">
                                {selectedDish ? (
                                    <div>
                                        <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                                            {getDishThumbnail(selectedDish.image) ? (
                                                <img
                                                    src={getDishThumbnail(selectedDish.image)!}
                                                    alt={selectedDish.name}
                                                    className="w-14 h-14 rounded-xl object-cover border border-white/20 shadow-md shrink-0"
                                                />
                                            ) : (
                                                <span className="text-3xl bg-white/10 w-14 h-14 rounded-xl flex items-center justify-center shrink-0">
                                                    {selectedDish.category_icon || '🍽️'}
                                                </span>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <span className="text-[10px] uppercase font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">
                                                    Plat de base
                                                </span>
                                                <h4 className="font-bold text-sm text-white truncate mt-0.5">
                                                    {selectedDish.name}
                                                </h4>
                                                <p className="text-xs text-primary font-bold">
                                                    {selectedDish.price} DA
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setCurrentStep(1)}
                                                className="text-gray-400 hover:text-white text-xs bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors shrink-0"
                                                title="Changer de plat"
                                            >
                                                <FaEdit />
                                            </button>
                                        </div>

                                        {/* Added Extras Details */}
                                        <div className="space-y-2 pt-3 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">🥩 Viandes extra ({selectedViandes.length}):</span>
                                                <span className="font-semibold text-right max-w-[170px] truncate text-gray-200">
                                                    {selectedViandes.length > 0
                                                        ? selectedViandes.map(v => v.name).join(', ')
                                                        : 'Aucune'}
                                                </span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span className="text-gray-400">🧀 Suppléments ({selectedSupplements.length}):</span>
                                                <span className="font-semibold text-right max-w-[170px] truncate text-gray-200">
                                                    {selectedSupplements.length > 0
                                                        ? selectedSupplements.map(s => s.name).join(', ')
                                                        : 'Aucun'}
                                                </span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span className="text-gray-400">🥫 Sauces ({selectedSauces.length}/3):</span>
                                                <span className="font-semibold text-right max-w-[170px] truncate text-gray-200">
                                                    {selectedSauces.length > 0
                                                        ? selectedSauces.map(s => s.name.replace('Sauce ', '')).join(', ')
                                                        : 'Aucune'}
                                                </span>
                                            </div>

                                            {specialNote && (
                                                <div className="flex justify-between pt-1 border-t border-white/5">
                                                    <span className="text-gray-400">📝 Note:</span>
                                                    <span className="italic text-yellow-300 max-w-[170px] truncate">
                                                        {specialNote}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-6">
                                        <div className="text-4xl mb-2">🍽️</div>
                                        <p className="text-sm font-semibold text-gray-300">Aucun plat sélectionné</p>
                                        <p className="text-xs text-gray-400 mt-1">Choisissez un plat dans l'Étape 1 pour commencer.</p>
                                    </div>
                                )}

                                {/* Total Price */}
                                <div className="pt-3.5 border-t border-white/10 flex justify-between items-end">
                                    <div>
                                        <p className="text-[11px] text-gray-400">Total estimé</p>
                                        <motion.p
                                            key={calculateTotal()}
                                            initial={{ scale: 0.9, color: '#DE2824' }}
                                            animate={{ scale: 1, color: '#FACC15' }}
                                            className="text-3xl font-black font-heading"
                                        >
                                            {calculateTotal()} DA
                                        </motion.p>
                                    </div>
                                    {selectedDish && currentStep !== 5 && (
                                        <button
                                            onClick={() => setCurrentStep(5)}
                                            className="bg-primary hover:bg-red-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                                        >
                                            Commander <FaArrowRight />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Quick Tip */}
                            <div className="bg-yellow-50 border border-yellow-200/60 rounded-2xl p-3.5 text-xs text-yellow-800 flex items-start gap-2.5">
                                <span className="text-base">💡</span>
                                <p>
                                    Vous pouvez ajouter plusieurs viandes et suppléments à votre plat pour le rendre encore plus gourmand !
                                </p>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Interactive Step Content */}
                        <div className="lg:col-span-8 flex flex-col">
                            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100 flex-1 flex flex-col">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentStep}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -15 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex-1 flex flex-col"
                                    >

                                        {/* ================= STEP 1: CHOOSE BASE DISH ================= */}
                                        {currentStep === 1 && (
                                            <div className="space-y-6">
                                                <div>
                                                    <h2 className="text-2xl md:text-3xl font-black font-heading text-dark">
                                                        1. Choisissez votre Plat de Base 🍽️
                                                    </h2>
                                                    <p className="text-gray-500 text-sm mt-1">
                                                        Sélectionnez le plat normal du menu que vous souhaitez personnaliser.
                                                    </p>
                                                </div>

                                                {/* Search & Category Filter Pills */}
                                                <div className="space-y-3">
                                                    {/* Search input */}
                                                    <div className="relative">
                                                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            placeholder="Rechercher un plat (ex: Burger Cheese, Pizza Royale, Tacos...)"
                                                            value={dishSearchQuery}
                                                            onChange={(e) => setDishSearchQuery(e.target.value)}
                                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                        />
                                                        {dishSearchQuery && (
                                                            <button
                                                                onClick={() => setDishSearchQuery('')}
                                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                                                            >
                                                                Effacer
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Category Tabs */}
                                                    <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
                                                        <button
                                                            onClick={() => setSelectedCatFilter(null)}
                                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                                                                selectedCatFilter === null
                                                                    ? 'bg-dark text-white shadow-md'
                                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                            }`}
                                                        >
                                                            🍽️ Tous les Plats ({menuItems.length})
                                                        </button>
                                                        {categories.map(cat => (
                                                            <button
                                                                key={cat.id}
                                                                onClick={() => setSelectedCatFilter(cat.id)}
                                                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                                                                    selectedCatFilter === cat.id
                                                                        ? 'bg-primary text-white shadow-md shadow-primary/30'
                                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                                }`}
                                                            >
                                                                <span>{cat.icon}</span>
                                                                <span>{cat.name}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Dishes Grid */}
                                                {filteredDishes.length === 0 ? (
                                                    <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                                        <span className="text-4xl mb-2 block">🔍</span>
                                                        <h4 className="font-bold text-gray-700">Aucun plat trouvé</h4>
                                                        <p className="text-xs text-gray-400 mt-1">Essayez un autre mot-clé ou changez de catégorie.</p>
                                                        <button
                                                            onClick={() => { setDishSearchQuery(''); setSelectedCatFilter(null); }}
                                                            className="mt-3 text-xs text-primary font-bold hover:underline"
                                                        >
                                                            Réinitialiser la recherche
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[520px] overflow-y-auto pr-1">
                                                        {filteredDishes.map((dish) => {
                                                            const isSelected = selectedDish?.id === dish.id;
                                                            const thumb = getDishThumbnail(dish.image);

                                                            return (
                                                                <div
                                                                    key={dish.id}
                                                                    onClick={() => handleSelectDish(dish)}
                                                                    className={`group relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                                                                        isSelected
                                                                            ? 'border-primary bg-primary/5 ring-4 ring-primary/10 shadow-lg'
                                                                            : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-md'
                                                                    }`}
                                                                >
                                                                    <div>
                                                                        <div className="flex items-center gap-3 mb-3">
                                                                            {thumb ? (
                                                                                <img
                                                                                    src={thumb}
                                                                                    alt={dish.name}
                                                                                    className="w-16 h-16 rounded-xl object-cover border border-gray-100 shadow-sm shrink-0 group-hover:scale-105 transition-transform"
                                                                                />
                                                                            ) : (
                                                                                <span className="text-3xl bg-gray-50 w-16 h-16 rounded-xl flex items-center justify-center shrink-0 border border-gray-100">
                                                                                    {dish.category_icon || '🍽️'}
                                                                                </span>
                                                                            )}
                                                                            <div className="min-w-0 flex-1">
                                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                                    <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                                                                        {dish.category_icon} {dish.category_name}
                                                                                    </span>
                                                                                    {dish.is_popular === 1 && (
                                                                                        <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                                                                                            🔥 Top
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <h3 className="font-bold text-dark text-base mt-1 group-hover:text-primary transition-colors leading-tight">
                                                                                    {dish.name}
                                                                                </h3>
                                                                            </div>
                                                                        </div>

                                                                        {dish.description && (
                                                                            <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                                                                                {dish.description}
                                                                            </p>
                                                                        )}
                                                                    </div>

                                                                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between mt-auto">
                                                                        <span className="font-black text-primary text-base font-heading">
                                                                            {dish.price} DA
                                                                        </span>
                                                                        <button
                                                                            type="button"
                                                                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                                                                                isSelected
                                                                                    ? 'bg-primary text-white'
                                                                                    : 'bg-dark text-white group-hover:bg-primary'
                                                                            }`}
                                                                        >
                                                                            {isSelected ? (
                                                                                <>
                                                                                    <FaCheck /> Sélectionné
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    Personnaliser ✨
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* ================= STEP 2: VIANDES EN EXTRA ================= */}
                                        {currentStep === 2 && (
                                            <div className="space-y-6">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h2 className="text-2xl md:text-3xl font-black font-heading text-dark flex items-center gap-2">
                                                            2. Viandes & Protéines en Extra 🥩
                                                        </h2>
                                                        <p className="text-gray-500 text-sm mt-1">
                                                            Envie de plus de viande dans votre {selectedDish?.name || 'plat'} ? Ajoutez des garnitures supplémentaires ! (Optionnel)
                                                        </p>
                                                    </div>
                                                </div>

                                                {availableViandes.length === 0 ? (
                                                    <div className="text-center py-10 bg-gray-50 rounded-2xl">
                                                        <p className="text-gray-500 text-sm">Aucune viande supplémentaire disponible pour cette catégorie.</p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {availableViandes.map(v => {
                                                            const isSelected = selectedViandes.some(item => item.id === v.id);
                                                            return (
                                                                <button
                                                                    key={v.id}
                                                                    type="button"
                                                                    onClick={() => toggleViande(v)}
                                                                    className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                                                                        isSelected
                                                                            ? 'border-primary bg-primary/5 ring-4 ring-primary/10 shadow-md'
                                                                            : 'border-gray-100 bg-white hover:border-gray-300'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border text-xs transition-colors ${
                                                                            isSelected
                                                                                ? 'bg-primary border-primary text-white'
                                                                                : 'border-gray-300 bg-gray-50 text-transparent'
                                                                        }`}>
                                                                            <FaCheck />
                                                                        </div>
                                                                        <div>
                                                                            <span className="font-bold text-dark text-sm block">🥩 {v.name}</span>
                                                                            <span className="text-[11px] text-gray-400">Portion extra</span>
                                                                        </div>
                                                                    </div>
                                                                    <span className="font-bold text-primary text-sm bg-primary/10 px-2.5 py-1 rounded-lg">
                                                                        +{v.price} DA
                                                                    </span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* ================= STEP 3: SUPPLEMENTS & FROMAGES ================= */}
                                        {currentStep === 3 && (
                                            <div className="space-y-6">
                                                <div>
                                                    <h2 className="text-2xl md:text-3xl font-black font-heading text-dark flex items-center gap-2">
                                                        3. Suppléments & Fromages 🧀
                                                    </h2>
                                                    <p className="text-gray-500 text-sm mt-1">
                                                        Ajoutez du fondant, du croustillant ou du fromage supplémentaire ! (Optionnel)
                                                    </p>
                                                </div>

                                                {availableSupplements.length === 0 ? (
                                                    <div className="text-center py-10 bg-gray-50 rounded-2xl">
                                                        <p className="text-gray-500 text-sm">Aucun supplément disponible pour cette catégorie.</p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {availableSupplements.map(s => {
                                                            const isSelected = selectedSupplements.some(item => item.id === s.id);
                                                            return (
                                                                <button
                                                                    key={s.id}
                                                                    type="button"
                                                                    onClick={() => toggleSupplement(s)}
                                                                    className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                                                                        isSelected
                                                                            ? 'border-primary bg-primary/5 ring-4 ring-primary/10 shadow-md'
                                                                            : 'border-gray-100 bg-white hover:border-gray-300'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border text-xs transition-colors ${
                                                                            isSelected
                                                                                ? 'bg-primary border-primary text-white'
                                                                                : 'border-gray-300 bg-gray-50 text-transparent'
                                                                        }`}>
                                                                            <FaCheck />
                                                                        </div>
                                                                        <div>
                                                                            <span className="font-bold text-dark text-sm block">🧀 {s.name}</span>
                                                                            <span className="text-[11px] text-gray-400">Supplément gourmand</span>
                                                                        </div>
                                                                    </div>
                                                                    <span className="font-bold text-primary text-sm bg-primary/10 px-2.5 py-1 rounded-lg">
                                                                        +{s.price} DA
                                                                    </span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* ================= STEP 4: SAUCES ================= */}
                                        {currentStep === 4 && (
                                            <div className="space-y-6">
                                                <div>
                                                    <div className="flex items-center justify-between">
                                                        <h2 className="text-2xl md:text-3xl font-black font-heading text-dark flex items-center gap-2">
                                                            4. Sauces (3 max) 🥫
                                                        </h2>
                                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                                            selectedSauces.length === 3
                                                                ? 'bg-orange-100 text-orange-600'
                                                                : 'bg-green-100 text-green-700'
                                                        }`}>
                                                            {selectedSauces.length} / 3 sélectionnées
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-500 text-sm mt-1">
                                                        Choisissez jusqu'à 3 sauces gratuites pour accompagner votre plat.
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                    {availableSauces.map(sa => {
                                                        const isSelected = selectedSauces.some(item => item.id === sa.id);
                                                        return (
                                                            <button
                                                                key={sa.id}
                                                                type="button"
                                                                onClick={() => toggleSauce(sa)}
                                                                className={`p-3.5 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1 ${
                                                                    isSelected
                                                                        ? 'border-primary bg-primary text-white font-bold shadow-md shadow-primary/20 scale-105'
                                                                        : 'border-gray-100 bg-white hover:border-gray-300 text-gray-700'
                                                                }`}
                                                            >
                                                                <span className="text-lg">🥫</span>
                                                                <span className="text-xs font-semibold">{sa.name.replace('Sauce ', '')}</span>
                                                                <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-green-600 font-bold'}`}>
                                                                    Gratuit
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* ================= STEP 5: RECAPITULATIF & COMMANDE ================= */}
                                        {currentStep === 5 && (
                                            <div className="space-y-6">
                                                <div className="text-center">
                                                    <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-3 shadow-inner">
                                                        <FaCheck />
                                                    </div>
                                                    <h2 className="text-2xl md:text-3xl font-black font-heading text-dark">
                                                        Votre Plat est Prêt ! 🎉
                                                    </h2>
                                                    <p className="text-gray-500 text-sm mt-1">
                                                        Vérifiez les détails ci-dessous avant d'envoyer votre commande sur WhatsApp.
                                                    </p>
                                                </div>

                                                {/* Receipt Card */}
                                                <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
                                                    <h4 className="font-bold text-gray-800 border-b border-gray-200 pb-3 flex items-center justify-between">
                                                        <span>📋 Récapitulatif de la Commande</span>
                                                        <span className="text-xs font-normal text-gray-500">{siteName}</span>
                                                    </h4>

                                                    {/* Base dish line */}
                                                    <div className="flex items-center justify-between text-sm py-1 border-b border-gray-200/60">
                                                        <div className="flex items-center gap-2 font-bold text-dark">
                                                            <span>🍽️ {selectedDish?.name}</span>
                                                            <span className="text-[10px] text-gray-400 font-normal">({selectedDish?.category_name})</span>
                                                        </div>
                                                        <span className="font-bold text-dark">{selectedDish?.price} DA</span>
                                                    </div>

                                                    {/* Extra meats */}
                                                    {selectedViandes.map(v => (
                                                        <div key={v.id} className="flex justify-between text-xs text-gray-600 pl-4">
                                                            <span>🥩 Extra {v.name}</span>
                                                            <span className="font-semibold text-primary">+{v.price} DA</span>
                                                        </div>
                                                    ))}

                                                    {/* Supplements */}
                                                    {selectedSupplements.map(s => (
                                                        <div key={s.id} className="flex justify-between text-xs text-gray-600 pl-4">
                                                            <span>🧀 Supplément {s.name}</span>
                                                            <span className="font-semibold text-primary">+{s.price} DA</span>
                                                        </div>
                                                    ))}

                                                    {/* Sauces */}
                                                    {selectedSauces.length > 0 && (
                                                        <div className="flex justify-between text-xs text-gray-600 pl-4">
                                                            <span>🥫 Sauces : {selectedSauces.map(s => s.name.replace('Sauce ', '')).join(', ')}</span>
                                                            <span className="font-semibold text-green-600">Inclus (Gratuit)</span>
                                                        </div>
                                                    )}

                                                    {/* Special Instructions Input */}
                                                    <div className="pt-3 border-t border-gray-200">
                                                        <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                                            <FaStickyNote className="text-yellow-500" />
                                                            Notes / Instructions spéciales (Optionnel) :
                                                        </label>
                                                        <input
                                                            type="text"
                                                            placeholder="Ex: Sans oignons, bien cuit, sauce à part..."
                                                            value={specialNote}
                                                            onChange={(e) => setSpecialNote(e.target.value)}
                                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                        />
                                                    </div>

                                                    {/* Total Line */}
                                                    <div className="pt-4 border-t-2 border-gray-300 flex justify-between items-center text-lg font-black font-heading text-dark">
                                                        <span>PRIX TOTAL ESTIMÉ</span>
                                                        <span className="text-2xl text-primary">{calculateTotal()} DA</span>
                                                    </div>
                                                </div>

                                                {/* WhatsApp Order Button */}
                                                <button
                                                    onClick={sendWhatsAppOrder}
                                                    className="w-full bg-green-500 hover:bg-green-600 text-white py-4 px-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] shadow-xl shadow-green-500/30"
                                                >
                                                    <FaWhatsapp className="text-3xl" />
                                                    <span>Commander sur WhatsApp ({calculateTotal()} DA)</span>
                                                </button>
                                            </div>
                                        )}

                                    </motion.div>
                                </AnimatePresence>

                                {/* Navigation Prev / Next Buttons */}
                                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center mt-auto">
                                    <button
                                        onClick={goPrev}
                                        disabled={currentStep === 1}
                                        className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
                                            currentStep === 1
                                                ? 'opacity-0 invisible'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        <FaArrowLeft /> Précédent
                                    </button>

                                    {currentStep < 5 && (
                                        <button
                                            onClick={goNext}
                                            className="px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 bg-dark text-white hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl"
                                        >
                                            {currentStep === 1 ? 'Continuer la personnalisation' : 'Étape suivante'}{' '}
                                            <FaArrowRight />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </section>
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
                    <p className="text-gray-500 font-medium">Chargement de l'atelier...</p>
                </div>
            </main>
        }>
            <ComposerContent />
        </Suspense>
    );
}
