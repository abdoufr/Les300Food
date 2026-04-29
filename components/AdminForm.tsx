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
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        
        // Parse existing images
        let currentImages: string[] = [];
        try {
            currentImages = JSON.parse(formData.image || '[]');
            if (!Array.isArray(currentImages)) currentImages = formData.image ? [formData.image] : [];
        } catch {
            currentImages = formData.image ? [formData.image] : [];
        }

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const form = new FormData();
            form.append('file', file);

            try {
                const res = await fetch('/api/upload', { method: 'POST', body: form });
                const data = await res.json();
                if (data.url) {
                    currentImages.push(data.url);
                }
            } catch (error) {
                console.error('Upload error:', error);
            }
        }

        setFormData(prev => ({ ...prev, image: JSON.stringify(currentImages) }));
        setUploading(false);
    };

    const removeImage = (index: number) => {
        let currentImages: string[] = [];
        try {
            currentImages = JSON.parse(formData.image || '[]');
        } catch {
            currentImages = [];
        }
        currentImages.splice(index, 1);
        setFormData(prev => ({ ...prev, image: JSON.stringify(currentImages) }));
    };

    const getImages = () => {
        try {
            const parsed = JSON.parse(formData.image || '[]');
            return Array.isArray(parsed) ? parsed : (formData.image ? [formData.image] : []);
        } catch {
            return formData.image ? [formData.image] : [];
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const images = getImages();

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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Photos (Plusieurs possibles)</label>
                    <div className="flex gap-2 mb-2">
                        <label className="btn-primary flex-1 cursor-pointer flex items-center justify-center gap-2 text-sm py-3">
                            <FaUpload />
                            <span>{uploading ? 'Upload en cours...' : 'Ajouter des photos'}</span>
                            <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                        </label>
                    </div>
                    
                    {images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {images.map((img, idx) => (
                                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                                    <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                                    <button 
                                        type="button"
                                        onClick={() => removeImage(idx)}
                                        className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-lg hover:bg-red-600 transition-colors"
                                    >
                                        <FaTimes size={10} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
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