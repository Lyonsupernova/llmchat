import { PostHog } from 'posthog-node';
import { v4 as uuidv4 } from 'uuid';

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const client = posthogKey ? new PostHog(posthogKey, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
}) : null;

export enum EVENT_TYPES {
    WORKFLOW_SUMMARY = 'workflow_summary',
}

export type PostHogEvent = {
    event: EVENT_TYPES;
    userId: string;
    properties: Record<string, any>;
};

export const posthog = {
    capture: (event: PostHogEvent) => {
        if (client) {
            client.capture({
                distinctId: event?.userId || uuidv4(),
                event: event.event,
                properties: event.properties,
            });
        }
    },
    flush: () => {
        if (client) {
            client.flush();
        }
    },
};
