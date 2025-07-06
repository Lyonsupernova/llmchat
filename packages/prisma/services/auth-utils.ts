import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { ThreadService } from './prisma-service';

/**
 * Authentication utility that ensures the user is authenticated and exists in the database
 * Use this at the start of any API route that requires authentication
 */
export async function authenticateAndEnsureUser(
  request?: NextRequest
): Promise<{ userId: string; error?: NextResponse }> {
  try {
    // Get the authenticated user from Clerk
    const session = await auth();
    const userId = session?.userId;

    if (!userId) {
      return {
        userId: '',
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      };
    }

    // Ensure user exists in our database
    await ThreadService.ensureUserExists(userId);

    return { userId };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      userId: '',
      error: NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
    };
  }
}

/**
 * Simpler version that just returns the user ID or null
 * Use when you want to handle errors manually
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const session = await auth();
    const userId = session?.userId;

    if (!userId) {
      return null;
    }

    // Ensure user exists in our database
    await ThreadService.ensureUserExists(userId);

    return userId;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Middleware-like function for API routes that require authentication
 * Returns early with error response if authentication fails
 */
export async function withAuth<T>(
  handler: (userId: string, request: NextRequest, ...args: any[]) => Promise<T>
) {
  return async (request: NextRequest, ...args: any[]): Promise<T | NextResponse> => {
    const { userId, error } = await authenticateAndEnsureUser(request);
    
    if (error) {
      return error;
    }

    return handler(userId, request, ...args);
  };
} 