// Domain conversion utilities for Prisma enum integration

export type DomainOption = 'legal' | 'civil_engineering' | 'real_estate';
export type PrismaDomain = 'LEGAL' | 'CIVIL_ENGINEERING' | 'REAL_ESTATE';

export type CertifiedStatusOption = 'PENDING' | 'CERTIFIED' | 'NOT_CERTIFIED';
export type PrismaCertifiedStatus = 'PENDING' | 'CERTIFIED' | 'NOT_CERTIFIED';

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

/**
 * Convert from certified status option (used in frontend) to Prisma enum value
 */
export function certifiedStatusOptionToPrismaEnum(status: CertifiedStatusOption): PrismaCertifiedStatus {
    return status; // They are the same, but keeping for consistency
}

/**
 * Convert from Prisma enum value to certified status option (used in frontend)
 */
export function prismaEnumToCertifiedStatusOption(status: PrismaCertifiedStatus): CertifiedStatusOption {
    return status; // They are the same, but keeping for consistency
}

/**
 * Validate if a string is a valid certified status option
 */
export function isValidCertifiedStatusOption(status: string): status is CertifiedStatusOption {
    return ['PENDING', 'CERTIFIED', 'NOT_CERTIFIED'].includes(status);
}

/**
 * Validate if a string is a valid Prisma certified status enum
 */
export function isValidPrismaCertifiedStatus(status: string): status is PrismaCertifiedStatus {
    return ['PENDING', 'CERTIFIED', 'NOT_CERTIFIED'].includes(status);
}

/**
 * Get all available certified status options
 */
export function getAllCertifiedStatusOptions(): CertifiedStatusOption[] {
    return ['PENDING', 'CERTIFIED', 'NOT_CERTIFIED'];
}

/**
 * Get all available Prisma certified status enums
 */
export function getAllPrismaCertifiedStatuses(): PrismaCertifiedStatus[] {
    return ['PENDING', 'CERTIFIED', 'NOT_CERTIFIED'];
}

/**
 * Convert certified status option to display name
 */
export function certifiedStatusOptionToDisplayName(status: CertifiedStatusOption): string {
    switch (status) {
        case 'PENDING':
            return 'Pending';
        case 'CERTIFIED':
            return 'Certified';
        case 'NOT_CERTIFIED':
            return 'Not Certified';
        default:
            return 'Pending';
    }
}

/**
 * Convert Prisma enum to display name
 */
export function prismaEnumToCertifiedStatusDisplayName(status: PrismaCertifiedStatus): string {
    switch (status) {
        case 'PENDING':
            return 'Pending';
        case 'CERTIFIED':
            return 'Certified';
        case 'NOT_CERTIFIED':
            return 'Not Certified';
        default:
            return 'Pending';
    }
} 