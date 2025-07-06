import { authenticateAndEnsureUser } from '@repo/prisma/services/auth-utils';
import { ThreadService } from '@repo/prisma/services/prisma-service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { userId, error } = await authenticateAndEnsureUser(request);
        if (error) return error;

        const url = new URL(request.url);
        const searchParams = url.searchParams;
        
        const pinned = searchParams.get('pinned');
        const domain = searchParams.get('domain');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');
        const orderBy = searchParams.get('orderBy') as 'createdAt' | 'updatedAt' | 'pinnedAt' || 'createdAt';
        const orderDirection = searchParams.get('orderDirection') as 'asc' | 'desc' || 'desc';

        const filters = {
            userId,
            ...(pinned !== null && { pinned: pinned === 'true' }),
            ...(domain && { domain }),
            limit,
            offset,
            orderBy,
            orderDirection,
        };

        const threads = await ThreadService.getThreads(filters);

        return NextResponse.json(threads);
    } catch (error) {
        console.error('Error fetching threads:', error);
        return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        console.log('api/threads POST - create thread request', request);
        const { userId, error } = await authenticateAndEnsureUser(request);
        if (error) return error;

        const body = await request.json();
        console.log('api/threads POST - create thread body', body);
        const { title, domain, pinned } = body;

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const thread = await ThreadService.createThread({
            title,
            userId,
            domain,
            pinned,
        });

        console.log('api/threads POST - create thread response', thread);

        return NextResponse.json(thread, { status: 201 });
    } catch (error) {
        console.error('Error creating thread:', error);
        return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 });
    }
} 