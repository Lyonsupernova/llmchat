'use client';

import { Model, models } from '@repo/ai/models';
import { ChatMode } from '@repo/shared/config';
import { MessageGroup, Thread, ThreadItem } from '@repo/shared/types';
import { nanoid } from 'nanoid';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useAppStore } from './app.store';
import ThreadApiService from '../services/thread-api.service';

let CONFIG_KEY = 'chat-config';

const loadInitialData = async () => {
    try {
        const threads = await ThreadApiService.getThreads({
            orderBy: 'createdAt',
            orderDirection: 'desc',
        });
        
        const configStr = localStorage.getItem(CONFIG_KEY);
        const config = configStr
            ? JSON.parse(configStr)
            : {
                  customInstructions: undefined,
                  model: models[0].id,
                  useWebSearch: false,
                  showSuggestions: true,
                  chatMode: ChatMode.GPT_4_1,
              };
        const chatMode = config.chatMode || ChatMode.GPT_4_1;
        const useWebSearch = typeof config.useWebSearch === 'boolean' ? config.useWebSearch : false;
        const customInstructions = config.customInstructions || '';

        return {
            threads,
            currentThreadId: config.currentThreadId || threads[0]?.id,
            config,
            useWebSearch,
            chatMode,
            customInstructions,
            showSuggestions: config.showSuggestions ?? true,
        };
    } catch (error) {
        console.error('Failed to load initial data:', error);
        // Return default values if API fails
        const config = {
            customInstructions: '',
            model: models[0].id,
            useWebSearch: false,
            showSuggestions: true,
            chatMode: ChatMode.GPT_4_1,
        };
        return {
            threads: [],
            currentThreadId: null,
            config,
            useWebSearch: false,
            chatMode: ChatMode.GPT_4_1,
            customInstructions: '',
            showSuggestions: true,
        };
    }
};

type State = {
    model: Model;
    isGenerating: boolean;
    useWebSearch: boolean;
    customInstructions: string;
    showSuggestions: boolean;
    editor: any;
    chatMode: ChatMode;
    domain: string;
    context: string;
    imageAttachment: { base64?: string; file?: File };
    abortController: AbortController | null;
    threads: Thread[];
    threadItems: ThreadItem[];
    currentThreadId: string | null;
    activeThreadItemView: string | null;
    currentThread: Thread | null;
    currentThreadItem: ThreadItem | null;
    messageGroups: MessageGroup[];
    isLoadingThreads: boolean;
    isLoadingThreadItems: boolean;
    currentSources: string[];
    // Map real database IDs to optimistic IDs using plain object
    optimisticIdMap: Record<string, string>;
    // Map real thread item database IDs to optimistic thread item IDs  
    optimisticThreadItemIdMap: Record<string, string>;
    creditLimit: {
        remaining: number | undefined;
        maxLimit: number | undefined;
        reset: string | undefined;
        isAuthenticated: boolean;
        isFetched: boolean;
    };
};

