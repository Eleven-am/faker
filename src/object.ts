import { Schema, SchemaImpl } from './schema';
import { GeneratorContext } from './context';
import { Infer } from './types';

// --- Types ---

// Helper type to define the shape expected by f.object
export type SchemaShape = Record<string, Schema<any>>;

// Helper type to infer the resulting object type from the shape
export type ObjectOutputType<T extends SchemaShape> = {
    // Use mapped types to infer the type for each key
    // Handle optional properties correctly if using f.optional() or f.dependent()
    [K in keyof T]: Infer<T[K]>;
};

// --- Generator ---

// Define the generator function using generic constraints
export function object<T extends SchemaShape>(shape: T): Schema<ObjectOutputType<T>> {
    const generator = (context: GeneratorContext): ObjectOutputType<T> => {
        const result: Record<string, any> = {};
        const { rng, cache } = context; // Inherit RNG, cache from parent context

        // Base context for generating properties
        const propertyContextBase: Omit<
            GeneratorContext,
            'index' | 'key' | 'parent' | 'path' | 'options'
        > = {
            rng: rng, // Use the same RNG sequence for the whole object
            cache: cache,
            locale: context.locale,
            seed: context.seed,
        };

        // Iterate over the keys defined in the shape
        for (const key in shape) {
            // Ensure it's an own property of the shape, not from the prototype chain
            if (Object.prototype.hasOwnProperty.call(shape, key)) {
                const propertySchema = shape[key] as Schema<any>; // Get the schema for this property

                // Generate the value for this property
                const propertyValue = propertySchema.generate({
                    ...propertyContextBase,
                    key: key, // Pass the current property key
                    parent: result, // Pass the partially built object as parent context
                    path: `${context.path || ''}${context.path ? '.' : ''}${key}`, // Build dot-notation path
                    // Note: propertySchema uses its own options
                });

                // Assign the generated value. Handle `undefined` from f.dependent
                if (propertyValue !== undefined) {
                    result[key] = propertyValue;
                }
            }
        }
        // Cast the resulting record to the inferred ObjectOutputType
        return result as ObjectOutputType<T>;
    };

    // Object schema typically doesn't have its own specific fluent methods
    return new SchemaImpl<ObjectOutputType<T>>(generator, {}); // No initial options for the object wrapper itself
}
