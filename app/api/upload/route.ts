// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';


export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'Aucun fichier' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        const mimeType = file.type;
        const dataUrl = `data:${mimeType};base64,${base64}`;

        return NextResponse.json({
            success: true,
            url: dataUrl
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Erreur upload' }, { status: 500 });
    }
}