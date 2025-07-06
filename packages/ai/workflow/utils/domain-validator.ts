// Domain validation utilities
export interface DomainConfig {
    name: string;
    keywords: string[];
    description: string;
    restrictive: boolean;
}

export const DOMAIN_CONFIGS: Record<string, DomainConfig> = {
    legal: {
        name: 'Legal',
        keywords: [
            'law', 'legal', 'court', 'attorney', 'lawyer', 'contract', 'lawsuit', 'regulation',
            'statute', 'litigation', 'compliance', 'constitutional', 'criminal', 'civil law',
            'intellectual property', 'patent', 'trademark', 'copyright', 'privacy law',
            'employment law', 'business law', 'tax law', 'immigration law', 'family law',
            'jurisdiction', 'precedent', 'defendant', 'plaintiff', 'evidence', 'testimony',
            'subpoena', 'deposition', 'arbitration', 'mediation', 'settlement', 'verdict'
        ],
        description: 'Legal advice, law, regulations, and legal procedures',
        restrictive: true
    },
    civil_engineering: {
        name: 'Civil Engineering',
        keywords: [
            'construction', 'engineering', 'structural', 'building', 'infrastructure', 'concrete',
            'steel', 'foundation', 'bridge', 'road', 'highway', 'drainage', 'geotechnical',
            'surveying', 'CAD', 'blueprint', 'building code', 'construction management',
            'project management', 'materials', 'soil', 'earthquake', 'seismic', 'load',
            'beam', 'column', 'truss', 'excavation', 'grading', 'utilities', 'stormwater'
        ],
        description: 'Civil engineering, construction, structural design, and infrastructure',
        restrictive: true
    },
    real_estate: {
        name: 'Real Estate',
        keywords: [
            'property', 'real estate', 'house', 'home', 'apartment', 'commercial property',
            'residential', 'mortgage', 'loan', 'appraisal', 'listing', 'buying', 'selling',
            'rental', 'lease', 'landlord', 'tenant', 'property management', 'investment',
            'market analysis', 'zoning', 'property tax', 'escrow', 'closing', 'MLS',
            'realtor', 'broker', 'commission', 'equity', 'refinance', 'foreclosure'
        ],
        description: 'Real estate, property markets, buying/selling, and property management',
        restrictive: true
    }
};

export function validateQuestionForDomain(question: string, domain: string): {
    isValid: boolean;
    confidence: number;
    suggestion?: string;
} {
    const config = DOMAIN_CONFIGS[domain];
    if (!config || !config.restrictive) {
        return { isValid: true, confidence: 1.0 };
    }

    const questionLower = question.toLowerCase();
    const matchedKeywords = config.keywords.filter(keyword => 
        questionLower.includes(keyword.toLowerCase())
    );

    const confidence = matchedKeywords.length / Math.max(config.keywords.length * 0.1, 1);
    const isValid = confidence > 0.1; // Threshold for domain relevance

    if (!isValid) {
        return {
            isValid: false,
            confidence,
            suggestion: `This question appears to be outside the ${config.name} domain. Please switch to the appropriate domain or use the general assistant for questions about other topics.`
        };
    }

    return { isValid: true, confidence };
}

export function getDomainRestrictivePrompt(domain: string): string {
    const config = DOMAIN_CONFIGS[domain];
    if (!config || !config.restrictive) {
        return '';
    }

    return `
IMPORTANT: You are a specialized ${config.name} assistant. You must ONLY answer questions related to ${config.description}.

Domain Keywords: ${config.keywords.join(', ')}

STRICT INSTRUCTIONS:
1. Before answering ANY question, first check if it relates to ${config.name}
2. If the question is clearly outside your domain, respond with: "I'm specialized in ${config.name} and can only help with ${config.description}. For questions about other topics, please switch to the appropriate domain or use the general assistant."
3. If the question is borderline, ask for clarification about the ${config.name} aspect
4. Only provide detailed answers for questions clearly within your domain

Remember: It's better to decline a question than to provide information outside your expertise area.
`;
}

export function getCustomInstructionsForDomain(domain: string): string {
    const config = DOMAIN_CONFIGS[domain];
    if (!config) return '';

    return `Focus exclusively on ${config.description}. Politely decline questions outside this domain and redirect users to the appropriate specialist or general assistant.`;
} 