export { type Schema, SchemaImpl } from './schema';
export type { GeneratorContext } from './context';
export type { Infer } from './types';

export { transformers } from './transformers';
export { getLocaleData } from './localeData';
export type { LocaleDefinition } from './localeData';

import { address } from './address';
import { array } from './array';
import { avatar } from './avatar';
import { boolean } from './boolean';
import { creditCard } from './creditCards';
import { custom } from './custom';
import { date } from './date';
import { dependent } from './dependent';
import { email } from './email';
import { enumValue } from './enum';
import { literal } from './literal';
import { locale } from './locale';
import { name } from './name';
import { number } from './number';
import { object } from './object';
import { paragraph } from './paragraph';
import { phone } from './phone';
import { record } from './record';
import { reference } from './reference';
import { string } from './string';
import { tuple } from './tuples';
import { union } from './union';
import { url } from './url';
import { uuid } from './uuid';

export * from './string';
export * from './number';
export * from './boolean';
export * from './date';
export * from './array';
export * from './creditCards';
export * from './paragraph';
export * from './object';
export * from './email';
export * from './name';
export * from './url';
export * from './phone';
export * from './address';
export * from './avatar';
export * from './record';
export * from './tuples';
export * from './dependent';
export * from './reference';

export const f = {
    address,
    array,
    avatar,
    boolean,
    custom,
    date,
    dependent,
    email,
    creditCard,
    enum: enumValue,
    literal,
    locale,
    name,
    number,
    object,
    paragraph,
    phone,
    record,
    reference,
    string,
    tuple,
    union,
    url,
    uuid,
};
