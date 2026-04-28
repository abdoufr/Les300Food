// app/api/categories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateCategory, deleteCategory } from '@/lib/db';

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        const data = await request.json();
        await updateCategory(parseInt(params.id), data);

        return NextResponse.json({ success: true, message: 'Catégorie mise à jour' });
    } catch (error) {
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        await deleteCategory(parseInt(params.id));
        return NextResponse.json({ success: true, message: 'Catégorie supprimée' });
    } catch (error) {
        return NextResponse.json({ error: 'Impossible de supprimer une catégorie contenant des plats' }, { status: 400 });
    }
}
