// components/CategoryManager.tsx
'use client';

import { useState } from 'react';
import { FaSave, FaTrash, FaEdit, FaPlus, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface Category {
    id: number;
    name: string;
    icon: string;
    order_index: number;
}

interface CategoryManagerProps {
    categories: Category[];
    token: string;
    onRefresh: () => void;
}

export default function CategoryManager({ categories, token, onRefresh }: CategoryManagerProps) {
    const [editingCat, setEditingCat] = useState<Category | null>(null);
    const [newCat, setNewCat] = useState({ name: '', icon: '🍽️', order_index: 0 });
    const [showForm, setShowForm] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = editingCat || newCat;
        const method = editingCat ? 'PUT' : 'POST';
        const url = editingCat ? `/api/categories/${editingCat.id}` : '/api/categories';

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
                toast.success('Catégorie enregistrée');
                setShowForm(false);
                setEditingCat(null);
                setNewCat({ name: '', icon: '🍽️', order_index: 0 });
                onRefresh();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error('Erreur');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Supprimer cette catégorie ?')) return;
        try {
            const res = await fetch(`/api/categories/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) {
                toast.success('Supprimée');
                onRefresh();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error('Erreur');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm">
                <h2 className="text-xl font-bold font-heading text-dark">Gestion des Catégories</h2>
                <button 
                    onClick={() => { setShowForm(true); setEditingCat(null); }}
                    className="btn-primary flex items-center gap-2"
                >
                    <FaPlus /> Nouvelle Catégorie
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSave} className="glass-card p-6 animate-scaleIn space-y-4">
                    <h3 className="font-bold text-lg">{editingCat ? 'Modifier' : 'Ajouter'} une catégorie</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                        <input
                            type="text"
                            placeholder="Nom (ex: Pizzas)"
                            className="input-field"
                            value={editingCat ? editingCat.name : newCat.name}
                            onChange={(e) => editingCat ? setEditingCat({...editingCat, name: e.target.value}) : setNewCat({...newCat, name: e.target.value})}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Emoji Icon (ex: 🍕)"
                            className="input-field"
                            value={editingCat ? editingCat.icon : newCat.icon}
                            onChange={(e) => editingCat ? setEditingCat({...editingCat, icon: e.target.value}) : setNewCat({...newCat, icon: e.target.value})}
                        />
                        <input
                            type="number"
                            placeholder="Ordre"
                            className="input-field"
                            value={editingCat ? editingCat.order_index : newCat.order_index}
                            onChange={(e) => editingCat ? setEditingCat({...editingCat, order_index: parseInt(e.target.value)}) : setNewCat({...newCat, order_index: parseInt(e.target.value)})}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" className="btn-primary flex items-center gap-2"><FaSave /> Sauvegarder</button>
                        <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex items-center gap-2"><FaTimes /> Annuler</button>
                    </div>
                </form>
            )}

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {categories.map(cat => (
                    <div key={cat.id} className="bg-white p-4 rounded-2xl shadow-md border border-gray-100 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">{cat.icon}</span>
                            <div>
                                <p className="font-bold text-dark">{cat.name}</p>
                                <p className="text-xs text-gray-400">Ordre: {cat.order_index}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingCat(cat); setShowForm(true); }} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg">
                                <FaEdit />
                            </button>
                            <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                                <FaTrash />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
