import { PCG } from './pcg';
import { GeneratorContext } from './context';

export interface Schema<T> {
    /** Generates a single value using the schema. */
    generate: (
        contextOptions?: Partial<Omit<GeneratorContext, 'rng' | 'options'>> & { seed?: number }
    ) => T;

    /** Generates an array of values using the schema. */
    generateMany: (count: number, options?: { seed?: number }) => T[];

    /** Makes the generated value potentially null. */
    optional: (probability?: number) => Schema<T | null>;

    /** Applies a transformation function after generation. */
    transform: <U>(fn: (val: T, context: GeneratorContext) => U) => Schema<U>;

    /**
     * Adds a constraint that the generated value must satisfy.
     * Retries generation up to `retries` times if the predicate fails.
     */
    where: (predicate: (val: T) => boolean, retries?: number) => Schema<T>;

    /** Chains multiple transformation functions. */
    pipe: <U>(...transformers: Array<(val: any, context: GeneratorContext) => any>) => Schema<U>;
}

// Base implementation class providing core functionality and fluent methods.
// Individual factory functions will create instances of this and cast to specific types (e.g., StringSchema).
export class SchemaImpl<T> implements Schema<T> {
    protected readonly generatorFn: (context: GeneratorContext) => T;
    protected constraints: Array<{ predicate: (val: T) => boolean; retries: number }> = [];
    protected readonly currentOptions: Record<string, any> = {};

    constructor(
        generator: (context: GeneratorContext) => T,
        initialOptions: Record<string, any> = {}
    ) {
        this.generatorFn = generator;
        // Deep clone options to prevent mutations across schema instances
        this.currentOptions = JSON.parse(JSON.stringify(initialOptions));
    }

    generate(
        contextOptions: Partial<Omit<GeneratorContext, 'rng' | 'options'>> & { seed?: number } = {}
    ): T {
        const seed = contextOptions.seed ?? Date.now() + Math.floor(Math.random() * 10000);
        const rng = new PCG(seed); // Each generate call gets its own RNG sequence if seed is provided/new
        const cache = contextOptions['cache'] || new Map<string, any>();
        const fullContext: GeneratorContext = {
            rng,
            cache,
            locale: 'en-US', // Default locale
            seed: seed,
            ...contextOptions, // User-provided context overrides defaults
            options: this.currentOptions, // Pass generator-specific options
            path: contextOptions['path'] || contextOptions['key'] || '', // Build path info
        };

        let attempts = 0;
        // Determine max attempts based on the *first* constraint's retry count (or default)
        const maxTotalAttempts = (this.constraints[0]?.retries ?? 10) + 1;
        let result: T;

        do {
            attempts++;
            // Execute the core generator function with the full context
            result = this.generatorFn(fullContext);

            // Check all constraints
            let satisfied = true;
            for (const { predicate } of this.constraints) {
                if (!predicate(result)) {
                    satisfied = false;
                    break; // Stop checking constraints if one fails
                }
            }

            if (satisfied) return result; // Return if all constraints pass

            // If attempts exhausted and still not satisfied, warn and return last result
            if (attempts >= maxTotalAttempts) {
                console.warn(
                    `[F] Constraint fail path '${fullContext.path}' after ${attempts} attempts. Returning last generated value.`
                );
                return result;
            }
        } while (attempts < maxTotalAttempts);

        // Should be unreachable due to the check inside the loop, but satisfies TS
        return result;
    }

    generateMany(count: number, options: { seed?: number } = {}): T[] {
        if (count < 0) count = 0;
        const results: T[] = [];
        // Use a single RNG for the whole array generation process for consistency
        const seed = options.seed ?? Date.now() + Math.floor(Math.random() * 10000);
        const rng = new PCG(seed);
        const cache = new Map<string, any>();

        // Base context for each element generation
        const elementContextBase: Omit<
            GeneratorContext,
            'index' | 'key' | 'parent' | 'path' | 'options'
        > = {
            rng,
            cache,
            locale: 'en-US', // Can be overridden if the schema itself forces a locale
            seed: seed, // Seed is mainly for the initial RNG state
        };

        for (let i = 0; i < count; i++) {
            // Generate each element using the base schema's generate method
            // Pass index and path specific to the element
            results.push(this.generate({ ...elementContextBase, index: i, path: `[${i}]` }));
        }
        return results;
    }