type Actions = {
    setModel: (model: Model) => void;
    setEditor: (editor: any) => void;
    setContext: (context: string) => void;
    setDomain: (domain: string) => void;
    fetchRemainingCredits: () => Promise<void>;
    setImageAttachment: (imageAttachment: { base64?: string; file?: File }) => void;
    clearImageAttachment: () => void;
    setIsGenerating: (isGenerating: boolean) => void;
    stopGeneration: () => void;
    setAbortController: (abortController: AbortController) => void;
    createThread: (optimisticId: string, thread?: Pick<Thread, 'title'>) => Promise<Thread>;
    setChatMode: (chatMode: ChatMode) => void;
    updateThread: (thread: Pick<Thread, 'id' | 'title'>) => Promise<void>;
    getThread: (threadId: string) => Promise<Thread | null>;
    pinThread: (threadId: string) => Promise<void>;
    unpinThread: (threadId: string) => Promise<void>;
    createThreadItem: (threadItem: ThreadItem) => Promise<void>;
    updateThreadItem: (threadId: string, threadItem: Partial<ThreadItem>) => Promise<void>;
    switchThread: (threadId: string) => void;
    setActiveThreadItemView: (threadItemId: string) => void;
    setCustomInstructions: (customInstructions: string) => void;
    deleteThreadItem: (threadItemId: string) => Promise<void>;
    deleteThread: (threadId: string) => Promise<void>;
    getPreviousThreadItems: (threadId?: string) => ThreadItem[];
    getCurrentThreadItem: (threadId?: string) => ThreadItem | null;
    getCurrentThread: () => Thread | null;
    removeFollowupThreadItems: (threadItemId: string) => Promise<void>;
    getThreadItems: (threadId: string) => Promise<ThreadItem[]>;
    loadThreadItems: (threadId: string) => Promise<void>;
    setCurrentThreadItem: (threadItem: ThreadItem) => void;
    clearAllThreads: () => void;
    setCurrentSources: (sources: string[]) => void;
    setUseWebSearch: (useWebSearch: boolean) => void;
    setShowSuggestions: (showSuggestions: boolean) => void;
    // Optimistic ID mapping actions
    setOptimisticIdMapping: (realId: string, optimisticId: string) => void;
    getOptimisticIdFromReal: (realId: string) => string | null;
    getRealIdFromOptimistic: (optimisticId: string) => string | null;
    clearOptimisticIdMapping: (realId: string) => void;
    // Thread item optimistic ID mapping actions
    setOptimisticThreadItemIdMapping: (realThreadItemId: string, optimisticThreadItemId: string) => void;
    getOptimisticThreadItemIdFromReal: (realThreadItemId: string) => string | null;
    getRealThreadItemIdFromOptimistic: (optimisticThreadItemId: string) => string | null;
    clearOptimisticThreadItemIdMapping: (realThreadItemId: string) => void;
    isThreadExpertCertified: (threadId: string) => boolean;
    getExpertCertificationStatus: (threadId: string) => 'expert-certified' | 'not-certified' | 'none';
};

// Utility function to debounce function calls
function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    return (...args: Parameters<T>) => {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Utility function to throttle function calls
function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle = false;
    let lastArgs: Parameters<T> | null = null;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
                if (lastArgs) {
                    func(...lastArgs);
                    lastArgs = null;
                }
            }, limit);
        } else {
            lastArgs = args;
        }
    };
}

