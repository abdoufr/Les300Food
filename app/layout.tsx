// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
    title: 'BurgerZone - Le Meilleur FastFood',
    description: 'Découvrez nos délicieux burgers, pizzas, tacos et plus encore! Commandez en ligne maintenant.',
    keywords: 'fastfood, burger, pizza, tacos, restaurant, commande en ligne',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="fr">
            <body>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 3000,
                        style: {
                            background: '#1A1A2E',
                            color: '#fff',
                            borderRadius: '12px',
                        },
                        success: { iconTheme: { primary: '#FF6B35', secondary: '#fff' } },
                        error: { iconTheme: { primary: '#E94560', secondary: '#fff' } },
                    }}
                />
                {children}
            </body>
        </html>
    );
}