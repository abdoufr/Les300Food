// app/page.tsx
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { getPopularItems, getCategories, getSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
    const popularItems = await getPopularItems() as any[];
    const categories = await getCategories() as any[];
    const settings = await getSettings();
    const whatsapp = settings.whatsapp || process.env.NEXT_PUBLIC_WHATSAPP || '';

    return (
        <main>
            <Navbar />
            <Hero />

            {/* Popular Section */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="text-primary font-semibold text-sm uppercase tracking-wider">
                            ⭐ Les plus demandés
                        </span>
                        <h2 className="section-title mt-2">
                            Nos Plats <span className="gradient-text">Populaires</span>
                        </h2>
                        <p className="text-gray-500 mt-2 max-w-md mx-auto">
                            Découvrez les favoris de nos clients, préparés avec passion!
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {popularItems.map((item: any, index: number) => (
                            <div key={item.id} className="card-menu group animate-fadeIn"
                                style={{ animationDelay: `${index * 100}ms` }}>
                                <div className="relative h-40 bg-gradient-to-br from-red-50 to-yellow-50 
                                flex items-center justify-center">
                                    <span className="text-6xl group-hover:scale-125 transition-transform duration-500">
                                        {item.category_icon}
                                    </span>
                                    <span className="badge-popular">🔥 Top</span>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-dark font-heading">{item.name}</h3>
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{item.description}</p>
                                    <div className="flex justify-between items-center mt-3">
                                        <span className="text-primary font-bold text-lg">{item.price} DA</span>
                                        <a
                                            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Je voudrais commander: ${item.name} (${item.price} DA)`)}`}
                                            target="_blank"
                                            className="bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-medium 
                                 hover:bg-green-600 transition-colors"
                                        >
                                            Commander
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-10">
                        <Link href="/menu" className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2">
                            Voir tout le menu 🍽️
                        </Link>
                    </div>
                </div>
            </section>

            {/* Categories Preview */}
            <section className="py-16 px-4 bg-white">
                <div className="max-w-7xl mx-auto">
                    <h2 className="section-title mb-12">
                        Nos <span className="gradient-text">Catégories</span>
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {categories.map((cat: any, index: number) => (
                            <Link
                                key={cat.id}
                                href={`/menu?category=${cat.id}`}
                                className="group bg-gradient-to-br from-orange-50 to-white p-6 rounded-2xl 
                           text-center hover:shadow-xl transition-all duration-300 
                           hover:-translate-y-2 border border-orange-100 animate-fadeIn"
                                style={{ animationDelay: `${index * 80}ms` }}
                            >
                                <span className="text-5xl block mb-3 group-hover:scale-125 transition-transform duration-300">
                                    {cat.icon}
                                </span>
                                <span className="font-bold text-dark font-heading">{cat.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Us */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <h2 className="section-title mb-12">
                        Pourquoi <span className="gradient-text">Nous Choisir</span>?
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { emoji: '🥩', title: 'Ingrédients Frais', desc: 'Des produits frais sélectionnés chaque jour pour une qualité maximale.' },
                            { emoji: '⚡', title: 'Service Rapide', desc: 'Votre commande prête en moins de 15 minutes, sans compromis sur la qualité.' },
                            { emoji: '💰', title: 'Prix Imbattables', desc: 'Les meilleurs plats aux meilleurs prix. Le goût sans se ruiner!' },
                        ].map((feature, i) => (
                            <div key={i} className="text-center p-8 rounded-2xl bg-white shadow-md 
                                      hover:shadow-xl transition-all duration-300 
                                      hover:-translate-y-2 border border-orange-50 animate-fadeIn"
                                style={{ animationDelay: `${i * 150}ms` }}>
                                <span className="text-5xl block mb-4">{feature.emoji}</span>
                                <h3 className="text-xl font-bold mb-2 font-heading">{feature.title}</h3>
                                <p className="text-gray-500">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}