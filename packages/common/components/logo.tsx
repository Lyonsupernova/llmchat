import * as React from 'react';

export const Logo = (props: React.SVGProps<SVGSVGElement>) => (
    <div className="size-5 rounded-full overflow-hidden flex items-center justify-center">
        <img 
            src="/icons/expert-ai-logo.png" 
            alt="Experts AI Logo" 
            className="w-full h-full object-cover"
        />
    </div>
);

export const DarkLogo = (props: React.SVGProps<SVGSVGElement>) => (
    <div className="rounded-full overflow-hidden flex items-center justify-center">
        <img 
            src="/icons/expert-ai-logo.png" 
            alt="Experts AI Logo" 
            className="w-full h-full object-cover"
        />
    </div>
);