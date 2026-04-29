// app/api/menu/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMenuItems, createMenuItem, getCategories } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get('category');
        const search = searchParams.get('search');

        const items = await getMenuItems(
            categoryId ? parseInt(categoryId) : undefined,
            search || undefined
        );
        const categories = await getCategories();

        return NextResponse.json({ items, categories });
    } catch (error) {
        console.error('Error fetching menu:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // Vérifier l'authentification
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const data = await request.json();

        if (!data.name || !data.price || !data.category_id) {
            return NextResponse.json(
                { error: 'Nom, prix et catégorie sont requis' },
                { status: 400 }
            );
        }

        const result = await createMenuItem(data);

        return NextResponse.json({
            success: true,
            id: result.lastInsertRowid,
            message: 'Plat ajouté avec succès'
        });
    } catch (error) {
        console.error('Error creating menu item:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}