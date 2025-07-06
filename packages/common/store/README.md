# Chat Store with Clerk Authentication

The chat store has been updated to use Clerk authentication and now communicates with the backend through HTTP API calls instead of direct database operations.

## Key Changes

- **API-Based Architecture**: All database operations now go through HTTP API routes (`/api/threads/*`)
- **Clerk Session Authentication**: All operations require a valid Clerk session
- **Secure Server-Side Operations**: Authentication and authorization are handled server-side
- **Type Safety**: Enhanced type safety with proper TypeScript interfaces
- **Error Handling**: Improved error handling with proper HTTP status codes
- **Multi-tab Synchronization**: Real-time updates across browser tabs

## Setup

### 1. Using ChatStoreProvider (Recommended)

Wrap your app with the `ChatStoreProvider` to automatically handle authentication:

```tsx
import { ChatStoreProvider } from '@repo/common/components';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ChatStoreProvider>
      {children}
    </ChatStoreProvider>
  );
}
```

### 2. Using the Hook Directly

For more control, use the `useChatStoreWithAuth` hook:

```tsx
import { useChatStoreWithAuth } from '@repo/common/store';

export default function ChatComponent() {
  const store = useChatStoreWithAuth();

  if (!store) {
    return <div>Please sign in to continue</div>;
  }

  const { createThread, threads, isAuthenticated } = store;

  return (
    <div>
      {isAuthenticated ? (
        <button onClick={() => createThread('New Thread')}>
          Create Thread
        </button>
      ) : (
        <div>Authentication required</div>
      )}
    </div>
  );
}
```

## API Architecture

### Client-Side (Chat Store)
- Uses `ThreadApiService` for all HTTP requests
- Handles local state management and UI updates
- Manages optimistic updates and error states
- Synchronizes data across browser tabs

### Server-Side (API Routes)
- `/api/threads` - Thread CRUD operations
- `/api/threads/[threadId]` - Individual thread operations
- `/api/threads/[threadId]/items` - Thread items operations
- `/api/threads/[threadId]/items/[itemId]` - Individual thread item operations

All API routes:
- Validate Clerk session authentication
- Verify user ownership of resources
- Handle errors with proper HTTP status codes
- Use Prisma service for database operations

## Store State

The store maintains the following state:

```typescript
{
  // Authentication
  userId: string | null;
  isAuthenticated: boolean;
  
  // Threads
  threads: Thread[];
  currentThreadId: string | null;
  currentThread: Thread | null;
  
  // Thread Items
  threadItems: ThreadItem[];
  currentThreadItem: ThreadItem | null;
  
  // UI State
  isLoadingThreads: boolean;
  isLoadingThreadItems: boolean;
  // ... other UI state
}
```

## Authenticated Operations

All the following operations require a valid Clerk session:

- `createThread(title)` - Create a new thread
- `updateThread(thread)` - Update thread details
- `deleteThread(threadId)` - Delete a thread
- `pinThread(threadId)` / `unpinThread(threadId)` - Pin/unpin threads
- `createThreadItem(item)` - Create a thread item
- `updateThreadItem(itemId, updates)` - Update a thread item
- `deleteThreadItem(itemId)` - Delete a thread item
- `getThreadItems(threadId)` - Load thread items
- `clearAllThreads()` - Clear all user threads

## Migration Notes

### What's Changed
- **Removed**: Direct Prisma database calls
- **Removed**: `MOCK_USER_ID` constant
- **Added**: HTTP API service layer
- **Added**: Proper authentication checks
- **Added**: Server-side authorization
- **Enhanced**: Error handling and type safety

### What's Required
- Valid Clerk session for all operations
- Proper error handling in components
- Use of `useChatStoreWithAuth()` hook instead of direct store access

### Security Improvements
- All database operations are now server-side
- User authentication is verified on each request
- Resource ownership is validated before operations
- No direct database access from client-side code

## Usage in Components

```tsx
import { useChatStoreWithAuth } from '@repo/common/store';

function MyComponent() {
  const store = useChatStoreWithAuth();
  
  // store will be undefined if user is not authenticated
  if (!store) {
    return <div>Please sign in</div>;
  }
  
  const { 
    threads, 
    createThread, 
    deleteThread,
    isAuthenticated 
  } = store;
  
  return (
    <div>
      {/* Your component JSX */}
    </div>
  );
}
```

This architecture provides a secure, scalable, and maintainable foundation for the chat application with proper separation of concerns between client and server operations. 