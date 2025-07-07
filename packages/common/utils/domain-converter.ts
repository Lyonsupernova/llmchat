// Domain conversion utilities for Prisma enum integration

export type DomainOption = 'legal' | 'civil_engineering' | 'real_estate';
export type PrismaDomain = 'LEGAL' | 'CIVIL_ENGINEERING' | 'REAL_ESTATE';

/**
 * Convert from domain option (used in frontend) to Prisma enum value
 */
export function domainOptionToPrismaEnum(domain: DomainOption): PrismaDomain {
    switch (domain) {
        case 'legal':
            return 'LEGAL';
        case 'civil_engineering':
            return 'CIVIL_ENGINEERING';
        case 'real_estate':
            return 'REAL_ESTATE';
        default:
            return 'LEGAL'; // Default fallback
    }
}

/**
 * Convert from Prisma enum value to domain option (used in frontend)
 */
export function prismaEnumToDomainOption(domain: PrismaDomain): DomainOption {
    switch (domain) {
        case 'LEGAL':
            return 'legal';
        case 'CIVIL_ENGINEERING':
            return 'civil_engineering';
        case 'REAL_ESTATE':
            return 'real_estate';
        default:
            return 'legal'; // Default fallback
    }
}

/**
 * Validate if a string is a valid domain option
 */
export function isValidDomainOption(domain: string): domain is DomainOption {
    return ['legal', 'civil_engineering', 'real_estate'].includes(domain);
}

/**
 * Validate if a string is a valid Prisma domain enum
 */
export function isValidPrismaDomain(domain: string): domain is PrismaDomain {
    return ['LEGAL', 'CIVIL_ENGINEERING', 'REAL_ESTATE'].includes(domain);
}

/**
 * Get all available domain options
 */
export function getAllDomainOptions(): DomainOption[] {
    return ['legal', 'civil_engineering', 'real_estate'];
}

/**
 * Get all available Prisma domain enums
 */
export function getAllPrismaDomains(): PrismaDomain[] {
    return ['LEGAL', 'CIVIL_ENGINEERING', 'REAL_ESTATE'];
}

/**
 * Convert domain option to display name
 */
export function domainOptionToDisplayName(domain: DomainOption): string {
    switch (domain) {
        case 'legal':
            return 'Legal';
        case 'civil_engineering':
            return 'Civil Engineering';
        case 'real_estate':
            return 'Real Estate';
        default:
            return 'Legal';
    }
}

/**
 * Convert Prisma enum to display name
 */
export function prismaEnumToDisplayName(domain: PrismaDomain): string {
    switch (domain) {
        case 'LEGAL':
            return 'Legal';
        case 'CIVIL_ENGINEERING':
            return 'Civil Engineering';
        case 'REAL_ESTATE':
            return 'Real Estate';
        default:
            return 'Legal';
    }
} 