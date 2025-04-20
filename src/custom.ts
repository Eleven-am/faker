import { Schema, SchemaImpl } from './schema';
import { GeneratorContext } from './context';

// --- Types ---

// Type for the custom generator function provided by the user
export type CustomGeneratorFn<T> = (context: GeneratorContext) => T;

// --- Generator ---

/**
 * Creates a schema from a custom generator function.
 * @param generatorFn The function that takes a GeneratorContext and returns a value.
 */
export function custom<T>(generatorFn: CustomGeneratorFn<T>): Schema<T> {
    if (typeof generatorFn !== 'function') {
        throw new Error('[F] f.custom requires a generator function as an argument.');
    }

    // The SchemaImpl simply wraps the provided custom function.
    return new SchemaImpl<T>(generatorFn, {}); // No specific options or fluent methods
}
