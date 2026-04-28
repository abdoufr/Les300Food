// app/api/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json(
                { error: 'Nom d\'utilisateur et mot de passe requis' },
                { status: 400 }
            );
        }

        const admin = await verifyAdmin(username, password);

        if (!admin) {
            return NextResponse.json(
                { error: 'Identifiants incorrects' },
                { status: 401 }
            );
        }

        const token = jwt.sign(
            { id: admin.id, username: admin.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return NextResponse.json({
            success: true,
            token,
            user: { id: admin.id, username: admin.username }
        });
    } catch (error) {
        console.error('Auth error:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}