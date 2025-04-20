import { Schema, SchemaImpl } from './schema';
import { GeneratorContext } from './context';
import { getLocaleData } from './localeData';
import { formatString } from './utils'; // Import formatter

// --- Types ---

export interface AddressOptions {
    /** Target locale (e.g., 'en-US', 'en-GB', 'fr-FR'). Defaults to context locale or 'en-US'. */
    locale?: string;
    /** Include the country name in the address. Defaults to false. */
    includeCountry?: boolean;
    /** Include the postal/zip code. Defaults to true. */
    includeZip?: boolean;
    /** Include the state/province/region (if available in locale). Defaults to true. */
    includeState?: boolean;
    /** Override the locale's default postal code format (e.g., 'XXXXX', 'XXN NAA'). 'X' for digit, 'A' for letter, 'N' for digit. */
    zipFormat?: string;
}

// No specific fluent methods for address currently
export type AddressSchema = Schema<string>;

// --- Generator ---

export function address(options: AddressOptions = {}): AddressSchema {
    const generator = (context: GeneratorContext): string => {
        const opts: AddressOptions = { ...context.options };
        const { rng, locale: contextLocale } = context;
        const locale = getLocaleData(opts.locale || contextLocale);

        // Get address format from locale, or provide a very basic fallback
        const formatTemplate = locale.formats?.address || '{{number}} {{street}}, {{city}}';
        // Get postal code format from options or locale, or fallback
        const postalFormat = opts.zipFormat || locale.formats?.postal || 'XXXXX';

        // --- Generate Address Components ---
        const streetNumber = rng.nextInt(1, 2000);

        const streetName =
            locale.streetNames && locale.streetNames.length > 0
                ? locale.streetNames[rng.nextInt(0, locale.streetNames.length - 1)]
                : 'Unknown Street'; // Fallback

        const cityName =
            locale.cities && locale.cities.length > 0
                ? locale.cities[rng.nextInt(0, locale.cities.length - 1)]
                : 'Unknown City'; // Fallback

        // Generate State/Region only if requested and available
        let stateName = '';
        const includeState = opts.includeState ?? true; // Default to include
        if (includeState && locale.states && locale.states.length > 0) {
            stateName = locale.states[rng.nextInt(0, locale.states.length - 1)];
        }

        // Generate Postal Code only if requested
        let postalCode = '';
        const includeZip = opts.includeZip ?? true; // Default to include
        if (includeZip) {
            // Generate based on postalFormat
            postalCode = postalFormat.replace(/[XNA]/g, (char: string) => {
                switch (char) {
                    case 'X':
                        return String(rng.nextInt(0, 9)); // Digit
                    case 'N':
                        return String(rng.nextInt(1, 9)); // Non-zero Digit (common in UK postcodes)
                    case 'A':
                        return String.fromCharCode(65 + rng.nextInt(0, 25)); // Uppercase Letter
                    default:
                        return char; // Keep spaces or other chars
                }
            });
        }

        // Get Country only if requested and available
        let countryName = '';
        const includeCountry = opts.includeCountry ?? false; // Default to exclude
        if (includeCountry && locale.countries && locale.countries.length > 0) {
            // Assuming the first country in the list is the primary one for the locale
            countryName = locale.countries[0];
        }

        // --- Assemble Data for Formatting ---
        const data = {
            number: streetNumber,
            street: streetName,
            city: cityName,
            state: stateName,
            postal: postalCode,
            country: countryName,
        };

        // --- Format the Address ---
        let formattedAddress = formatString(formatTemplate, data);

        // Append country on a new line if included and not already part of the format
        if (countryName && !formatTemplate.includes('{{country}}')) {
            formattedAddress += `\n${countryName}`;
        }

        // Clean up potential blank lines if optional parts were empty
        formattedAddress = formattedAddress
            .split('\n')
            .filter(line => line.trim() !== '')
            .join('\n');

        return formattedAddress;
    };

    return new SchemaImpl<string>(generator, options);
}
