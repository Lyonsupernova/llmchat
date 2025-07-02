import { useChatStore } from '@repo/common/store';
import { Button } from '@repo/ui';
import {
    IconBook,
    IconBulb,
    IconChartBar,
    IconPencil,
    IconQuestionMark,
} from '@tabler/icons-react';
import { Editor } from '@tiptap/react';

export const examplePrompts = {
    howTo: [
        'How to apply for a work visa in the United States as a software engineer from India?',
        'How to calculate the return on investment (ROI) for a rental property purchase?',
        'How to design a reinforced concrete beam for a residential building foundation?',
        'How to sponsor a spouse for permanent residency in Canada?',
        'How to conduct a comparative market analysis (CMA) when pricing a home for sale?',
    ],

    explainConcepts: [
        'Explain the concept of factor of safety in structural engineering and why it\'s critical.',
        'Explain the difference between asylum and refugee status in immigration law.',
        'Explain the difference between a buyer\'s market and a seller\'s market in real estate.',
        'What is the difference between dead load, live load, and wind load in structural analysis?',
        'What is the priority date system in US family-based immigration and how does it work?',
    ],

    advice: [
        'What advice would you give to first-time homebuyers in today\'s market conditions?',
        'What advice would you give to a new civil engineer starting their career in structural design?',
        'What advice would you give to someone whose immigration application was denied?',
        'Should I buy or rent property in a high-cost area like San Francisco or New York?',
        'What considerations should guide the choice between concrete and steel in building construction?',
    ]
};

export const getRandomPrompt = (category?: keyof typeof examplePrompts) => {
    if (category && examplePrompts[category]) {
        const prompts = examplePrompts[category];
        return prompts[Math.floor(Math.random() * prompts.length)];
    }

    // If no category specified or invalid category, return a random prompt from any category
    const categories = Object.keys(examplePrompts) as Array<keyof typeof examplePrompts>;
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const prompts = examplePrompts[randomCategory];
    return prompts[Math.floor(Math.random() * prompts.length)];
};

// Map of category to icon component
const categoryIcons = {
    howTo: { name: 'How to', icon: IconQuestionMark, color: '!text-yellow-700' },
    explainConcepts: { name: 'Explain Concepts', icon: IconBulb, color: '!text-blue-700' },
    advice: { name: 'Advice', icon: IconBook, color: '!text-purple-700' }
};

export const ExamplePrompts = () => {
    const editor: Editor | undefined = useChatStore(state => state.editor);
    const handleCategoryClick = (category: keyof typeof examplePrompts) => {
        console.log('editor', editor);
        if (!editor) return;
        const randomPrompt = getRandomPrompt(category);
        editor.commands.clearContent();
        editor.commands.insertContent(randomPrompt);
    };

    if (!editor) return null;

    return (
        <div className="animate-fade-in mb-8 flex w-full flex-wrap justify-center gap-2 p-6 duration-[1000ms]">
            {Object.entries(categoryIcons).map(([category, value], index) => (
                <Button
                    key={index}
                    variant="bordered"
                    rounded="full"
                    size="sm"
                    onClick={() => handleCategoryClick(category as keyof typeof examplePrompts)}
                >
                    <value.icon size={16} className={'text-muted-foreground/50'} />
                    {value.name}
                </Button>
            ))}
        </div>
    );
};
