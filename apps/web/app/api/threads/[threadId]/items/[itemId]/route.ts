import { auth } from '@clerk/nextjs/server';
import { ThreadService } from '@repo/prisma/services/prisma-service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { threadId: string; itemId: string } }
) {
    try {
        const session = await auth();
        const userId = session?.userId;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { threadId, itemId } = params;

        // Verify thread ownership
        const thread = await ThreadService.getThread(threadId, userId);
        if (!thread) {
            return NextResponse.json({ error: 'Thread not found or access denied' }, { status: 404 });
        }

        // Find the specific thread item
        const threadItem = thread.threadItems.find(item => item.id === itemId);
        if (!threadItem) {
            return NextResponse.json({ error: 'Thread item not found' }, { status: 404 });
        }

        return NextResponse.json(threadItem);
    } catch (error) {
        console.error('Error fetching thread item:', error);
        return NextResponse.json({ error: 'Failed to fetch thread item' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { threadId: string; itemId: string } }
) {
    try {
        const session = await auth();
        const userId = session?.userId;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { threadId, itemId } = params;
        const body = await request.json();

        // Verify thread ownership
        const thread = await ThreadService.getThread(threadId, userId);
        if (!thread) {
            return NextResponse.json({ error: 'Thread not found or access denied' }, { status: 404 });
        }

        // Verify thread item exists
        const existingItem = thread.threadItems.find(item => item.id === itemId);
        if (!existingItem) {
            return NextResponse.json({ error: 'Thread item not found' }, { status: 404 });
        }

        const {
            query,
            status,
            error,
            imageAttachment,
            toolCalls,
            toolResults,
            steps,
            answer,
            metadata,
            sources,
            suggestions,
            object,
        } = body;

        const threadItem = await ThreadService.updateThreadItem({
            id: itemId,
            query,
            status,
            error,
            imageAttachment,
            toolCalls,
            toolResults,
            steps,
            answer,
            metadata,
            sources,
            suggestions,
            object,
        });

        return NextResponse.json(threadItem);
    } catch (error) {
        console.error('Error updating thread item:', error);
        return NextResponse.json({ error: 'Failed to update thread item' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { threadId: string; itemId: string } }
) {
    try {
        const session = await auth();
        const userId = session?.userId;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { threadId, itemId } = params;

        // Verify thread ownership
        const thread = await ThreadService.getThread(threadId, userId);
        if (!thread) {
            return NextResponse.json({ error: 'Thread not found or access denied' }, { status: 404 });
        }

        // Verify thread item exists
        const existingItem = thread.threadItems.find(item => item.id === itemId);
        if (!existingItem) {
            return NextResponse.json({ error: 'Thread item not found' }, { status: 404 });
        }

        await ThreadService.deleteThreadItem(itemId);

        return NextResponse.json({ message: 'Thread item deleted successfully' });
    } catch (error) {
        console.error('Error deleting thread item:', error);
        return NextResponse.json({ error: 'Failed to delete thread item' }, { status: 500 });
    }
} 