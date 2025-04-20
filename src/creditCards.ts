import { Schema, SchemaImpl } from './schema';
import { GeneratorContext } from './context';
import { getLocaleData } from './localeData';
import { PCG } from './pcg';

// --- Types ---

/**
 * Options for credit card generation
 */
export interface CreditCardOptions {
    /**
     * The type of credit card to generate
     * Default is random from major brands
     */
    type?: 'visa' | 'mastercard' | 'amex' | 'discover' | 'random';

    /**
     * Whether to format the number with spaces
     * Example: "4532 1234 5678 9012" instead of "4532123456789012"
     * Default: true
     */
    formatted?: boolean;

    /**
     * Whether to include the CVV code
     * Default: true
     */
    includeCVV?: boolean;

    /**
     * Whether to include expiration date
     * Default: true
     */
    includeExpiration?: boolean;

    /**
     * Min years from now for expiration (inclusive)
     * Default: 1
     */
    expirationYearsMin?: number;

    /**
     * Max years from now for expiration (inclusive)
     * Default: 5
     */
    expirationYearsMax?: number;

    /**
     * Whether to include cardholder name
     * Default: true
     */
    includeCardholder?: boolean;
}

/**
 * Credit card data object returned by the credit card generator
 */
export interface CreditCardData {
    /**
     * The credit card number
     */
    number: string;

    /**
     * The type of credit card (visa, mastercard, etc.)
     */
    type: string;

    /**
     * The CVV verification code (3-4 digits)
     */
    cvv?: string;

    /**
     * The expiration month (1-12)
     */
    expirationMonth?: number;

    /**
     * The expiration year (4-digit year)
     */
    expirationYear?: number;

    /**
     * The formatted expiration date (MM/YY)
     */
    expiration?: string;

    /**
     * Cardholder name
     */
    cardholder?: string;
}

// No specific fluent methods for credit card currently
export type CreditCardSchema = Schema<CreditCardData>;

// --- Constants ---

/**
 * Credit card information for different providers
 */
const CARD_TYPES = {
    visa: {
        prefixes: ['4'],
        lengths: [16],
        cvvLength: 3,
        format: [4, 4, 4, 4],
    },
    mastercard: {
        prefixes: [
            '51',
            '52',
            '53',
            '54',
            '55',
            '2221',
            '2222',
            '2223',
            '2224',
            '2225',
            '2226',
            '2227',
            '2228',
            '2229',
            '223',
            '224',
            '225',
            '226',
            '227',
            '228',
            '229',
            '23',
            '24',
            '25',
            '26',
            '270',
            '271',
            '2720',
        ],
        lengths: [16],
        cvvLength: 3,
        format: [4, 4, 4, 4],
    },
    amex: {
        prefixes: ['34', '37'],
        lengths: [15],
        cvvLength: 4,
        format: [4, 6, 5],
    },
    discover: {
        prefixes: ['6011', '644', '645', '646', '647', '648', '649', '65'],
        lengths: [16],
        cvvLength: 3,
        format: [4, 4, 4, 4],
    },
};

// --- Helper Functions ---


/**
 * Generates a valid credit card number using the Luhn algorithm
 * @param prefix The prefix to use for the card number
 * @param length The total length of the card number
 * @param rng The random number generator to use
 * @returns A valid credit card number
 */
function generateCardNumber(prefix: string, length: number, rng: PCG): string {
    // Start with the prefix
    let cardNumber = prefix;

    // Add random digits until we're 1 digit short of the required length
    const digitsToAdd = length - prefix.length - 1;
    for (let i = 0; i < digitsToAdd; i++) {
        cardNumber += rng.nextInt(0, 9).toString();
    }

    // Calculate the check digit
    const checkDigit = generateCheckDigit(cardNumber);
    cardNumber += checkDigit;

    return cardNumber;
}

/**
 * Generates the check digit for a credit card number using the Luhn algorithm
 * @param partialCardNumber The card number without the check digit
 * @returns The check digit (0-9) that makes the card number valid
 */
function generateCheckDigit(partialCardNumber: string): string {
    const digits = partialCardNumber.replace(/\D/g, '');
    let sum = 0;
    let shouldDouble = true; // Start with true because we're calculating from left to right

    // Calculate the sum (starting from the leftmost digit)
    for (let i = 0; i < digits.length; i++) {
        let digit = parseInt(digits.charAt(i));

        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        shouldDouble = !shouldDouble;
    }

    // Calculate the check digit
    const remainder = sum % 10;
    const checkDigit = remainder === 0 ? 0 : 10 - remainder;

    return checkDigit.toString();
}

