// components/IngredientManager.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { FaSave, FaTrash, FaEdit, FaPlus, FaTimes, FaEye, FaEyeSlash, FaSearch } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface Ingredient {
    id?: number;
    name: string;
    price: number;
    category: string;
    subcategory: string;
    is_available: number;
}

interface IngredientManagerProps {
    token: string;
}

export default function IngredientManager({ token }: IngredientManagerProps) {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingIng, setEditingIng] = useState<Ingredient | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('');
    const [filterSubcategory, setFilterSubcategory] = useState<string>('');

    const [newIng, setNewIng] = useState<Ingredient>({
        name: '',
        price: 0,
        category: 'sandwich',
        subcategory: 'base',
        is_available: 1
    });

    const categories = [
        { id: 'sandwich', name: 'Sandwich 🥪' },
        { id: 'pizza', name: 'Pizza 🍕' },
        { id: 'burger', name: 'Burger/Cheese 🍔' },
        { id: 'crepe', name: 'Crêpe 🥞' },
        { id: 'tacos', name: 'Tacos 🌮' }
    ];

    const subcategories = [
        { id: 'base', name: 'Base / Pain / Pâte' },
        { id: 'viande', name: 'Viande / Protéine' },
        { id: 'supplement', name: 'Supplément / Extra' },
        { id: 'sauce', name: 'Sauce' }
    ];

    const fetchIngredients = useCallback(async () => {
        try {
            const res = await fetch('/api/ingredients');
            const data = await res.json();
            if (Array.isArray(data)) {
                setIngredients(data);
            }
            setLoading(false);
        } catch {
            toast.error('Erreur lors de la récupération des ingrédients');
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchIngredients();
    }, [fetchIngredients]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = editingIng || newIng;
        const method = editingIng ? 'PUT' : 'POST';
        const url = editingIng ? `/api/ingredients/${editingIng.id}` : '/api/ingredients';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.success) {
                toast.success(editingIng ? 'Ingrédient modifié' : 'Ingrédient ajouté');
                setShowForm(false);
                setEditingIng(null);
                setNewIng({
                    name: '',
                    price: 0,
                    category: 'sandwich',
                    subcategory: 'base',
                    is_available: 1
                });
                fetchIngredients();
            } else {
                toast.error(result.error);
            }
        } catch {
            toast.error('Erreur serveur');
        }
    };

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Supprimer l'ingrédient "${name}" ?`)) return;
        try {
            const res = await fetch(`/api/ingredients/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) {
                toast.success('Ingrédient supprimé');
                fetchIngredients();
            } else {
                toast.error(result.error);
            }
        } catch {
            toast.error('Erreur de suppression');
        }
    };

    const toggleAvailability = async (ing: Ingredient) => {
        const newStatus = ing.is_available ? 0 : 1;
        
        // Optimistic UI update
        setIngredients(prev => prev.map(i => i.id === ing.id ? { ...i, is_available: newStatus } : i));

        try {
            const res = await fetch(`/api/ingredients/${ing.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ is_available: newStatus })
            });
            const result = await res.json();
            if (!result.success) {
                toast.error('Erreur lors de la modification de disponibilité');
                fetchIngredients();
            } else {
                toast.success(newStatus ? 'Ingrédient visible' : 'Ingrédient caché');
            }
        } catch {
            toast.error('Erreur réseau');
            fetchIngredients();
        }
    };

    const filteredIngredients = ingredients.filter(ing => {
        const matchesSearch = !searchQuery || ing.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !filterCategory || ing.category === filterCategory;
        const matchesSubcategory = !filterSubcategory || ing.subcategory === filterSubcategory;
        return matchesSearch && matchesCategory && matchesSubcategory;
    });

    if (loading) return <div className="p-8 text-center text-gray-500">Chargement des ingrédients...</div>;

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-2xl shadow-sm gap-4">
                <div>
                    <h2 className="text-xl font-bold font-heading text-dark">Gestion des Ingrédients</h2>
                    <p className="text-xs text-gray-400">Gérez les ingrédients du compositeur de sandwichs, pizzas, burgers et tacos.</p>
                </div>
                <button 
                    onClick={() => { setShowForm(true); setEditingIng(null); }}
                    className="btn-primary flex items-center gap-2"
                >
                    <FaPlus /> Nouvel Ingrédient
                </button>
            </div>

            {/* Form Drawer / Accordion */}
            {showForm && (
                <form onSubmit={handleSave} className="glass-card p-6 animate-scaleIn space-y-4">
                    <h3 className="font-bold text-lg text-dark">{editingIng ? 'Modifier' : 'Ajouter'} un ingrédient</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Nom de l&apos;ingrédient</label>
                            <input
                                type="text"
                                placeholder="Ex: Fromage Cheddar"
                                className="input-field py-2 text-sm"
                                value={editingIng ? editingIng.name : newIng.name}
                                onChange={(e) => editingIng ? setEditingIng({...editingIng, name: e.target.value}) : setNewIng({...newIng, name: e.target.value})}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Prix (DA)</label>
                            <input
                                type="number"
                                placeholder="Prix en DA (ex: 50)"
                                className="input-field py-2 text-sm"
                                value={editingIng ? editingIng.price : newIng.price}
                                onChange={(e) => editingIng ? setEditingIng({...editingIng, price: parseFloat(e.target.value)}) : setNewIng({...newIng, price: parseFloat(e.target.value)})}
                                required
                                min="0"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Catégorie de Plat</label>
                            <select
                                className="input-field py-2 text-sm"
                                value={editingIng ? editingIng.category : newIng.category}
                                onChange={(e) => editingIng ? setEditingIng({...editingIng, category: e.target.value}) : setNewIng({...newIng, category: e.target.value})}
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Sous-catégorie</label>
                            <select
                                className="input-field py-2 text-sm"
                                value={editingIng ? editingIng.subcategory : newIng.subcategory}
                                onChange={(e) => editingIng ? setEditingIng({...editingIng, subcategory: e.target.value}) : setNewIng({...newIng, subcategory: e.target.value})}
                            >
                                {subcategories.map(sub => (
                                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                        <button type="submit" className="btn-primary flex items-center gap-2 py-2 text-sm">
                            <FaSave /> Sauvegarder
                        </button>
                        <button 
                            type="button" 
                            onClick={() => { setShowForm(false); setEditingIng(null); }} 
                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full font-semibold hover:bg-gray-200 transition-colors text-sm flex items-center gap-2"
                        >
                            <FaTimes /> Annuler
                        </button>
                    </div>
                </form>
            )}

            {/* Filters */}
            <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher un ingrédient..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-field pl-10 py-2.5 text-sm"
                    />
                </div>
                
                <div className="flex flex-wrap md:flex-nowrap gap-2 w-full md:w-auto">
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="input-field py-2.5 text-sm w-full md:w-48"
                    >
                        <option value="">Tous les plats</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>

                    <select
                        value={filterSubcategory}
                        onChange={(e) => setFilterSubcategory(e.target.value)}
                        className="input-field py-2.5 text-sm w-full md:w-48"
                    >
                        <option value="">Toutes sous-catégories</option>
                        {subcategories.map(sub => (
                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Ingredients Table */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Nom</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Plat</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Type d&apos;ingrédient</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Prix</th>
                                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Disponibilité</th>
                                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredIngredients.map((ing) => (
                                <tr key={ing.id} className="hover:bg-orange-50/30 transition-colors">
                                    <td className="px-6 py-4 font-semibold text-dark">
                                        {ing.name}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="capitalize bg-orange-100 text-primary px-3 py-1 rounded-full text-xs font-medium">
                                            {categories.find(c => c.id === ing.category)?.name || ing.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {subcategories.find(s => s.id === ing.subcategory)?.name || ing.subcategory}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-primary text-sm">
                                        {ing.price === 0 ? 'Gratuit / Inclus' : `${ing.price} DA`}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => toggleAvailability(ing)}
                                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                                                ing.is_available
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                            }`}
                                        >
                                            {ing.is_available ? <><FaEye /> Visible</> : <><FaEyeSlash /> Caché</>}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingIng(ing);
                                                    setShowForm(true);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-600 hover:text-white transition-all text-xs"
                                                title="Modifier"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(ing.id!, ing.name)}
                                                className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-600 hover:text-white transition-all text-xs"
                                                title="Supprimer"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredIngredients.length === 0 && (
                    <div className="text-center py-12">
                        <span className="text-4xl block mb-2">🔍</span>
                        <p className="text-gray-500">Aucun ingrédient trouvé</p>
                    </div>
                )}
            </div>
        </div>
    );
}
