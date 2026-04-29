'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaArrowRight, FaStar } from 'react-icons/fa';

export default function Hero() {
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
        <section className="relative min-h-screen flex items-center overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-dark via-gray-900 to-dark">
                <div className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FF6B35' fill-opacity='0.15'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                />
            </div>

            {/* Floating emojis */}
            <div className="absolute top-20 left-10 text-6xl animate-float opacity-30">🍔</div>
            <div className="absolute top-40 right-20 text-5xl animate-float animation-delay-200 opacity-30">🍟</div>
            <div className="absolute bottom-40 left-20 text-5xl animate-float animation-delay-400 opacity-30">🌮</div>
            <div className="absolute bottom-20 right-10 text-6xl animate-float opacity-30">🍕</div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className="text-center lg:text-left animate-slideUp">
                        <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full mb-6">
                            <FaStar className="text-yellow-400" />
                            <span className="text-sm font-semibold">Le meilleur FastFood en ville</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 font-heading leading-tight">
                            Bienvenue à{' '}
                            <span className="gradient-text">{siteName}</span>
                        </h1>

                        <p className="text-xl text-gray-300 mb-8 max-w-lg mx-auto lg:mx-0">
                            Des burgers juteux, des pizzas croustillantes et des saveurs
                            qui vous feront revenir encore et encore! 🔥
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link href="/menu" className="btn-primary text-lg flex items-center justify-center gap-2 px-8 py-4">
                                Voir le Menu
                                <FaArrowRight />
                            </Link>
                            <a
                                href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                                className="btn-secondary text-lg flex items-center justify-center gap-2 px-8 py-4"
                            >
                                📞 Appeler pour commander
                            </a>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-8 mt-12 justify-center lg:justify-start">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-primary">500+</div>
                                <div className="text-gray-400 text-sm">Clients satisfaits</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-secondary">50+</div>
                                <div className="text-gray-400 text-sm">Plats au menu</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-accent">4.8</div>
                                <div className="text-gray-400 text-sm flex items-center gap-1">
                                    <FaStar className="text-yellow-400" /> Note
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right - Big Emoji / Image */}
                    <div className="hidden lg:flex justify-center items-center">
                        <div className="relative">
                            <div className="text-[200px] animate-float select-none">🍔</div>

                        </div>
                    </div>
                </div>
            </div>

            {/* Wave bottom */}
            <div className="absolute bottom-0 left-0 right-0">
                <svg viewBox="0 0 1440 120" className="w-full">
                    <path fill="#FFF8F0" d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
                </svg>
            </div>
        </section>
    );
}