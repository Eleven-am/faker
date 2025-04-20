import { Schema, SchemaImpl } from './schema';
import { GeneratorContext } from './context';

// --- Types ---

// Supported avatar generation services
export type AvatarService = 'dicebear' | 'robohash' | 'unavatar' | 'ui-avatars';

export interface AvatarOptions {
    /** The avatar service to use. Defaults to 'dicebear'. */
    service?: AvatarService;
    /** The style or sprite set (service-dependent, e.g., 'identicon', 'bottts' for DiceBear). */
    style?: string;
    /** Desired image size in pixels (square). Defaults to 128. */
    size?: number;
    /** Background color (hex without '#', e.g., 'ffffff'). Some services might ignore or randomize. */
    background?: string;
    /** A specific seed value to use. Overrides automatic seed generation. */
    seedValue?: string | number;
}

// No specific fluent methods for avatar currently
export type AvatarSchema = Schema<string>;

// --- Generator ---

export function avatar(options: AvatarOptions = {}): AvatarSchema {
    const generator = (context: GeneratorContext): string => {
        const opts: AvatarOptions = { ...context.options };
        const { rng, parent, index } = context; // Get potential seeding sources

        // --- Determine Options ---
        const service = opts.service || 'dicebear';
        // Default styles per service (examples)
        const defaultStyles: Record<AvatarService, string> = {
            dicebear: 'identicon',
            robohash: 'set1', // Robohash uses 'set1', 'set2', etc.
            unavatar: '', // Unavatar mainly uses external providers
            'ui-avatars': '', // UI Avatars uses name initials
        };
        const style = opts.style || defaultStyles[service];
        const size = opts.size || 128;
        const background = opts.background?.replace(/^#/, ''); // Remove leading '#' if present

        // --- Determine Seed ---
        let seed: string | number;
        if (opts.seedValue !== undefined) {
            seed = opts.seedValue;
        } else {
            // Try to derive a consistent seed from context
            const parentId = parent?.id;
            const parentEmail =
                parent?.email && typeof parent.email === 'string' ? parent.email : null;
            const parentUsername =
                parent?.username && typeof parent.username === 'string' ? parent.username : null;
            const parentName = parent?.name && typeof parent.name === 'string' ? parent.name : null;

            if (parentId) seed = `id-${parentId}`;
            else if (parentEmail) seed = parentEmail;
            else if (parentUsername) seed = parentUsername;
            else if (parentName) seed = parentName;
            else if (index !== undefined)
                seed = `index-${index}`; // Use index in arrays/objects
            else seed = `rng-${rng.nextInt(10000, 999999)}`; // Fallback random seed
        }
        const encodedSeed = encodeURIComponent(String(seed));

        // --- Generate URL based on Service ---
        const sizeParam = `size=${size}`;
        const bgParamDice = background ? `&backgroundColor=${background}` : '';
        const bgParamRobo = background ? `&bgset=bg${rng.nextInt(1, 2)}` : ''; // Robohash has bg1/bg2
        const bgParamUi = background ? `&background=${background}` : '&background=random'; // UI Avatars

        // Determine name for services that use it (ui-avatars, unavatar fallback)
        const nameForAvatar =
            (parent?.name && typeof parent.name === 'string' ? parent.name : '') ||
            (parent?.username && typeof parent.username === 'string' ? parent.username : '') ||
            `User ${index ?? rng.nextInt(10, 99)}`;
        const encodedName = encodeURIComponent(nameForAvatar);

        switch (service) {
            case 'dicebear':
                // Using v8 API format example
                const dicebearStyle = style || 'identicon'; // Ensure a style is provided
                return `https://api.dicebear.com/8.x/${encodeURIComponent(dicebearStyle)}/svg?seed=${encodedSeed}&${sizeParam}${bgParamDice}`;

            case 'robohash':
                const roboSet = style && style.startsWith('set') ? style : 'set1'; // Default to set1
                return `https://robohash.org/${encodedSeed}?set=${roboSet}&${sizeParam}x${sizeParam}${bgParamRobo}`;

            case 'unavatar':
                // Unavatar acts as a proxy, often needs a fallback
                const fallbackUrl = `https://ui-avatars.com/api/?name=${encodedName}&${sizeParam}&background=random&color=fff`; // Use UI Avatars as fallback
                // Try using the seed as if it were a domain or email
                return `https://unavatar.io/${encodedSeed}?fallback=${encodeURIComponent(fallbackUrl)}&${sizeParam}`;

            case 'ui-avatars':
                return `https://ui-avatars.com/api/?name=${encodedName}&${sizeParam}${bgParamUi}&color=fff`; // White text color is common

            default:
                // Fallback to DiceBear identicon if service is unknown
                console.warn(
                    `[F] Avatar generation: Unknown service '${service}'. Falling back to DiceBear identicon.`
                );
                return `https://api.dicebear.com/8.x/identicon/svg?seed=${encodedSeed}&${sizeParam}`;
        }
    };

    return new SchemaImpl<string>(generator, options);
}
