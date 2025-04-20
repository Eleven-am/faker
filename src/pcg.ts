/**
 * PCG (Permuted Congruential Generator) - Better statistical properties than LCG
 * Based on the PCG algorithm by Melissa O'Neill
 */
export class PCG {
    private state: bigint;
    private readonly inc: bigint;
    // PCG constants for 64-bit version
    private readonly MULTIPLIER = BigInt('6364136223846793005');
    private readonly DEFAULT_INC = BigInt('1442695040888963407');

    /**
     * Creates a new PCG instance with the given seed
     * @param seed - Number or BigInt to use as seed
     */
    constructor(seed: number | bigint) {
        // Ensure the increment is odd as required by PCG
        this.inc = this.DEFAULT_INC | BigInt(1);

        // Initialize state properly
        const seedBig = typeof seed === 'number' ? BigInt(Math.abs(Math.floor(seed)) || 1) : seed;

        // Initial state setup requires two steps
        this.state = BigInt(0);
        this.step();
        this.state = this.state + seedBig;
        this.step();
    }

    /**
     * Advances the internal state
     */
    private step(): void {
        this.state =
            (this.state * this.MULTIPLIER + this.inc) & ((BigInt(1) << BigInt(64)) - BigInt(1));
    }

    /**
     * Generate the next 32-bit random number
     * @returns A number between 0 and 2^32 - 1
     */
    private nextUint32(): number {
        // Save current state
        const oldState = this.state;

        // Advance internal state
        this.step();

        // Calculate output function (XSH RR: xorshift high, random rotation)
        const xorShifted = Number(((oldState >> BigInt(18)) ^ oldState) >> BigInt(27)) & 0xffffffff;
        const rot = Number(oldState >> BigInt(59)) & 31;

        // Rotate right operation
        return ((xorShifted >>> rot) | (xorShifted << (-rot & 31))) >>> 0;
    }

    /**
     * Returns a random floating-point number between 0 (inclusive) and 1 (exclusive)
     */
    next(): number {
        return this.nextUint32() / 4294967296;
    }

    /**
     * Returns a random integer between min and max (both inclusive)
     * @param min - Minimum value (inclusive)
     * @param max - Maximum value (inclusive)
     */
    nextInt(min: number, max: number): number {
        min = Math.floor(min);
        max = Math.floor(max);

        // Handle edge cases
        if (min > max) {
            console.warn('nextInt: min > max, swapping values');
            [min, max] = [max, min];
        }

        if (min === max) {
            return min;
        }

        // Calculate range size
        const range = max - min + 1;

        // For small ranges, we can use a simple modulo approach
        if (range <= 0x100000) {
            return min + (this.nextUint32() % range);
        }

        // For larger ranges, reject values outside our range to avoid modulo bias
        // Calculate how many values we need to reject
        const limit = Math.floor(0x100000000 / range) * range;

        // Keep generating until we get a value in the acceptable range
        let x: number;
        do {
            x = this.nextUint32();
        } while (x >= limit);

        return min + (x % range);
    }
}
