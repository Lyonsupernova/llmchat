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

        // Verify thread ownership
        const thread = await ThreadService.getThread(threadId, userId);
        if (!thread) {
            return NextResponse.json({ error: 'Thread not found or access denied' }, { status: 404 });
        }

        const threadItems = await ThreadService.getThreadItems(threadId);

        return NextResponse.json(threadItems);
    } catch (error) {
        console.error('Error fetching thread items:', error);
        return NextResponse.json({ error: 'Failed to fetch thread items' }, { status: 500 });
    }
}

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
        const body = await request.json();

        // Verify thread ownership
        const thread = await ThreadService.getThread(threadId, userId);
        if (!thread) {
            return NextResponse.json({ error: 'Thread not found or access denied' }, { status: 404 });
        }

        const {
            query,
            parentId,
            mode,
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

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        const threadItem = await ThreadService.createThreadItem({
            query,
            threadId,
            parentId,
            mode,
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

        return NextResponse.json(threadItem, { status: 201 });
    } catch (error) {
        console.error('Error creating thread item:', error);
        return NextResponse.json({ error: 'Failed to create thread item' }, { status: 500 });
    }
} 