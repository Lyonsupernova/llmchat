/**
 * Client-side authentication sync service
 * Use this to ensure the current user is synchronized with the database
 */
export class AuthSyncService {
  private static readonly SYNC_ENDPOINT = '/api/auth/sync-user';

  /**
   * Sync the current authenticated user to the database
   * Call this after user login or when you need to ensure user exists
   */
  static async syncUser(): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      const response = await fetch(this.SYNC_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || 'Failed to sync user',
        };
      }

      const data = await response.json();
      return {
        success: true,
        userId: data.userId,
      };
    } catch (error) {
      console.error('Error syncing user:', error);
      return {
        success: false,
        error: 'Network error while syncing user',
      };
    }
  }

  /**
   * Check if the current user is synchronized
   * This is a lighter operation that just checks sync status
   */
  static async checkUserSync(): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      const response = await fetch(this.SYNC_ENDPOINT, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || 'Failed to check user sync',
        };
      }

      const data = await response.json();
      return {
        success: true,
        userId: data.userId,
      };
    } catch (error) {
      console.error('Error checking user sync:', error);
      return {
        success: false,
        error: 'Network error while checking user sync',
      };
    }
  }

  /**
   * Ensure user is synced with retry logic
   * Use this for critical operations that require user to exist
   */
  static async ensureUserSynced(maxRetries: number = 3): Promise<{ success: boolean; userId?: string; error?: string }> {
    let lastError = '';
    
    for (let i = 0; i < maxRetries; i++) {
      const result = await this.syncUser();
      
      if (result.success) {
        return result;
      }
      
      lastError = result.error || 'Unknown error';
      
      // Wait before retry (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
    
    return {
      success: false,
      error: `Failed to sync user after ${maxRetries} attempts: ${lastError}`,
    };
  }
} 