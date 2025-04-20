import { Schema, SchemaImpl } from './schema';
import { GeneratorContext } from './context';

// --- Types ---

// Ensure RefT is constrained to object types
export interface ReferenceOptions<RefT extends object> {
    /** The array of possible items to reference. */
    collection: RefT[];
    /** Optional field name within the collection items whose value should be returned instead of the whole object. */
    idField?: keyof RefT; // Use keyof for better type safety
}

// Type for the possible return values: either the ID field's type or the whole object type
// Also includes undefined for safety, though the generator tries to avoid it.
export type ReferenceReturnType<
    RefT extends object,
    K extends keyof RefT | undefined,
> = K extends keyof RefT ? RefT[K] | undefined : RefT | undefined;

// --- Generator ---

/**
 * Creates a schema that randomly picks an item from a provided collection.
 * Optionally returns the value of a specific field (`idField`) from the chosen item.
 *
 * @template RefT - The type of objects within the collection (must extend object).
 * @param options Configuration including the collection and optional idField.
 * @returns A schema generating either a value from the idField or the entire selected object.
 */
export function reference<RefT extends object>(
    options: ReferenceOptions<RefT>
): Schema<ReferenceReturnType<RefT, typeof options.idField>> {
    if (!options || !Array.isArray(options.collection) || options.collection.length === 0) {
        throw new Error("[F] f.reference requires a non-empty 'collection' array in options.");
    }

    const { collection, idField } = options; // Destructure options

    const generator = (
        context: GeneratorContext
    ): ReferenceReturnType<RefT, typeof options.idField> => {
        const { rng } = context;

        // Select a random item from the collection
        const randomIndex = rng.nextInt(0, collection.length - 1);
        const selectedItem = collection[randomIndex];

        if (selectedItem === undefined || selectedItem === null) {
            console.warn(
                `[F] f.reference: Selected item at index ${randomIndex} from collection is null or undefined. Returning undefined.`
            );
            // @ts-ignore
            return undefined;
        }

        // If an idField is specified, try to return its value
        if (idField !== undefined) {
            // Check if the idField actually exists on the selected object
            // Use 'in' operator for robust check (includes prototype chain if necessary)
            if (idField in selectedItem) {
                // Return the value of the specified field
                // Type assertion is safe here because we checked 'idField in selectedItem'
                return selectedItem[idField as keyof RefT] as ReferenceReturnType<
                    RefT,
                    typeof options.idField
                >;
            } else {
                // idField specified but not found on the selected item
                console.warn(
                    `[F] f.reference: idField '${String(idField)}' not found on the selected item at index ${randomIndex}. Returning the whole item instead.`,
                    selectedItem
                );
                // Fallback: return the whole object if idField is missing
                return selectedItem as ReferenceReturnType<RefT, typeof options.idField>;
            }
        } else {
            // No idField specified, return the entire selected object
            return selectedItem as ReferenceReturnType<RefT, typeof options.idField>;
        }
    };

    return new SchemaImpl(generator, {}); // No specific options needed for the reference wrapper itself
}
