// app/admin/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminForm from '@/components/AdminForm';
import CategoryManager from '@/components/CategoryManager';
import SettingsManager from '@/components/SettingsManager';
import toast from 'react-hot-toast';
import {
    FaPlus, FaEdit, FaTrash, FaSignOutAlt, FaHome, FaUtensils,
    FaChartBar, FaSearch, FaEye, FaEyeSlash, FaFire, FaCheck, FaTags, FaCog
} from 'react-icons/fa';

interface MenuItem {
    id?: number;
    name: string;
    description: string;
    price: number;
    category_id: number;
    category_name?: string;
    category_icon?: string;
    image: string;
    is_available: number;
    is_popular: number;
}

interface Category {
    id: number;
    name: string;
    icon: string;
    order_index: number;
}

export default function AdminPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'items' | 'categories' | 'settings'>('items');
    const [items, setItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<number | null>(null);
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(true);

    // Check auth
    useEffect(() => {
        const storedToken = localStorage.getItem('admin_token');
        if (!storedToken) {
            router.replace('/admin/login');
        } else {
            setToken(storedToken);
        }
    }, [router]);

    // Fetch data
    const fetchData = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/menu');
            const data = await res.json();
            setItems(data.items);
            setCategories(data.categories);
            setLoading(false);
        } catch (error) {
            console.error('Error:', error);
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) fetchData();
    }, [token, fetchData]);

    // Handlers
    const handleSave = async (data: MenuItem) => {
        try {
            const url = data.id ? `/api/menu/${data.id}` : '/api/menu';
            const method = data.id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            const result = await res.json();

            if (result.success) {
                toast.success(result.message || 'Sauvegardé!');
                setShowForm(false);
                setEditingItem(null);
                fetchData();
            } else {
                toast.error(result.error || 'Erreur');
            }
        } catch (error) {
            toast.error('Erreur de sauvegarde');
        }
    };

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Supprimer "${name}" ?`)) return;

        try {
            const res = await fetch(`/api/menu/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            const result = await res.json();
            if (result.success) {
                toast.success('Plat supprimé');
                fetchData();
            }
        } catch (error) {
            toast.error('Erreur de suppression');
        }
    };

    const toggleAvailability = async (item: MenuItem) => {
        const newStatus = item.is_available ? 0 : 1;

        // Mise à jour optimiste dans l'UI
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: newStatus } : i));

        try {
            const res = await fetch(`/api/menu/${item.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ is_available: newStatus }),
            });

            const result = await res.json();
            if (result.success) {
                toast.success(newStatus ? 'Plat visible' : 'Plat caché');
            } else {
                toast.error('Erreur lors du changement de statut');
                fetchData(); // Reset en cas d'erreur
            }
        } catch (error) {
            toast.error('Erreur réseau');
            fetchData();
        }
    };

    const togglePopular = async (item: MenuItem) => {
        await handleSave({ ...item, is_popular: item.is_popular ? 0 : 1 });
    };

    const handleEdit = (item: MenuItem) => {
        setEditingItem(item);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        router.push('/admin/login');
    };

    // Filter items
    const filteredItems = items.filter(item => {
        const matchesSearch = !searchQuery ||
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !filterCategory || item.category_id === filterCategory;
        return matchesSearch && matchesCategory;
    });

    // Stats
    const stats = {
        total: items.length,
        available: items.filter(i => i.is_available).length,
        popular: items.filter(i => i.is_popular).length,
        categories: categories.length,
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-light flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl animate-bounce mb-4">🍔</div>
                    <p className="text-gray-500">Chargement...</p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50">
            {/* Admin Header */}
            <header className="bg-dark text-white shadow-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🍔</span>
                        <div>
                            <h1 className="text-lg font-bold font-heading">Admin Panel</h1>
                            <p className="text-xs text-gray-400">Gestion du menu</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <a href="/" target="_blank" className="flex items-center gap-2 text-gray-300 
                                                    hover:text-white transition-colors text-sm">
                            <FaHome /> Voir le site
                        </a>
                        <button onClick={handleLogout}
                            className="flex items-center gap-2 bg-accent/20 text-accent px-4 py-2 
                         rounded-lg hover:bg-accent hover:text-white transition-all text-sm">
                            <FaSignOutAlt /> Déconnexion
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="stat-card">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-3 rounded-xl">
                                <FaUtensils className="text-primary text-xl" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-dark">{stats.total}</p>
                                <p className="text-sm text-gray-500">Total Plats</p>
                            </div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-3 rounded-xl">
                                <FaCheck className="text-green-600 text-xl" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-dark">{stats.available}</p>
                                <p className="text-sm text-gray-500">Disponibles</p>
                            </div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="flex items-center gap-3">
                            <div className="bg-accent/10 p-3 rounded-xl">
                                <FaFire className="text-accent text-xl" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-dark">{stats.popular}</p>
                                <p className="text-sm text-gray-500">Populaires</p>
                            </div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-3 rounded-xl">
                                <FaChartBar className="text-blue-600 text-xl" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-dark">{stats.categories}</p>
                                <p className="text-sm text-gray-500">Catégories</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => setActiveTab('items')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'items'
                            ? 'bg-primary text-white shadow-lg'
                            : 'bg-white text-gray-500 hover:bg-orange-50'
                            }`}
                    >
                        <FaUtensils /> Plats
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'categories'
                            ? 'bg-primary text-white shadow-lg'
                            : 'bg-white text-gray-500 hover:bg-orange-50'
                            }`}
                    >
                        <FaTags /> Catégories
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'settings'
                            ? 'bg-primary text-white shadow-lg'
                            : 'bg-white text-gray-500 hover:bg-orange-50'
                            }`}
                    >
                        <FaCog /> Paramètres
                    </button>
                </div>

                {activeTab === 'settings' ? (
                    <SettingsManager token={token} />
                ) : activeTab === 'categories' ? (
                    <CategoryManager
                        categories={categories}
                        token={token}
                        onRefresh={fetchData}
                    />
                ) : (
                    <>
                        {/* Add Button & Form */}
                        {!showForm ? (
                            <button
                                onClick={() => { setEditingItem(null); setShowForm(true); }}
                                className="btn-primary mb-8 flex items-center gap-2 text-lg"
                            >
                                <FaPlus /> Ajouter un plat
                            </button>
                        ) : (
                            <div className="mb-8">
                                <AdminForm
                                    item={editingItem}
                                    categories={categories}
                                    onSave={handleSave}
                                    onCancel={() => { setShowForm(false); setEditingItem(null); }}
                                />
                            </div>
                        )}

                        {/* Filters */}
                        <div className="glass-card p-4 mb-6 flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="input-field pl-10"
                                />
                            </div>
                            <select
                                value={filterCategory || ''}
                                onChange={(e) => setFilterCategory(e.target.value ? parseInt(e.target.value) : null)}
                                className="input-field md:w-48"
                            >
                                <option value="">Toutes catégories</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Items Table */}
                        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Plat</th>
                                            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 hidden md:table-cell">Catégorie</th>
                                            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Prix</th>
                                            <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Statut</th>
                                            <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Populaire</th>
                                            <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredItems.map((item) => (
                                            <tr key={item.id} className="hover:bg-orange-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-2xl">{item.category_icon}</span>
                                                        <div>
                                                            <p className="font-semibold text-dark">{item.name}</p>
                                                            <p className="text-xs text-gray-400 line-clamp-1 max-w-xs">
                                                                {item.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 hidden md:table-cell">
                                                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                                                        {item.category_name}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-primary">{item.price} DA</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => toggleAvailability(item)}
                                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium
                          transition-all duration-200 ${item.is_available
                                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                            }`}
                                                    >
                                                        {item.is_available ? <><FaEye /> Visible</> : <><FaEyeSlash /> Caché</>}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => togglePopular(item)}
                                                        className={`text-lg transition-transform duration-200 hover:scale-125 ${item.is_popular ? 'text-accent' : 'text-gray-300'
                                                            }`}
                                                    >
                                                        <FaFire />
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEdit(item)}
                                                            className="bg-blue-100 text-blue-600 p-2 rounded-lg 
                                     hover:bg-blue-600 hover:text-white transition-all"
                                                            title="Modifier"
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item.id!, item.name)}
                                                            className="bg-red-100 text-red-600 p-2 rounded-lg 
                                     hover:bg-red-600 hover:text-white transition-all"
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

                            {filteredItems.length === 0 && (
                                <div className="text-center py-12">
                                    <span className="text-4xl block mb-2">🔍</span>
                                    <p className="text-gray-500">Aucun plat trouvé</p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                <p className="text-center text-gray-400 text-sm mt-4">
                    {activeTab === 'items' ? `${filteredItems.length} plat(s)` : `${categories.length} catégorie(s)`} affiché(s)
                </p>
            </div>
        </main>
    );
}