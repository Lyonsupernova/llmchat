import { auth } from '@clerk/nextjs/server';
import { ThreadService } from '@repo/prisma/services/prisma-service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: { threadId: string } }
) {
    try {
        const session = await auth();
        const userId = session?.userId;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { threadId } = params;

        const thread = await ThreadService.toggleThreadPin(threadId, userId);

        return NextResponse.json(thread);
    } catch (error) {
        console.error('Error toggling thread pin:', error);
        return NextResponse.json({ error: 'Failed to toggle thread pin' }, { status: 500 });
    }
} 