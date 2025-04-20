import { Schema, SchemaImpl } from './schema';
import { GeneratorContext } from './context';
import { getLocaleData } from './localeData';
import { string as fString } from './string'; // Import string generator for path/query/hash parts

// --- Types ---

export interface UrlOptions {
    /** Specific protocol or array ('http', 'https') to choose from. Defaults to 'https' bias. */
    protocol?: 'http' | 'https' | Array<'http' | 'https'>;
    /** Specific domain or array of domains to choose from. Defaults to generated domain. */
    domain?: string | Array<string>;
    /** Specific path part. Defaults to a randomly generated path segment. */
    path?: string;
    /** Include random query parameters (e.g., ?key=value). Defaults to false (randomly decided). */
    includeQueryParams?: boolean;
    /** Include a random hash fragment (e.g., #section). Defaults to false (randomly decided). */
    includeHash?: boolean;
    /** Force HTTPS protocol. Overrides protocol option if true. */
    secure?: boolean;
    /** Array of possible file extensions to append to the path. */
    extensions?: Array<string>;
}

// No specific fluent methods for url currently
export type UrlSchema = Schema<string>;

// --- Generator ---

export function url(options: UrlOptions = {}): UrlSchema {
    const generator = (context: GeneratorContext): string => {
        const opts: UrlOptions = { ...context.options };
        const { rng, locale: contextLocale } = context;
        const locale = getLocaleData(contextLocale);

        // --- Determine Protocol ---
        let protocol: string;
        if (opts.secure === true) {
            protocol = 'https';
        } else if (opts.protocol) {
            protocol = Array.isArray(opts.protocol)
                ? opts.protocol[rng.nextInt(0, opts.protocol.length - 1)] as 'http' | 'https'
                : opts.protocol;
        } else {
            // Default: Higher chance for HTTPS
            protocol = rng.next() < 0.8 ? 'https' : 'http';
        }

        // --- Determine Domain ---
        let domain: string;
        if (opts.domain) {
            domain = Array.isArray(opts.domain)
                ? opts.domain[rng.nextInt(0, opts.domain.length - 1)] as string
                : opts.domain;
        } else {
            // Generate a random domain name + locale extension
            const domainName = fString({
                length: rng.nextInt(5, 12),
                chars: 'abcdefghijklmnopqrstuvwxyz0123456789', // Allow numbers in domain
            }).generate(context); // Use sub-generator with context
            const ext = locale.domainExt[rng.nextInt(0, locale.domainExt.length - 1)];
            domain = `${domainName}${ext}`;
        }
        // Basic cleanup for domain (e.g., remove leading/trailing hyphens if generator created them)
        domain = domain.replace(/^-+|-+$/g, '');

        // --- Determine Path ---
        let path: string;
        if (opts.path) {
            path = opts.path.startsWith('/') ? opts.path : `/${opts.path}`;
        } else {
            // Generate random path segments
            const numSegments = rng.nextInt(1, 4);
            const segments = Array.from(
                { length: numSegments },
                () =>
                    fString({
                        length: rng.nextInt(4, 10),
                        chars: 'abcdefghijklmnopqrstuvwxyz0123456789-', // Allow hyphens in path
                    })
                        .generate(context)
                        .replace(/^-+|-+$/g, '') // Basic cleanup
            );
            path = `/${segments.join('/')}`;
        }

        // Append extension if provided
        if (opts.extensions && opts.extensions.length > 0) {
            const ext = opts.extensions[rng.nextInt(0, opts.extensions.length - 1)] as string;
            // Ensure extension starts with a dot if needed
            path += ext.startsWith('.') ? ext : `.${ext}`;
        } else if (rng.next() < 0.15 && !path.includes('.')) {
            // Occasionally add a common web extension if none provided
            const commonExts = ['.html', '.php', '.aspx', '']; // Include '' for no extension
            path += commonExts[rng.nextInt(0, commonExts.length - 1)];
        }

        // --- Determine Query Parameters ---
        let query = '';
        // Default: add query params sometimes if not explicitly false
        const shouldAddQuery =
            opts.includeQueryParams === undefined ? rng.next() < 0.3 : opts.includeQueryParams;
        if (shouldAddQuery) {
            const numParams = rng.nextInt(1, 3);
            const params = Array.from({ length: numParams }, () => {
                const key = fString({
                    length: rng.nextInt(3, 8),
                    chars: 'abcdefghijklmnopqrstuvwxyz',
                }).generate(context);
                const value = fString({
                    length: rng.nextInt(5, 15),
                    chars: 'abcdefghijklmnopqrstuvwxyz0123456789',
                }).generate(context);
                return `${key}=${encodeURIComponent(value)}`; // Encode value
            });
            query = `?${params.join('&')}`;
        }

        // --- Determine Hash Fragment ---
        let hash = '';
        // Default: add hash sometimes if not explicitly false
        const shouldAddHash = opts.includeHash === undefined ? rng.next() < 0.2 : opts.includeHash;
        if (shouldAddHash) {
            const fragment = fString({
                length: rng.nextInt(4, 10),
                chars: 'abcdefghijklmnopqrstuvwxyz-',
            }).generate(context);
            hash = `#${fragment}`;
        }

        // --- Assemble URL ---
        return `${protocol}://${domain}${path}${query}${hash}`;
    };

    return new SchemaImpl<string>(generator, options);
}
