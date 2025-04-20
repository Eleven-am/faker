import { Schema, SchemaImpl } from './schema';
import { GeneratorContext } from './context';
import { Infer } from './types';

// --- Types ---

export interface DependentOptions<ParentType = unknown> {
    // Default ParentType to unknown
    /**
     * Condition function to check against the partially built parent object.
     * IMPORTANT: You MUST perform type checks or assertions on 'parent' inside this function
     * before accessing its properties, especially if ParentType is inferred or complex.
     * Example: `condition: (parent) => typeof (parent as YourType).someProp === 'number' && (parent as YourType).someProp > 10`
     * @param parent The partially built parent object (type ParentType, defaults to unknown).
     * @returns `true` if the dependent field should be generated, `false` otherwise.
     */
    condition: (parent: ParentType) => boolean;
}

// --- Generator ---

/**
 * Creates a schema that generates a value only if a condition based on the parent object is met.
 * If the condition is not met, it generates `undefined`.
 * Primarily used within `f.object`.
 *
 * @template ParentType - The expected type of the parent object being built (used in the condition function). Defaults to `unknown`.
 * @template S - The schema type for the dependent value.
 * @param schema The schema to use for generating the value if the condition is met.
 * @param options The options containing the condition function.
 * @returns A schema that generates `Infer<S>` or `undefined`.
 */
export function dependent<ParentType = unknown, S extends Schema<any> = Schema<unknown>>(
    schema: S,
    options: DependentOptions<ParentType>
): Schema<Infer<S> | undefined> {
    // The result can be the schema's type or undefined

    if (!options || typeof options.condition !== 'function') {
        throw new Error("[F] f.dependent requires an options object with a 'condition' function.");
    }

    const generator = (context: GeneratorContext): Infer<S> | undefined => {
        // Check if running within an object context (parent should exist)
        if (!context.parent) {
            console.warn(
                '[F] f.dependent used outside of an f.object context (context.parent is missing). Condition cannot be evaluated. Returning undefined.'
            );
            return undefined;
        }

        try {
            // Evaluate the user-provided condition function, passing the parent object.
            // The user's function is responsible for safe type handling of the parent.
            if (options.condition(context.parent as ParentType)) {
                // Condition met: generate the value using the provided schema and current context.
                // Context (rng, path, etc.) is passed down.
                return schema.generate({ ...context });
            } else {
                // Condition not met: return undefined.
                return undefined;
            }
        } catch (e) {
            // Catch errors during condition evaluation (e.g., accessing property on wrong type)
            console.error(
                `[F] Error during f.dependent condition evaluation for path '${context.path}'. Check type assertions/checks within the condition function. Returning undefined. Error:`,
                e
            );
            return undefined; // Return undefined on error to prevent crashes
        }
    };

    // The dependent wrapper itself doesn't usually need specific options or fluent methods
    return new SchemaImpl<Infer<S> | undefined>(generator, {});
}