/**
 * Formats a credit card number according to the card type's format
 * @param cardNumber The unformatted card number
 * @param formatArray An array of digit group lengths (e.g., [4, 4, 4, 4] for Visa)
 * @returns The formatted card number
 */
function formatCardNumber(cardNumber: string, formatArray: number[]): string {
    let formattedNumber = '';
    let currentPosition = 0;

    for (let i = 0; i < formatArray.length; i++) {
        const groupLength = formatArray[i] || 0;
        formattedNumber += cardNumber.substring(currentPosition, currentPosition + groupLength);
        currentPosition += groupLength;

        // Add space if not the last group
        if (i < formatArray.length - 1) {
            formattedNumber += ' ';
        }
    }

    return formattedNumber;
}

// --- Generator ---

/**
 * Creates a schema that generates realistic credit card data
 * @param options Options for customizing the generated credit card
 * @returns A schema that generates credit card data
 */
export function creditCard(options: CreditCardOptions = {}): CreditCardSchema {
    const generator = (context: GeneratorContext): CreditCardData => {
        const opts: CreditCardOptions = {
            type: options.type || 'random',
            formatted: options.formatted !== false,
            includeCVV: options.includeCVV !== false,
            includeExpiration: options.includeExpiration !== false,
            expirationYearsMin: options.expirationYearsMin || 1,
            expirationYearsMax: options.expirationYearsMax || 5,
            includeCardholder: options.includeCardholder !== false,
            ...context.options,
        };

        const { rng } = context;

        // Select card type
        let cardType: string;
        if (opts.type === 'random') {
            const types = Object.keys(CARD_TYPES);
            cardType = types[rng.nextInt(0, types.length - 1)] as string;
        } else {
            cardType = opts.type ?? 'visa';
        }

        const cardInfo = CARD_TYPES[cardType as keyof typeof CARD_TYPES];

        // Select a random prefix and length
        const prefix = cardInfo.prefixes[rng.nextInt(0, cardInfo.prefixes.length - 1)] || '';
        const length = cardInfo.lengths[rng.nextInt(0, cardInfo.lengths.length - 1)] || 16;

        // Generate card number
        let cardNumber = generateCardNumber(prefix, length, rng);

        // Format the card number if requested
        if (opts.formatted) {
            cardNumber = formatCardNumber(cardNumber, cardInfo.format);
        }

        // Create the result object
        const result: CreditCardData = {
            number: cardNumber,
            type: cardType,
        };

        // Add CVV if requested
        if (opts.includeCVV) {
            let cvv = '';
            for (let i = 0; i < cardInfo.cvvLength; i++) {
                cvv += rng.nextInt(0, 9).toString();
            }
            result.cvv = cvv;
        }

        // Add expiration date if requested
        if (opts.includeExpiration) {
            const now = new Date();
            const currentMonth = now.getMonth() + 1; // 1-12
            const currentYear = now.getFullYear();

            // Generate future expiration date
            const yearsToAdd = rng.nextInt(
                opts.expirationYearsMin || 1,
                opts.expirationYearsMax || 5
            );

            let expirationMonth: number;
            let expirationYear: number;

            if (yearsToAdd === 0) {
                // If expiring this year, ensure the month is in the future
                expirationMonth = rng.nextInt(currentMonth + 1, 12);
                expirationYear = currentYear;
            } else {
                // Otherwise, any month is valid
                expirationMonth = rng.nextInt(1, 12);
                expirationYear = currentYear + yearsToAdd;
            }

            result.expirationMonth = expirationMonth;
            result.expirationYear = expirationYear;
            result.expiration = `${expirationMonth.toString().padStart(2, '0')}/${(expirationYear % 100).toString().padStart(2, '0')}`;
        }

        // Add cardholder name if requested
        if (opts.includeCardholder) {
            // If the parent object has a name property, use it
            if (context.parent?.name && typeof context.parent.name === 'string') {
                result.cardholder = context.parent.name.toUpperCase();
            } else if (
                context.parent?.firstName &&
                context.parent?.lastName &&
                typeof context.parent.firstName === 'string' &&
                typeof context.parent.lastName === 'string'
            ) {
                result.cardholder =
                    `${context.parent.firstName} ${context.parent.lastName}`.toUpperCase();
            } else {
                // Otherwise, generate a random name
                const locale = getLocaleData(context.locale);
                const firstName = locale.maleNames[rng.nextInt(0, locale.maleNames.length - 1)];
                const lastName = locale.lastNames[rng.nextInt(0, locale.lastNames.length - 1)];
                result.cardholder = `${firstName} ${lastName}`.toUpperCase();
            }
        }

        return result;
    };

    return new SchemaImpl<CreditCardData>(generator, options);
}
