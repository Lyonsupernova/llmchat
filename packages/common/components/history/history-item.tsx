import { useChatStore } from '@repo/common/store';
import { Thread } from '@repo/shared/types';
import {
    Button,
    cn,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuSub,
    DropdownMenuTrigger,
    Flex,
    Input,
} from '@repo/ui';
import { MoreHorizontal } from 'lucide-react';
import { IconShieldCheck, IconShieldX, IconShield } from '@tabler/icons-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export const HistoryItem = ({
    thread,
    dismiss,
    isActive,
    isPinned,
    pinThread,
    unpinThread,
}: {
    thread: Thread;
    dismiss: () => void;
    isActive?: boolean;
    isPinned?: boolean;
    pinThread: (threadId: string) => void;
    unpinThread: (threadId: string) => void;
}) => {
    const { push } = useRouter();
    const { threadId: currentThreadId } = useParams();
    const updateThread = useChatStore(state => state.updateThread);
    const getExpertCertificationStatus = useChatStore(state => state.getExpertCertificationStatus);
    const updateThreadCertifiedStatus = useChatStore(state => state.updateThreadCertifiedStatus);
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(thread.title);
    const deleteThread = useChatStore(state => state.deleteThread);
    const historyInputRef = useRef<HTMLInputElement>(null);
    const switchThread = useChatStore(state => state.switchThread);
    const [openOptions, setOpenOptions] = useState(false);

    // Get expert certification status
    const certificationStatus = getExpertCertificationStatus(thread.id);

    useEffect(() => {
        if (isEditing) {
            historyInputRef.current?.focus();
        }
    }, [isEditing]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
    };

    const handleInputBlur = () => {
        setIsEditing(false);
        updateThread({
            id: thread.id,
            title: title?.trim() || 'Untitled',
        });
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setIsEditing(false);
            updateThread({
                id: thread.id,
                title: title?.trim() || 'Untitled',
            });
        }
    };

    const containerClasses = cn(
        'gap-2 w-full group w-full relative flex flex-row items-center h-7 py-0.5 pl-2 pr-1 rounded-sm hover:bg-quaternary',
        isActive || isEditing ? 'bg-tertiary' : '',
        certificationStatus === 'none' && !isActive && !isEditing ? 'bg-orange-50 border border-orange-200 dark:bg-orange-900/10 dark:border-orange-800/30' : '',
        certificationStatus === 'expert-certified' && !isActive && !isEditing ? 'bg-green-50 border border-green-200 dark:bg-green-900/10 dark:border-green-800/30' : '',
        certificationStatus === 'not-certified' && !isActive && !isEditing ? 'bg-red-50 border border-red-200 dark:bg-red-900/10 dark:border-red-800/30' : ''
    );

    const handleEditClick = () => {
        setIsEditing(true);
        setTimeout(() => {
            historyInputRef.current?.focus();
        }, 500);
    };

    const handleDeleteConfirm = () => {
        deleteThread(thread.id);
        if (currentThreadId === thread.id) {
            push('/chat');
        }
    };

    return (
        <div key={thread.id} className={containerClasses}>
            {isEditing ? (
                <Input
                    variant="ghost"
                    className="h-5 pl-0 text-xs"
                    ref={historyInputRef}
                    value={title || 'Untitled'}
                    onChange={handleInputChange}
                    onKeyDown={handleInputKeyDown}
                    onBlur={handleInputBlur}
                />
            ) : (
                <Link
                    href={`/chat/${thread.id}`}
                    className="flex flex-1 items-center"
                    onClick={() => switchThread(thread.id)}
                >
                    <Flex
                        direction="col"
                        items="start"
                        className="flex-1 overflow-hidden"
                        gap="none"
                    >
                        <div className="flex items-center gap-1 w-full">
                            <p className="hover:text-foreground line-clamp-1 flex-1 text-xs">
                                {thread.title}
                            </p>
                            {certificationStatus === 'none' && (
                                <IconShield 
                                    size={12} 
                                    strokeWidth={2} 
                                    className="text-orange-600 dark:text-orange-400 flex-shrink-0" 
                                    title="Pending Certification"
                                />
                            )}
                            {certificationStatus === 'expert-certified' && (
                                <IconShieldCheck 
                                    size={12} 
                                    strokeWidth={2} 
                                    className="text-green-600 dark:text-green-400 flex-shrink-0" 
                                    title="Expert Certified"
                                />
                            )}
                            {certificationStatus === 'not-certified' && (
                                <IconShieldX 
                                    size={12} 
                                    strokeWidth={2} 
                                    className="text-red-600 dark:text-red-400 flex-shrink-0" 
                                    title="Not Certified"
                                />
                            )}
                        </div>
                    </Flex>
                </Link>
            )}
            <DropdownMenu open={openOptions} onOpenChange={setOpenOptions}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon-xs"
                        className="bg-quaternary invisible absolute right-1 shrink-0 group-hover:visible group-hover:w-6"
                        onClick={e => {
                            e.stopPropagation();
                            setOpenOptions(!openOptions);
                        }}
                    >
                        <MoreHorizontal
                            size={14}
                            strokeWidth="2"
                            className="text-muted-foreground/50"
                        />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="right">
                    <DropdownMenuItem
                        onClick={e => {
                            e.stopPropagation();
                            handleEditClick();
                        }}
                    >
                        Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={e => {
                            e.stopPropagation();
                            handleDeleteConfirm();
                        }}
                    >
                        Delete Chat
                    </DropdownMenuItem>
                    {isPinned ? (
                        <DropdownMenuItem onClick={() => unpinThread(thread.id)}>
                            Unpin
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem onClick={() => pinThread(thread.id)}>
                            Pin
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <IconShield size={16} strokeWidth={2} className="mr-2" />
                            Certification Status
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem
                                onClick={() => updateThreadCertifiedStatus(thread.id, 'PENDING')}
                                className={certificationStatus === 'none' ? 'bg-accent' : ''}
                            >
                                <IconShield size={16} strokeWidth={2} className="mr-2" />
                                Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => updateThreadCertifiedStatus(thread.id, 'CERTIFIED')}
                                className={certificationStatus === 'expert-certified' ? 'bg-accent' : ''}
                            >
                                <IconShieldCheck size={16} strokeWidth={2} className="mr-2 text-green-600" />
                                Certified
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => updateThreadCertifiedStatus(thread.id, 'NOT_CERTIFIED')}
                                className={certificationStatus === 'not-certified' ? 'bg-accent' : ''}
                            >
                                <IconShieldX size={16} strokeWidth={2} className="mr-2 text-red-600" />
                                Not Certified
                            </DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};
