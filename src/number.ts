import { Schema, SchemaImpl } from './schema';
import { GeneratorContext } from './context';
import { generateDistributedValue } from './utils'; // Import helper

// --- Types ---

export interface NumberOptions {
    min?: number;
    max?: number;
    precision?: number; // Number of decimal places
    integer?: boolean;
    positive?: boolean; // >= 0
    negative?: boolean; // <= 0
    distribution?: 'uniform' | 'normal' | 'exponential';
    distributionOptions?: {
        mean?: number;
        standardDeviation?: number;
        lambda?: number;
    };
}

export interface NumberSchemaFluent {
    min: (value: number) => NumberSchema;
    max: (value: number) => NumberSchema;
    integer: () => NumberSchema;
    positive: () => NumberSchema;
    negative: () => NumberSchema;
    precision: (digits: number) => NumberSchema;
    distribution: (
        dist: 'uniform' | 'normal' | 'exponential',
        options?: {
            mean?: number;
            standardDeviation?: number;
            lambda?: number;
        }
    ) => NumberSchema;
}

export type NumberSchema = Schema<number> & NumberSchemaFluent;

// --- Generator ---

export function number(options: NumberOptions = {}): NumberSchema {
    const generator = (context: GeneratorContext): number => {
        const opts: NumberOptions = { ...context.options };
        const { rng } = context;

        // Determine effective min/max, handling positive/negative flags
        let effMin = opts.min ?? -Infinity;
        let effMax = opts.max ?? Infinity;

        if (opts.positive === true && opts.negative === true) {
            // If both positive and negative are true, the only valid value is 0
            console.warn(
                `[F] Number generation: Both 'positive' and 'negative' flags set. Result will be 0.`
            );
            return 0;
        }
        if (opts.positive === true) {
            effMin = Math.max(effMin, 0); // Ensure min is at least 0
            if (effMax < 0) {
                console.warn(
                    `[F] Number generation: 'positive' flag set, but max (${effMax}) is negative. Result will be 0.`
                );
                return 0;
            }
            effMax = Math.max(effMax, 0); // Max should also be non-negative
        }
        if (opts.negative === true) {
            effMax = Math.min(effMax, 0); // Ensure max is at most 0
            if (effMin > 0) {
                console.warn(
                    `[F] Number generation: 'negative' flag set, but min (${effMin}) is positive. Result will be 0.`
                );
                return 0;
            }
            effMin = Math.min(effMin, 0); // Min should also be non-positive
        }

        // Basic validation for min/max after applying positive/negative
        const numericMin = typeof effMin === 'number' && !isNaN(effMin) ? effMin : -Infinity;
        const numericMax = typeof effMax === 'number' && !isNaN(effMax) ? effMax : Infinity;

        if (numericMin > numericMax) {
            console.warn(
                `[F] Number generation: Effective min (${numericMin}) > max (${numericMax}). Returning min.`
            );
            return numericMin === -Infinity ? 0 : numericMin; // Avoid returning -Infinity directly
        }
        if (numericMin === numericMax) {
            return numericMin; // If they are equal, return that value
        }

        // Generate base value using distribution
        let value = generateDistributedValue(rng, opts.distribution || 'uniform', {
            min: numericMin === -Infinity ? Number.MIN_SAFE_INTEGER : numericMin, // Provide bounds for distributions
            max: numericMax === Infinity ? Number.MAX_SAFE_INTEGER : numericMax,
            distributionOptions: opts.distributionOptions,
        });

        // Apply integer constraint *before* precision if both are set
        if (opts.integer) {
            value = Math.round(value); // Or Math.floor/Math.ceil depending on desired behavior
        }

        // Apply precision
        if (opts.precision !== undefined && opts.precision >= 0) {
            const factor = Math.pow(10, opts.precision);
            // Use Math.round for better precision handling than parseFloat(toFixed())
            value = Math.round(value * factor) / factor;
        }

        // Final clamp to ensure the result respects min/max after rounding/precision adjustments
        value = Math.max(numericMin, Math.min(numericMax, value));

        // Re-apply integer rounding if precision wasn't the last step
        if (opts.integer && !(opts.precision !== undefined && opts.precision >= 0)) {
            value = Math.round(value);
        }

        return value;
    };

    return new SchemaImpl<number>(generator, options) as NumberSchema;
}
