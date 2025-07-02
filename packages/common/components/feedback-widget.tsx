import { useAuth } from '@clerk/nextjs';
import { Button, Textarea } from '@repo/ui';
import { IconCircleCheckFilled, IconHelpSmall, IconX } from '@tabler/icons-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { create } from 'zustand';

// Global state for feedback widget
interface FeedbackStore {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
}

export const useFeedbackStore = create<FeedbackStore>((set, get) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
    toggle: () => set({ isOpen: !get().isOpen }),
}));

export const FeedbackWidget = () => {
    const { userId } = useAuth();
    const { isOpen, close } = useFeedbackStore();
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = async () => {
        if (!feedback.trim()) return;

        setIsSubmitting(true);

        try {
            await fetch('/api/feedback', {
                method: 'POST',
                body: JSON.stringify({ feedback }),
            });
            setIsSuccess(true);
            setFeedback('');

            setTimeout(() => {
                setIsSuccess(false);
                close();
            }, 2000);
        } catch (error) {
            console.error('Failed to submit feedback:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!userId) {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex items-end justify-end">
            <AnimatePresence mode="wait">
                {isOpen && (
                    <motion.div
                        className="border-hard w-80 max-w-xs rounded-xl border bg-white shadow-2xl"
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                    >
                        {!isSuccess ? (
                            <>
                                <div className="flex w-full flex-row justify-between px-4 pt-4">
                                    <p className="text-sm font-medium">Help us improve</p>
                                    <Button
                                        variant="ghost"
                                        size="icon-xs"
                                        rounded="full"
                                        onClick={close}
                                    >
                                        <IconX size={14} strokeWidth={2} />
                                    </Button>
                                </div>
                                <Textarea
                                    placeholder="Share your thoughts or suggestions to help us improve."
                                    value={feedback}
                                    className="placeholder:text-muted-foreground/50 border-none bg-transparent px-4 py-2"
                                    onChange={e => setFeedback(e.target.value)}
                                    ref={inputRef}
                                />
                                <div className="flex w-full flex-row justify-end px-4 pb-4">
                                    <Button
                                        variant="default"
                                        size="xs"
                                        disabled={isSubmitting || !feedback.trim()}
                                        rounded="full"
                                        onClick={handleSubmit}
                                    >
                                        {isSubmitting ? 'Sending...' : 'Send Feedback'}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="flex w-full flex-row gap-3 p-4">
                                <div className="flex flex-col items-center justify-center">
                                    <IconCircleCheckFilled
                                        size={24}
                                        strokeWidth={2}
                                        className="text-brand"
                                    />
                                </div>
                                <div className="flex flex-col gap-0">
                                    <p className="text-sm font-medium">Thank you!</p>
                                    <p className="text-muted-foreground/50 text-sm">
                                        Your feedback has been sent.
                                    </p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
