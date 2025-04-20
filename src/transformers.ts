import { GeneratorContext } from './context'; // Needed for type hint in pipe

// Type for a transformer function
export type TransformerFn<InType = any, OutType = any> = (
    val: InType,
    context: GeneratorContext
) => OutType;

// Note: Adjust types if stricter input checking is desired (e.g., string transformers only accept string)
export const transformers = {
    /** Converts a string to lowercase. No-op if not a string. */
    lowercase: (): TransformerFn<string, string> => val =>
        typeof val === 'string' ? val.toLowerCase() : val,

    /** Converts a string to uppercase. No-op if not a string. */
    uppercase: (): TransformerFn<string, string> => val =>
        typeof val === 'string' ? val.toUpperCase() : val,

    /** Capitalizes the first letter of a string. No-op if not a string. */
    capitalize: (): TransformerFn<string, string> => val =>
        typeof val === 'string' && val.length > 0
            ? val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()
            : val,

    /** Trims whitespace from the start and end of a string. No-op if not a string. */
    trim: (): TransformerFn<string, string> => val => (typeof val === 'string' ? val.trim() : val),

    /** Truncates a string if it exceeds maxLength. No-op if not a string. */
    truncate:
        (maxLength: number, ellipsis: string = '...'): TransformerFn<string, string> =>
        val =>
            typeof val === 'string' && val.length > maxLength
                ? val.substring(0, maxLength) + ellipsis
                : val,

    /** Rounds a number to a specified precision. No-op if not a number. */
    round:
        (precision: number = 0): TransformerFn<number, number> =>
        val => {
            if (typeof val !== 'number' || isNaN(val)) return val;
            // Use Math.round for potentially better accuracy with decimals than toFixed
            const factor = Math.pow(10, precision);
            return Math.round(val * factor) / factor;
        },

    /** Formats a Date object into a string. No-op if not a valid Date. */
    formatDate:
        (format: string = 'ISO'): TransformerFn<Date, string | Date> =>
        val => {
            if (!(val instanceof Date) || isNaN(val.getTime())) return val; // Check for valid Date

            switch (format) {
                case 'ISO':
                    return val.toISOString();
                case 'date':
                    return val.toDateString();
                case 'time':
                    return val.toTimeString();
                case 'locale':
                    return val.toLocaleString(); // Added locale option
                case 'localeDate':
                    return val.toLocaleDateString(); // Added locale option
                case 'localeTime':
                    return val.toLocaleTimeString(); // Added locale option
                default:
                    // Simple custom format parsing
                    try {
                        return format.replace(
                            /yyyy|MM|dd|HH|mm|ss|SSS|yy|M|d|H|h|m|s|a/g,
                            match => {
                                switch (match) {
                                    case 'yyyy':
                                        return val.getFullYear().toString();
                                    case 'MM':
                                        return (val.getMonth() + 1).toString().padStart(2, '0');
                                    case 'dd':
                                        return val.getDate().toString().padStart(2, '0');
                                    case 'HH':
                                        return val.getHours().toString().padStart(2, '0');
                                    case 'mm':
                                        return val.getMinutes().toString().padStart(2, '0');
                                    case 'ss':
                                        return val.getSeconds().toString().padStart(2, '0');
                                    case 'SSS':
                                        return val.getMilliseconds().toString().padStart(3, '0');
                                    case 'yy':
                                        return val.getFullYear().toString().slice(-2);
                                    case 'M':
                                        return (val.getMonth() + 1).toString();
                                    case 'd':
                                        return val.getDate().toString();
                                    case 'H':
                                        return val.getHours().toString();
                                    case 'h':
                                        return (val.getHours() % 12 || 12).toString(); // 12-hour format
                                    case 'm':
                                        return val.getMinutes().toString();
                                    case 's':
                                        return val.getSeconds().toString();
                                    case 'a':
                                        return val.getHours() < 12 ? 'AM' : 'PM';
                                    default:
                                        return match; // Return unrecognized parts as is
                                }
                            }
                        );
                    } catch (e) {
                        console.error(
                            `[F] formatDate: Error formatting date with custom format "${format}". Returning ISO string.`,
                            e
                        );
                        return val.toISOString(); // Fallback on error
                    }
            }
        },
};
