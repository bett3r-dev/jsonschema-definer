# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript library for building and validating JSON Schemas with a fluent API. The library provides type-safe schema construction with TypeScript type inference, allowing developers to create schemas and automatically derive TypeScript types from them.

**For complete API documentation and usage examples, see DOCUMENTATION.md**

## Commands

### Development
- `npm run build` - Compile TypeScript to JavaScript (output: `dist/`)
- `npm run clean` - Remove `dist/` directory
- `npm run lint` - Run ESLint with auto-fix
- `npm run test` - Run all tests with Jest
- `npm run check` - Run lint, build, and test in sequence (pre-commit validation)
- `npm run docs` - Generate TypeDoc documentation

### Testing
- Run all tests: `npm test`
- Run a specific test file: `npx jest src/__tests__/object.test.ts`
- Run tests in watch mode: `npx jest --watch`

## Architecture

### Core Design Pattern

The library uses a **fluent builder pattern** with **immutability**. Each schema class provides chainable methods that return new instances rather than modifying existing ones. This is implemented through the `copyWith()` method in BaseSchema.

### Schema Class Hierarchy

```
BaseSchema (base.ts)
├── StringSchema (string.ts)
├── NumericSchema (numeric.ts)
├── ArraySchema (array.ts)
├── ObjectSchema (object.ts)
├── FunctionSchema (function.ts)
└── SchemaFactory (index.ts) - extends BaseSchema
```

All schema classes extend `BaseSchema` and follow this pattern:
1. Define a TypeScript interface for the JSON Schema structure (e.g., `StringJsonSchema extends BaseJsonSchema`)
2. Extend `BaseSchema<T, R, S>` where:
   - `T` = TypeScript type this schema represents
   - `R extends boolean` = whether the schema is required (affects `otype`)
   - `S` = The JSON Schema interface (e.g., `Readonly<StringJsonSchema>`)
3. Implement fluent methods that call `copyWith()` to return modified copies

### Key Properties

Each schema instance has:
- `plain` - The raw JSON Schema object
- `type` - The TypeScript type this schema represents
- `otype` - The output type (includes `| undefined` if not required)
- `isRequired` - Boolean indicating if schema is required in parent ObjectSchema
- `$schema` - JSON Schema version
- `$defs` - Schema definitions for reuse

### Immutable Updates

The `copyWith()` method (base.ts:437) creates a new schema instance with modified properties. This ensures schemas are immutable and can be safely reused:

```typescript
copyWith (modifyObject: Partial<BaseSchema & { plain: Partial<Schema['plain']> }>): this {
  return Object.assign(Object.create(this.constructor.prototype), {
    ...this,
    ...modifyObject,
    plain: { ...this.plain, ...modifyObject.plain }
  })
}
```

### Type Inference

The library leverages TypeScript's type system heavily using `ts-toolbelt` for advanced type manipulations:
- `O.Optional<T>` - Makes specified keys optional
- `O.Required<T>` - Makes specified keys required
- `O.Merge<T, U>` - Merges object types
- `O.Pick<T, K>` - Picks properties
- `O.Omit<T, K>` - Omits properties
- `U.IntersectOf<T>` - Creates intersection types

### SchemaFactory (default export)

The main export `S` is a SchemaFactory instance that provides factory methods:
- Type constructors: `S.string()`, `S.number()`, `S.boolean()`, etc.
- Complex types: `S.array()`, `S.list(itemSchema)`, `S.object()`, `S.shape(props)`
- Combinators: `S.anyOf()`, `S.oneOf()`, `S.allOf()`
- Special: `S.instanceOf(Class)`, `S.enum()`, `S.const()`

### ObjectSchema Patterns

ObjectSchema has two creation patterns:
1. `S.object()` - Empty object, build with `.prop(name, schema)`
2. `S.shape(props)` - Define all properties at once (sets `additionalProperties: false`)

Important methods:
- `required(fields)` - Set required fields array explicitly
- `notRequired(fields)` - Remove fields from required array
- `partial()` - Recursively remove all required constraints
- `optional()` - Make the schema itself optional in parent ObjectSchema

### Custom Validation

The library supports custom validators via AJV keywords (base.ts:423):
- `S.custom((schema, data) => boolean)` registers validators with unique UUIDs
- Validators are stored in `BaseSchema.validators` static property
- The validation function receives schema and data parameters

### Utility Functions (utils.ts)

- `mergeSchemas(s1, s2)` - Merge two ObjectSchemas' properties and required arrays
- `mergeMultipleSchemas(...schemas)` - Merge multiple ObjectSchemas
- `pickFromSchema(schema, props)` - Create schema with only specified properties
- `omitFromSchema(schema, props)` - Create schema without specified properties

## TypeScript Configuration Notes

- `strictNullChecks: true` is critical for proper optional type handling
- `module: "NodeNext"` for modern Node.js module resolution
- Tests are excluded from compilation (exclude: `**/*.test.ts`)
- Jest uses CommonJS module transformation for test execution

## Testing Patterns

Tests use standard Jest patterns with ts-jest. Test files are in `src/__tests__/` and named `*.test.ts`.

## Common Pitfalls

1. Always use `copyWith()` for modifications to maintain immutability
2. The `required` array in ObjectSchema is managed automatically when using `.prop()` based on schema's `isRequired` property
3. When extending schemas, ensure the generic type parameters `<T, R, S>` are correctly propagated
4. The `plain` property contains the actual JSON Schema - this is what gets serialized
5. Date schemas use custom `coerceDate` property in the plain object for AJV date handling
