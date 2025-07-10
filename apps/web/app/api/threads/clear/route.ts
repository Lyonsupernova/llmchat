import { auth } from '@clerk/nextjs/server';
import { ThreadService } from '@repo/prisma/services/prisma-service';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();
        const userId = session?.userId;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await ThreadService.clearAllThreads(userId);

        return NextResponse.json({ message: 'All threads cleared successfully' });
    } catch (error) {
        console.error('Error clearing all threads:', error);
        return NextResponse.json({ error: 'Failed to clear all threads' }, { status: 500 });
    }
} 