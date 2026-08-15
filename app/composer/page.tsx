// app/composer/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import toast from 'react-hot-toast';
import { FaWhatsapp, FaArrowRight, FaArrowLeft, FaUndoAlt, FaCheck } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface Ingredient {
    id: number;
    name: string;
    price: number;
    category: string;
    subcategory: string;
    is_available: number;
}

export default function ComposerPage() {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<'sandwich' | 'pizza' | 'tacos' | 'burger' | 'crepe'>('sandwich');
    
    const [categoryBasePrices, setCategoryBasePrices] = useState<{ [key: string]: number }>({
        pizza: 300,
        sandwich: 150,
        burger: 200,
        tacos: 200,
        crepe: 250
    });

    // Wizard step state
    const [currentStep, setCurrentStep] = useState(1); // 1: Base, 2: Viandes, 3: Supplements, 4: Sauces, 5: Recap

    // Selection state
    const [selectedBase, setSelectedBase] = useState<Ingredient | null>(null);
    const [selectedViandes, setSelectedViandes] = useState<Ingredient[]>([]);
    const [selectedSupplements, setSelectedSupplements] = useState<Ingredient[]>([]);
    const [selectedSauces, setSelectedSauces] = useState<Ingredient[]>([]);

    const [whatsapp, setWhatsapp] = useState('');
    const [siteName, setSiteName] = useState('300FOOD');

    // Fetch ingredients & settings
    const loadData = useCallback(async () => {
        try {
            const ingRes = await fetch('/api/ingredients');
            const ingData = await ingRes.json();
            if (Array.isArray(ingData)) {
                setIngredients(ingData.filter(i => i.is_available === 1));
            }

            const settingsRes = await fetch('/api/public-settings');
            const settingsData = await settingsRes.json();
            if (settingsData.whatsapp) setWhatsapp(settingsData.whatsapp);
            if (settingsData.site_name) setSiteName(settingsData.site_name);
            
            setCategoryBasePrices({
                pizza: parseInt(settingsData.base_price_pizza || '300'),
                sandwich: parseInt(settingsData.base_price_sandwich || '150'),
                burger: parseInt(settingsData.base_price_burger || '200'),
                tacos: parseInt(settingsData.base_price_tacos || '200'),
                crepe: parseInt(settingsData.base_price_crepe || '250'),
            });
            
            setLoading(false);
        } catch (error) {
            console.error(error);
            toast.error('Erreur de chargement des données');
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Filter ingredients based on current selected category
    const catIngredients = ingredients.filter(i => i.category === selectedCategory);
    const bases = catIngredients.filter(i => i.subcategory === 'base');
    const viandes = catIngredients.filter(i => i.subcategory === 'viande');
    const supplements = catIngredients.filter(i => i.subcategory === 'supplement');
    const sauces = catIngredients.filter(i => i.subcategory === 'sauce');

    // Reset selection when category changes
    useEffect(() => {
        if (bases.length > 0) {
            setSelectedBase(bases[0]);
        } else {
            setSelectedBase(null);
        }
        setSelectedViandes([]);
        setSelectedSupplements([]);
        setSelectedSauces([]);
        setCurrentStep(1); // Return to step 1
    }, [selectedCategory, ingredients]); // React on ingredients load too

    // Calculate total price: Category Base Price + Base extra + Viandes + Supplements + Sauces
    const calculateTotal = () => {
        let total = categoryBasePrices[selectedCategory] || 0;
        if (selectedBase) total += selectedBase.price;
        selectedViandes.forEach(v => total += v.price);
        selectedSupplements.forEach(s => total += s.price);
        selectedSauces.forEach(sa => total += sa.price);
        return total;
    };

    const toggleViande = (viande: Ingredient) => {
        setSelectedViandes(prev => prev.find(v => v.id === viande.id) ? prev.filter(v => v.id !== viande.id) : [...prev, viande]);
    };

    const toggleSupplement = (supp: Ingredient) => {
        setSelectedSupplements(prev => prev.find(s => s.id === supp.id) ? prev.filter(s => s.id !== supp.id) : [...prev, supp]);
    };

    const toggleSauce = (sauce: Ingredient) => {
        setSelectedSauces(prev => {
            if (prev.find(s => s.id === sauce.id)) return prev.filter(s => s.id !== sauce.id);
            if (prev.length >= 3) { toast.error('Maximum 3 sauces par plat'); return prev; }
            return [...prev, sauce];
        });
    };

    const sendWhatsAppOrder = () => {
        const categoryLabels: { [key: string]: string } = {
            sandwich: '🥪 SANDWICH CUSTOM',
            pizza: '🍕 PIZZA CUSTOM',
            tacos: '🌮 TACOS CUSTOM',
            burger: '🍔 BURGER CUSTOM',
            crepe: '🥞 CRÊPE CUSTOM'
        };

        const basePrice = categoryBasePrices[selectedCategory] || 0;

        let message = `Bonjour ${siteName} ! Je souhaite commander un plat personnalisé :\n\n`;
        message += `${categoryLabels[selectedCategory]}\n`;
        message += `💰 Prix de départ (${selectedCategory}) : ${basePrice} DA\n`;
        if (selectedBase) message += `🥖 Base : ${selectedBase.name}${selectedBase.price > 0 ? ` (+${selectedBase.price} DA)` : ''}\n`;

        if (selectedViandes.length > 0) message += `🥩 Viandes / Garnitures : ${selectedViandes.map(v => `${v.name} (+${v.price} DA)`).join(', ')}\n`;
        if (selectedSupplements.length > 0) message += `🧀 Suppléments : ${selectedSupplements.map(s => `${s.name} (+${s.price} DA)`).join(', ')}\n`;
        if (selectedSauces.length > 0) message += `成分 Sauces : ${selectedSauces.map(s => s.name).join(', ')}\n`;

        message += `\n💰 PRIX TOTAL : ${calculateTotal()} DA\n`;
        message += `Merci de valider ma commande !`;

        const whatsappNumber = whatsapp || process.env.NEXT_PUBLIC_WHATSAPP || '213600000000';
        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const steps = [
        { id: 1, title: 'Base', hasData: bases.length > 0 },
        { id: 2, title: 'Viandes', hasData: viandes.length > 0 },
        { id: 3, title: 'Suppléments', hasData: supplements.length > 0 },
        { id: 4, title: 'Sauces', hasData: sauces.length > 0 },
        { id: 5, title: 'Récapitulatif', hasData: true }
    ].filter(s => s.hasData);

    const actualStepIndex = steps.findIndex(s => s.id === currentStep);
    const isLastStep = actualStepIndex === steps.length - 1;

    const goNext = () => {
        if (!isLastStep) setCurrentStep(steps[actualStepIndex + 1].id);
    };

    const goPrev = () => {
        if (actualStepIndex > 0) setCurrentStep(steps[actualStepIndex - 1].id);
    };

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            
            {/* Header Banner */}
            <section className="bg-dark pt-24 pb-8 px-4 text-center text-white">
                <div className="max-w-4xl mx-auto">
                    <span className="text-secondary font-semibold text-xs uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">
                        👨‍🍳 Customizer 3000
                    </span>
                    <h1 className="text-3xl md:text-5xl font-black mt-4 font-heading">
                        Composez votre <span className="text-primary">Plat de Rêve</span>
                    </h1>
                </div>
            </section>

            {loading ? (
                <div className="text-center py-24 flex-1 flex flex-col items-center justify-center">
                    <div className="text-6xl animate-bounce mb-4">🍕</div>
                    <p className="text-gray-500 text-lg">Chargement de l'atelier...</p>
                </div>
            ) : (
                <section className="py-8 px-4 max-w-6xl mx-auto w-full flex-1 flex flex-col">
                    
                    {/* Category Tabs */}
                    <div className="flex overflow-x-auto gap-3 pb-4 mb-6 scrollbar-hide snap-x justify-center">
                        {[
                            { id: 'sandwich', name: 'Sandwich', icon: '🥪' },
                            { id: 'pizza', name: 'Pizza', icon: '🍕' },
                            { id: 'burger', name: 'Burger', icon: '🍔' },
                            { id: 'crepe', name: 'Crêpe', icon: '🥞' },
                            { id: 'tacos', name: 'Tacos', icon: '🌮' }
                        ].map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id as any)}
                                className={`snap-center shrink-0 flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
                                    selectedCategory === cat.id 
                                        ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                                        : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                                }`}
                            >
                                <span className="text-xl">{cat.icon}</span>
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1">
                        
                        {/* LEFT COLUMN: Summary & Live Price (Sticky) */}
                        <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex flex-col sticky top-24 z-10 space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                    <span className="text-2xl">
                                        {selectedCategory === 'sandwich' && '🥪'}
                                        {selectedCategory === 'pizza' && '🍕'}
                                        {selectedCategory === 'burger' && '🍔'}
                                        {selectedCategory === 'crepe' && '🥞'}
                                        {selectedCategory === 'tacos' && '🌮'}
                                    </span> 
                                    Votre Composition
                                </h3>
                                <button 
                                    onClick={() => {
                                        setSelectedViandes([]); setSelectedSupplements([]); setSelectedSauces([]);
                                        setCurrentStep(1);
                                        toast.success('Réinitialisé');
                                    }}
                                    className="text-gray-400 hover:text-red-500 transition-colors text-xs flex items-center gap-1 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100"
                                >
                                    <FaUndoAlt /> Réinitialiser
                                </button>
                            </div>

                            {/* Selections summary card */}
                            <div className="bg-gradient-to-br from-dark to-gray-900 rounded-2xl p-5 text-white shadow-inner space-y-3">
                                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                                    <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Prix de départ ({selectedCategory})</span>
                                    <span className="font-bold text-yellow-400 text-sm">{categoryBasePrices[selectedCategory] || 0} DA</span>
                                </div>

                                <div className="space-y-2.5">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-400">🥖 Base / Pain:</span>
                                        <span className="font-semibold text-right max-w-[200px] truncate">
                                            {selectedBase ? `${selectedBase.name}${selectedBase.price > 0 ? ` (+${selectedBase.price} DA)` : ''}` : 'Aucune'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-400">🥩 Viandes:</span>
                                        <span className="font-semibold text-right max-w-[200px] truncate">
                                            {selectedViandes.length > 0 ? selectedViandes.map(v => v.name).join(', ') : 'Aucune'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-400">🧀 Suppléments:</span>
                                        <span className="font-semibold text-right max-w-[200px] truncate">
                                            {selectedSupplements.length > 0 ? selectedSupplements.map(s => s.name).join(', ') : 'Aucun'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-400">🥫 Sauces:</span>
                                        <span className="font-semibold text-right max-w-[200px] truncate">
                                            {selectedSauces.length > 0 ? selectedSauces.map(s => s.name).join(', ') : 'Aucune'}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-white/10 flex justify-between items-end">
                                    <div>
                                        <p className="text-[11px] text-gray-400">Total estimé</p>
                                        <motion.p key={calculateTotal()} initial={{ scale: 0.9, color: '#DE2824' }} animate={{ scale: 1, color: '#FACC15' }} className="text-3xl font-black font-heading">
                                            {calculateTotal()} DA
                                        </motion.p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Wizard Steps */}
                        <div className="lg:col-span-7 flex flex-col">
                            
                            {/* Stepper Progress */}
                            <div className="flex items-center justify-between mb-8 px-2 relative">
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full"></div>
                                {steps.map((step, idx) => (
                                    <div key={step.id} className="flex flex-col items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                                            currentStep === step.id ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/40 ring-4 ring-white' : 
                                            currentStep > step.id ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                            {currentStep > step.id ? <FaCheck /> : idx + 1}
                                        </div>
                                        <span className={`text-[10px] uppercase font-bold mt-2 ${currentStep === step.id ? 'text-primary' : 'text-gray-400'}`}>
                                            {step.title}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Step Content */}
                            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100 flex-1 flex flex-col">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentStep}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex-1"
                                    >
                                        
                                        {/* STEP 1: BASE */}
                                        {currentStep === 1 && (
                                            <div>
                                                <h2 className="text-2xl font-bold font-heading mb-6">Choisissez votre Base</h2>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {bases.map(b => (
                                                        <button key={b.id} onClick={() => setSelectedBase(b)}
                                                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                                                                selectedBase?.id === b.id ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-gray-100 hover:border-gray-300'
                                                            }`}
                                                        >
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="font-bold text-dark">{b.name}</span>
                                                                <span className="font-bold text-primary text-sm">{b.price === 0 ? 'Inclus' : `${b.price} DA (Base)`}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-400">Prix de base de départ</p>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* STEP 2: VIANDES */}
                                        {currentStep === 2 && (
                                            <div>
                                                <h2 className="text-2xl font-bold font-heading mb-6">Protéines & Viandes</h2>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {viandes.map(v => {
                                                        const isSelected = selectedViandes.some(item => item.id === v.id);
                                                        return (
                                                            <button key={v.id} onClick={() => toggleViande(v)}
                                                                className={`p-4 rounded-xl border-2 text-left transition-all ${
                                                                    isSelected ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-gray-100 hover:border-gray-300'
                                                                }`}
                                                            >
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="font-bold text-dark flex items-center gap-2">🥩 {v.name}</span>
                                                                    <span className="font-bold text-primary text-sm">+{v.price} DA</span>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* STEP 3: SUPPLEMENTS */}
                                        {currentStep === 3 && (
                                            <div>
                                                <h2 className="text-2xl font-bold font-heading mb-6">Suppléments & Fromages</h2>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {supplements.map(s => {
                                                        const isSelected = selectedSupplements.some(item => item.id === s.id);
                                                        return (
                                                            <button key={s.id} onClick={() => toggleSupplement(s)}
                                                                className={`p-4 rounded-xl border-2 text-left transition-all ${
                                                                    isSelected ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-gray-100 hover:border-gray-300'
                                                                }`}
                                                            >
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="font-bold text-dark flex items-center gap-2">🧀 {s.name}</span>
                                                                    <span className="font-bold text-primary text-sm">+{s.price} DA</span>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* STEP 4: SAUCES */}
                                        {currentStep === 4 && (
                                            <div>
                                                <div className="mb-6">
                                                    <h2 className="text-2xl font-bold font-heading">Sauces (3 max)</h2>
                                                    <p className="text-sm text-gray-500">Ajoutez de la saveur à votre création ! (Gratuit)</p>
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                    {sauces.map(sa => {
                                                        const isSelected = selectedSauces.some(item => item.id === sa.id);
                                                        return (
                                                            <button key={sa.id} onClick={() => toggleSauce(sa)}
                                                                className={`p-3 rounded-xl border-2 text-center transition-all ${
                                                                    isSelected ? 'border-primary bg-primary/5 ring-2 ring-primary/20 font-bold text-primary' : 'border-gray-100 hover:border-gray-300 text-gray-600'
                                                                }`}
                                                            >
                                                                <span className="text-sm">{sa.name.replace('Sauce ', '')}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* STEP 5: RECAP */}
                                        {currentStep === 5 && (
                                            <div className="flex flex-col items-center text-center">
                                                <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-4xl mb-6">
                                                    <FaCheck />
                                                </div>
                                                <h2 className="text-3xl font-black font-heading mb-2">Création Terminée !</h2>
                                                <p className="text-gray-500 mb-8">Votre {selectedCategory} est magnifique. Prêt à le dévorer ?</p>
                                                
                                                <div className="w-full bg-gray-50 p-6 rounded-2xl text-left border border-gray-100 mb-8">
                                                    <h4 className="font-bold mb-4 border-b pb-2">Récapitulatif</h4>
                                                    <ul className="space-y-2 text-sm">
                                                        <li className="flex justify-between"><span>Base: {selectedBase?.name}</span> <span>{selectedBase?.price} DA</span></li>
                                                        {selectedViandes.map(v => <li key={v.id} className="flex justify-between text-gray-600"><span>- {v.name}</span> <span>{v.price} DA</span></li>)}
                                                        {selectedSupplements.map(s => <li key={s.id} className="flex justify-between text-gray-600"><span>- {s.name}</span> <span>{s.price} DA</span></li>)}
                                                        {selectedSauces.length > 0 && <li className="flex justify-between text-gray-600"><span>- Sauces: {selectedSauces.map(s => s.name.replace('Sauce ', '')).join(', ')}</span> <span>Gratuit</span></li>}
                                                    </ul>
                                                    <div className="mt-4 pt-4 border-t flex justify-between font-bold text-lg">
                                                        <span>TOTAL</span>
                                                        <span className="text-primary">{calculateTotal()} DA</span>
                                                    </div>
                                                </div>

                                                <button onClick={sendWhatsAppOrder} className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all transform hover:scale-105 shadow-lg shadow-green-500/30">
                                                    <FaWhatsapp className="text-2xl" />
                                                    Commander sur WhatsApp
                                                </button>
                                            </div>
                                        )}
                                        
                                    </motion.div>
                                </AnimatePresence>

                                {/* Navigation Buttons */}
                                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center mt-auto">
                                    <button 
                                        onClick={goPrev} 
                                        disabled={actualStepIndex === 0}
                                        className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
                                            actualStepIndex === 0 ? 'opacity-0 invisible' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        <FaArrowLeft /> Précédent
                                    </button>
                                    
                                    {!isLastStep && (
                                        <button 
                                            onClick={goNext}
                                            className="px-8 py-3 rounded-xl font-bold flex items-center gap-2 bg-dark text-white hover:bg-gray-800 transition-all shadow-lg"
                                        >
                                            Étape suivante <FaArrowRight />
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
