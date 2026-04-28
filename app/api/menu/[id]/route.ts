// app/api/menu/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMenuItem, updateMenuItem, deleteMenuItem } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const item = await getMenuItem(parseInt(params.id));
        if (!item) {
            return NextResponse.json({ error: 'Plat non trouvé' }, { status: 404 });
        }
        return NextResponse.json(item);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

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
        await updateMenuItem(parseInt(params.id), data);

        return NextResponse.json({
            success: true,
            message: 'Plat modifié avec succès'
        });
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
        if (!authHeader) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        await deleteMenuItem(parseInt(params.id));

        return NextResponse.json({
            success: true,
            message: 'Plat supprimé avec succès'
        });
    } catch (error) {
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}