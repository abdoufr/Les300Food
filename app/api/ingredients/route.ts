// app/api/ingredients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getIngredients, createIngredient } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category') || undefined;

        const ingredients = await getIngredients(category);
        return NextResponse.json(ingredients);
    } catch (error) {
        console.error('Error fetching ingredients:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const data = await request.json();

        if (!data.name || data.price === undefined || !data.category || !data.subcategory) {
            return NextResponse.json(
                { error: 'Nom, prix, catégorie et sous-catégorie sont requis' },
                { status: 400 }
            );
        }

        const result = await createIngredient(data);

        return NextResponse.json({
            success: true,
            id: result.lastInsertRowid,
            message: 'Ingrédient ajouté avec succès'
        });
    } catch (error) {
        console.error('Error creating ingredient:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