    optional(probability: number = 0.5): Schema<T | null> {
        const p = Math.max(0, Math.min(1, probability)); // Clamp probability
        // Create a new schema that wraps the original generator
        const opts = { ...this.currentOptions, _isOptional: true, probability: p };
        return new SchemaImpl<T | null>(
            ctx => (ctx.rng.next() < p ? this.generatorFn(ctx) : null),
            opts
        );
    }

    transform<U>(fn: (val: T, context: GeneratorContext) => U): Schema<U> {
        const opts = { ...this.currentOptions, _transformed: true };
        // Create a new schema that runs the original generator, then the transform function
        return new SchemaImpl<U>(ctx => fn(this.generatorFn(ctx), ctx), opts);
    }

    where(predicate: (val: T) => boolean, retries: number = 10): Schema<T> {
        // Create a clone of the current schema
        const newSchema = new SchemaImpl<T>(this.generatorFn, this.currentOptions);
        // Add the new constraint to the clone
        newSchema.constraints = [...this.constraints, { predicate, retries: Math.max(1, retries) }];
        return newSchema;
    }

    pipe<U>(...tf: Array<(val: any, context: GeneratorContext) => any>): Schema<U> {
        const opts = { ...this.currentOptions, _piped: true };
        // Create a new schema that runs the original generator, then applies each transformer in sequence
        // @ts-ignore - Trusting the transformer chain results in type U
        return new SchemaImpl<U>(ctx => {
            let v = this.generatorFn(ctx);
            for (const t of tf) {
                v = t(v, ctx);
            }
            return v;
        }, opts);
    }

    minLength(l: number): this {
        return this.cloneWithOptions({ minLength: l });
    }
    maxLength(l: number): this {
        return this.cloneWithOptions({ maxLength: l });
    }
    length(l: number): this {
        return this.cloneWithOptions({ length: l });
    }
    chars(c: string): this {
        return this.cloneWithOptions({ chars: c });
    }
    prefix(p: string): this {
        return this.cloneWithOptions({ prefix: p });
    }
    suffix(s: string): this {
        return this.cloneWithOptions({ suffix: s });
    }
    casing(c: 'lower' | 'upper' | 'capitalize' | 'title'): this {
        return this.cloneWithOptions({ casing: c });
    }
    exclude(e: string | RegExp | Array<string | RegExp>): this {
        return this.cloneWithOptions({ exclude: e });
    }
    pattern(p: RegExp): this {
        return this.cloneWithOptions({ pattern: p });
    }

    min(v: number | Date | string): this {
        return this.cloneWithOptions({ min: v });
    }
    max(v: number | Date | string): this {
        return this.cloneWithOptions({ max: v });
    }
    integer(): this {
        return this.cloneWithOptions({ integer: true });
    }
    positive(): this {
        return this.cloneWithOptions({ positive: true });
    }
    negative(): this {
        return this.cloneWithOptions({ negative: true });
    }
    precision(d: number): this {
        return this.cloneWithOptions({ precision: d });
    }
    distribution(d: 'uniform' | 'normal' | 'exponential' | 'recent', opts?: any): this {
        return this.cloneWithOptions({ distribution: d, distributionOptions: opts });
    } // 'any' for opts to cover Date/Number

    onlyWeekdays(e: boolean = true): this {
        return this.cloneWithOptions({ onlyWeekdays: e });
    }
    onlyBusinessHours(e: boolean = true): this {
        return this.cloneWithOptions({ onlyBusinessHours: e });
    }

    unique(u: boolean = true): this {
        return this.cloneWithOptions({ unique: u });
    }
    sort(s?: boolean | ((a: any, b: any) => number)): this {
        return this.cloneWithOptions({ sort: s ?? true });
    }

    likelihood(p: number): this {
        return this.cloneWithOptions({ likelihood: p });
    }

    /** Internal helper to create a new instance with updated options */
    protected cloneWithOptions(newOptions: Partial<Record<string, any>>): this {
        // Get the constructor of the current instance (might be a subclass)
        const Cls = this.constructor as typeof SchemaImpl;
        // Create a new instance of the *same* class
        const inst = new Cls(this.generatorFn, { ...this.currentOptions, ...newOptions });
        // Copy constraints to the new instance
        inst.constraints = [...this.constraints];
        // Cast to 'this' to maintain the specific type (e.g., StringSchema)
        return inst as this;
    }
}
