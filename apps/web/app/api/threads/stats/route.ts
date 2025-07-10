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

        const stats = await ThreadService.getThreadStats(userId);

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Error fetching thread stats:', error);
        return NextResponse.json({ error: 'Failed to fetch thread stats' }, { status: 500 });
    }
} 