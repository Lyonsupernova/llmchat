import { authenticateAndEnsureUser } from '@repo/prisma/services/auth-utils';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/sync-user
 * Manually sync the current authenticated user to the database
 * This endpoint can be called from the frontend to ensure user exists
 */
export async function POST(request: NextRequest) {
    try {
        const { userId, error } = await authenticateAndEnsureUser(request);
        if (error) return error;

        return NextResponse.json({ 
            message: 'User synchronized successfully',
            userId 
        });
    } catch (error) {
        console.error('Error syncing user:', error);
        return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
    }
}

/**
 * GET /api/auth/sync-user
 * Check if the current user exists in the database and sync if needed
 */
export async function GET(request: NextRequest) {
    try {
        const { userId, error } = await authenticateAndEnsureUser(request);
        if (error) return error;

        return NextResponse.json({ 
            message: 'User exists and is synchronized',
            userId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error checking user sync:', error);
        return NextResponse.json({ error: 'Failed to check user sync' }, { status: 500 });
    }
} 