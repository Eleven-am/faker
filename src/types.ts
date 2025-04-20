import { Schema } from './schema';

/** Infers the generated type from a Schema */
export type Infer<T extends Schema<any>> = T extends Schema<infer U> ? U : never;

// Could potentially define base Option/Fluent interfaces here if needed
// export interface BaseOptions { /* common options? */ }
// export interface BaseFluent { /* common fluent methods? */ }
