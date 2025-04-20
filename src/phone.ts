import { Schema, SchemaImpl } from './schema';
import { GeneratorContext } from './context';
import { getLocaleData } from './localeData';

// --- Types ---

export interface PhoneOptions {
    /** Specific format string (e.g., 'XXX-XXX-XXXX', '0X XX XX XX XX'). 'X' replaced by digits. Uses locale default if omitted. */
    format?: string;
    /** Target locale (e.g., 'en-US', 'fr-FR'). Defaults to context locale or 'en-US'. */
    locale?: string;
    /** Prepend a random country code (e.g., '+1', '+44'). Defaults to false. */
    countryCode?: boolean;
}

// No specific fluent methods for phone currently
export type PhoneSchema = Schema<string>;

// --- Generator ---

export function phone(options: PhoneOptions = {}): PhoneSchema {
    const generator = (context: GeneratorContext): string => {
        const opts: PhoneOptions = { ...context.options };
        const { rng, locale: contextLocale } = context;
        const locale = getLocaleData(opts.locale || contextLocale);

        // Determine the format string
        const format = opts.format || locale.formats?.phone || 'XXX-XXX-XXXX'; // Fallback format

        // Generate digits by replacing 'X'
        let number = format;
        // Use a function in replace to get a new random digit for each 'X'
        number = number.replace(/X/g, () => String(rng.nextInt(0, 9)));

        // Add country code if requested
        if (opts.countryCode) {
            // Generate a plausible country code (1-2 digits, sometimes 3)
            const cc = rng.nextInt(1, 99); // Simple random code
            number = `+${cc} ${number}`;
        }

        return number;
    };

    return new SchemaImpl<string>(generator, options);
}
