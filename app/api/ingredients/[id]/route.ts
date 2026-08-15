// app/api/ingredients/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateIngredient, deleteIngredient } from '@/lib/db';

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const data = await request.json();
        await updateIngredient(parseInt(params.id), data);

        return NextResponse.json({
            success: true,
            message: 'Ingrédient modifié avec succès'
        });
    } catch (error) {
        console.error('Error updating ingredient:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        await deleteIngredient(parseInt(params.id));

        return NextResponse.json({
            success: true,
            message: 'Ingrédient supprimé avec succès'
        });
    } catch (error) {
        console.error('Error deleting ingredient:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
