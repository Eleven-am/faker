import { Schema, SchemaImpl } from './schema';
import { GeneratorContext } from './context';
import { getLocaleData } from './localeData';

// --- Types ---

export interface NameOptions {
    /** Specify gender ('male', 'female') or 'any' for random. Defaults to 'any'. */
    gender?: 'male' | 'female' | 'any';
    /** Target locale (e.g., 'en-US', 'fr-FR'). Defaults to context locale or 'en-US'. */
    locale?: string;
    /** Include a random middle initial. Defaults to false. */
    withMiddle?: boolean;
    /** Include a common prefix (e.g., Mr., Ms.). Not yet implemented with locale data. */
    withPrefix?: boolean; // Placeholder for future enhancement
    /** Include a common suffix (e.g., Jr., PhD). Not yet implemented with locale data. */
    withSuffix?: boolean; // Placeholder for future enhancement
}

// No specific fluent methods for name currently
export type NameSchema = Schema<string>;

// --- Generator ---

export function name(options: NameOptions = {}): NameSchema {
    const generator = (context: GeneratorContext): string => {
        const opts: NameOptions = { ...context.options };
        const { rng, locale: contextLocale } = context;
        const locale = getLocaleData(opts.locale || contextLocale); // Use option locale or context locale

        // Determine gender
        let gender: 'male' | 'female';
        const requestedGender = opts.gender || 'any';
        if (requestedGender === 'any') {
            gender = rng.next() < 0.5 ? 'male' : 'female';
        } else {
            gender = requestedGender;
        }

        // Get name lists from locale data
        const firstNames =
            (gender === 'male' ? locale.maleNames : locale.femaleNames) ||
            locale.maleNames ||
            locale.femaleNames;
        const lastNames = locale.lastNames;

        // Ensure lists are available
        if (!firstNames || firstNames.length === 0) {
            console.warn(
                `[F] Name generation: No ${gender} first names found for locale '${locale}'. Using fallback.`
            );
            return 'Fallback FirstName'; // Or throw error
        }
        if (!lastNames || lastNames.length === 0) {
            console.warn(
                `[F] Name generation: No last names found for locale '${locale}'. Using fallback.`
            );
            return `${firstNames[rng.nextInt(0, firstNames.length - 1)]} FallbackLastName`;
        }

        // Select names
        const firstName = firstNames[rng.nextInt(0, firstNames.length - 1)];
        const lastName = lastNames[rng.nextInt(0, lastNames.length - 1)];

        // Assemble the name
        let fullName = firstName;
        if (opts.withMiddle) {
            // Add a random uppercase letter as middle initial
            const middleInitial = String.fromCharCode(65 + rng.nextInt(0, 25)); // ASCII A-Z
            fullName += ` ${middleInitial}.`;
        }
        fullName += ` ${lastName}`;

        // TODO: Implement prefix/suffix logic when locale data supports it
        if (opts.withPrefix) {
            console.warn(`[F] Name generation: withPrefix option not yet fully implemented.`);
            // Example placeholder: fullName = "Mr. " + fullName;
        }
        if (opts.withSuffix) {
            console.warn(`[F] Name generation: withSuffix option not yet fully implemented.`);
            // Example placeholder: fullName = fullName + " Jr.";
        }

        return fullName;
    };

    return new SchemaImpl<string>(generator, options);
}
