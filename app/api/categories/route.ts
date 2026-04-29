// app/api/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCategories, createCategory } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const categories = await getCategories();
        return NextResponse.json(categories);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        const data = await request.json();
        if (!data.name) return NextResponse.json({ error: 'Nom requis' }, { status: 400 });

        await createCategory(data);
        return NextResponse.json({ success: true, message: 'Catégorie créée' });
    } catch (error) {
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
