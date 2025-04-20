import { Schema, SchemaImpl } from './schema';
import { GeneratorContext } from './context';

// --- Types ---

export interface DateOptions {
    /** Minimum date (inclusive). Can be Date object, timestamp number, or parsable string. Defaults to 1 year ago. */
    min?: Date | string | number;
    /** Maximum date (inclusive). Can be Date object, timestamp number, or parsable string. Defaults to now. */
    max?: Date | string | number;
    /** Distribution strategy. 'uniform' or 'recent' (favors dates closer to max). */
    distribution?: 'uniform' | 'recent';
    /** If true, only generates dates falling on Monday-Friday. */
    onlyWeekdays?: boolean;
    /** If true, only generates dates falling within 9:00 AM to 4:59 PM (local time) on weekdays. Implies onlyWeekdays. */
    onlyBusinessHours?: boolean;
}

export interface DateSchemaFluent {
    min: (value: Date | string | number) => DateSchema;
    max: (value: Date | string | number) => DateSchema;
    onlyWeekdays: (enabled?: boolean) => DateSchema;
    onlyBusinessHours: (enabled?: boolean) => DateSchema;
    distribution: (dist: 'uniform' | 'recent') => DateSchema;
}

export type DateSchema = Schema<Date> & DateSchemaFluent;

// --- Helper ---

function parseDateOption(option: Date | string | number | undefined, defaultDate: Date): Date {
    if (option === undefined) return defaultDate;
    try {
        const date = new Date(option);
        return isNaN(date.getTime()) ? defaultDate : date; // Fallback if parsing fails
    } catch (e) {
        return defaultDate;
    }
}

// --- Generator ---

export function date(options: DateOptions = {}): DateSchema {
    const generator = (context: GeneratorContext): Date => {
        const opts: DateOptions = { ...context.options };
        const { rng } = context;

        // Establish default range: last year to now
        const defaultMax = new Date();
        const defaultMin = new Date(defaultMax.getTime() - 365 * 24 * 60 * 60 * 1000);

        // Parse min/max options with fallbacks
        let minD = parseDateOption(opts.min, defaultMin);
        let maxD = parseDateOption(opts.max, defaultMax);

        // Ensure min <= max
        if (minD.getTime() > maxD.getTime()) {
            console.warn(
                `[F] Date generation: min date (${minD.toISOString()}) is after max date (${maxD.toISOString()}). Swapping them.`
            );
            [minD, maxD] = [maxD, minD];
        }

        let minTime = minD.getTime();
        let maxTime = maxD.getTime();

        // Handle edge case where min and max are the same time
        if (minTime === maxTime) {
            // Check constraints for the single possible date
            const theDate = new Date(minTime);
            const day = theDate.getDay(); // 0 = Sun, 6 = Sat
            const hour = theDate.getHours(); // 0-23
            const isWeekday = day > 0 && day < 6;
            const isBusinessHour = hour >= 9 && hour < 17; // 9:00 to 16:59

            if (opts.onlyBusinessHours && (!isWeekday || !isBusinessHour)) {
                console.warn(
                    `[F] Date generation: min and max are identical (${theDate.toISOString()}), but it fails the onlyBusinessHours constraint.`
                );
                // Fallback: maybe return min/max or throw? Returning max for now.
                return maxD;
            }
            if (opts.onlyWeekdays && !isWeekday) {
                console.warn(
                    `[F] Date generation: min and max are identical (${theDate.toISOString()}), but it fails the onlyWeekdays constraint.`
                );
                return maxD;
            }
            return theDate;
        }

        let generatedDate: Date;
        let attempts = 0;
        const maxAttempts = 100; // Increased attempts for potentially tricky constraints

        do {
            attempts++;
            let timestamp: number;

            // Generate timestamp based on distribution
            if (opts.distribution === 'recent') {
                // Skew towards maxTime using a power function (sqrt makes it favor recent)
                const randomFactor = 1 - Math.sqrt(rng.next()); // Generates values closer to 0 (meaning closer to maxTime)
                timestamp = minTime + randomFactor * (maxTime - minTime);
                // Ensure it stays within bounds due to potential floating point issues
                timestamp = Math.max(minTime, Math.min(maxTime, timestamp));
            } else {
                // Uniform distribution
                timestamp = minTime + rng.next() * (maxTime - minTime);
            }

            generatedDate = new Date(timestamp);

            // Check constraints
            const day = generatedDate.getDay(); // 0 = Sun, 6 = Sat
            const hour = generatedDate.getHours(); // 0-23
            const isWeekday = day > 0 && day < 6;
            const isBusinessHour = hour >= 9 && hour < 17; // 9:00 to 16:59

            // Apply constraints. Note: onlyBusinessHours implies onlyWeekdays.
            if (opts.onlyBusinessHours) {
                if (isWeekday && isBusinessHour) {
                    return generatedDate; // Valid date found
                }
            } else if (opts.onlyWeekdays) {
                if (isWeekday) {
                    return generatedDate; // Valid date found
                }
            } else {
                // No day/hour constraints
                return generatedDate; // Valid date found
            }
        } while (attempts < maxAttempts);

        // If loop finishes without returning, constraints couldn't be met
        console.warn(
            `[F] Date generation: Failed to meet constraints (onlyWeekdays: ${opts.onlyWeekdays}, onlyBusinessHours: ${opts.onlyBusinessHours}) within ${maxAttempts} attempts in range [${minD.toISOString()}, ${maxD.toISOString()}]. Returning last generated date: ${generatedDate!.toISOString()}`
        );
        return generatedDate!; // Return the last generated date as a fallback
    };

    return new SchemaImpl<Date>(generator, options) as DateSchema;
}
