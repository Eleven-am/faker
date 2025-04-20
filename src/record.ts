import { Schema, SchemaImpl } from './schema';
import { GeneratorContext } from './context';
import { Infer } from './types';

// --- Types ---

export interface RecordOptions {
    minLength?: number;
    maxLength?: number;
    length?: number;
    /** Ensure generated keys are unique. Defaults to true. */
    uniqueKeys?: boolean;
}

// Type constraint for keys (must be usable as object keys)
export type RecordKey = string | number;

// --- Generator ---

/**
 * Creates a schema that generates an object (record) with specified keys and values.
 * @param keySchema Schema for generating keys (must produce string or number).
 * @param valueSchema Schema for generating values.
 * @param options Configuration for the record generation.
 */
export function record<K extends Schema<RecordKey>, V extends Schema<any>>(
    keySchema: K,
    valueSchema: V,
    options: RecordOptions = {}
): Schema<Record<Infer<K>, Infer<V>>> {
    // Infer key and value types

    type KeyType = Infer<K>;
    type ValueType = Infer<V>;
    type ResultRecord = Record<KeyType, ValueType>;

    const generator = (context: GeneratorContext): ResultRecord => {
        const opts: RecordOptions = { ...context.options };
        const { rng, cache } = context;

        // Determine length
        const minLen = opts.minLength ?? 1;
        const maxLen = opts.maxLength ?? 5;
        let length = opts.length ?? rng.nextInt(minLen, maxLen);
        if (length < 0) length = 0;

        const result: ResultRecord = {} as ResultRecord; // Initialize empty record
        const uniqueKeys = opts.uniqueKeys !== false; // Default to true
        const usedKeys = uniqueKeys ? new Set<RecordKey>() : null;

        // Base context for generating keys/values
        const propertyContextBase: Omit<
            GeneratorContext,
            'index' | 'key' | 'parent' | 'path' | 'options'
        > = {
            rng: rng,
            cache: cache,
            locale: context.locale,
            seed: context.seed,
        };

        let attempts = 0;
        // Allow more attempts if unique keys are needed
        const maxAttempts = length * (uniqueKeys ? 5 : 1) + 20;
        let generatedCount = 0;

        while (generatedCount < length && attempts < maxAttempts) {
            attempts++;
            const index = generatedCount; // Index relative to successful generations

            // --- Generate Key ---
            const key = keySchema.generate({
                ...propertyContextBase,
                index: index,
                // No meaningful parent/key context for the key itself usually
                path: `${context.path || ''}<key_${index}>`, // Indicate path is for a key
            });

            // --- Check Key Uniqueness ---
            if (usedKeys && usedKeys.has(key)) {
                continue; // Skip if key already exists and uniqueness is required
            }

            // --- Generate Value ---
            // Value generation context includes the generated key and the partially built record
            // --- Add to Record ---
            // @ts-ignore
            result[key] = valueSchema.generate({
                ...propertyContextBase,
                index: index,
                key: String(key), // Pass the generated key as context
                parent: result, // Pass the record being built
                path: `${context.path || ''}['${String(key)}']`, // Path uses the generated key
            });

            if (usedKeys) {
                usedKeys.add(key);
            }
            generatedCount++; // Increment count of successfully generated pairs
        }

        // Warn if target length wasn't reached
        if (generatedCount < length) {
            console.warn(
                `[F] Record generation: Failed to generate ${length} entries (got ${generatedCount}) after ${attempts} attempts. Unique key constraint might be too strict.`
            );
        }

        return result;
    };

    return new SchemaImpl<ResultRecord>(generator, options);
}
