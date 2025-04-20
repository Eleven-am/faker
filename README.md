# faker

A modern, strongly-typed fake data generator for TypeScript with a declarative, fluent API.

[![npm version](https://img.shields.io/npm/v/@eleven-am/faker.svg)](https://www.npmjs.com/package/@eleven-am/faker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](https://www.typescriptlang.org/)

## Features

- **🔒 Strongly Typed**: Full TypeScript support with type inference.
- **⚡ Deterministic**: Reproducible data generation with seed support.
- **🧩 Composable**: Build complex schemas from simple building blocks.
- **🌐 Internationalization**: Multi-locale support for names, addresses, and more.
- **🔄 Fluent API**: Chain methods for concise, readable schema definitions.
- **📚 Comprehensive**: Generate everything from simple values to complex objects.
- **🔌 Zero Dependencies**: Lightweight and self-contained.

## Installation

```bash
npm install @eleven-am/faker
# or
yarn add @eleven-am/faker
# or
pnpm add @eleven-am/faker
```

## Quick Start

```typescript
import { f } from '@eleven-am/faker';

// Define a user schema
const userSchema = f.object({
  id: f.uuid(),
  username: f.string().minLength(5).maxLength(15),
  email: f.email(),
  isActive: f.boolean({ likelihood: 0.8 }),
  registeredAt: f.date().min('2020-01-01'),
  profile: f.object({
    name: f.name(),
    avatar: f.avatar(),
    bio: f.paragraph({ maxSentences: 3 })
  })
});

// Generate a single user
const user = userSchema.generate();
console.log(user);

// Generate multiple users with a specific seed
const users = userSchema.generateMany(10, { seed: 12345 });
```

## Schema Types

### Basic Types

```typescript
// Strings
f.string({ minLength: 5, maxLength: 10, prefix: 'user-' })
f.string().minLength(5).maxLength(10).prefix('user-') // Fluent alternative

// Numbers
f.number({ min: 1, max: 100, precision: 2 })
f.number().min(1).max(100).precision(2) // Fluent alternative

// Booleans
f.boolean({ likelihood: 0.7 })
f.boolean().likelihood(0.7) // Fluent alternative

// Dates
f.date({ min: '2020-01-01', max: '2022-12-31' })
f.date().min('2020-01-01').max('2022-12-31') // Fluent alternative

// Enums
f.enum(['admin', 'user', 'editor'] as const)

// Literals
f.literal('constant value')
```

### Advanced Types

```typescript
// Objects
f.object({
  id: f.uuid(),
  name: f.string(),
  createdAt: f.date()
})

// Arrays
f.array(f.string(), { minLength: 3, maxLength: 7 })
f.array(f.number()).minLength(3).maxLength(7) // Fluent alternative

// Tuples (fixed length arrays with mixed types)
f.tuple(f.string(), f.number(), f.boolean())

// Records (dictionaries with dynamic keys)
f.record(f.string(), f.number())

// Unions (randomly choose one schema)
f.union(f.string(), f.number())

// Optional values
f.string().optional(0.3) // 30% chance of being null

// Dependent values (conditional generation)
f.dependent<Parent>(schema, {
  condition: (parent) => parent.includeDetail === true
})
```

### Real-World Types

```typescript
// Names
f.name({ gender: 'female' })

// Emails
f.email({ domain: 'example.com' })

// URLs
f.url({ includeQueryParams: true })

// Paragraphs
f.paragraph({ sentences: 3 })

// Addresses
f.address({ includeCountry: true })

// Phone numbers
f.phone({ countryCode: true })

// Avatars
f.avatar({ service: 'dicebear', style: 'avataaars' })

// Credit cards
f.creditCard({ type: 'visa' })
```

## Advanced Usage

### Type Inference

Use the `Infer` helper to extract the generated type from a schema:

```typescript
import { f, Infer } from '@eleven-am/faker';

const userSchema = f.object({
  id: f.uuid(),
  name: f.string()
});

// TypeScript automatically infers the correct type
type User = Infer<typeof userSchema>;
// Equivalent to: { id: string; name: string; }

// Use the inferred type
function processUser(user: User) {
  // ...
}

processUser(userSchema.generate());
```

### Deterministic Generation

Generate consistent data sets with seeds:

```typescript
// Same seed produces the same output every time
const user1 = userSchema.generate({ seed: 12345 });
const user2 = userSchema.generate({ seed: 12345 });
console.log(user1.id === user2.id); // true

// For arrays
const users = userSchema.generateMany(10, { seed: 12345 });
```

### Constraints and Transformations

Apply constraints and transformations to schemas:

```typescript
// Ensure generated values meet a condition
const adultSchema = f.number({ min: 1, max: 100 })
  .where(age => age >= 18);

// Transform generated values
const emailSchema = f.string()
  .transform((str, ctx) => `${str}@example.com`);

// Chain transformations
import { transformers } from '@eleven-am/faker';

const titleSchema = f.string()
  .pipe(
    transformers.trim(),
    transformers.capitalize()
  );
```

### Internationalization

Generate locale-specific data:

```typescript
// French names
const frenchName = f.locale('fr-FR', f.name());

// UK addresses
const ukAddress = f.locale('en-GB', f.address());
```

## API Reference

See the [full API documentation](https://eleven-am.github.io/faker) for detailed information on all schema types, options, and methods.

## License

MIT