// components/AdminForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaUpload } from 'react-icons/fa';

interface Category {
    id: number;
    name: string;
    icon: string;
}

interface MenuItem {
    id?: number;
    name: string;
    description: string;
    price: number;
    category_id: number;
    image: string;
    is_available: number;
    is_popular: number;
}

interface AdminFormProps {
    item?: MenuItem | null;
    categories: Category[];
    onSave: (data: MenuItem) => void;
    onCancel: () => void;
}

export default function AdminForm({ item, categories, onSave, onCancel }: AdminFormProps) {
    const [formData, setFormData] = useState<MenuItem>({
        name: '',
        description: '',
        price: 0,
        category_id: categories[0]?.id || 1,
        image: '',
        is_available: 1,
        is_popular: 0,
    });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (item) {
            setFormData(item);
        }
    }, [item]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value
        }));
    };

    const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: checked ? 1 : 0
        }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const form = new FormData();
        form.append('file', file);

        try {
            const res = await fetch('/api/upload', { method: 'POST', body: form });
            const data = await res.json();
            if (data.url) {
                setFormData(prev => ({ ...prev, image: data.url }));
            }
        } catch (error) {
            console.error('Upload error:', error);
        }
        setUploading(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 animate-scaleIn">
            <h3 className="text-xl font-bold mb-6 font-heading text-dark">
                {item?.id ? '✏️ Modifier le plat' : '➕ Ajouter un nouveau plat'}
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
                {/* Nom */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du plat *</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="input-field"
                        placeholder="Ex: Classic Burger"
                    />
                </div>

                {/* Prix */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix (DA) *</label>
                    <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.5"
                        className="input-field"
                        placeholder="35"
                    />
                </div>

                {/* Catégorie */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                    <select
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleChange}
                        className="input-field"
                    >
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.icon} {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            name="image"
                            value={formData.image}
                            onChange={handleChange}
                            className="input-field flex-1"
                            placeholder="URL de l'image"
                        />
                        <label className="btn-primary cursor-pointer flex items-center gap-1 text-sm px-4">
                            <FaUpload />
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            {uploading ? '...' : 'Upload'}
                        </label>
                    </div>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="input-field resize-none"
                        placeholder="Description du plat..."
                    />
                </div>

                {/* Toggles */}
                <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            name="is_available"
                            checked={formData.is_available === 1}
                            onChange={handleCheckbox}
                            className="w-5 h-5 accent-primary rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">✅ Disponible</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            name="is_popular"
                            checked={formData.is_popular === 1}
                            onChange={handleCheckbox}
                            className="w-5 h-5 accent-accent rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">🔥 Populaire</span>
                    </label>
                </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
                <button type="submit" className="btn-primary flex items-center gap-2">
                    <FaSave /> {item?.id ? 'Modifier' : 'Ajouter'}
                </button>
                <button type="button" onClick={onCancel} className="btn-secondary flex items-center gap-2">
                    <FaTimes /> Annuler
                </button>
            </div>
        </form>
    );
}