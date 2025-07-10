import { TEST_Thread, TEST_ThreadItem, Prisma } from '@prisma/client';
import { Thread, ThreadItem } from '@repo/shared/types';
import { prisma } from '../client';
import { createClerkClient } from '@clerk/nextjs/server';
import { domainOptionToPrismaEnum, isValidDomainOption, isValidPrismaCertifiedStatus } from '../../common/utils/domain-converter';

// Type definitions for the service
export type CreateThreadInput = {
  title: string;
  userId: string;
  domain?: string;
  pinned?: boolean;
};

export type UpdateThreadInput = {
  id: string;
  title?: string;
  pinned?: boolean;
  pinnedAt?: Date;
  certifiedStatus?: 'PENDING' | 'CERTIFIED' | 'NOT_CERTIFIED';
};

export type CreateThreadItemInput = {
  query: string;
  threadId: string;
  parentId?: string;
  mode: string; // ChatMode as string
  status?: string; // ItemStatus as string
  error?: string;
  imageAttachment?: string;
  toolCalls?: Record<string, any>;
  toolResults?: Record<string, any>;
  steps?: Record<string, any>;
  answer?: Record<string, any>;
  metadata?: Record<string, any>;
  sources?: Array<any>;
  suggestions?: string[];
  object?: Record<string, any>;
};

export type UpdateThreadItemInput = {
  id: string;
  query?: string;
  status?: string;
  error?: string;
  imageAttachment?: string;
  toolCalls?: Record<string, any>;
  toolResults?: Record<string, any>;
  steps?: Record<string, any>;
  answer?: Record<string, any>;
  metadata?: Record<string, any>;
  sources?: Array<any>;
  suggestions?: string[];
  object?: Record<string, any>;
};

export type ThreadWithItems = TEST_Thread & {
  threadItems: TEST_ThreadItem[];
};

export type ThreadFilters = {
  userId: string;
  pinned?: boolean;
  domain?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'updatedAt' | 'pinnedAt';
  orderDirection?: 'asc' | 'desc';
};

/**
 * Thread Service - Handles all thread-related database operations
 */
export class ThreadService {
  /**
   * Fetch user information from Clerk API
   */
  private static async fetchUserFromClerk(userId: string): Promise<{ email?: string; name?: string } | null> {
    try {
      const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
      const user = await clerk.users.getUser(userId);
      const email = user.emailAddresses.find((e: any) => e.id === user.primaryEmailAddressId)?.emailAddress;
      const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined;
      
      return { email, name };
    } catch (error) {
      console.error('Error fetching user from Clerk:', error);
      return null;
    }
  }

  /**
   * Ensure user exists in database (create if not exists)
   * This method should be called at the start of any API route that requires user authentication
   */
  static async ensureUserExists(userId: string): Promise<void> {
    try {
      // Check if user already exists
      const existingUser = await prisma.tEST_User.findUnique({
        where: { id: userId },
      });

      if (existingUser) {
        return; // User already exists, no need to create
      }

      // User doesn't exist, fetch from Clerk and create
      console.log(`User ${userId} not found in database, fetching from Clerk...`);
      const clerkUser = await this.fetchUserFromClerk(userId);
      
      if (!clerkUser?.email) {
        console.warn(`Could not fetch user ${userId} from Clerk, creating with minimal data`);
      }

      // Create user with available data
      await prisma.tEST_User.create({
        data: {
          id: userId,
          email: clerkUser?.email || `${userId}@unknown.com`, // Fallback email
          name: clerkUser?.name || null,
          role: 'USER',
        },
      });

      console.log(`User ${userId} created successfully in database`);
    } catch (error) {
      // If creation fails due to race condition (user created by webhook), ignore
      if (error instanceof Error && error.message.includes('Unique constraint failed')) {
        console.log(`User ${userId} already exists (race condition), continuing...`);
        return;
      }
      
      console.error('Error ensuring user exists:', error);
      throw new Error('Failed to ensure user exists');
    }
  }

