import { Schema, SchemaImpl } from './schema';
import { GeneratorContext } from './context';

// --- Types ---

export interface BooleanOptions {
    /** The probability of generating `true` (0 to 1). Defaults to 0.5. */
    likelihood?: number;
}

export interface BooleanSchemaFluent {
    likelihood: (prob: number) => BooleanSchema;
}

export type BooleanSchema = Schema<boolean> & BooleanSchemaFluent;

// --- Generator ---

export function boolean(options: BooleanOptions = {}): BooleanSchema {
    const generator = (context: GeneratorContext): boolean => {
        const opts: BooleanOptions = { ...context.options };
        const { rng } = context;
        // Clamp likelihood between 0 and 1
        const probabilityTrue = Math.max(0, Math.min(1, opts.likelihood ?? 0.5));
        return rng.next() < probabilityTrue;
    };

    return new SchemaImpl<boolean>(generator, options) as BooleanSchema;
}
