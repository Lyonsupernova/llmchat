import { auth } from '@clerk/nextjs/server';
import { ThreadService } from '@repo/prisma/services/prisma-service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
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

        const thread = await ThreadService.getThread(threadId, userId);

        if (!thread) {
            return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
        }

        return NextResponse.json(thread);
    } catch (error) {
        console.error('Error fetching thread:', error);
        return NextResponse.json({ error: 'Failed to fetch thread' }, { status: 500 });
    }
}

export async function PUT(
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
        console.log('api/threads/[threadId] PUT - update thread request', request, 'for threadId', threadId);
        const body = await request.json();
        const { title, pinned, pinnedAt, certifiedStatus } = body;

        // Verify ownership
        const existingThread = await ThreadService.getThread(threadId, userId);
        console.log('api/threads/[threadId] PUT - existingThread', existingThread);
        if (!existingThread) {
            return NextResponse.json({ error: 'Thread not found or access denied' }, { status: 404 });
        }

        const thread = await ThreadService.updateThread({
            id: threadId,
            title,
            pinned,
            pinnedAt,
            certifiedStatus,
        });
        console.log('api/threads/[threadId] PUT - updated thread', thread);

        return NextResponse.json(thread);
    } catch (error) {
        console.error('Error updating thread:', error);
        return NextResponse.json({ error: 'Failed to update thread' }, { status: 500 });
    }
}

export async function DELETE(
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

        await ThreadService.deleteThread(threadId, userId);

        return NextResponse.json({ message: 'Thread deleted successfully' });
    } catch (error) {
        console.error('Error deleting thread:', error);
        return NextResponse.json({ error: 'Failed to delete thread' }, { status: 500 });
    }
} 