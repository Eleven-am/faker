import { Schema, SchemaImpl } from './schema';
import { GeneratorContext } from './context';
import { getLocaleData } from './localeData'; // Import locale helpers

// --- Types ---

export interface EmailOptions {
    /** Specific domain or array of domains to choose from. Overrides provider and locale defaults. */
    domain?: string | Array<string>;
    /** Preferred email provider name (e.g., 'gmail.com') or array to choose from. Overrides locale defaults. */
    provider?: string | Array<string>;
    /** Use first name in the local part (requires parent context with 'firstName'). */
    firstName?: string; // Usually inferred from context, but can be overridden
    /** Use last name in the local part (requires parent context with 'lastName'). */
    lastName?: string; // Usually inferred from context, but can be overridden
    /** Generate a safe, non-existent domain (e.g., 'example.com'). Defaults to false. */
    safe?: boolean;
}

// No specific fluent methods for email currently
export type EmailSchema = Schema<string>;

// --- Generator ---

export function email(options: EmailOptions = {}): EmailSchema {
    const generator = (context: GeneratorContext): string => {
        const opts: EmailOptions = { ...context.options };
        const { rng, locale: contextLocale, parent } = context;
        const locale = getLocaleData(contextLocale); // Get locale data based on context

        // --- Determine Domain ---
        let domain: string;
        if (opts.safe) {
            domain = locale.safeDomain || 'example.com'; // Use locale safe domain or fallback
        } else if (opts.domain) {
            domain = Array.isArray(opts.domain)
                ? opts.domain[rng.nextInt(0, opts.domain.length - 1)] as string
                : opts.domain;
        } else if (opts.provider) {
            domain = Array.isArray(opts.provider)
                ? opts.provider[rng.nextInt(0, opts.provider.length - 1)] as string
                : opts.provider;
        } else {
            // Generate a plausible domain using locale extensions
            const domainName = `domain${rng.nextInt(10, 999)}`;
            const ext = locale.domainExt[rng.nextInt(0, locale.domainExt.length - 1)];
            domain = `${domainName}${ext}`;
        }

        // --- Determine Local Part ---
        let localPart = '';
        // Try various strategies based on options and parent context
        const parentFirstName =
            parent?.firstName && typeof parent.firstName === 'string' ? parent.firstName : null;
        const parentLastName =
            parent?.lastName && typeof parent.lastName === 'string' ? parent.lastName : null;
        const explicitFirstName = opts.firstName;
        const explicitLastName = opts.lastName;

        const useFirstName = explicitFirstName ?? parentFirstName;
        const useLastName = explicitLastName ?? parentLastName;

        if (useFirstName || useLastName) {
            // Combine names, preferring explicit options
            localPart =
                `${useFirstName || ''}${useFirstName && useLastName ? '.' : ''}${useLastName || ''}`.toLowerCase();
        } else if (parent?.username && typeof parent.username === 'string') {
            localPart = parent.username;
        } else if (parent?.name && typeof parent.name === 'string') {
            // Use full name from parent if available
            localPart = parent.name.replace(/\s+/g, '.').toLowerCase();
        } else if (parent?.id) {
            // Use ID if available
            localPart = `user.${parent.id}`;
        } else {
            // Fallback to random user string
            localPart = `user${rng.nextInt(100, 9999)}`;
        }

        // Sanitize local part (basic rules)
        localPart = localPart
            .replace(/[^a-z0-9._-]/gi, '') // Remove invalid chars
            .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
            .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
            .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
            .replace(/-{2,}/g, '-'); // Replace multiple hyphens with single hyphen

        // Ensure localPart is not empty
        if (!localPart) {
            localPart = `random${rng.nextInt(100, 999)}`;
        }

        // Truncate if excessively long (optional, adjust limit as needed)
        const MAX_LOCAL_PART_LENGTH = 64; // Common limit
        if (localPart.length > MAX_LOCAL_PART_LENGTH) {
            localPart = localPart.substring(0, MAX_LOCAL_PART_LENGTH);
            // Ensure it doesn't end with a dot or hyphen after truncation
            localPart = localPart.replace(/[.-]$/, '');
        }

        return `${localPart}@${domain}`;
    };

    return new SchemaImpl<string>(generator, options);
}
