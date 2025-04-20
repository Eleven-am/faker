import { Schema, SchemaImpl } from './schema';
import { GeneratorContext } from './context';
import { loremSentences } from './utils'; // Import sample sentences

// --- Types ---

export interface ParagraphOptions {
    /** Minimum number of sentences (inclusive). Defaults to 3. */
    minSentences?: number;
    /** Maximum number of sentences (inclusive). Defaults to 7. */
    maxSentences?: number;
    /** Exact number of sentences. Overrides min/max. */
    sentences?: number;
}

// No specific fluent interface needed for paragraph currently
export type ParagraphSchema = Schema<string>;

// --- Generator ---

export function paragraph(options: ParagraphOptions = {}): ParagraphSchema {
    const generator = (context: GeneratorContext): string => {
        const opts: ParagraphOptions = { ...context.options };
        const { rng } = context;

        // Determine number of sentences
        const minSent = opts.minSentences ?? 3;
        const maxSent = opts.maxSentences ?? 7;
        let numSentences = opts.sentences ?? rng.nextInt(minSent, maxSent);

        // Validate sentence count against available sentences
        if (numSentences < 1) numSentences = 1;
        if (numSentences > loremSentences.length) {
            console.warn(
                `[F] Paragraph generation: Requested ${numSentences} sentences, but only ${loremSentences.length} unique sentences are available. Using ${loremSentences.length}.`
            );
            numSentences = loremSentences.length;
        }

        // Select unique random sentences
        const selectedSentences: string[] = [];
        // Create a mutable array of indices to pick from
        const availableIndices = Array.from(loremSentences.keys());

        for (let i = 0; i < numSentences; i++) {
            if (availableIndices.length === 0) break; // Should not happen with validation above, but safe check

            // Pick a random index from the *remaining* available indices
            const randomIndexPosition = rng.nextInt(0, availableIndices.length - 1);
            const selectedSentenceIndex = availableIndices[randomIndexPosition] as number;

            // Add the corresponding sentence
            selectedSentences.push(loremSentences[selectedSentenceIndex] as string);

            // Remove the used index to prevent duplicates
            availableIndices.splice(randomIndexPosition, 1);
        }

        // Join the selected sentences into a paragraph
        return selectedSentences.join(' ');
    };

    // Paragraph has no specific fluent methods beyond the base Schema ones
    return new SchemaImpl<string>(generator, options);
}
