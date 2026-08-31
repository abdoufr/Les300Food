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
    FaReceipt,
    FaTimes
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

    // Dish filter in Step 1
    const [selectedCatFilter, setSelectedCatFilter] = useState<number | null>(
        categoryParam ? parseInt(categoryParam) : null
    );
    const [dishSearchQuery, setDishSearchQuery] = useState('');

    // Wizard step state (1: Dish selection, 2: Viandes extra, 3: Supplements, 4: Sauces, 5: Recap)
    const [currentStep, setCurrentStep] = useState(1);

    // Supplement subcategory filter in Step 3
    const [supplementCategoryFilter, setSupplementCategoryFilter] = useState<string>('auto');

    // Customization states
    const [selectedViandes, setSelectedViandes] = useState<Ingredient[]>([]);
    const [selectedSupplements, setSelectedSupplements] = useState<Ingredient[]>([]);
    const [selectedSauces, setSelectedSauces] = useState<Ingredient[]>([]);
    const [specialNote, setSpecialNote] = useState('');

    // Mobile slide-up details drawer state
    const [showMobileDetails, setShowMobileDetails] = useState(false);

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

    // Map Category Name to Category Key (pizza, burger, sandwich, plat, tacos, crepe)
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

    // Set auto supplement filter when dish changes
    useEffect(() => {
        if (selectedDish) {
            setSupplementCategoryFilter(dishCategoryKey);
        } else {
            setSupplementCategoryFilter('all');
        }
    }, [selectedDish, dishCategoryKey]);

    // Base dishes and categories (exclude pure supplements and sauces from Step 1 base dishes)
    const baseCategories = useMemo(() => {
        return categories.filter(cat => {
            const catName = (cat.name || '').toLowerCase();
            return !catName.includes('suppl') && !catName.includes('extra') && !catName.includes('sauce');
        });
    }, [categories]);

    const baseDishes = useMemo(() => {
        return menuItems.filter(item => {
            const cat = (item.category_name || '').toLowerCase();
            return !cat.includes('suppl') && !cat.includes('extra') && !cat.includes('sauce');
        });
    }, [menuItems]);

    // 1. Supplements from menu items (category "Suppléments" / "Supplements" / "Extras")
    const menuSupplements = useMemo(() => {
        return menuItems.filter(item => {
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
    }, [menuItems]);

    // 2. Supplements from ingredients table
    const ingredientSupplements = useMemo(() => {
        return ingredients.filter(i => i.subcategory === 'supplement' || i.category === 'supplement');
    }, [ingredients]);

    // Combined unique supplements
    const allSupplements = useMemo(() => {
        const combined = [...menuSupplements, ...ingredientSupplements];
        const uniqueMap = new Map<string, Ingredient>();
        combined.forEach(s => {
            const key = `${s.name.trim().toLowerCase()}_${s.category}`;
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, s);
            }
        });
        return Array.from(uniqueMap.values());
    }, [menuSupplements, ingredientSupplements]);

    // Filtered supplements based on the active tab in Step 3
    const filteredSupplements = useMemo(() => {
        if (supplementCategoryFilter === 'all') {
            return allSupplements;
        }
        return allSupplements.filter(s =>
            s.category === supplementCategoryFilter ||
            s.category === 'all' ||
            s.category === 'supplement' ||
            s.category === 'general'
        );
    }, [allSupplements, supplementCategoryFilter]);

    // Viandes en extra from menu & ingredients (filtered by dish category)
    const availableViandes = useMemo(() => {
        const catViandes = ingredients.filter(i => i.category === dishCategoryKey && i.subcategory === 'viande');
        const fallbackViandes = catViandes.length > 0 ? catViandes : ingredients.filter(i => i.subcategory === 'viande');

        const menuViandes = menuItems.filter(item => {
            const cat = (item.category_name || '').toLowerCase();
            return cat.includes('viande') || cat.includes('protéine');
        }).map(item => ({
            id: -(item.id + 10000),
            name: item.name,
            price: item.price,
            category: dishCategoryKey,
            subcategory: 'viande',
            is_available: item.is_available,
            image: item.image,
            description: item.description
        }));

        const combined = [...menuViandes, ...fallbackViandes];
        const uniqueMap = new Map<string, Ingredient>();
        combined.forEach(v => {
            const key = v.name.trim().toLowerCase();
            if (!uniqueMap.has(key)) uniqueMap.set(key, v);
        });
        return Array.from(uniqueMap.values());
    }, [ingredients, dishCategoryKey, menuItems]);

    // Sauces from menu & ingredients
    const availableSauces = useMemo(() => {
        const allSauces = ingredients.filter(i => i.subcategory === 'sauce');
        const uniqueMap = new Map<string, Ingredient>();
        allSauces.forEach(s => {
            const key = s.name.trim().toLowerCase();
            if (!uniqueMap.has(key)) uniqueMap.set(key, s);
        });
        return Array.from(uniqueMap.values());
    }, [ingredients]);

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
        setShowMobileDetails(false);
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
        { id: 1, title: 'Plat', subtitle: 'Choisir', icon: '🍽️' },
        { id: 2, title: 'Viandes', subtitle: 'Extras', icon: '🥩' },
        { id: 3, title: 'Suppléments', subtitle: 'Fromages', icon: '🧀' },
        { id: 4, title: 'Sauces', subtitle: 'Au choix', icon: '🥫' },
        { id: 5, title: 'Récapitulatif', subtitle: 'Commander', icon: '📋' }
    ];

    const goNext = () => {
        if (currentStep === 1 && !selectedDish) {
            toast.error('Veuillez d\'abord choisir un plat dans la liste');
            return;
        }
        if (currentStep < 5) setCurrentStep(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const goPrev = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Subcategory options for Step 3
    const supplementCategoryTabs = [
        { id: 'pizza', name: 'Pizza 🍕', icon: '🍕' },
        { id: 'burger', name: 'Burger 🍔', icon: '🍔' },
        { id: 'sandwich', name: 'Sandwich 🥪', icon: '🥪' },
        { id: 'plat', name: 'Plats / Assiettes 🍽️', icon: '🍽️' },
        { id: 'tacos', name: 'Tacos 🌮', icon: '🌮' },
        { id: 'all', name: 'Tous les Suppléments ✨', icon: '✨' }
    ];

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col pb-24 lg:pb-8">
            <Navbar />

            {/* Header Banner - Compact & Responsive */}
            <section className="bg-gradient-to-br from-dark via-gray-900 to-dark pt-20 pb-6 md:pt-24 md:pb-10 px-4 text-center text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#DE2824_1px,transparent_1px)] [background-size:16px_16px]"></div>
                <div className="max-w-4xl mx-auto relative z-10">
                    <span className="text-yellow-400 font-bold text-[10px] md:text-xs uppercase tracking-widest bg-yellow-400/10 border border-yellow-400/20 px-3.5 py-1 rounded-full inline-flex items-center gap-1.5 mb-2">
                        👨‍🍳 Atelier Personnalisation
                    </span>
                    <h1 className="text-2xl sm:text-3xl md:text-5xl font-black font-heading mt-1">
                        Composez votre <span className="text-yellow-400">Plat Idéal</span>
                    </h1>
                    <p className="text-gray-300 text-xs sm:text-sm mt-1.5 max-w-xl mx-auto line-clamp-2 sm:line-clamp-none">
                        Choisissez un plat dans notre menu, puis personnalisez-le avec vos suppléments et sauces !
                    </p>
                </div>
            </section>

            {loading ? (
                <div className="text-center py-20 flex-1 flex flex-col items-center justify-center">
                    <div className="text-5xl md:text-6xl animate-bounce mb-3">🍔</div>
                    <p className="text-gray-500 font-medium text-sm md:text-base">Chargement de votre atelier...</p>
                </div>
            ) : (
                <section className="py-4 md:py-8 px-3 sm:px-4 max-w-7xl mx-auto w-full flex-1 flex flex-col">
                    
                    {/* Stepper Navigation Bar - Fully Responsive */}
                    <div className="mb-4 md:mb-6">
                        <div className="flex overflow-x-auto gap-1.5 sm:gap-3 pb-2 scrollbar-hide justify-start md:justify-center items-center">
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
                                        className={`flex items-center gap-1.5 sm:gap-2.5 px-3 sm:px-4 py-2 rounded-xl sm:rounded-2xl transition-all shrink-0 text-left border text-xs ${
                                            isActive
                                                ? 'bg-primary text-white border-primary shadow-md shadow-primary/20 scale-100 sm:scale-105 font-bold'
                                                : isCompleted
                                                ? 'bg-white text-gray-700 border-green-300 shadow-sm font-semibold'
                                                : 'bg-white/80 text-gray-400 border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold ${
                                            isActive
                                                ? 'bg-white text-primary'
                                                : isCompleted
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-100 text-gray-400'
                                        }`}>
                                            {isCompleted ? <FaCheck /> : step.icon}
                                        </div>
                                        <span className="leading-tight whitespace-nowrap">
                                            {step.id}. {step.title}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Main Layout: Responsive Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
                        
                        {/* LEFT COLUMN (Desktop): Sticky Live Summary - Hidden on Mobile */}
                        <div className="hidden lg:flex lg:col-span-4 bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex-col sticky top-24 z-10 space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                                    <FaUtensils className="text-primary" />
                                    Votre Composition
                                </h3>
                                <button
                                    onClick={resetAll}
                                    className="text-gray-400 hover:text-red-500 transition-colors text-xs flex items-center gap-1 bg-gray-50 hover:bg-red-50 px-2.5 py-1.5 rounded-lg border border-gray-100"
                                >
                                    <FaUndoAlt /> Réinitialiser
                                </button>
                            </div>

                            {/* Summary Card */}
                            <div className="bg-gradient-to-br from-dark to-gray-900 rounded-2xl p-5 text-white shadow-inner space-y-3">
                                {selectedDish ? (
                                    <div>
                                        <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                                            {getDishThumbnail(selectedDish.image) ? (
                                                <img
                                                    src={getDishThumbnail(selectedDish.image)!}
                                                    alt={selectedDish.name}
                                                    className="w-12 h-12 rounded-xl object-cover border border-white/20 shadow-md shrink-0"
                                                />
                                            ) : (
                                                <span className="text-2xl bg-white/10 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                                                    {selectedDish.category_icon || '🍽️'}
                                                </span>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <span className="text-[9px] uppercase font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">
                                                    {selectedDish.category_name}
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
                                                <span className="text-gray-400">🥩 Viandes ({selectedViandes.length}):</span>
                                                <span className="font-semibold text-right max-w-[150px] truncate text-gray-200">
                                                    {selectedViandes.length > 0
                                                        ? selectedViandes.map(v => v.name).join(', ')
                                                        : 'Aucune'}
                                                </span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span className="text-gray-400">🧀 Suppléments ({selectedSupplements.length}):</span>
                                                <span className="font-semibold text-right max-w-[150px] truncate text-gray-200">
                                                    {selectedSupplements.length > 0
                                                        ? selectedSupplements.map(s => s.name).join(', ')
                                                        : 'Aucun'}
                                                </span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span className="text-gray-400">🥫 Sauces ({selectedSauces.length}/3):</span>
                                                <span className="font-semibold text-right max-w-[150px] truncate text-gray-200">
                                                    {selectedSauces.length > 0
                                                        ? selectedSauces.map(s => s.name.replace('Sauce ', '')).join(', ')
                                                        : 'Aucune'}
                                                </span>
                                            </div>

                                            {specialNote && (
                                                <div className="flex justify-between pt-1 border-t border-white/5">
                                                    <span className="text-gray-400">📝 Note:</span>
                                                    <span className="italic text-yellow-300 max-w-[150px] truncate">
                                                        {specialNote}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <div className="text-3xl mb-1.5">🍽️</div>
                                        <p className="text-xs font-semibold text-gray-300">Aucun plat sélectionné</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">Choisissez un plat dans l'Étape 1.</p>
                                    </div>
                                )}

                                {/* Total Price */}
                                <div className="pt-3 border-t border-white/10 flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] text-gray-400">Total estimé</p>
                                        <motion.p
                                            key={calculateTotal()}
                                            initial={{ scale: 0.9, color: '#DE2824' }}
                                            animate={{ scale: 1, color: '#FACC15' }}
                                            className="text-2xl font-black font-heading text-yellow-400"
                                        >
                                            {calculateTotal()} DA
                                        </motion.p>
                                    </div>
                                    {selectedDish && currentStep !== 5 && (
                                        <button
                                            onClick={() => setCurrentStep(5)}
                                            className="bg-primary hover:bg-red-600 text-white font-bold text-xs px-3 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                                        >
                                            Commander <FaArrowRight />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Interactive Step Content (Full width on Mobile) */}
                        <div className="lg:col-span-8 w-full flex flex-col">
                            <div className="bg-white rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 shadow-lg md:shadow-xl border border-gray-100 flex-1 flex flex-col">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentStep}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex-1 flex flex-col"
                                    >

                                        {/* ================= STEP 1: CHOOSE BASE DISH ================= */}
                                        {currentStep === 1 && (
                                            <div className="space-y-4 sm:space-y-6">
                                                <div>
                                                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-heading text-dark flex items-center gap-2">
                                                        1. Choisissez votre Plat 🍽️
                                                    </h2>
                                                    <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                                                        Sélectionnez le plat du menu que vous souhaitez personnaliser.
                                                    </p>
                                                </div>

                                                {/* Search & Category Filter Pills */}
                                                <div className="space-y-2.5">
                                                    {/* Search input */}
                                                    <div className="relative">
                                                        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm" />
                                                        <input
                                                            type="text"
                                                            placeholder="Rechercher (ex: Burger, Pizza, Tacos...)"
                                                            value={dishSearchQuery}
                                                            onChange={(e) => setDishSearchQuery(e.target.value)}
                                                            className="w-full pl-9 pr-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                        />
                                                        {dishSearchQuery && (
                                                            <button
                                                                onClick={() => setDishSearchQuery('')}
                                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                                                            >
                                                                Effacer
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Category Tabs */}
                                                    <div className="flex overflow-x-auto gap-1.5 sm:gap-2 pb-1 scrollbar-hide">
                                                        <button
                                                            onClick={() => setSelectedCatFilter(null)}
                                                            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
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
                                                                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
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

                                                {/* Dishes Grid */}
                                                {filteredDishes.length === 0 ? (
                                                    <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                                        <span className="text-3xl mb-1 block">🔍</span>
                                                        <h4 className="font-bold text-gray-700 text-sm">Aucun plat trouvé</h4>
                                                        <p className="text-xs text-gray-400 mt-0.5">Essayez un autre mot-clé ou changez de filtre.</p>
                                                        <button
                                                            onClick={() => { setDishSearchQuery(''); setSelectedCatFilter(null); }}
                                                            className="mt-2 text-xs text-primary font-bold hover:underline"
                                                        >
                                                            Réinitialiser la recherche
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-h-[500px] overflow-y-auto pr-1">
                                                        {filteredDishes.map((dish) => {
                                                            const isSelected = selectedDish?.id === dish.id;
                                                            const thumb = getDishThumbnail(dish.image);

                                                            return (
                                                                <div
                                                                    key={dish.id}
                                                                    onClick={() => handleSelectDish(dish)}
                                                                    className={`group relative p-3 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                                                                        isSelected
                                                                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md'
                                                                            : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm'
                                                                    }`}
                                                                >
                                                                    <div>
                                                                        <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-3">
                                                                            {thumb ? (
                                                                                <img
                                                                                    src={thumb}
                                                                                    alt={dish.name}
                                                                                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-gray-100 shadow-sm shrink-0 group-hover:scale-105 transition-transform"
                                                                                />
                                                                            ) : (
                                                                                <span className="text-2xl sm:text-3xl bg-gray-50 w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center shrink-0 border border-gray-100">
                                                                                    {dish.category_icon || '🍽️'}
                                                                                </span>
                                                                            )}
                                                                            <div className="min-w-0 flex-1">
                                                                                <div className="flex items-center gap-1 flex-wrap">
                                                                                    <span className="text-[9px] sm:text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                                                                        {dish.category_icon} {dish.category_name}
                                                                                    </span>
                                                                                    {dish.is_popular === 1 && (
                                                                                        <span className="text-[9px] sm:text-[10px] font-bold bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">
                                                                                            🔥 Top
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <h3 className="font-bold text-dark text-sm sm:text-base mt-0.5 group-hover:text-primary transition-colors truncate">
                                                                                    {dish.name}
                                                                                </h3>
                                                                            </div>
                                                                        </div>

                                                                        {dish.description && (
                                                                            <p className="text-[11px] sm:text-xs text-gray-500 line-clamp-2 mb-2 sm:mb-3">
                                                                                {dish.description}
                                                                            </p>
                                                                        )}
                                                                    </div>

                                                                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between mt-auto">
                                                                        <span className="font-black text-primary text-sm sm:text-base font-heading">
                                                                            {dish.price} DA
                                                                        </span>
                                                                        <button
                                                                            type="button"
                                                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                                                                                isSelected
                                                                                    ? 'bg-primary text-white'
                                                                                    : 'bg-dark text-white group-hover:bg-primary'
                                                                            }`}
                                                                        >
                                                                            {isSelected ? (
                                                                                <>
                                                                                    <FaCheck /> Choisi
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    Choisir ✨
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
                                            <div className="space-y-4 sm:space-y-6">
                                                <div>
                                                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-heading text-dark flex items-center gap-2">
                                                        2. Viandes & Protéines en Extra 🥩
                                                    </h2>
                                                    <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                                                        Ajoutez une portion de viande supplémentaire à votre {selectedDish?.name || 'plat'} ! (Optionnel)
                                                    </p>
                                                </div>

                                                {availableViandes.length === 0 ? (
                                                    <div className="text-center py-10 bg-gray-50 rounded-2xl">
                                                        <p className="text-gray-500 text-xs sm:text-sm">Aucune viande supplémentaire disponible pour cette catégorie.</p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-h-[480px] overflow-y-auto pr-1">
                                                        {availableViandes.map(v => {
                                                            const isSelected = selectedViandes.some(item => item.id === v.id);
                                                            return (
                                                                <button
                                                                    key={v.id}
                                                                    type="button"
                                                                    onClick={() => toggleViande(v)}
                                                                    className={`p-3 sm:p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                                                                        isSelected
                                                                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                                                                            : 'border-gray-100 bg-white hover:border-gray-300'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-2.5">
                                                                        <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center border text-[10px] sm:text-xs transition-colors shrink-0 ${
                                                                            isSelected
                                                                                ? 'bg-primary border-primary text-white'
                                                                                : 'border-gray-300 bg-gray-50 text-transparent'
                                                                        }`}>
                                                                            <FaCheck />
                                                                        </div>
                                                                        <div>
                                                                            <span className="font-bold text-dark text-xs sm:text-sm block">🥩 {v.name}</span>
                                                                            <span className="text-[10px] text-gray-400">Portion extra</span>
                                                                        </div>
                                                                    </div>
                                                                    <span className="font-bold text-primary text-xs sm:text-sm bg-primary/10 px-2.5 py-1 rounded-lg shrink-0 ml-2">
                                                                        +{v.price} DA
                                                                    </span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* ================= STEP 3: SUPPLEMENTS PAR CATEGORIE ================= */}
                                        {currentStep === 3 && (
                                            <div className="space-y-4 sm:space-y-6">
                                                <div>
                                                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-heading text-dark flex items-center gap-2">
                                                        3. Suppléments & Fromages 🧀
                                                    </h2>
                                                    <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                                                        Chaque plat a ses suppléments dédiés au meilleur prix. Choisissez vos extras !
                                                    </p>
                                                </div>

                                                {/* Subcategory Filter Tabs (Pizza, Burger, Sandwich, Plat, etc.) */}
                                                <div className="flex overflow-x-auto gap-1.5 sm:gap-2 pb-1 scrollbar-hide">
                                                    {supplementCategoryTabs.map(tab => (
                                                        <button
                                                            key={tab.id}
                                                            type="button"
                                                            onClick={() => setSupplementCategoryFilter(tab.id)}
                                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                                                                supplementCategoryFilter === tab.id
                                                                    ? 'bg-primary text-white shadow-sm'
                                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                            }`}
                                                        >
                                                            <span>{tab.name}</span>
                                                        </button>
                                                    ))}
                                                </div>

                                                {filteredSupplements.length === 0 ? (
                                                    <div className="text-center py-10 bg-gray-50 rounded-2xl">
                                                        <p className="text-gray-500 text-xs sm:text-sm">Aucun supplément disponible dans cette catégorie.</p>
                                                        <button
                                                            onClick={() => setSupplementCategoryFilter('all')}
                                                            className="mt-2 text-xs text-primary font-bold hover:underline"
                                                        >
                                                            Voir tous les suppléments
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-h-[480px] overflow-y-auto pr-1">
                                                        {filteredSupplements.map(s => {
                                                            const isSelected = selectedSupplements.some(item => item.id === s.id);
                                                            return (
                                                                <button
                                                                    key={s.id}
                                                                    type="button"
                                                                    onClick={() => toggleSupplement(s)}
                                                                    className={`p-3 sm:p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                                                                        isSelected
                                                                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                                                                            : 'border-gray-100 bg-white hover:border-gray-300'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-2.5">
                                                                        <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center border text-[10px] sm:text-xs transition-colors shrink-0 ${
                                                                            isSelected
                                                                                ? 'bg-primary border-primary text-white'
                                                                                : 'border-gray-300 bg-gray-50 text-transparent'
                                                                        }`}>
                                                                            <FaCheck />
                                                                        </div>
                                                                        {s.image && getDishThumbnail(s.image) ? (
                                                                            <img
                                                                                src={getDishThumbnail(s.image)!}
                                                                                alt={s.name}
                                                                                className="w-10 h-10 rounded-xl object-cover border border-gray-100 shrink-0"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-lg shrink-0 border border-orange-100">
                                                                                🧀
                                                                            </div>
                                                                        )}
                                                                        <div className="min-w-0">
                                                                            <span className="font-bold text-dark text-xs sm:text-sm block truncate">{s.name}</span>
                                                                            <span className="text-[10px] text-gray-400 truncate block">
                                                                                {s.description || `Supplément ${s.category !== 'all' ? s.category : ''}`}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <span className="font-bold text-primary text-xs sm:text-sm bg-primary/10 px-2.5 py-1 rounded-lg shrink-0 ml-2">
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
                                            <div className="space-y-4 sm:space-y-6">
                                                <div>
                                                    <div className="flex items-center justify-between">
                                                        <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-heading text-dark flex items-center gap-2">
                                                            4. Sauces (3 max) 🥫
                                                        </h2>
                                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                                            selectedSauces.length === 3
                                                                ? 'bg-orange-100 text-orange-600'
                                                                : 'bg-green-100 text-green-700'
                                                        }`}>
                                                            {selectedSauces.length} / 3
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                                                        Sélectionnez jusqu'à 3 sauces gratuites.
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 max-h-[480px] overflow-y-auto pr-1">
                                                    {availableSauces.map(sa => {
                                                        const isSelected = selectedSauces.some(item => item.id === sa.id);
                                                        return (
                                                            <button
                                                                key={sa.id}
                                                                type="button"
                                                                onClick={() => toggleSauce(sa)}
                                                                className={`p-3 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1 ${
                                                                    isSelected
                                                                        ? 'border-primary bg-primary text-white font-bold shadow-sm scale-[1.02]'
                                                                        : 'border-gray-100 bg-white hover:border-gray-300 text-gray-700'
                                                                }`}
                                                            >
                                                                <span className="text-base sm:text-lg">🥫</span>
                                                                <span className="text-xs font-semibold truncate w-full">{sa.name.replace('Sauce ', '')}</span>
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
                                            <div className="space-y-4 sm:space-y-6">
                                                <div className="text-center">
                                                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-2xl sm:text-3xl mx-auto mb-2 shadow-inner">
                                                        <FaCheck />
                                                    </div>
                                                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-heading text-dark">
                                                        Votre Plat est Prêt ! 🎉
                                                    </h2>
                                                    <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                                                        Vérifiez votre commande avant d'envoyer sur WhatsApp.
                                                    </p>
                                                </div>

                                                {/* Receipt Card */}
                                                <div className="bg-gray-50 border border-gray-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-3">
                                                    <h4 className="font-bold text-gray-800 border-b border-gray-200 pb-2.5 flex items-center justify-between text-xs sm:text-sm">
                                                        <span>📋 Récapitulatif</span>
                                                        <span className="text-xs text-gray-400">{siteName}</span>
                                                    </h4>

                                                    {/* Base dish line */}
                                                    <div className="flex items-center justify-between text-xs sm:text-sm py-1 border-b border-gray-200/60 font-bold text-dark">
                                                        <div className="flex items-center gap-1.5 truncate">
                                                            <span>🍽️ {selectedDish?.name}</span>
                                                        </div>
                                                        <span className="shrink-0">{selectedDish?.price} DA</span>
                                                    </div>

                                                    {/* Extra meats */}
                                                    {selectedViandes.map(v => (
                                                        <div key={v.id} className="flex justify-between text-xs text-gray-600 pl-3">
                                                            <span>🥩 Extra {v.name}</span>
                                                            <span className="font-semibold text-primary">+{v.price} DA</span>
                                                        </div>
                                                    ))}

                                                    {/* Supplements */}
                                                    {selectedSupplements.map(s => (
                                                        <div key={s.id} className="flex justify-between text-xs text-gray-600 pl-3">
                                                            <span>🧀 {s.name}</span>
                                                            <span className="font-semibold text-primary">+{s.price} DA</span>
                                                        </div>
                                                    ))}

                                                    {/* Sauces */}
                                                    {selectedSauces.length > 0 && (
                                                        <div className="flex justify-between text-xs text-gray-600 pl-3">
                                                            <span className="truncate">🥫 {selectedSauces.map(s => s.name.replace('Sauce ', '')).join(', ')}</span>
                                                            <span className="font-semibold text-green-600 shrink-0">Gratuit</span>
                                                        </div>
                                                    )}

                                                    {/* Special Instructions Input */}
                                                    <div className="pt-2.5 border-t border-gray-200">
                                                        <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                                                            <FaStickyNote className="text-yellow-500" />
                                                            Notes / Instructions (Optionnel) :
                                                        </label>
                                                        <input
                                                            type="text"
                                                            placeholder="Ex: Sans oignons, bien cuit..."
                                                            value={specialNote}
                                                            onChange={(e) => setSpecialNote(e.target.value)}
                                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                        />
                                                    </div>

                                                    {/* Total Line */}
                                                    <div className="pt-3 border-t-2 border-gray-300 flex justify-between items-center text-base sm:text-lg font-black font-heading text-dark">
                                                        <span>TOTAL</span>
                                                        <span className="text-xl sm:text-2xl text-primary">{calculateTotal()} DA</span>
                                                    </div>
                                                </div>

                                                {/* WhatsApp Order Button */}
                                                <button
                                                    onClick={sendWhatsAppOrder}
                                                    className="w-full bg-green-500 hover:bg-green-600 text-white py-3.5 sm:py-4 px-4 rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-2.5 transition-all transform hover:scale-[1.01] shadow-lg shadow-green-500/20"
                                                >
                                                    <FaWhatsapp className="text-2xl sm:text-3xl" />
                                                    <span>Commander sur WhatsApp ({calculateTotal()} DA)</span>
                                                </button>
                                            </div>
                                        )}

                                    </motion.div>
                                </AnimatePresence>

                                {/* Navigation Prev / Next Buttons */}
                                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center mt-auto">
                                    <button
                                        onClick={goPrev}
                                        disabled={currentStep === 1}
                                        className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all ${
                                            currentStep === 1
                                                ? 'opacity-0 invisible pointer-events-none'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        <FaArrowLeft /> Précédent
                                    </button>

                                    {currentStep < 5 && (
                                        <button
                                            onClick={goNext}
                                            className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 bg-dark text-white hover:bg-gray-800 transition-all shadow-md"
                                        >
                                            {currentStep === 1 ? 'Personnaliser' : 'Étape suivante'}{' '}
                                            <FaArrowRight />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </section>
            )}

            {/* MOBILE FLOATING BOTTOM BAR (Always clean and accessible on phones) */}
            {!loading && selectedDish && (
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-dark/95 backdrop-blur-md border-t border-white/10 p-3 px-4 flex items-center justify-between text-white lg:hidden shadow-2xl">
                    <div
                        onClick={() => setShowMobileDetails(true)}
                        className="flex items-center gap-2 cursor-pointer max-w-[55%]"
                    >
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-base shrink-0">
                            {selectedDish.category_icon || '🍽️'}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                                {selectedDish.name}
                                <span className="text-[9px] text-yellow-400 font-bold">📋 Détails</span>
                            </p>
                            <p className="text-sm font-black font-heading text-yellow-400">
                                {calculateTotal()} DA
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {currentStep < 5 ? (
                            <button
                                onClick={goNext}
                                className="bg-primary hover:bg-red-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5"
                            >
                                <span>{currentStep === 1 ? 'Composer' : 'Suivant'}</span>
                                <FaArrowRight />
                            </button>
                        ) : (
                            <button
                                onClick={sendWhatsAppOrder}
                                className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-md flex items-center gap-1.5"
                            >
                                <FaWhatsapp className="text-base" />
                                <span>Commander</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* MOBILE DETAILS SLIDE-UP DRAWER */}
            <AnimatePresence>
                {showMobileDetails && selectedDish && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end lg:hidden"
                        onClick={() => setShowMobileDetails(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto space-y-4 shadow-2xl"
                        >
                            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                                    <FaReceipt className="text-primary" /> Détails de votre composition
                                </h3>
                                <button
                                    onClick={() => setShowMobileDetails(false)}
                                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between font-bold py-1 border-b border-gray-100">
                                    <span>🍽️ {selectedDish.name}</span>
                                    <span>{selectedDish.price} DA</span>
                                </div>
                                {selectedViandes.map(v => (
                                    <div key={v.id} className="flex justify-between text-gray-600 pl-3">
                                        <span>🥩 Extra {v.name}</span>
                                        <span className="text-primary font-bold">+{v.price} DA</span>
                                    </div>
                                ))}
                                {selectedSupplements.map(s => (
                                    <div key={s.id} className="flex justify-between text-gray-600 pl-3">
                                        <span>🧀 {s.name}</span>
                                        <span className="text-primary font-bold">+{s.price} DA</span>
                                    </div>
                                ))}
                                {selectedSauces.length > 0 && (
                                    <div className="flex justify-between text-gray-600 pl-3">
                                        <span>🥫 Sauces: {selectedSauces.map(s => s.name.replace('Sauce ', '')).join(', ')}</span>
                                        <span className="text-green-600 font-bold">Gratuit</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-3 border-t-2 border-gray-200 flex justify-between items-center text-lg font-black font-heading">
                                <span>TOTAL ESTIMÉ</span>
                                <span className="text-primary">{calculateTotal()} DA</span>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => { setShowMobileDetails(false); setCurrentStep(1); }}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold text-xs"
                                >
                                    Changer de plat
                                </button>
                                <button
                                    onClick={() => { setShowMobileDetails(false); setCurrentStep(5); }}
                                    className="flex-1 bg-primary hover:bg-red-600 text-white py-3 rounded-xl font-bold text-xs"
                                >
                                    Valider commande
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
