'use client';
import Link from 'next/link';
import { useFeedbackStore } from './feedback-widget';

export const Footer = () => {
    const { open: openFeedback } = useFeedbackStore();

    const links = [
        {
            href: '',
            label: 'Feedback',
            onClick: (e: React.MouseEvent) => {
                e.preventDefault();
                openFeedback();
            },
        },
        {
            href: '/terms',
            label: 'Terms',
        },
        {
            href: '/privacy',
            label: 'Privacy',
        },
    ];

    return (
        <div className="flex w-full flex-row items-center justify-center gap-4 p-3">
            {links.map(link => (
                <Link
                    key={link.href || link.label}
                    href={link.href || '#'}
                    onClick={link.onClick}
                    className="text-muted-foreground text-xs opacity-50 hover:opacity-100 cursor-pointer"
                >
                    {link.label}
                </Link>
            ))}
        </div>
    );
};
