// src/f/locale.ts
import { Schema, SchemaImpl } from './schema';
import { GeneratorContext } from './context';
import { Infer } from './types';

// --- Generator Wrapper ---

/**
 * Creates a schema that forces the generation context to use a specific locale
 * when generating a value from the provided schema.
 *
 * @template S - The type of the schema being wrapped.
 * @param localeCode The locale code string (e.g., 'fr-FR', 'en-GB') to use.
 * @param schema The schema whose generation should use the specified locale.
 * @returns A new schema that behaves like the original but with a forced locale.
 */
export function locale<S extends Schema<any>>(localeCode: string, schema: S): Schema<Infer<S>> {
    // The output type remains the same as the input schema's
    if (typeof localeCode !== 'string' || localeCode.trim() === '') {
        console.warn(
            `[F] f.locale: Invalid locale code provided ('${localeCode}'). Using context's default.`
        );
        // Return original schema if locale is invalid? Or throw error? Returning original for now.
        return schema;
    }
    if (!schema || typeof schema.generate !== 'function') {
        throw new Error('[F] f.locale: Invalid schema provided.');
    }

    // The generator function simply calls the original schema's generate method,
    // but overrides the 'locale' property in the context passed down.
    const generator = (context: GeneratorContext): Infer<S> => {
        return schema.generate({
            ...context, // Pass down all existing context properties (rng, parent, path, etc.)
            locale: localeCode, // Override the locale for this specific generation call
        });
    };

    // The wrapper itself doesn't add new options or fluent methods, it just modifies context.
    // We pass the original schema's options in case they are relevant (though usually they are handled within the original schema's generator)
    return new SchemaImpl<Infer<S>>(generator, (schema as any).currentOptions || {});
}
