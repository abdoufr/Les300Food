// components/Navbar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaBars, FaTimes, FaFire } from 'react-icons/fa';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const [siteName, setSiteName] = useState(process.env.NEXT_PUBLIC_SITE_NAME || '300FOOD');

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);

        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/public-settings');
                const data = await res.json();
                if (data.site_name) setSiteName(data.site_name);
            } catch (error) {}
        };
        fetchSettings();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
                ? 'bg-white/95 backdrop-blur-md shadow-lg py-2'
                : 'bg-transparent py-4'
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <span className="text-3xl group-hover:animate-bounce">🍔</span>
                        <span className={`text-2xl font-bold font-heading transition-colors duration-300 ${scrolled ? 'text-dark' : 'text-white'
                            }`}>
                            {siteName}
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link href="/" className={`font-medium hover:text-primary transition-colors ${scrolled ? 'text-gray-700' : 'text-white'
                            }`}>
                            Accueil
                        </Link>
                        <Link href="/menu" className={`font-medium hover:text-primary transition-colors ${scrolled ? 'text-gray-700' : 'text-white'
                            }`}>
                            Menu
                        </Link>
                        <Link href="/#contact" className={`font-medium hover:text-primary transition-colors ${scrolled ? 'text-gray-700' : 'text-white'
                            }`}>
                            Contact
                        </Link>
                        <Link href="/menu" className="btn-primary flex items-center gap-2">
                            <FaFire className="text-yellow-300" />
                            Commander
                        </Link>
                    </div>

                    {/* Mobile Toggle */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={`md:hidden text-2xl transition-colors ${scrolled ? 'text-dark' : 'text-white'
                            }`}
                    >
                        {isOpen ? <FaTimes /> : <FaBars />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isOpen && (
                    <div className="md:hidden mt-4 pb-4 animate-slideUp">
                        <div className="glass-card p-4 space-y-3">
                            <Link href="/" onClick={() => setIsOpen(false)}
                                className="block px-4 py-2 rounded-lg hover:bg-primary/10 text-dark font-medium">
                                🏠 Accueil
                            </Link>
                            <Link href="/menu" onClick={() => setIsOpen(false)}
                                className="block px-4 py-2 rounded-lg hover:bg-primary/10 text-dark font-medium">
                                📋 Menu
                            </Link>
                            <Link href="/#contact" onClick={() => setIsOpen(false)}
                                className="block px-4 py-2 rounded-lg hover:bg-primary/10 text-dark font-medium">
                                📞 Contact
                            </Link>
                            <Link href="/menu" onClick={() => setIsOpen(false)}
                                className="btn-primary block text-center">
                                🔥 Commander
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}