// components/SettingsManager.tsx
'use client';

import { useState, useEffect } from 'react';
import { FaSave, FaStore, FaPhone, FaMapMarkerAlt, FaWhatsapp, FaFacebook, FaInstagram, FaTiktok } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface SettingsManagerProps {
    token: string;
}

export default function SettingsManager({ token }: SettingsManagerProps) {
    const [settings, setSettings] = useState({
        site_name: '',
        phone: '',
        address: '',
        whatsapp: '',
        facebook: '',
        instagram: '',
        tiktok: '',
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                setSettings(data);
                setLoading(false);
            } catch (error) {
                toast.error('Erreur de chargement');
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            });
            const result = await res.json();
            if (result.success) {
                toast.success('Informations enregistrées !');
                // Optionnel: recharger la page pour mettre à jour le header admin si besoin
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error('Erreur');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Chargement des paramètres...</div>;

    return (
        <form onSubmit={handleSave} className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold font-heading text-dark mb-6 flex items-center gap-2">
                    <FaStore className="text-primary" /> Informations du FastFood
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'enseigne</label>
                        <input
                            type="text"
                            className="input-field"
                            value={settings.site_name}
                            onChange={(e) => setSettings({...settings, site_name: e.target.value})}
                            placeholder="Ex: 300FOOD"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                        <div className="relative">
                            <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                className="input-field pl-10"
                                value={settings.phone}
                                onChange={(e) => setSettings({...settings, phone: e.target.value})}
                                placeholder="+213 ..."
                            />
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                        <div className="relative">
                            <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                className="input-field pl-10"
                                value={settings.address}
                                onChange={(e) => setSettings({...settings, address: e.target.value})}
                                placeholder="Adresse complète"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold font-heading text-dark mb-6 flex items-center gap-2">
                    <FaWhatsapp className="text-green-500" /> Réseaux Sociaux & Contact
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Numéro WhatsApp (sans +)</label>
                        <div className="relative">
                            <FaWhatsapp className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                className="input-field pl-10"
                                value={settings.whatsapp}
                                onChange={(e) => setSettings({...settings, whatsapp: e.target.value})}
                                placeholder="Ex: 213600000000"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Facebook (URL)</label>
                        <div className="relative">
                            <FaFacebook className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                className="input-field pl-10"
                                value={settings.facebook}
                                onChange={(e) => setSettings({...settings, facebook: e.target.value})}
                                placeholder="https://facebook.com/..."
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Instagram (URL)</label>
                        <div className="relative">
                            <FaInstagram className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                className="input-field pl-10"
                                value={settings.instagram}
                                onChange={(e) => setSettings({...settings, instagram: e.target.value})}
                                placeholder="https://instagram.com/..."
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">TikTok (URL)</label>
                        <div className="relative">
                            <FaTiktok className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                className="input-field pl-10"
                                value={settings.tiktok}
                                onChange={(e) => setSettings({...settings, tiktok: e.target.value})}
                                placeholder="https://tiktok.com/@..."
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button type="submit" className="btn-primary flex items-center gap-2 px-12 py-4 text-lg">
                    <FaSave /> Enregistrer tous les changements
                </button>
            </div>
        </form>
    );
}
