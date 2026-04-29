'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SocialLinks, { ContactInfo } from './SocialLinks';
import { FaHeart } from 'react-icons/fa';

export default function Footer() {
    const [siteName, setSiteName] = useState(process.env.NEXT_PUBLIC_SITE_NAME || '300FOOD');
    const [phone, setPhone] = useState(process.env.NEXT_PUBLIC_PHONE || '');

    useEffect(() => {
        fetch('/api/public-settings')
            .then(res => res.json())
            .then(data => {
                if (data.site_name) setSiteName(data.site_name);
                if (data.phone) setPhone(data.phone);
            })
            .catch(() => { });
    }, []);

    return (
        <footer id="contact" className="bg-dark text-white">
            {/* CTA Section */}
            <div className="bg-gradient-to-r from-primary to-accent py-16">
                <div className="max-w-4xl mx-auto text-center px-4">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 font-heading">
                        Vous avez faim? 😋
                    </h2>
                    <p className="text-xl text-white/90 mb-8">
                        Commandez maintenant et profitez de nos délicieux plats!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/menu" className="bg-white text-primary px-8 py-4 rounded-full 
                                          font-bold text-lg hover:bg-gray-100 transition-all 
                                          duration-300 hover:shadow-xl">
                            📋 Voir le Menu
                        </Link>
                        <a
                            href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                            className="bg-green-500 text-white px-8 py-4 rounded-full 
                         font-bold text-lg hover:bg-green-600 transition-all 
                         duration-300 hover:shadow-xl"
                        >
                            📞 Appeler pour commander
                        </a>
                    </div>
                </div>
            </div>

            {/* Footer Content */}
            <div className="max-w-7xl mx-auto px-4 py-16">
                <div className="grid md:grid-cols-3 gap-12">
                    {/* Brand */}
                    <div className="text-center md:text-left">
                        <div className="flex items-center gap-2 justify-center md:justify-start mb-4">
                            <span className="text-4xl">🍔</span>
                            <span className="text-2xl font-bold font-heading">{siteName}</span>
                        </div>
                        <p className="text-gray-400 leading-relaxed">
                            Le meilleur fastfood de la ville! Des ingrédients frais,
                            des recettes savoureuses et un service rapide.
                        </p>
                    </div>

                    {/* Links */}
                    <div className="text-center">
                        <h3 className="text-lg font-bold mb-4 text-primary">Liens Rapides</h3>
                        <div className="space-y-2">
                            <Link href="/" className="block text-gray-400 hover:text-primary transition-colors">
                                Accueil
                            </Link>
                            <Link href="/menu" className="block text-gray-400 hover:text-primary transition-colors">
                                Notre Menu
                            </Link>
                            <Link href="/#contact" className="block text-gray-400 hover:text-primary transition-colors">
                                Contact
                            </Link>
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="text-center md:text-right">
                        <h3 className="text-lg font-bold mb-4 text-primary">Contact</h3>
                        <ContactInfo />
                    </div>
                </div>

                {/* Social Links */}
                <div className="mt-12 pt-8 border-t border-gray-800">
                    <h3 className="text-center text-lg font-bold mb-6 text-primary">
                        Suivez-nous sur les réseaux sociaux
                    </h3>
                    <SocialLinks />
                </div>

                {/* Copyright */}
                <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
                    <p className="flex items-center justify-center gap-1">
                        © {new Date().getFullYear()} {siteName}. Fait avec
                        <FaHeart className="text-accent" />
                        Tous droits réservés.
                    </p>
                </div>
            </div>
        </footer>
    );
}