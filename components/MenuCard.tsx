// components/MenuCard.tsx
'use client';

import { useState, useEffect } from 'react';
import { FaPhoneAlt } from 'react-icons/fa';

interface MenuItem {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    category_name: string;
    category_icon: string;
    is_available: number;
    is_popular: number;
}

interface MenuCardProps {
    item: MenuItem;
    index: number;
}

export default function MenuCard({ item, index }: MenuCardProps) {
    const [phone, setPhone] = useState('0542017560');

    useEffect(() => {
        fetch('/api/public-settings')
            .then(res => res.json())
            .then(data => {
                if (data.phone) setPhone(data.phone);
            })
            .catch(() => { });
    }, []);

    const callToOrder = () => {
        window.open(`tel:${phone.replace(/[^\d+]/g, '')}`, '_self');
    };

    return (
        <div
            className={`card-menu group animate-fadeIn ${!item.is_available ? 'opacity-75' : ''}`}
            style={{ animationDelay: `${index * 100}ms` }}
        >
            {/* Image */}
            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-orange-100 to-yellow-50">
                <div className="absolute inset-0 flex items-center justify-center 
                        group-hover:scale-110 transition-transform duration-500">
                    {item.image ? (
                        <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-7xl">{item.category_icon || '🍽️'}</span>
                    )}
                </div>

                {item.is_popular === 1 && (
                    <span className="badge-popular">
                        🔥 Populaire
                    </span>
                )}

                {!item.is_available && (
                    <div className="badge-unavailable">
                        ⚠️ Indisponible
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-dark font-heading group-hover:text-primary transition-colors">
                        {item.name}
                    </h3>
                    <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-sm whitespace-nowrap ml-2">
                        {item.price} DA
                    </span>
                </div>

                <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                    {item.description}
                </p>

                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                        {item.category_icon} {item.category_name}
                    </span>

                    {item.is_available ? (
                        <button
                            onClick={callToOrder}
                            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 
                         text-white px-4 py-2 rounded-full text-sm font-medium 
                         transition-all duration-300 hover:shadow-lg hover:shadow-green-500/30"
                        >
                            <FaPhoneAlt />
                            Appeler
                        </button>
                    ) : (
                        <span className="text-sm text-gray-400 italic">Non disponible</span>
                    )}
                </div>
            </div>
        </div>
    );
}