  /**
   * Create a new thread
   */
  static async createThread(input: CreateThreadInput): Promise<TEST_Thread> {
    try {
      // Ensure user exists before creating thread
      console.log('prisma-service.ts - createThread - input', input);
      await this.ensureUserExists(input.userId);
      
      // Convert domain from frontend format to Prisma enum format
      let prismaDomain = 'LEGAL'; // Default fallback
      if (input.domain && isValidDomainOption(input.domain)) {
        prismaDomain = domainOptionToPrismaEnum(input.domain);
      }
      
      console.log('prisma-service.ts - createThread - creating thread');
      const thread = await prisma.tEST_Thread.create({
        data: {
          title: input.title,
          userId: input.userId,
          domain: prismaDomain,
          pinned: input.pinned || false,
          pinnedAt: input.pinned ? new Date() : null,
        },
      });

      console.log('prisma-service.ts - createThread - thread created', thread);
      return thread;
    } catch (error) {
      console.error('Error creating thread:', error);
      throw new Error('Failed to create thread');
    }
  }

  /**
   * Get a thread by ID
   */
  static async getThread(threadId: string, userId: string): Promise<ThreadWithItems | null> {
    try {
      console.log('prisma-service.ts - getThread - threadId', threadId, 'userId', userId);
      const thread = await prisma.tEST_Thread.findFirst({
        where: {
          id: threadId,
          userId: userId,
        },
        include: {
          threadItems: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      console.log('prisma-service.ts - getThread - thread', thread);

      return thread;
    } catch (error) {
      console.error('Error getting thread:', error);
      throw new Error('Failed to get thread');
    }
  }

  /**
   * Get all threads for a user with optional filters
   */
  static async getThreads(filters: ThreadFilters): Promise<TEST_Thread[]> {
    try {
      console.log('prisma-service.ts - getThreads - filters', filters);
      const {
        userId,
        pinned,
        domain,
        limit = 50,
        offset = 0,
        orderBy = 'createdAt',
        orderDirection = 'desc',
      } = filters;

      // Convert domain from frontend format to Prisma enum format
      let prismaDomain;
      if (domain && isValidDomainOption(domain)) {
        prismaDomain = domainOptionToPrismaEnum(domain);
      }

      const where: Prisma.TEST_ThreadWhereInput = {
        userId: userId,
        ...(pinned !== undefined && { pinned }),
        ...(prismaDomain && { domain: prismaDomain }),
      };

      const threads = await prisma.tEST_Thread.findMany({
        where,
        include: {
          threadItems: {
            orderBy: { createdAt: 'asc' },
            take: 1, // Only get the first item for preview
          },
        },
        orderBy: {
          [orderBy]: orderDirection,
        },
        take: limit,
        skip: offset,
      });

      return threads;
    } catch (error) {
      console.error('Error getting threads:', error);
      throw new Error('Failed to get threads');
    }
  }

  /**
   * Update a thread
   */
  static async updateThread(input: UpdateThreadInput): Promise<TEST_Thread> {
    try {
      const updateData: Prisma.TEST_ThreadUpdateInput = {};

      if (input.title !== undefined) updateData.title = input.title;
      if (input.pinned !== undefined) {
        updateData.pinned = input.pinned;
        updateData.pinnedAt = input.pinned ? new Date() : null;
      }
      if (input.pinnedAt !== undefined) updateData.pinnedAt = input.pinnedAt;
      if (input.certifiedStatus !== undefined) {
        if (isValidPrismaCertifiedStatus(input.certifiedStatus)) {
          updateData.certifiedStatus = input.certifiedStatus;
        }
      }

      const thread = await prisma.tEST_Thread.update({
        where: { id: input.id },
        data: updateData,
      });

      return thread;
    } catch (error) {
      console.error('Error updating thread:', error);
      throw new Error('Failed to update thread');
    }
  }

  /**
   * Delete a thread and all its items
   */
  static async deleteThread(threadId: string, userId: string): Promise<void> {
    try {
      // Verify ownership before deletion
      const thread = await prisma.tEST_Thread.findFirst({
        where: {
          id: threadId,
          userId: userId,
        },
      });

      if (!thread) {
        throw new Error('Thread not found or access denied');
      }

      // Delete thread (cascade will handle thread items)
      await prisma.tEST_Thread.delete({
        where: { id: threadId },
      });
    } catch (error) {
      console.error('Error deleting thread:', error);
      throw new Error('Failed to delete thread');
    }
  }

  /**
   * Pin/Unpin a thread
   */
  static async toggleThreadPin(threadId: string, userId: string): Promise<TEST_Thread> {
    try {
      const thread = await prisma.tEST_Thread.findFirst({
        where: {
          id: threadId,
          userId: userId,
        },
      });

      if (!thread) {
        throw new Error('Thread not found or access denied');
      }

      const updatedThread = await prisma.tEST_Thread.update({
        where: { id: threadId },
        data: {
          pinned: !thread.pinned,
          pinnedAt: !thread.pinned ? new Date() : null,
        },
      });

      return updatedThread;
    } catch (error) {
      console.error('Error toggling thread pin:', error);
      throw new Error('Failed to toggle thread pin');
    }
  }

  /**
   * Get pinned threads for a user
   */
  static async getPinnedThreads(userId: string): Promise<TEST_Thread[]> {
    try {
      const threads = await prisma.tEST_Thread.findMany({
        where: {
          userId: userId,
          pinned: true,
        },
        include: {
          threadItems: {
            orderBy: { createdAt: 'asc' },
            take: 1,
          },
        },
        orderBy: {
          pinnedAt: 'desc',
        },
      });

      return threads;
    } catch (error) {
      console.error('Error getting pinned threads:', error);
      throw new Error('Failed to get pinned threads');
    }
  }

  /**
   * Create a new thread item
   */
  static async createThreadItem(input: CreateThreadItemInput): Promise<TEST_ThreadItem> {
    try {
      const threadItem = await prisma.tEST_ThreadItem.create({
        data: {
          query: input.query,
          threadId: input.threadId,
          parentId: input.parentId,
          mode: input.mode,
          status: input.status,
          error: input.error,
          imageAttachment: input.imageAttachment,
          toolCalls: input.toolCalls,
          toolResults: input.toolResults,
          steps: input.steps,
          answer: input.answer,
          metadata: input.metadata,
          sources: input.sources,
          suggestions: input.suggestions || [],
          object: input.object,
        },
      });

      return threadItem;
    } catch (error) {
      console.error('Error creating thread item:', error);
      throw new Error('Failed to create thread item');
    }
  }

  /**
   * Update a thread item
   */
  static async updateThreadItem(input: UpdateThreadItemInput): Promise<TEST_ThreadItem> {
    try {
      const updateData: Prisma.TEST_ThreadItemUpdateInput = {};

      if (input.query !== undefined) updateData.query = input.query;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.error !== undefined) updateData.error = input.error;
      if (input.imageAttachment !== undefined) updateData.imageAttachment = input.imageAttachment;
      if (input.toolCalls !== undefined) updateData.toolCalls = input.toolCalls;
      if (input.toolResults !== undefined) updateData.toolResults = input.toolResults;
      if (input.steps !== undefined) updateData.steps = input.steps;
      if (input.answer !== undefined) updateData.answer = input.answer;
      if (input.metadata !== undefined) updateData.metadata = input.metadata;
      if (input.sources !== undefined) updateData.sources = input.sources;
      if (input.suggestions !== undefined) updateData.suggestions = input.suggestions;
      if (input.object !== undefined) updateData.object = input.object;

      const threadItem = await prisma.tEST_ThreadItem.update({
        where: { id: input.id },
        data: updateData,
      });

      return threadItem;
    } catch (error) {
      console.error('Error updating thread item:', error);
      throw new Error('Failed to update thread item');
    }
  }

  /**
   * Delete a thread item
   */
  static async deleteThreadItem(threadItemId: string): Promise<void> {
    try {
      console.log('prisma-service.ts - deleteThreadItem - threadItemId', threadItemId);
      await prisma.tEST_ThreadItem.delete({
        where: { id: threadItemId },
      });
      console.log('prisma-service.ts - deleteThreadItem - threadItem deleted');
    } catch (error) {
      console.error('Error deleting thread item:', error);
      throw new Error('Failed to delete thread item');
    }
  }

  /**
   * Get thread items for a specific thread
   */
  static async getThreadItems(threadId: string): Promise<TEST_ThreadItem[]> {
    try {
      console.log('prisma-service.ts - getThreadItems - threadId', threadId);
      const threadItems = await prisma.tEST_ThreadItem.findMany({
        where: { threadId },
        orderBy: { createdAt: 'asc' },
      });

      console.log('prisma-service.ts - getThreadItems - threadItems', threadItems);

      return threadItems;
    } catch (error) {
      console.error('Error getting thread items:', error);
      throw new Error('Failed to get thread items');
    }
  }

  /**
   * Delete follow-up thread items after a specific item
   */
  static async deleteFollowupThreadItems(threadItemId: string): Promise<void> {
    try {
      const threadItem = await prisma.tEST_ThreadItem.findUnique({
        where: { id: threadItemId },
      });

      if (!threadItem) {
        throw new Error('Thread item not found');
      }

      // Delete all thread items created after this one in the same thread
      await prisma.tEST_ThreadItem.deleteMany({
        where: {
          threadId: threadItem.threadId,
          createdAt: {
            gt: threadItem.createdAt,
          },
        },
      });
    } catch (error) {
      console.error('Error deleting follow-up thread items:', error);
      throw new Error('Failed to delete follow-up thread items');
    }
  }

  /**
   * Clear all threads for a user (for testing purposes)
   */
  static async clearAllThreads(userId: string): Promise<void> {
    try {
      await prisma.tEST_Thread.deleteMany({
        where: { userId },
      });
    } catch (error) {
      console.error('Error clearing all threads:', error);
      throw new Error('Failed to clear all threads');
    }
  }

  /**
   * Get thread statistics for a user
   */
  static async getThreadStats(userId: string): Promise<{
    totalThreads: number;
    pinnedThreads: number;
    totalThreadItems: number;
    threadsToday: number;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalThreads, pinnedThreads, totalThreadItems, threadsToday] = await Promise.all([
        await prisma.tEST_Thread.count({
          where: { userId },
        }),
        await prisma.tEST_Thread.count({
          where: { userId, pinned: true },
        }),
        await prisma.tEST_ThreadItem.count({
          where: {
            thread: { userId },
          },
        }),
        await prisma.tEST_Thread.count({
          where: {
            userId,
            createdAt: {
              gte: today,
            },
          },
        }),
      ]);

      return {
        totalThreads,
        pinnedThreads,
        totalThreadItems,
        threadsToday,
      };
    } catch (error) {
      console.error('Error getting thread stats:', error);
      throw new Error('Failed to get thread stats');
    }
  }

