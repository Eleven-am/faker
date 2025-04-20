import { Schema, SchemaImpl } from './schema';

// --- Types ---

// Type constraint for literal values (primitive types)
export type LiteralValue = string | number | boolean | null | undefined;

// --- Generator ---

/**
 * Creates a schema that always returns the provided literal value.
 * @param value The literal value to be returned by the generator.
 */
export function literal<T extends LiteralValue>(value: T): Schema<T> {
    // The generator function simply returns the captured literal value, ignoring context.
    const generator = (): T => value;

    return new SchemaImpl<T>(generator, {}); // No specific options or fluent methods needed
}
