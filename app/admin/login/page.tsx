// app/admin/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FaLock, FaUser, FaSignInAlt } from 'react-icons/fa';

export default function AdminLoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (data.success) {
                localStorage.setItem('admin_token', data.token);
                localStorage.setItem('admin_user', JSON.stringify(data.user));
                toast.success('Connexion réussie! 🎉');
                router.push('/admin');
            } else {
                toast.error(data.error || 'Identifiants incorrects');
            }
        } catch (error) {
            toast.error('Erreur de connexion');
        }

        setLoading(false);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-dark via-gray-900 to-dark flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <span className="text-6xl block mb-4">🍔</span>
                    <h1 className="text-3xl font-bold text-white font-heading">
                        Administration
                    </h1>
                    <p className="text-gray-400 mt-2">Connectez-vous pour gérer le menu</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="glass-card p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            <FaUser className="inline mr-2" />
                            Nom d'utilisateur
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="input-field bg-white/10 text-white border-gray-600 
                         focus:border-primary placeholder-gray-500"
                            placeholder="admin"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            <FaLock className="inline mr-2" />
                            Mot de passe
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field bg-white/10 text-white border-gray-600 
                         focus:border-primary placeholder-gray-500"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg
                       disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Connexion...
                            </>
                        ) : (
                            <>
                                <FaSignInAlt />
                                Se connecter
                            </>
                        )}
                    </button>
                </form>

                {/* Info */}
                <div className="mt-6 text-center">
                    <p className="text-gray-500 text-sm">
                        🔐 Par défaut: admin / admin123
                    </p>
                    <a href="/" className="text-primary hover:underline text-sm mt-2 block">
                        ← Retour au site
                    </a>
                </div>
            </div>
        </main>
    );
}