  /**
   * Batch create thread items (useful for migrations)
   */
  static async batchCreateThreadItems(items: CreateThreadItemInput[]): Promise<void> {
    try {
      await prisma.tEST_ThreadItem.createMany({
        data: items.map(item => ({
          query: item.query,
          threadId: item.threadId,
          parentId: item.parentId,
          mode: item.mode,
          status: item.status,
          error: item.error,
          imageAttachment: item.imageAttachment,
          toolCalls: item.toolCalls,
          toolResults: item.toolResults,
          steps: item.steps,
          answer: item.answer,
          metadata: item.metadata,
          sources: item.sources,
          suggestions: item.suggestions || [],
          object: item.object,
        })),
        skipDuplicates: true,
      });
    } catch (error) {
      console.error('Error batch creating thread items:', error);
      throw new Error('Failed to batch create thread items');
    }
  }

  /**
   * Search threads by title or content
   */
  static async searchThreads(
    userId: string,
    query: string,
    limit: number = 20
  ): Promise<TEST_Thread[]> {
    try {
      console.log('prisma-service.ts - searchThreads - userId', userId);
      console.log('prisma-service.ts - searchThreads - query', query);
      console.log('prisma-service.ts - searchThreads - limit', limit);
      const threads = await prisma.tEST_Thread.findMany({
        where: {
          userId,
          OR: [
            {
              title: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              threadItems: {
                some: {
                  query: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
              },
            },
          ],
        },
        include: {
          threadItems: {
            orderBy: { createdAt: 'asc' },
            take: 1,
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: limit,
      });

      return threads;
    } catch (error) {
      console.error('Error searching threads:', error);
      throw new Error('Failed to search threads');
    }
  }

  /**
   * Close Prisma connection (useful for cleanup)
   */
  static async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}

export default ThreadService; 