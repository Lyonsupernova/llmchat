import { Thread, ThreadItem } from '@repo/shared/types';

export type CreateThreadRequest = {
  title: string;
  domain?: string;
  pinned?: boolean;
};

export type UpdateThreadRequest = {
  title?: string;
  pinned?: boolean;
  pinnedAt?: Date;
  certifiedStatus?: 'PENDING' | 'CERTIFIED' | 'NOT_CERTIFIED';
};

export type CreateThreadItemRequest = {
  query: string;
  parentId?: string;
  mode: string;
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

export type UpdateThreadItemRequest = {
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

export type ThreadFilters = {
  pinned?: boolean;
  domain?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'updatedAt' | 'pinnedAt';
  orderDirection?: 'asc' | 'desc';
};

export type ThreadStats = {
  totalThreads: number;
  pinnedThreads: number;
  totalThreadItems: number;
  threadsToday: number;
};

class ThreadApiService {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get all threads for the current user
   */
  static async getThreads(filters: ThreadFilters = {}): Promise<Thread[]> {
    const params = new URLSearchParams();
    
    if (filters.pinned !== undefined) params.append('pinned', filters.pinned.toString());
    if (filters.domain) params.append('domain', filters.domain);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());
    if (filters.orderBy) params.append('orderBy', filters.orderBy);
    if (filters.orderDirection) params.append('orderDirection', filters.orderDirection);

    const url = `/api/threads${params.toString() ? `?${params.toString()}` : ''}`;
    return this.request<Thread[]>(url);
  }

  /**
   * Get a specific thread by ID
   */
  static async getThread(threadId: string): Promise<Thread> {
    return this.request<Thread>(`/api/threads/${threadId}`);
  }

  /**
   * Create a new thread
   */
  static async createThread(data: CreateThreadRequest): Promise<Thread> {
    return this.request<Thread>('/api/threads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update a thread
   */
  static async updateThread(threadId: string, data: UpdateThreadRequest): Promise<Thread> {
    return this.request<Thread>(`/api/threads/${threadId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a thread
   */
  static async deleteThread(threadId: string): Promise<void> {
    await this.request<void>(`/api/threads/${threadId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Toggle thread pin status
   */
  static async toggleThreadPin(threadId: string): Promise<Thread> {
    return this.request<Thread>(`/api/threads/${threadId}/pin`, {
      method: 'POST',
    });
  }

  /**
   * Get thread items for a specific thread
   */
  static async getThreadItems(threadId: string): Promise<ThreadItem[]> {
    return this.request<ThreadItem[]>(`/api/threads/${threadId}/items`);
  }

  /**
   * Get a specific thread item
   */
  static async getThreadItem(threadId: string, itemId: string): Promise<ThreadItem> {
    return this.request<ThreadItem>(`/api/threads/${threadId}/items/${itemId}`);
  }

  /**
   * Create a new thread item
   */
  static async createThreadItem(
    threadId: string,
    data: CreateThreadItemRequest
  ): Promise<ThreadItem> {
    return this.request<ThreadItem>(`/api/threads/${threadId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update a thread item
   */
  static async updateThreadItem(
    threadId: string,
    itemId: string,
    data: UpdateThreadItemRequest
  ): Promise<ThreadItem> {
    console.log('thread-api.service.ts - updateThreadItem', threadId, itemId, data);
    return this.request<ThreadItem>(`/api/threads/${threadId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a thread item
   */
  static async deleteThreadItem(threadId: string, itemId: string): Promise<void> {
    await this.request<void>(`/api/threads/${threadId}/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Search threads
   */
  static async searchThreads(query: string, limit: number = 20): Promise<Thread[]> {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });

    return this.request<Thread[]>(`/api/threads/search?${params.toString()}`);
  }

  /**
   * Get thread statistics
   */
  static async getThreadStats(): Promise<ThreadStats> {
    return this.request<ThreadStats>('/api/threads/stats');
  }

  /**
   * Clear all threads (for testing purposes)
   */
  static async clearAllThreads(): Promise<void> {
    await this.request<void>('/api/threads/clear', {
      method: 'DELETE',
    });
  }
}

export default ThreadApiService; 