export const useChatStore = create(
    immer<State & Actions>((set, get) => ({
        model: models[0],
        isGenerating: false,
        editor: undefined,
        context: '',
        threads: [],
        chatMode: ChatMode.GPT_4_1,
        threadItems: [],
        useWebSearch: false,
        customInstructions: '',
        currentThreadId: null,
        activeThreadItemView: null,
        currentThread: null,
        currentThreadItem: null,
        imageAttachment: { base64: undefined, file: undefined },
        messageGroups: [],
        abortController: null,
        isLoadingThreads: false,
        isLoadingThreadItems: false,
        currentSources: [],
        optimisticIdMap: {},
        optimisticThreadItemIdMap: {},
        creditLimit: {
            remaining: undefined,
            maxLimit: undefined,
            reset: undefined,
            isAuthenticated: false,
            isFetched: false,
        },
        showSuggestions: true,
        domain: 'legal',

        setCustomInstructions: (customInstructions: string) => {
            const existingConfig = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');
            localStorage.setItem(
                CONFIG_KEY,
                JSON.stringify({ ...existingConfig, customInstructions })
            );
            set(state => {
                state.customInstructions = customInstructions;
            });
        },

        setImageAttachment: (imageAttachment: { base64?: string; file?: File }) => {
            set(state => {
                state.imageAttachment = imageAttachment;
            });
        },

        clearImageAttachment: () => {
            set(state => {
                state.imageAttachment = { base64: undefined, file: undefined };
            });
        },

        setActiveThreadItemView: (threadItemId: string) => {
            set(state => {
                state.activeThreadItemView = threadItemId;
            });
        },

        setShowSuggestions: (showSuggestions: boolean) => {
            const existingConfig = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');
            localStorage.setItem(CONFIG_KEY, JSON.stringify({ ...existingConfig, showSuggestions }));
            set(state => {
                state.showSuggestions = showSuggestions;
            });
        },

        setUseWebSearch: (useWebSearch: boolean) => {
            const existingConfig = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');
            localStorage.setItem(CONFIG_KEY, JSON.stringify({ ...existingConfig, useWebSearch }));
            set(state => {
                state.useWebSearch = useWebSearch;
            });
        },

        setChatMode: (chatMode: ChatMode) => {
            const existingConfig = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');
            localStorage.setItem(CONFIG_KEY, JSON.stringify({ ...existingConfig, chatMode }));
            set(state => {
                state.chatMode = chatMode;
            });
        },

        pinThread: async (threadId: string) => {
            try {
                // Check if this is an optimistic ID and map it to real ID
                const realId = get().getRealIdFromOptimistic(threadId) || threadId;
                
                const updatedThread = await ThreadApiService.toggleThreadPin(realId);
                set(state => {
                    const index = state.threads.findIndex(t => t.id === realId || t.id === threadId);
                    if (index !== -1) {
                        state.threads[index] = updatedThread;
                    }
                    if (state.currentThreadId === threadId || state.currentThreadId === realId) {
                        state.currentThread = updatedThread;
                    }
                });
            } catch (error) {
                console.error('Failed to pin thread:', error);
            }
        },

        unpinThread: async (threadId: string) => {
            try {
                // Check if this is an optimistic ID and map it to real ID
                const realId = get().getRealIdFromOptimistic(threadId) || threadId;
                
                const updatedThread = await ThreadApiService.toggleThreadPin(realId);
                set(state => {
                    const index = state.threads.findIndex(t => t.id === realId || t.id === threadId);
                    if (index !== -1) {
                        state.threads[index] = updatedThread;
                    }
                    if (state.currentThreadId === threadId || state.currentThreadId === realId) {
                        state.currentThread = updatedThread;
                    }
                });
            } catch (error) {
                console.error('Failed to unpin thread:', error);
            }
        },

        fetchRemainingCredits: async () => {
            try {
                const response = await fetch('/api/messages/remaining');
                if (!response.ok) throw new Error('Failed to fetch credit info');

                const data = await response.json();
                set({
                    creditLimit: {
                        ...data,
                        isFetched: true,
                    },
                });
            } catch (error) {
                console.error('Error fetching remaining credits:', error);
            }
        },

        removeFollowupThreadItems: async (threadItemId: string) => {
            try {
                const threadItem = get().threadItems.find(item => item.id === threadItemId);
                if (!threadItem) return;

                const threadItemCreatedAt = threadItem.createdAt instanceof Date ? threadItem.createdAt : new Date(threadItem.createdAt);

                const threadItems = get().threadItems.filter(
                    item => {
                        const itemCreatedAt = item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt);
                        return item.threadId === threadItem.threadId && 
                               itemCreatedAt > threadItemCreatedAt;
                    }
                );

                for (const item of threadItems) {
                    // Check if this is an optimistic thread item ID and map it to real ID
                    const realThreadItemId = get().getRealThreadItemIdFromOptimistic(item.id) || item.id;
                    await ThreadApiService.deleteThreadItem(item.threadId, realThreadItemId);
                }

                set(state => {
                    state.threadItems = state.threadItems.filter(
                        t => {
                            const tCreatedAt = t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt);
                            return tCreatedAt <= threadItemCreatedAt || t.threadId !== threadItem.threadId;
                        }
                    );
                });
            } catch (error) {
                console.error('Failed to remove follow-up thread items:', error);
            }
        },

        getThreadItems: async (threadId: string) => {
            try {
                // Check if this is an optimistic ID and map it to real ID
                const realId = get().getRealIdFromOptimistic(threadId) || threadId;
                
                return await ThreadApiService.getThreadItems(realId);
            } catch (error) {
                console.error('Failed to get thread items:', error);
                return [];
            }
        },

        setCurrentSources: (sources: string[]) => {
            set(state => {
                state.currentSources = sources;
            });
        },

        setCurrentThreadItem: threadItem =>
            set(state => {
                state.currentThreadItem = threadItem;
            }),

        setEditor: editor =>
            set(state => {
                state.editor = editor;
            }),

        setContext: context =>
            set(state => {
                state.context = context;
            }),

        setIsGenerating: isGenerating => {
            useAppStore.getState().dismissSideDrawer();
            set(state => {
                state.isGenerating = isGenerating;
            });
        },

        stopGeneration: () => {
            set(state => {
                state.isGenerating = false;
                state.abortController?.abort();
            });
        },

        setAbortController: abortController =>
            set(state => {
                state.abortController = abortController;
            }),

        loadThreadItems: async (threadId: string) => {
            try {
                set(state => {
                    state.isLoadingThreadItems = true;
                });

                // Check if this is an optimistic ID and map it to real ID
                const realId = get().getRealIdFromOptimistic(threadId) || threadId;
                
                const threadItems = await ThreadApiService.getThreadItems(realId);
                set(state => {
                    state.threadItems = threadItems;
                    state.isLoadingThreadItems = false;
                });
            } catch (error) {
                console.error('Failed to load thread items:', error);
                set(state => {
                    state.isLoadingThreadItems = false;
                });
            }
        },

        clearAllThreads: async () => {
            try {
                await ThreadApiService.clearAllThreads();
                set(state => {
                    state.threads = [];
                    state.threadItems = [];
                    state.currentThreadId = null;
                    state.currentThread = null;
                });
            } catch (error) {
                console.error('Failed to clear all threads:', error);
            }
        },

        getThread: async (threadId: string) => {
            try {
                console.log('chat.store.ts - getThread - threadId', threadId);
                
                // Check if this is an optimistic ID and map it to real ID
                const realId = get().getRealIdFromOptimistic(threadId) || threadId;
                console.log('chat.store.ts - getThread - realId', realId);
                
                // First check if thread exists in local state
                const localThread = get().threads.find(t => t.id === realId || t.id === threadId);
                if (localThread) {
                    console.log('chat.store.ts - getThread - found in local state', localThread);
                    return localThread;
                }
                
                // If not found locally, fetch from API
                const thread = await ThreadApiService.getThread(realId);
                console.log('chat.store.ts - getThread - fetched from API', thread);
                
                // Add to local state
                set(state => {
                    const existingIndex = state.threads.findIndex(t => t.id === thread.id);
                    if (existingIndex === -1) {
                        state.threads.push(thread);
                    }
                });
                
                return thread;
            } catch (error) {
                console.error('Failed to get thread:', error);
                return null;
            }
        },

        createThread: async (optimisticId: string, thread?: Pick<Thread, 'title'>) => {
            // Create optimistic thread for immediate UI feedback
            console.log('chat.store.ts - createThread - optimisticId', optimisticId, 'from domain', get().domain);
            const optimisticThread: Thread = {
                id: optimisticId,
                title: thread?.title || 'New Chat',
                pinned: false,
                pinnedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
                domain: get().domain || 'legal',
            };
            
            // Add optimistic thread to state
            set(state => {
                state.threads.unshift(optimisticThread);
                state.currentThreadId = optimisticId;
                state.currentThread = optimisticThread;
            });
            
            try {
                // Create thread in database
                const realThread = await ThreadApiService.createThread({
                    title: thread?.title || 'New Chat',
                    domain: get().domain || 'legal',
                    pinned: false,
                });
                
                // Store the mapping: realId -> optimisticId
                get().setOptimisticIdMapping(realThread.id, optimisticId);
                
                // Update the thread in state with real data
                set(state => {
                    const threadIndex = state.threads.findIndex(t => t.id === optimisticId);
                    if (threadIndex !== -1) {
                        state.threads[threadIndex] = realThread;
                    }
                    state.currentThreadId = realThread.id;
                    state.currentThread = realThread;
                });
                
                // Update URL with real ID
                if (typeof window !== 'undefined') {
                    const currentPath = window.location.pathname;
                    if (currentPath.includes(optimisticId)) {
                        const newPath = currentPath.replace(optimisticId, realThread.id);
                        window.history.replaceState({}, '', newPath);
                    }
                }
                
                return realThread;
            } catch (error) {
                console.error('Failed to create thread:', error);
                
                // Remove optimistic thread on error
                set(state => {
                    state.threads = state.threads.filter(t => t.id !== optimisticId);
                    state.currentThreadId = null;
                });
                
                // Return fallback thread
                const fallbackThread: Thread = {
                    id: optimisticId,
                    title: thread?.title || 'New Chat',
                    pinned: false,
                    pinnedAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    domain: get().domain || 'legal',
                };
                
                return fallbackThread;
            }
        },

        setModel: async (model: Model) => {
            const existingConfig = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');
            localStorage.setItem(CONFIG_KEY, JSON.stringify({ ...existingConfig, model: model.id }));
            set(state => {
                state.model = model;
            });
        },

        updateThread: async thread => {
            try {
                console.log('chat.store.ts - updateThread - thread', thread);
                
                // Check if this is an optimistic ID and map it to real ID
                const realId = get().getRealIdFromOptimistic(thread.id) || thread.id;
                console.log('chat.store.ts - updateThread - realId', realId);
                
                const updatedThread = await ThreadApiService.updateThread(realId, {
                    title: thread.title,
                });
                console.log('chat.store.ts - updateThread - updatedThread', updatedThread);
                set(state => {
                    const index = state.threads.findIndex((t: Thread) => t.id === realId || t.id === thread.id);
                    if (index !== -1) {
                        state.threads[index] = updatedThread;
                    }
                    if (state.currentThreadId === thread.id || state.currentThreadId === realId) {
                        state.currentThread = updatedThread;
                    }
                });
            } catch (error) {
                console.error('Failed to update thread:', error);
            }
        },

        createThreadItem: async threadItem => {
            const currentThreadId = get().currentThreadId;
            if (!currentThreadId) return;

            // Get real thread ID (in case currentThreadId is optimistic)
            const realThreadId = get().getRealIdFromOptimistic(currentThreadId) || currentThreadId;

            try {
                const newThreadItem = await ThreadApiService.createThreadItem(realThreadId, {
                    query: threadItem.query,
                    parentId: threadItem.parentId,
                    mode: threadItem.mode,
                    status: threadItem.status,
                    error: threadItem.error,
                    imageAttachment: threadItem.imageAttachment,
                    toolCalls: threadItem.toolCalls,
                    toolResults: threadItem.toolResults,
                    steps: threadItem.steps,
                    answer: threadItem.answer,
                    metadata: threadItem.metadata,
                    sources: threadItem.sources,
                    suggestions: threadItem.suggestions,
                    object: threadItem.object,
                });

                // Store the mapping: realThreadItemId -> optimisticThreadItemId
                if (threadItem.id !== newThreadItem.id) {
                    get().setOptimisticThreadItemIdMapping(newThreadItem.id, threadItem.id);
                }

                set(state => {
                    const existingIndex = state.threadItems.findIndex(t => t.id === threadItem.id);
                    if (existingIndex !== -1) {
                        // Replace optimistic thread item with real one
                        state.threadItems[existingIndex] = newThreadItem;
                    } else {
                        state.threadItems.push(newThreadItem);
                    }
                });
            } catch (error) {
                console.error('Failed to create thread item:', error);
                // Add to local state as fallback
                set(state => {
                    const existingIndex = state.threadItems.findIndex(t => t.id === threadItem.id);
                    if (existingIndex !== -1) {
                        state.threadItems[existingIndex] = threadItem;
                    } else {
                        state.threadItems.push({ ...threadItem, threadId: realThreadId });
                    }
                });
            }
        },

        updateThreadItem: async (threadId, threadItem) => {
            if (!threadItem.id) return;
            if (!threadId) return;

            try {
                // Check if this is an optimistic thread ID and map it to real ID
                const realThreadId = get().getRealIdFromOptimistic(threadId) || threadId;
                
                // Check if this is an optimistic thread item ID and map it to real ID
                const realThreadItemId = get().getRealThreadItemIdFromOptimistic(threadItem.id) || threadItem.id;
                
                console.log('chat.store.ts - updateThreadItem - threadId', threadId, 'realThreadId', realThreadId, 'threadItemId', threadItem.id, 'realThreadItemId', realThreadItemId, 'threadItem', threadItem);
                
                const updatedItem = await ThreadApiService.updateThreadItem(realThreadId, realThreadItemId, {
                    query: threadItem.query,
                    status: threadItem.status,
                    error: threadItem.error,
                    imageAttachment: threadItem.imageAttachment,
                    toolCalls: threadItem.toolCalls,
                    toolResults: threadItem.toolResults,
                    steps: threadItem.steps,
                    answer: threadItem.answer,
                    metadata: threadItem.metadata,
                    sources: threadItem.sources,
                    suggestions: threadItem.suggestions,
                    object: threadItem.object,
                });
                console.log('chat.store.ts - updateThreadItem - updatedItem', updatedItem);
                set(state => {
                    // Find by optimistic ID or real ID
                    const index = state.threadItems.findIndex(t => t.id === threadItem.id || t.id === realThreadItemId);
                    if (index !== -1) {
                        state.threadItems[index] = updatedItem;
                    } else {
                        state.threadItems.push(updatedItem);
                    }
                });
            } catch (error) {
                console.error('Failed to update thread item:', error);
                // Update local state as fallback
                const existingItem = get().threadItems.find(t => t.id === threadItem.id);
                const realThreadId = get().getRealIdFromOptimistic(threadId) || threadId;
                const updatedItem = existingItem
                    ? { ...existingItem, ...threadItem, threadId: realThreadId, updatedAt: new Date() }
                    : ({
                          id: threadItem.id,
                          threadId: realThreadId,
                          createdAt: new Date(),
                          updatedAt: new Date(),
                          ...threadItem,
                      } as ThreadItem);

                set(state => {
                    const index = state.threadItems.findIndex(t => t.id === threadItem.id);
                    if (index !== -1) {
                        state.threadItems[index] = updatedItem;
                    } else {
                        state.threadItems.push(updatedItem);
                    }
                });
            }
        },

        switchThread: async (threadId: string) => {
            // Check if this is an optimistic ID and map it to real ID
            const realId = get().getRealIdFromOptimistic(threadId) || threadId;
            
            const thread = get().threads.find(t => t.id === realId || t.id === threadId);
            const existingConfig = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');
            localStorage.setItem(
                CONFIG_KEY,
                JSON.stringify({
                    ...existingConfig,
                    currentThreadId: realId,
                })
            );
            set(state => {
                state.currentThreadId = realId;
                state.currentThread = thread || null;
            });
            await get().loadThreadItems(realId);
        },

        deleteThreadItem: async threadItemId => {
            const threadId = get().currentThreadId;
            if (!threadId) return;

            try {
                // Check if this is an optimistic thread ID and map it to real ID
                const realThreadId = get().getRealIdFromOptimistic(threadId) || threadId;
                
                // Check if this is an optimistic thread item ID and map it to real ID
                const realThreadItemId = get().getRealThreadItemIdFromOptimistic(threadItemId) || threadItemId;
                
                await ThreadApiService.deleteThreadItem(realThreadId, realThreadItemId);
                
                set(state => {
                    state.threadItems = state.threadItems.filter(
                        (t: ThreadItem) => t.id !== threadItemId && t.id !== realThreadItemId
                    );
                });

                // Check if there are any thread items left for this thread
                const remainingItems = get().threadItems.filter(item => item.threadId === realThreadId);

                // If no items remain, delete the thread and redirect
                if (remainingItems.length === 0) {
                    await ThreadApiService.deleteThread(realThreadId);
                    set(state => {
                        state.threads = state.threads.filter((t: Thread) => t.id !== threadId && t.id !== realThreadId);
                        const nextThread = state.threads[0];
                        state.currentThreadId = nextThread?.id || null;
                        state.currentThread = nextThread || null;
                    });

                    // Redirect to /chat page
                    if (typeof window !== 'undefined') {
                        window.location.href = '/chat';
                    }
                }
            } catch (error) {
                console.error('Failed to delete thread item:', error);
            }
        },

        deleteThread: async threadId => {
            try {
                // Check if this is an optimistic ID and map it to real ID
                const realId = get().getRealIdFromOptimistic(threadId) || threadId;
                
                await ThreadApiService.deleteThread(realId);
                set(state => {
                    state.threads = state.threads.filter((t: Thread) => t.id !== threadId && t.id !== realId);
                    const nextThread = state.threads[0];
                    state.currentThreadId = nextThread?.id || null;
                    state.currentThread = nextThread || null;
                });
            } catch (error) {
                console.error('Failed to delete thread:', error);
            }
        },

        getPreviousThreadItems: threadId => {
            const state = get();
            let targetThreadId = threadId || state.currentThreadId;
            
            // Check if this is an optimistic ID and map it to real ID for filtering
            if (targetThreadId) {
                const realId = get().getRealIdFromOptimistic(targetThreadId);
                if (realId) {
                    targetThreadId = realId;
                }
            }

            const allThreadItems = state.threadItems
                .filter(item => item.threadId === targetThreadId)
                .sort((a, b) => {
                    const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
                    const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
                    return aTime - bTime;
                });

            if (allThreadItems.length > 1) {
                return allThreadItems.slice(0, -1);
            }

            return [];
        },

        getCurrentThreadItem: (threadId?: string) => {
            const state = get();
            let targetThreadId = threadId || state.currentThreadId;
            
            // Check if this is an optimistic ID and map it to real ID for filtering
            if (targetThreadId) {
                const realId = get().getRealIdFromOptimistic(targetThreadId);
                if (realId) {
                    targetThreadId = realId;
                }
            }

            const allThreadItems = state.threadItems
                .filter(item => item.threadId === targetThreadId)
                .sort((a, b) => {
                    const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
                    const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
                    return aTime - bTime;
                });
            return allThreadItems[allThreadItems.length - 1] || null;
        },

        getCurrentThread: () => {
            const state = get();
            return state.threads.find(t => t.id === state.currentThreadId) || null;
        },

        setDomain: (domain: string) => {
            set(state => {
                state.domain = domain;
                // Optionally set domain-specific custom instructions
                if (domain === 'legal' && !state.customInstructions) {
                    state.customInstructions = 'Focus only on legal matters. If asked about non-legal topics, politely decline and suggest using the appropriate domain.';
                } else if (domain === 'civil_engineering' && !state.customInstructions) {
                    state.customInstructions = 'Focus only on civil engineering and construction topics. If asked about non-engineering topics, politely decline and suggest using the appropriate domain.';
                } else if (domain === 'real_estate' && !state.customInstructions) {
                    state.customInstructions = 'Focus only on real estate and property topics. If asked about non-real estate topics, politely decline and suggest using the appropriate domain.';
                }
            });
        },

        isThreadExpertCertified: (threadId: string) => {
            const state = get();
            
            // Check if this is an optimistic ID and map it to real ID for lookup
            const realId = get().getRealIdFromOptimistic(threadId) || threadId;
            
            const thread = state.threads.find(t => t.id === realId || t.id === threadId);
            if (!thread) return false;

            // Check if thread is from yesterday
            const threadCreatedAt = thread.createdAt instanceof Date ? thread.createdAt : new Date(thread.createdAt);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            const isFromYesterday = 
                threadCreatedAt.getDate() === yesterday.getDate() &&
                threadCreatedAt.getMonth() === yesterday.getMonth() &&
                threadCreatedAt.getFullYear() === yesterday.getFullYear();

            if (isFromYesterday) {
                // Get all threads from yesterday, sorted by creation time (newest first)
                const yesterdayThreads = state.threads
                    .filter(t => {
                        const tCreatedAt = t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt);
                        return tCreatedAt.getDate() === yesterday.getDate() &&
                               tCreatedAt.getMonth() === yesterday.getMonth() &&
                               tCreatedAt.getFullYear() === yesterday.getFullYear();
                    })
                    .sort((a, b) => {
                        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
                        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
                        return bTime - aTime;
                    });

                // Find the position of this thread in yesterday's threads (using real ID)
                const threadIndex = yesterdayThreads.findIndex(t => t.id === realId);
                
                // Last 3 threads are NOT certified (positions 0, 1, 2 in the sorted array)
                // All other yesterday threads are certified
                return threadIndex >= 3;
            }

            // For all other threads (including today's threads with answers), return false
            return false;
        },

        getExpertCertificationStatus: (threadId: string) => {
            const state = get();
            
            // Check if this is an optimistic ID and map it to real ID for lookup
            const realId = get().getRealIdFromOptimistic(threadId) || threadId;
            
            const thread = state.threads.find(t => t.id === realId || t.id === threadId);
            if (!thread) return 'none';

            // Check if thread is from yesterday
            const threadCreatedAt = thread.createdAt instanceof Date ? thread.createdAt : new Date(thread.createdAt);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            const isFromYesterday = 
                threadCreatedAt.getDate() === yesterday.getDate() &&
                threadCreatedAt.getMonth() === yesterday.getMonth() &&
                threadCreatedAt.getFullYear() === yesterday.getFullYear();

            if (isFromYesterday) {
                // Get all threads from yesterday, sorted by creation time (newest first)
                const yesterdayThreads = state.threads
                    .filter(t => {
                        const tCreatedAt = t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt);
                        return tCreatedAt.getDate() === yesterday.getDate() &&
                               tCreatedAt.getMonth() === yesterday.getMonth() &&
                               tCreatedAt.getFullYear() === yesterday.getFullYear();
                    })
                    .sort((a, b) => {
                        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
                        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
                        return bTime - aTime;
                    });

                // Find the position of this thread in yesterday's threads (using real ID)
                const threadIndex = yesterdayThreads.findIndex(t => t.id === realId);
                
                // Last 3 threads (most recent) are NOT certified
                if (threadIndex >= 0 && threadIndex < 3) {
                    return 'not-certified';
                }
                // All other yesterday threads are expert certified
                if (threadIndex >= 3) {
                    return 'expert-certified';
                }
            }

            // For all other threads (including today's threads with answers), return 'none'
            return 'none';
        },

        // Optimistic ID mapping actions
        setOptimisticIdMapping: (realId: string, optimisticId: string) => {
            set(state => {
                state.optimisticIdMap[realId] = optimisticId;
            });
        },
        getOptimisticIdFromReal: (realId: string) => {
            return get().optimisticIdMap[realId] || null;
        },
        getRealIdFromOptimistic: (optimisticId: string) => {
            // Reverse lookup: find the key (realId) that has this value (optimisticId)
            const map = get().optimisticIdMap;
            for (const realId in map) {
                if (map[realId] === optimisticId) {
                    return realId;
                }
            }
            return null;
        },
        clearOptimisticIdMapping: (realId: string) => {
            set(state => {
                delete state.optimisticIdMap[realId];
            });
        },
        // Thread item optimistic ID mapping actions
        setOptimisticThreadItemIdMapping: (realThreadItemId: string, optimisticThreadItemId: string) => {
            set(state => {
                state.optimisticThreadItemIdMap[realThreadItemId] = optimisticThreadItemId;
            });
        },
        getOptimisticThreadItemIdFromReal: (realThreadItemId: string) => {
            return get().optimisticThreadItemIdMap[realThreadItemId] || null;
        },
        getRealThreadItemIdFromOptimistic: (optimisticThreadItemId: string) => {
            // Reverse lookup: find the key (realThreadItemId) that has this value (optimisticThreadItemId)
            const map = get().optimisticThreadItemIdMap;
            for (const realThreadItemId in map) {
                if (map[realThreadItemId] === optimisticThreadItemId) {
                    return realThreadItemId;
                }
            }
            return null;
        },
        clearOptimisticThreadItemIdMapping: (realThreadItemId: string) => {
            set(state => {
                delete state.optimisticThreadItemIdMap[realThreadItemId];
            });
        },
    }))
);

if (typeof window !== 'undefined') {
    // Initialize store with data from API
    loadInitialData().then(
        ({
            threads,
            currentThreadId,
            chatMode,
            useWebSearch,
            showSuggestions,
            customInstructions,
        }) => {
            useChatStore.setState({
                threads,
                currentThreadId,
                currentThread: threads.find(t => t.id === currentThreadId) || threads?.[0],
                chatMode,
                useWebSearch,
                showSuggestions,
                customInstructions,
            });
        }
    );
}
