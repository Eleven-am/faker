import { PCG } from './pcg';

/**
 * Formats a string template by replacing {{key}} placeholders.
 * Also cleans up extra commas and whitespace.
 */
export function formatString(template: string, data: Record<string, string | number>): string {
    // Replace placeholders
    let result = template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(data[key] ?? ''));
    // Clean up consecutive commas potentially left by empty optional fields
    result = result.replace(/,\s*,/g, ',');
    // Clean up trailing commas before the end or before a newline
    result = result.replace(/,\s*$/, '');
    // Clean up leading/trailing whitespace and multiple spaces
    result = result.trim().replace(/\s+/g, ' ');
    return result;
}

/**
 * Generates a random number based on a specified distribution.
 */
export function generateDistributedValue(
    rng: PCG,
    distribution: 'uniform' | 'normal' | 'exponential' = 'uniform',
    options: {
        min?: number;
        max?: number;
        distributionOptions?: { mean?: number; standardDeviation?: number; lambda?: number };
    } = {}
): number {
    const min = options.min ?? 0;
    const max = options.max ?? 1;

    // Basic validation
    if (min > max) {
        console.warn(`[F] Distribution generation: min (${min}) > max (${max}). Returning min.`);
        return min;
    }
    if (min === max) return min; // If min and max are the same, return that value

    switch (distribution) {
        case 'normal': {
            // Box-Muller transform for normal distribution
            const mean = options.distributionOptions?.mean ?? (min + max) / 2;
            // Estimate stdDev to keep most values within range (approx 95% within +/- 2 stdDev)
            const stdDev = options.distributionOptions?.standardDeviation ?? (max - min) / 4;
            if (stdDev <= 0) {
                console.warn(
                    `[F] Normal distribution: Standard deviation (${stdDev}) must be positive. Using uniform distribution.`
                );
                return min + rng.next() * (max - min);
            }

            let u1: number, u2: number;
            // Ensure u1 is not 0 to avoid issues with log(0)
            do {
                u1 = rng.next();
            } while (u1 === 0);
            u2 = rng.next();

            // Standard normal variable (mean 0, stdDev 1)
            const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

            // Scale and shift to desired mean and stdDev
            let value = mean + z * stdDev;

            // Clamp the value to the specified min/max range
            return Math.max(min, Math.min(max, value));
        }
        case 'exponential': {
            // Inverse transform sampling for exponential distribution
            // Default lambda aims for the mean to be roughly in the middle of min/max
            const lambda = options.distributionOptions?.lambda ?? 1 / ((max - min) / 2 || 1);
            if (lambda <= 0) {
                console.warn(
                    `[F] Exponential distribution: Lambda (${lambda}) must be positive. Using uniform distribution.`
                );
                return min + rng.next() * (max - min);
            }
            let u: number;
            // Ensure u is not 0 to avoid issues with log(0)
            do {
                u = rng.next();
            } while (u === 0);

            // Generate value starting from min
            let value = min - Math.log(u) / lambda;

            // Clamp the value to the specified max (min is already handled)
            // Note: Exponential distribution theoretically goes to infinity
            return Math.min(max, value);
        }
        case 'uniform':
        default:
            // Simple uniform distribution
            return min + rng.next() * (max - min);
    }
}

/** Sample sentences for paragraph generation */
export const loremSentences: ReadonlyArray<string> = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    'Curabitur pretium tincidunt lacus.',
    'Nulla gravida orci a odio.',
    'Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris.',
    'Integer in mauris eu nibh euismod gravida.',
    'Duis ac tellus et risus vulputate vehicula.',
    'Donec lobortis risus a elit.',
    'Etiam tempor.',
    'Ut ullamcorper, ligula eu tempor congue, eros est euismod turpis, id tincidunt sapien risus a quam.',
    'Maecenas fermentum consequat mi.',
    'Donec vestibulum.',
    'Integer rutrum, orci vestibulum ullamcorper ultricies, lacus quam ultricies odio, vitae placerat pede sem sit amet enim.',
    'Vivamusńst nisl.', // Note: Typo in original? Keeping as is.
    'Nulla facilisi.',
    'Integer lacinia sollicitudin massa.',
    'Cras metus.',
    'Sed aliquet risus a tortor.',
    'Integer id quam.',
    'Morbi mi.',
    'Quisque nisl felis, venenatis tristique, dignissim in, ultrices sit amet, augue.',
    'Proin sodales libero eget ante.',
    'Praesent dapibus.',
    'Fusce consectetuer risus a nunc.',
    'Vestibulum fermentum tortor id mi.',
    'Pellentesque ipsum.',
    'Nulla ac enim.',
    'Sed vel enim sit amet nunc viverra dapibus.',
    'In hac habitasse platea dictumst.',
];
