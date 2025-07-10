import { auth } from '@clerk/nextjs/server';
import { ThreadService } from '@repo/prisma/services/prisma-service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        const userId = session?.userId;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(request.url);
        const query = url.searchParams.get('q');
        const limit = parseInt(url.searchParams.get('limit') || '20');

        if (!query) {
            return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
        }

        const threads = await ThreadService.searchThreads(userId, query, limit);

        return NextResponse.json(threads);
    } catch (error) {
        console.error('Error searching threads:', error);
        return NextResponse.json({ error: 'Failed to search threads' }, { status: 500 });
    }
} 