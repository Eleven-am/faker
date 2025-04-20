import { PCG } from './pcg';

export interface GeneratorContext {
    index?: number;
    key?: string;
    parent?: any;
    rng: PCG;
    path?: string;
    locale?: string;
    cache?: Map<string, any>;
    seed?: number;
    options?: Record<string, any>;
    [key: string]: any;
}
