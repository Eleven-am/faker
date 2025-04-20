import { Schema, SchemaImpl } from './schema';
import { GeneratorContext } from './context';
import { Infer } from './types';

// --- Types ---

export interface ArrayOptions {
    minLength?: number;
    maxLength?: number;
    length?: number;
    /** Ensure generated elements are unique (uses JSON.stringify for comparison). */
    unique?: boolean;
    /** Sort the array after generation. True uses default sort, or provide a compare function. */
    sort?: boolean | ((a: any, b: any) => number);
}

// Note: Fluent methods need the element type T
export interface ArraySchemaFluent<T> {
    minLength: (length: number) => ArraySchema<T>;
    maxLength: (length: number) => ArraySchema<T>;
    length: (length: number) => ArraySchema<T>;
    /** If true, attempts to generate unique elements within the array. */
    unique: (unique?: boolean) => ArraySchema<T>;
    /** Sorts the generated array. Provide a compare function or `true` for default sort. */
    sort: (sort?: boolean | ((a: T, b: T) => number)) => ArraySchema<T>;
}

export type ArraySchema<T> = Schema<T[]> & ArraySchemaFluent<T>;

// --- Generator ---

export function array<T extends Schema<any>>(
    elementSchema: T,
    options: ArrayOptions = {}
): ArraySchema<Infer<T>> {
    // Infer the element type from the input schema

    type ElementType = Infer<T>; // Alias for the generated element type

    const generator = (context: GeneratorContext): ElementType[] => {
        const opts: ArrayOptions = { ...context.options };
        const { rng, cache } = context;

        // Determine length
        const minLen = opts.minLength ?? 0;
        const maxLen = opts.maxLength ?? 10;
        let length = opts.length ?? rng.nextInt(minLen, maxLen);
        if (length < 0) length = 0;

        const results: ElementType[] = [];
        // Use a Set to track unique items if requested. Stringify for complex objects.
        const uniqueValues = opts.unique ? new Set<string>() : null;

        // Base context for generating elements (inherits RNG, cache, locale from parent context)
        const elementContextBase: Omit<
            GeneratorContext,
            'index' | 'key' | 'parent' | 'path' | 'options'
        > = {
            rng: rng, // Use the same RNG sequence for the whole array
            cache: cache,
            locale: context.locale,
            seed: context.seed, // Pass down seed mainly for context, RNG is already seeded
        };

        let attempts = 0;
        // Allow more attempts if uniqueness is required, as collisions are possible
        const maxTotalAttempts = length * (opts.unique ? 5 : 1) + 20; // Heuristic max attempts

        while (results.length < length && attempts < maxTotalAttempts) {
            attempts++;
            const index = results.length;

            // Generate a potential element
            const element = elementSchema.generate({
                ...elementContextBase,
                index: index,
                parent: results, // Provide the partially built array as parent context
                path: `${context.path || ''}[${index}]`, // Update path
                // Note: elementSchema uses its own options, not the array's options
            });

            // Handle uniqueness constraint
            if (uniqueValues) {
                let elementKey: string;
                try {
                    // Stringify to handle objects/arrays. Primitives convert directly.
                    elementKey = JSON.stringify(element);
                } catch (e) {
                    // Handle circular references or other stringify errors
                    console.warn(
                        `[F] Array generation: Could not stringify element for uniqueness check at index ${index}. Treating as unique. Element:`,
                        element
                    );
                    elementKey = `__stringify_error_${rng.next()}__`; // Use a random key to likely avoid collision
                }

                if (uniqueValues.has(elementKey)) {
                    // If element is already present and uniqueness is required, skip and try again
                    continue;
                }
                uniqueValues.add(elementKey);
            }

            // Add the valid element to the results
            results.push(element);
        }

        // Warn if the target length wasn't reached
        if (results.length < length) {
            console.warn(
                `[F] Array generation: Failed to generate ${length} elements (got ${results.length}) after ${attempts} attempts. Uniqueness constraint might be too strict for the element generator.`
            );
        }

        // Apply sorting if requested
        if (opts.sort) {
            if (typeof opts.sort === 'function') {
                results.sort(opts.sort as (a: ElementType, b: ElementType) => number);
            } else {
                // Default sort (lexicographical/numeric)
                results.sort((a: any, b: any) => {
                    if (typeof a === 'number' && typeof b === 'number') return a - b;
                    if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
                    // Fallback for mixed or other types: convert to string
                    return String(a).localeCompare(String(b));
                });
            }
        }

        return results;
    };

    return new SchemaImpl<ElementType[]>(generator, options) as ArraySchema<ElementType>;
}
