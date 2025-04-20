import { Schema, SchemaImpl } from './schema';
import { GeneratorContext } from './context';

// --- Types ---

// Type constraint for enum values (primitive types)
export type EnumValue = string | number | boolean;

// --- Generator ---

/**
 * Creates a schema that randomly picks one value from the provided readonly array.
 * @param values A non-empty readonly array of possible values (strings, numbers, or booleans).
 */
export function enumValue<T extends EnumValue>(values: readonly T[]): Schema<T> { // Renamed to enumValue to avoid JS keyword conflict
    if (!values || values.length === 0) {
        throw new Error('[F] f.enumValue requires a non-empty readonly array of values.');
    }

    const generator = (context: GeneratorContext): T => {
        const { rng } = context;
        const randomIndex = rng.nextInt(0, values.length - 1);
        return values[randomIndex] as T; // Type assertion to ensure the return type matches the enum value type
    };

    return new SchemaImpl<T>(generator, {}); // No specific options or fluent methods needed
}
