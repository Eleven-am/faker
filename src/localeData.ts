// Keeping locale data internal for now, only exposing the getter function.
const localeData: Record<string, any> = {
    'en-US': {
        maleNames: ['James', 'John', 'Robert', 'Michael', 'William'],
        femaleNames: ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth'],
        lastNames: ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown'],
        streetNames: ['Main St', 'Oak Ave', 'Maple Dr'],
        cities: ['New York', 'Los Angeles', 'Chicago'],
        states: ['CA', 'TX', 'FL', 'NY'],
        countries: ['United States'],
        domainExt: ['.com', '.net', '.org', '.us'],
        safeDomain: 'example.com',
        formats: {
            phone: '(XXX) XXX-XXXX',
            address: '{{number}} {{street}}, {{city}}, {{state}} {{postal}}',
            postal: 'XXXXX',
        },
    },
    'en-GB': {
        maleNames: ['Oliver', 'Harry', 'George', 'Noah', 'Jack'],
        femaleNames: ['Olivia', 'Amelia', 'Isla', 'Ava', 'Mia'],
        lastNames: ['Smith', 'Jones', 'Williams', 'Brown', 'Taylor'],
        streetNames: ['High Street', 'Station Road', 'Main Street'],
        cities: ['London', 'Birmingham', 'Manchester'],
        states: [], // Often not used in UK addresses like US states
        countries: ['United Kingdom'],
        domainExt: ['.co.uk', '.uk', '.org.uk'],
        safeDomain: 'example.co.uk',
        formats: {
            phone: '0XXXX XXXXXX',
            address: '{{number}} {{street}}, {{city}}, {{postal}}',
            postal: 'XXN NAA',
        }, // Example UK postcode format
    },
    'fr-FR': {
        maleNames: ['Lucas', 'Léo', 'Gabriel', 'Adam', 'Louis'],
        femaleNames: ['Emma', 'Jade', 'Louise', 'Alice', 'Chloé'],
        lastNames: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert'],
        streetNames: ['Rue de la Paix', 'Avenue des Champs-Élysées', 'Boulevard Saint-Germain'],
        cities: ['Paris', 'Marseille', 'Lyon'],
        states: [], // Departments/Regions used differently than US states
        countries: ['France'],
        domainExt: ['.fr', '.com', '.eu'],
        safeDomain: 'example.fr',
        formats: {
            phone: '0X XX XX XX XX',
            address: '{{number}} {{street}}, {{postal}} {{city}}',
            postal: 'XXXXX',
        }, // French postcode
    },
};

// Type for the structure of a single locale's data (using en-US as the reference)
export type LocaleDefinition = (typeof localeData)['en-US'];

/**
 * Retrieves locale data, falling back to the base language or en-US.
 * @param locale - The locale code (e.g., 'en-US', 'fr-FR', 'en').
 * @returns The locale definition object.
 */
export function getLocaleData(locale: string = 'en-US'): LocaleDefinition {
    const mainLocale = locale.split('-')[0] || 'en'; // Extract base language (e.g., 'en' from 'en-US')
    // Prioritize specific locale, then base language, then default 'en-US'
    return localeData[locale] || localeData[mainLocale] || localeData['en-US'];
}
