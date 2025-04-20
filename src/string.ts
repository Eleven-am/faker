import { Schema, SchemaImpl } from './schema';
import { GeneratorContext } from './context';

export interface StringOptions {
    minLength?: number;
    maxLength?: number;
    length?: number;
    prefix?: string;
    suffix?: string;
    chars?: string;
    pattern?: RegExp;
    casing?: 'lower' | 'upper' | 'capitalize' | 'title';
    exclude?: string | RegExp | Array<string | RegExp>;
}

export interface StringSchemaFluent {
    minLength: (length: number) => StringSchema;
    maxLength: (length: number) => StringSchema;
    length: (length: number) => StringSchema;
    chars: (chars: string) => StringSchema;
    prefix: (prefix: string) => StringSchema;
    suffix: (suffix: string) => StringSchema;
    casing: (casing: 'lower' | 'upper' | 'capitalize' | 'title') => StringSchema;
    exclude: (exclude: string | RegExp | Array<string | RegExp>) => StringSchema;
    pattern: (pattern: RegExp) => StringSchema; // Fluent method exists, but generation needs implementation
}

export type StringSchema = Schema<string> & StringSchemaFluent;

// --- Generator ---

const DEFAULT_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function string(options: StringOptions = {}): StringSchema {
    const generator = (context: GeneratorContext): string => {
        const opts: StringOptions = { ...context.options }; // Combine initial and fluent options
        const { rng } = context;

        // Determine length
        const minLen = opts.minLength ?? 5;
        const maxLen = opts.maxLength ?? 10;
        let length = opts.length ?? rng.nextInt(minLen, maxLen);
        if (length < 0) length = 0; // Ensure non-negative length

        const chars = opts.chars || DEFAULT_CHARS;
        let result = opts.prefix || '';
        const targetBodyLength = length; // Length of the randomly generated part

        // Generate random part
        let generatedPart = '';
        let attempts = 0;
        const maxAttemptsPerChar = 30; // Prevent infinite loops if exclude is too restrictive

        while (
            generatedPart.length < targetBodyLength &&
            attempts < maxAttemptsPerChar * targetBodyLength + 50
        ) {
            attempts++;
            const charIndex = rng.nextInt(0, chars.length - 1);
            const char = chars.charAt(charIndex);

            // Check exclusion rules
            let excluded = false;
            if (opts.exclude) {
                const exclusions = Array.isArray(opts.exclude) ? opts.exclude : [opts.exclude];
                excluded = exclusions.some(
                    ex =>
                        (typeof ex === 'string' && ex.includes(char)) ||
                        (ex instanceof RegExp && ex.test(char))
                );
            }

            if (!excluded) {
                generatedPart += char;
            } else if (attempts > maxAttemptsPerChar * targetBodyLength + 40) {
                // If exclusion consistently fails near the end, break to avoid excessive loops
                console.warn(
                    `[F] String generation: Could not find suitable char due to exclusion rules near target length. Result may be shorter.`
                );
                break;
            }
        }

        if (generatedPart.length < targetBodyLength) {
            console.warn(
                `[F] String generation: Failed to reach target length ${targetBodyLength} (got ${generatedPart.length}) potentially due to restrictive exclusion rules or char set.`
            );
        }

        result += generatedPart;

        // Add suffix
        if (opts.suffix) {
            result += opts.suffix;
        }

        // Apply casing - applied AFTER prefix/suffix are added
        if (opts.casing) {
            switch (opts.casing) {
                case 'lower':
                    result = result.toLowerCase();
                    break;
                case 'upper':
                    result = result.toUpperCase();
                    break;
                case 'capitalize':
                    result = result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
                    break;
                case 'title':
                    result = result.replace(/\b\w/g, l => l.toUpperCase());
                    break; // Capitalize each word
            }
        }

        // TODO: Implement pattern generation/matching if required (complex)
        if (opts.pattern && !opts.pattern.test(result)) {
            // This would require a retry mechanism or a pattern-based generator
            console.warn(
                `[F] String generation: Pattern option is set but not fully implemented for generation. Result '${result}' might not match pattern ${opts.pattern}.`
            );
        }

        return result;
    };

    // Create SchemaImpl and cast to the specific StringSchema type
    return new SchemaImpl<string>(generator, options) as StringSchema;
}
