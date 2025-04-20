import { Schema, SchemaImpl } from './schema';
import { GeneratorContext } from './context';

// --- Generator ---

/**
 * Creates a schema that generates a random Version 4 UUID string.
 */
export function uuid(): Schema<string> {
    const generator = (context: GeneratorContext): string => {
        const { rng } = context;
        // Standard RFC 4122 Version 4 UUID format
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            // Generate a random hex digit (0-15)
            const r = rng.nextInt(0, 15);
            // For 'x', use the random digit directly.
            // For 'y', set the high bits to '10' (binary) as required by V4 UUID spec (0x8, 0x9, 0xA, or 0xB)
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16); // Convert to hexadecimal character
        });
    };

    return new SchemaImpl<string>(generator, {}); // No specific options or fluent methods
}
