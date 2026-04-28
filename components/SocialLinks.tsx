// components/SocialLinks.tsx
'use client';

import { useState, useEffect } from 'react';
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp, FaPhoneAlt, FaMapMarkerAlt } from 'react-icons/fa';

export default function SocialLinks() {
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        fetch('/api/public-settings').then(res => res.json()).then(data => setSettings(data)).catch(() => {});
    }, []);

    // Fallback to env if API not yet loaded
    const facebook = settings?.facebook || process.env.NEXT_PUBLIC_FACEBOOK;
    const instagram = settings?.instagram || process.env.NEXT_PUBLIC_INSTAGRAM;
    const tiktok = settings?.tiktok || process.env.NEXT_PUBLIC_TIKTOK;
    const whatsapp = settings?.whatsapp || process.env.NEXT_PUBLIC_WHATSAPP;

    return (
        <div className="flex flex-wrap justify-center gap-4">
            {facebook && (
                <a href={facebook} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <FaFacebookF /> Facebook
                </a>
            )}
            {instagram && (
                <a href={instagram} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white px-5 py-3 rounded-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <FaInstagram /> Instagram
                </a>
            )}
            {tiktok && (
                <a href={tiktok} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-5 py-3 rounded-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <FaTiktok /> TikTok
                </a>
            )}
            {whatsapp && (
                <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <FaWhatsapp /> WhatsApp
                </a>
            )}
        </div>
    );
}

export function ContactInfo() {
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        fetch('/api/public-settings').then(res => res.json()).then(data => setSettings(data)).catch(() => {});
    }, []);

    const phone = settings?.phone || process.env.NEXT_PUBLIC_PHONE;
    const address = settings?.address || process.env.NEXT_PUBLIC_ADDRESS;

    return (
        <div className="flex flex-col items-center gap-4 text-gray-300">
            {phone && (
                <a href={`tel:${phone}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                    <FaPhoneAlt className="text-primary" />
                    {phone}
                </a>
            )}
            {address && (
                <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-primary" />
                    {address}
                </div>
            )}
        </div>
    );
}