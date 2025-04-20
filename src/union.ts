import { Schema, SchemaImpl } from './schema';
import { GeneratorContext } from './context';
import { Infer } from './types';

// --- Types ---

// Type helper for a readonly array of schemas
export type SchemaArray = readonly Schema<any>[];

// --- Generator ---

/**
 * Creates a schema that randomly picks one of the provided schemas and generates a value from it.
 * @param schemas A non-empty readonly array of schemas.
 */
export function union<T extends SchemaArray>(...schemas: T): Schema<Infer<T[number]>> {
    if (!schemas || schemas.length === 0) {
        throw new Error('[F] f.union requires at least one schema.');
    }

    const generator = (context: GeneratorContext): Infer<T[number]> => {
        const { rng } = context;
        // Randomly select one of the provided schemas
        const randomIndex = rng.nextInt(0, schemas.length - 1);
        const selectedSchema = schemas[randomIndex] as Schema<any>;

        // Generate a value using the selected schema, passing the current context
        // The context (like path, parent) remains relevant for the chosen schema.
        return selectedSchema.generate({ ...context });
    };

    return new SchemaImpl<Infer<T[number]>>(generator, {}); // No specific options or fluent methods
}
