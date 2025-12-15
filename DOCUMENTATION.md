# jsonschema-definer - Complete Documentation

**Version**: 1.5.8
**Package**: `@bett3r-dev/jsonschema-definer`

A TypeScript library for building and validating JSON Schemas with a fluent, type-safe API. This library allows you to create JSON Schemas programmatically while automatically inferring TypeScript types from your schemas.

---

## Table of Contents

1. [Installation](#installation)
2. [Core Concepts](#core-concepts)
3. [Getting Started](#getting-started)
4. [Schema Factory Methods](#schema-factory-methods)
5. [BaseSchema Methods](#baseschema-methods)
6. [StringSchema](#stringschema)
7. [NumericSchema](#numericschema)
8. [ArraySchema](#arrayschema)
9. [ObjectSchema](#objectschema)
10. [Type Inference](#type-inference)
11. [Validation with AJV](#validation-with-ajv)
12. [Utility Functions](#utility-functions)
13. [Advanced Patterns](#advanced-patterns)
14. [Common Use Cases](#common-use-cases)

---

## Installation

```bash
npm install @bett3r-dev/jsonschema-definer
```

The library requires TypeScript for full type inference capabilities.

---

## Core Concepts

### Fluent API with Immutability

All schema methods return **new instances** rather than modifying existing ones. This allows for safe schema reuse and composition:

```typescript
import S from '@bett3r-dev/jsonschema-definer'

const baseString = S.string()
const emailString = baseString.format('email')  // New instance
const shortEmail = emailString.maxLength(50)     // Another new instance

// baseString is unchanged
```

### Type Inference

The library automatically infers TypeScript types from your schemas:

```typescript
const UserSchema = S.shape({
  name: S.string(),
  age: S.number(),
  email: S.string().format('email').optional()
})

// Automatically inferred type:
type User = typeof UserSchema.type
// { name: string, age: number, email?: string | undefined }
```

### Required vs Optional

In `ObjectSchema`, properties are **required by default** unless marked with `.optional()`:

```typescript
const schema = S.shape({
  required: S.string(),           // Required field
  optional: S.string().optional() // Optional field
})

// Type: { required: string, optional?: string | undefined }
```

### Schema Output

Every schema has a `.plain` property containing the raw JSON Schema object, and `.valueOf()` method to get the complete schema:

```typescript
const schema = S.string().minLength(5)

console.log(schema.plain)
// { type: 'string', minLength: 5 }

console.log(schema.valueOf())
// { type: 'string', minLength: 5 }
```

---

## Getting Started

### Basic Example

```typescript
import S from '@bett3r-dev/jsonschema-definer'

// Define a schema
const UserSchema = S.shape({
  name: S.string().minLength(1),
  email: S.string().format('email'),
  age: S.number().minimum(0),
  role: S.enum('admin', 'user', 'guest'),
  createdAt: S.date()
})

// Infer the TypeScript type
type User = typeof UserSchema.type
/*
{
  name: string,
  email: string,
  age: number,
  role: 'admin' | 'user' | 'guest',
  createdAt: string | Date
}
*/

// Get the JSON Schema
const jsonSchema = UserSchema.valueOf()
```

### With Validation

```typescript
import S from '@bett3r-dev/jsonschema-definer'
import Ajv from 'ajv'

const ajv = new Ajv()

const schema = S.shape({
  username: S.string().minLength(3),
  password: S.string().minLength(8)
})

const data = { username: 'john', password: 'secret123' }
const valid = ajv.validate(schema.plain, data)

if (!valid) {
  console.log(ajv.errors)
}
```

---

## Schema Factory Methods

The default export `S` is a `SchemaFactory` instance providing these factory methods:

### S.any()

Creates an empty schema that accepts any value.

```typescript
const schema = S.any()
// Type: any
// JSON Schema: {}
```

### S.string()

Creates a string schema.

```typescript
const schema = S.string()
// Type: string
// JSON Schema: { "type": "string" }
```

Returns: `StringSchema`

### S.number()

Creates a number schema (accepts integers and floats).

```typescript
const schema = S.number()
// Type: number
// JSON Schema: { "type": "number" }
```

Returns: `NumericSchema`

### S.integer()

Creates an integer schema (only whole numbers).

```typescript
const schema = S.integer()
// Type: number
// JSON Schema: { "type": "integer" }
```

Returns: `NumericSchema`

### S.boolean()

Creates a boolean schema.

```typescript
const schema = S.boolean()
// Type: boolean
// JSON Schema: { "type": "boolean" }
```

Returns: `BaseSchema<boolean>`

### S.null()

Creates a null schema.

```typescript
const schema = S.null()
// Type: null
// JSON Schema: { "type": "null" }
```

Returns: `BaseSchema<null>`

### S.array()

Creates an array schema without item type constraints.

```typescript
const schema = S.array()
// Type: any[]
// JSON Schema: { "type": "array" }
```

Returns: `ArraySchema`

### S.list(itemSchema)

Creates a typed array schema where all items must match the given schema.

```typescript
const schema = S.list(S.string())
// Type: string[]
// JSON Schema: { "type": "array", "items": { "type": "string" } }
```

**Parameters:**
- `itemSchema`: BaseSchema - Schema for array items

Returns: `ArraySchema`

### S.object()

Creates an object schema without property constraints.

```typescript
const schema = S.object()
// Type: {}
// JSON Schema: { "type": "object" }
```

Returns: `ObjectSchema`

### S.shape(properties, additionalProperties?)

Creates a typed object schema with defined properties. This is the most common way to create object schemas.

```typescript
const schema = S.shape({
  name: S.string(),
  age: S.number().optional()
})
// Type: { name: string, age?: number | undefined }
// JSON Schema: {
//   "type": "object",
//   "properties": {
//     "name": { "type": "string" },
//     "age": { "type": "number" }
//   },
//   "required": ["name"],
//   "additionalProperties": false
// }
```

**Parameters:**
- `properties`: Record<string, BaseSchema> - Object with property schemas
- `additionalProperties`: boolean (default: false) - Allow additional properties

Returns: `ObjectSchema`

### S.enum(...values)

Creates an enum schema with allowed values.

```typescript
const schema = S.enum('red', 'green', 'blue')
// Type: 'red' | 'green' | 'blue'
// JSON Schema: { "enum": ["red", "green", "blue"] }
```

**Parameters:**
- `...values`: Any[] - Allowed values

Returns: `BaseSchema`

### S.const(value)

Creates a constant schema that only accepts a specific value.

```typescript
const schema = S.const('hello')
// Type: 'hello'
// JSON Schema: { "const": "hello" }
```

**Parameters:**
- `value`: Any - The constant value

Returns: `BaseSchema`

### S.anyOf(...schemas)

Creates a schema where the value must match one or more of the given schemas.

```typescript
const schema = S.anyOf(S.string(), S.number())
// Type: string | number
// JSON Schema: { "anyOf": [{ "type": "string" }, { "type": "number" }] }
```

**Parameters:**
- `...schemas`: BaseSchema[] - Schemas to match against

Returns: `BaseSchema`

### S.oneOf(...schemas)

Creates a schema where the value must match exactly one of the given schemas.

```typescript
const schema = S.oneOf(S.string(), S.number())
// Type: string | number
// JSON Schema: { "oneOf": [{ "type": "string" }, { "type": "number" }] }
```

**Parameters:**
- `...schemas`: BaseSchema[] - Schemas to match against

Returns: `BaseSchema`

### S.allOf(...schemas)

Creates a schema where the value must match all of the given schemas (intersection).

```typescript
const schema = S.allOf(
  S.shape({ name: S.string() }),
  S.shape({ age: S.number() })
)
// Type: { name: string } & { age: number }
// JSON Schema: { "allOf": [{ ... }, { ... }] }
```

**Parameters:**
- `...schemas`: BaseSchema[] - Schemas to intersect

Returns: `BaseSchema`

### S.instanceOf(Class)

Creates a schema for validating JavaScript class instances using a custom validator.

```typescript
const schema = S.shape({
  birthday: S.instanceOf(Date),
  buffer: S.instanceOf(Buffer)
})
// Type: { birthday: Date, buffer: Buffer }
```

**Note**: Requires custom AJV keyword setup (see [Validation section](#validation-with-ajv)).

**Parameters:**
- `Class`: Class constructor

Returns: `BaseSchema`

### S.date()

Creates a date schema that accepts Date objects or date strings.

```typescript
const schema = S.date()
// Type: string | Date
// JSON Schema: { "type": "string", "format": "date", "coerceDate": true }
```

Returns: `BaseSchema<string | Date>`

### S.datetime()

Creates a datetime schema that accepts Date objects or datetime strings.

```typescript
const schema = S.datetime()
// Type: string | Date | object
// JSON Schema with oneOf for string with date-time format or object
```

Returns: `BaseSchema`

### S.function()

Creates a function schema for TypeScript type checking (not standard JSON Schema).

```typescript
const schema = S.function<[string, number], boolean>()
// Type: (arg0: string, arg1: number) => boolean
```

Returns: `FunctionSchema`

---

## BaseSchema Methods

These methods are available on all schema types.

### .optional()

Makes the schema optional when used as a property in an ObjectSchema.

```typescript
const schema = S.shape({
  required: S.string(),
  optional: S.string().optional()
})
// Type: { required: string, optional?: string | undefined }
```

Returns: Same schema type with `isRequired = false`

### .nullable()

Allows the value to be null in addition to its normal type.

```typescript
const schema = S.string().nullable()
// Type: string | null
// JSON Schema: { "type": ["null", "string"] }
```

For complex schemas with anyOf/oneOf containing objects or arrays, it adds `{ type: 'null' }` to the union:

```typescript
const schema = S.anyOf(S.string(), S.object()).nullable()
// JSON Schema: { "anyOf": [{ "type": "string" }, { "type": "object" }, { "type": "null" }] }
```

Returns: Same schema type with null support

### .enum(...values)

Restricts the value to a set of allowed values.

```typescript
const schema = S.string().enum('small', 'medium', 'large')
// Type: 'small' | 'medium' | 'large'
// JSON Schema: { "type": "string", "enum": ["small", "medium", "large"] }
```

**Parameters:**
- `...values`: Array of allowed values

Returns: Same schema type with restricted values

### .const(value)

Restricts the value to exactly one constant.

```typescript
const schema = S.string().const('hello')
// Type: 'hello'
// JSON Schema: { "type": "string", "const": "hello" }
```

**Parameters:**
- `value`: The constant value

Returns: Same schema type with single value

### .default(value)

Sets a default value for the schema.

```typescript
const schema = S.number().default(0)
// JSON Schema: { "type": "number", "default": 0 }
```

**Parameters:**
- `value`: Default value

Returns: Same schema type

### .title(title)

Sets a title for the schema (used in documentation/UI).

```typescript
const schema = S.string().title('User Name')
// JSON Schema: { "type": "string", "title": "User Name" }
```

**Parameters:**
- `title`: string

Returns: Same schema type

### .description(description)

Sets a description for the schema.

```typescript
const schema = S.string().description('The user\'s email address')
// JSON Schema: { "type": "string", "description": "The user's email address" }
```

**Parameters:**
- `description`: string

Returns: Same schema type

### .examples(...examples)

Provides example values for the schema.

```typescript
const schema = S.string().examples('alice@example.com', 'bob@example.com')
// JSON Schema: { "type": "string", "examples": ["alice@example.com", "bob@example.com"] }
```

**Parameters:**
- `...examples`: Array of example values

Returns: Same schema type

### .id(id)

Sets the schema's $id (URI identifier).

```typescript
const schema = S.shape({ name: S.string() }).id('#/definitions/User')
// JSON Schema: { "$id": "#/definitions/User", "type": "object", ... }
```

**Parameters:**
- `id`: string - URI identifier

Returns: Same schema type

### .ref(ref)

Creates a reference to another schema by $ref.

```typescript
const UserSchema = S.shape({ name: S.string() }).id('#/definitions/User')
const schema = S.ref<typeof UserSchema.type>('#/definitions/User')
// JSON Schema: { "$ref": "#/definitions/User" }
```

**Parameters:**
- `ref`: string - Reference path

Returns: `BaseSchema<T>` where T is inferred from the type parameter

### .schema(schemaVersion)

Sets the $schema property (JSON Schema version).

```typescript
const schema = S.string().schema('http://json-schema.org/draft-07/schema#')
```

**Parameters:**
- `schemaVersion`: string

Returns: Same schema type

### .definition(name, schema)

Adds a reusable schema definition to $defs.

```typescript
const schema = S.shape({
  user: S.ref('#/$defs/User')
}).definition('User', S.shape({
  name: S.string(),
  email: S.string()
}))

// JSON Schema:
// {
//   "type": "object",
//   "properties": { "user": { "$ref": "#/$defs/User" } },
//   "$defs": {
//     "User": {
//       "type": "object",
//       "properties": { "name": { "type": "string" }, "email": { "type": "string" } }
//     }
//   }
// }
```

**Parameters:**
- `name`: string - Definition name
- `schema`: BaseSchema - Schema to define

Returns: Same schema type

### .anyOf(...schemas)

Combines schemas with "any of" logic.

```typescript
const schema = S.string().anyOf(S.string(), S.number())
// Type: string | number
// JSON Schema: { "anyOf": [{ "type": "string" }, { "type": "number" }] }
```

**Parameters:**
- `...schemas`: BaseSchema[] - Schemas to combine

Returns: `BaseSchema<UnionType>`

### .oneOf(...schemas)

Combines schemas with "one of" logic (exactly one must match).

```typescript
const schema = S.oneOf(S.string(), S.number())
// Type: string | number
// JSON Schema: { "oneOf": [{ "type": "string" }, { "type": "number" }] }
```

**Parameters:**
- `...schemas`: BaseSchema[] - Schemas to combine

Returns: `BaseSchema<UnionType>`

### .allOf(...schemas)

Combines schemas with "all of" logic (all must match).

```typescript
const schema = S.allOf(
  S.shape({ name: S.string() }),
  S.shape({ age: S.number() })
)
// Type: { name: string } & { age: number }
```

**Parameters:**
- `...schemas`: BaseSchema[] - Schemas to intersect

Returns: `BaseSchema<IntersectionType>`

### .not(schema)

Negates a schema (value must NOT match the schema).

```typescript
const schema = S.not(S.string())
// Matches anything except strings
// JSON Schema: { "not": { "type": "string" } }
```

**Parameters:**
- `schema`: BaseSchema - Schema to negate

Returns: Same schema type

### .ifThen(ifSchema, thenSchema)

Conditional validation: if the value matches `ifSchema`, it must also match `thenSchema`.

```typescript
const schema = S.ifThen(
  S.shape({ country: S.const('US') }),
  S.shape({ zipCode: S.string().pattern(/^\d{5}$/) })
)
```

**Parameters:**
- `ifSchema`: BaseSchema - Condition schema
- `thenSchema`: BaseSchema - Schema to apply if condition matches

Returns: Same schema type

### .ifThenElse(ifSchema, thenSchema, elseSchema)

Conditional validation with else branch.

```typescript
const schema = S.ifThenElse(
  S.shape({ type: S.const('email') }),
  S.shape({ value: S.string().format('email') }),
  S.shape({ value: S.string() })
)
```

**Parameters:**
- `ifSchema`: BaseSchema - Condition schema
- `thenSchema`: BaseSchema - Schema when condition matches
- `elseSchema`: BaseSchema - Schema when condition doesn't match

Returns: Same schema type

### .custom(...validators)

Adds custom validation functions (requires AJV custom keyword setup).

```typescript
const schema = S.string().custom((schema, data) => {
  return data.startsWith('https://')
})
```

**Parameters:**
- `...validators`: Function[] - Validation functions `(schema, data, parentSchema?, dataCxt?) => boolean`

Returns: Same schema type

### .raw(fragment)

Injects arbitrary JSON Schema properties.

```typescript
const schema = S.string().raw({
  nullable: true,  // OpenAPI nullable
  'x-custom': 'value'
})
// JSON Schema: { "type": "string", "nullable": true, "x-custom": "value" }
```

**Parameters:**
- `fragment`: Record<string, any> - JSON Schema properties to merge

Returns: Same schema type

### .valueOf()

Returns the complete JSON Schema object.

```typescript
const schema = S.string().minLength(5)
const jsonSchema = schema.valueOf()
// { "type": "string", "minLength": 5 }
```

Returns: JSON Schema object

### .toJSON()

Returns the plain JSON Schema (same as `.plain` property). Used for JSON.stringify.

```typescript
const schema = S.string()
JSON.stringify(schema)
// '{"type":"string"}'
```

Returns: JSON Schema object

---

## StringSchema

Created with `S.string()`. Provides methods for string validation.

### .minLength(length)

Sets minimum string length.

```typescript
const schema = S.string().minLength(3)
// JSON Schema: { "type": "string", "minLength": 3 }
```

**Parameters:**
- `length`: number

Returns: `StringSchema`

### .maxLength(length)

Sets maximum string length.

```typescript
const schema = S.string().maxLength(50)
// JSON Schema: { "type": "string", "maxLength": 50 }
```

**Parameters:**
- `length`: number

Returns: `StringSchema`

### .pattern(regex)

Validates string against a regular expression.

```typescript
const schema = S.string().pattern(/^[A-Z][a-z]+$/)
// JSON Schema: { "type": "string", "pattern": "^[A-Z][a-z]+$" }
```

**Parameters:**
- `regex`: RegExp

Returns: `StringSchema`

### .format(format)

Sets a string format for validation (requires ajv-formats).

```typescript
const schema = S.string().format('email')
// JSON Schema: { "type": "string", "format": "email" }
```

**Common formats:**
- `'email'` - Email address
- `'uri'` / `'url'` - URI/URL
- `'date'` - Date (YYYY-MM-DD)
- `'date-time'` - DateTime (ISO 8601)
- `'time'` - Time
- `'ipv4'` / `'ipv6'` - IP addresses
- `'uuid'` - UUID
- `'hostname'` - Hostname
- `'json-pointer'` - JSON Pointer

**Parameters:**
- `format`: string

Returns: `StringSchema`

### .contentMediaType(mediaType)

Sets the content media type.

```typescript
const schema = S.string().contentMediaType('application/json')
// JSON Schema: { "type": "string", "contentMediaType": "application/json" }
```

**Parameters:**
- `mediaType`: string

Returns: `StringSchema`

### .contentEncoding(encoding)

Sets the content encoding.

```typescript
const schema = S.string().contentEncoding('base64')
// JSON Schema: { "type": "string", "contentEncoding": "base64" }
```

**Parameters:**
- `encoding`: string (e.g., 'base64', 'binary')

Returns: `StringSchema`

---

## NumericSchema

Created with `S.number()` or `S.integer()`. Provides methods for numeric validation.

### .minimum(value, exclusive?)

Sets minimum value (inclusive by default).

```typescript
const schema = S.number().minimum(0)
// JSON Schema: { "type": "number", "minimum": 0 }

const exclusiveSchema = S.number().minimum(0, true)
// JSON Schema: { "type": "number", "exclusiveMinimum": 0 }
```

**Parameters:**
- `value`: number - Minimum value
- `exclusive`: boolean (default: false) - If true, value must be strictly greater

Returns: `NumericSchema`

### .maximum(value, exclusive?)

Sets maximum value (inclusive by default).

```typescript
const schema = S.number().maximum(100)
// JSON Schema: { "type": "number", "maximum": 100 }

const exclusiveSchema = S.number().maximum(100, true)
// JSON Schema: { "type": "number", "exclusiveMaximum": 100 }
```

**Parameters:**
- `value`: number - Maximum value
- `exclusive`: boolean (default: false) - If true, value must be strictly less

Returns: `NumericSchema`

### .multipleOf(value)

Requires the number to be a multiple of the given value.

```typescript
const schema = S.number().multipleOf(5)
// Valid: 0, 5, 10, 15, ...
// JSON Schema: { "type": "number", "multipleOf": 5 }
```

**Parameters:**
- `value`: number

Returns: `NumericSchema`

---

## ArraySchema

Created with `S.array()` or `S.list(itemSchema)`. Provides methods for array validation.

### .items(schema)

Sets the schema for array items. Can be a single schema or an array of schemas.

```typescript
// Single schema - all items must match
const schema = S.array().items(S.string())
// JSON Schema: { "type": "array", "items": { "type": "string" } }

// Tuple validation - items at each position must match corresponding schema
const tupleSchema = S.array().items([S.string(), S.number(), S.boolean()])
// JSON Schema: { "type": "array", "items": [
//   { "type": "string" },
//   { "type": "number" },
//   { "type": "boolean" }
// ] }
```

**Parameters:**
- `schema`: BaseSchema | BaseSchema[]

Returns: `ArraySchema`

### .additionalItems(schema)

Controls validation of items beyond those specified in tuple-style `.items()`.

```typescript
const schema = S.array()
  .items([S.string(), S.number()])
  .additionalItems(S.boolean())
// First item: string, second: number, rest: boolean

const noAdditional = S.array()
  .items([S.string(), S.number()])
  .additionalItems(false)
// Exactly two items allowed
```

**Parameters:**
- `schema`: BaseSchema | boolean

Returns: `ArraySchema`

### .contains(schema)

Requires at least one array item to match the schema.

```typescript
const schema = S.array().contains(S.string().pattern(/^test/))
// At least one item must be a string starting with "test"
// JSON Schema: { "type": "array", "contains": { "type": "string", "pattern": "^test" } }
```

**Parameters:**
- `schema`: BaseSchema

Returns: `ArraySchema`

### .minItems(count)

Sets minimum number of items.

```typescript
const schema = S.array().minItems(1)
// JSON Schema: { "type": "array", "minItems": 1 }
```

**Parameters:**
- `count`: number

Returns: `ArraySchema`

### .maxItems(count)

Sets maximum number of items.

```typescript
const schema = S.array().maxItems(10)
// JSON Schema: { "type": "array", "maxItems": 10 }
```

**Parameters:**
- `count`: number

Returns: `ArraySchema`

### .uniqueItems(unique?)

Requires all items to be unique.

```typescript
const schema = S.array().uniqueItems()
// or explicitly: .uniqueItems(true)
// JSON Schema: { "type": "array", "uniqueItems": true }
```

**Parameters:**
- `unique`: boolean (default: true)

Returns: `ArraySchema`

---

## ObjectSchema

Created with `S.object()` or `S.shape(properties)`. Provides methods for object validation.

### .prop(name, schema)

Adds a property to the object schema.

```typescript
const schema = S.object()
  .prop('name', S.string())
  .prop('age', S.number().optional())

// Type: { name: string, age?: number | undefined }
// JSON Schema: {
//   "type": "object",
//   "properties": {
//     "name": { "type": "string" },
//     "age": { "type": "number" }
//   },
//   "required": ["name"]
// }
```

**Parameters:**
- `name`: string - Property name
- `schema`: BaseSchema - Property schema

Returns: `ObjectSchema`

### .required(fields)

Explicitly sets the required fields array.

```typescript
const schema = S.object()
  .prop('name', S.string().optional())
  .prop('email', S.string().optional())
  .required(['name', 'email'])

// Both fields are now required despite being marked optional
// Type still shows them as optional (type doesn't change)
// JSON Schema: { ..., "required": ["name", "email"] }
```

**Parameters:**
- `fields`: string[] - Array of required field names

Returns: `ObjectSchema`

### .notRequired(fields)

Removes fields from the required array.

```typescript
const schema = S.shape({
  name: S.string(),
  email: S.string()
}).notRequired(['email'])

// Type: { name: string, email?: string | undefined }
// JSON Schema: { ..., "required": ["name"] }
```

**Parameters:**
- `fields`: string[] - Array of field names to make optional

Returns: `ObjectSchema`

### .partial()

Recursively removes all required constraints, making all properties optional.

```typescript
const schema = S.shape({
  name: S.string(),
  address: S.shape({
    street: S.string(),
    city: S.string()
  })
})

const partialSchema = schema.partial()
// Type: { name?: string, address?: { street?: string, city?: string } }
// JSON Schema: No "required" arrays at any level
```

Returns: `ObjectSchema` with all fields optional

### .additionalProperties(schema)

Controls validation of properties not defined in the schema.

```typescript
// Allow any additional properties
const openSchema = S.shape({ name: S.string() }, true)
// or
const openSchema2 = S.object().prop('name', S.string()).additionalProperties(true)

// Additional properties must be strings
const stringSchema = S.object()
  .prop('name', S.string())
  .additionalProperties(S.string())

// No additional properties (default for S.shape)
const closedSchema = S.shape({ name: S.string() })
// JSON Schema: { ..., "additionalProperties": false }
```

**Parameters:**
- `schema`: BaseSchema | boolean

Returns: `ObjectSchema`

### .propertyNames(schema)

Validates property names against a schema.

```typescript
const schema = S.object().propertyNames(S.string().pattern(/^[a-z]+$/))
// All property names must be lowercase letters only

const enumSchema = S.object().propertyNames(S.string().enum('name', 'age', 'email'))
// Only these three property names are allowed
```

**Parameters:**
- `schema`: BaseSchema - Schema for property names (usually StringSchema)

Returns: `ObjectSchema`

### .minProperties(count)

Sets minimum number of properties.

```typescript
const schema = S.object().minProperties(1)
// Object must have at least one property
// JSON Schema: { "type": "object", "minProperties": 1 }
```

**Parameters:**
- `count`: number

Returns: `ObjectSchema`

### .maxProperties(count)

Sets maximum number of properties.

```typescript
const schema = S.object().maxProperties(5)
// Object can have at most 5 properties
// JSON Schema: { "type": "object", "maxProperties": 5 }
```

**Parameters:**
- `count`: number

Returns: `ObjectSchema`

### .dependencies(deps)

Defines property dependencies (if property X exists, properties Y and Z must also exist).

```typescript
// Array dependency: if "creditCard" exists, "billingAddress" must also exist
const schema = S.shape({
  name: S.string(),
  creditCard: S.string().optional(),
  billingAddress: S.string().optional()
}).dependencies({
  creditCard: ['billingAddress']
})

// Schema dependency: if "creditCard" exists, object must match this schema
const schemaDepSchema = S.shape({
  name: S.string(),
  creditCard: S.string().optional(),
  cvv: S.string().optional()
}).dependencies({
  creditCard: S.shape({ cvv: S.string() }, true)
})
```

**Parameters:**
- `deps`: Record<string, string[] | BaseSchema> - Dependencies map

Returns: `ObjectSchema`

### .patternProperties(patterns)

Validates properties matching regex patterns.

```typescript
const schema = S.object().patternProperties({
  '^str': S.string(),  // Properties starting with "str" must be strings
  '^num': S.number()   // Properties starting with "num" must be numbers
})

// Valid: { strName: "test", numAge: 25 }
// Invalid: { strName: 123 }
```

**Parameters:**
- `patterns`: Record<string, BaseSchema> - Map of regex patterns to schemas

Returns: `ObjectSchema`

---

## Type Inference

The library provides powerful TypeScript type inference:

### Basic Type Inference

```typescript
import S from '@bett3r-dev/jsonschema-definer'

const schema = S.shape({
  name: S.string(),
  age: S.number(),
  email: S.string().optional()
})

type User = typeof schema.type
// Inferred as: { name: string, age: number, email?: string | undefined }
```

### Optional vs Required

```typescript
const schema = S.shape({
  required: S.string(),           // Required by default
  optional: S.string().optional(), // Explicitly optional
  nullable: S.string().nullable()  // Required but can be null
})

type Type = typeof schema.type
// { required: string, optional?: string | undefined, nullable: string | null }
```

### Complex Types

```typescript
const schema = S.shape({
  // Union types
  status: S.enum('active', 'inactive', 'pending'),

  // Nested objects
  address: S.shape({
    street: S.string(),
    city: S.string(),
    zipCode: S.string().optional()
  }),

  // Arrays
  tags: S.list(S.string()),

  // Mixed types
  value: S.anyOf(S.string(), S.number(), S.boolean())
})

type Complex = typeof schema.type
/*
{
  status: 'active' | 'inactive' | 'pending',
  address: {
    street: string,
    city: string,
    zipCode?: string | undefined
  },
  tags: string[],
  value: string | number | boolean
}
*/
```

### Using Inferred Types

```typescript
const UserSchema = S.shape({
  id: S.number(),
  name: S.string(),
  email: S.string().format('email')
})

// Use the inferred type
type User = typeof UserSchema.type

// Type-safe function
function createUser(data: User): User {
  return data
}

// Type checking works
const user: User = {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com'
}

// TypeScript error: missing required fields
const invalid: User = {
  id: 1
  // Error: Property 'name' is missing
}
```

### Optional Helper Type

The library exports an `Optional` type helper:

```typescript
import { Optional } from '@bett3r-dev/jsonschema-definer'

type User = {
  name: string
  email: string
  age?: number
}

// Makes properties with undefined in their type optional
type CleanUser = Optional<User>
// Same as: { name: string, email: string, age?: number }
```

---

## Validation with AJV

The library generates standard JSON Schemas that work with AJV (or any JSON Schema validator).

### Basic Setup

```typescript
import S from '@bett3r-dev/jsonschema-definer'
import Ajv from 'ajv'

const ajv = new Ajv()

const schema = S.shape({
  username: S.string().minLength(3),
  password: S.string().minLength(8)
})

const data = { username: 'john', password: 'secret123' }

if (ajv.validate(schema.plain, data)) {
  console.log('Valid!')
} else {
  console.log('Validation errors:', ajv.errors)
}
```

### With String Formats

For string formats like 'email', 'uri', 'date-time', etc., use `ajv-formats`:

```typescript
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

const ajv = new Ajv()
addFormats(ajv)  // Add format validators

const schema = S.shape({
  email: S.string().format('email'),
  website: S.string().format('uri'),
  birthday: S.string().format('date')
})

const valid = ajv.validate(schema.plain, {
  email: 'user@example.com',
  website: 'https://example.com',
  birthday: '1990-01-01'
})
```

### Custom Validators

To use `.custom()` validators, register a custom keyword with AJV:

```typescript
import Ajv from 'ajv'
import { BaseSchema } from '@bett3r-dev/jsonschema-definer'

const ajv = new Ajv()

// Register the 'custom' keyword
ajv.addKeyword({
  keyword: 'custom',
  validate: (schema, data, parentSchema, dataCxt) => {
    // schema is an array of validator UUIDs
    // Execute each validator from BaseSchema.validators
    return BaseSchema.validators[schema[0]](schema, data, parentSchema, dataCxt)
  }
})

// Now you can use .custom()
const schema = S.string().custom((schema, data) => {
  return data.startsWith('https://')
})

ajv.validate(schema.plain, 'https://example.com') // true
ajv.validate(schema.plain, 'http://example.com')  // false
```

### instanceOf Validation

To use `S.instanceOf()`, set up custom validators:

```typescript
import Ajv from 'ajv'
import S, { BaseSchema } from '@bett3r-dev/jsonschema-definer'

const ajv = new Ajv()

ajv.addKeyword({
  keyword: 'custom',
  validate: (schema, data, parentSchema, dataCxt) => {
    return BaseSchema.validators[schema[0]](schema, data, parentSchema, dataCxt)
  }
})

const schema = S.shape({
  createdAt: S.instanceOf(Date),
  buffer: S.instanceOf(Buffer)
})

ajv.validate(schema.plain, {
  createdAt: new Date(),
  buffer: Buffer.from('hello')
}) // true
```

### Creating a Reusable Validator

```typescript
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { BaseSchema } from '@bett3r-dev/jsonschema-definer'

function createValidator() {
  const ajv = new Ajv()
  addFormats(ajv)

  ajv.addKeyword({
    keyword: 'custom',
    validate: (schema, data, parentSchema, dataCxt) => {
      return BaseSchema.validators[schema[0]](schema, data, parentSchema, dataCxt)
    }
  })

  return ajv
}

const ajv = createValidator()

// Use with any schema
function validate<T>(schema: BaseSchema<T>, data: unknown): data is T {
  return ajv.validate(schema.plain, data) as boolean
}
```

---

## Utility Functions

The library provides utility functions for schema manipulation.

### mergeSchemas(schema1, schema2)

Merges two ObjectSchemas, combining their properties and required arrays.

```typescript
import { mergeSchemas } from '@bett3r-dev/jsonschema-definer'

const schema1 = S.shape({
  name: S.string(),
  age: S.number()
})

const schema2 = S.shape({
  email: S.string(),
  phone: S.string().optional()
})

const merged = mergeSchemas(schema1, schema2)
// Type: { name: string, age: number, email: string, phone?: string }
```

**Parameters:**
- `schema1`: ObjectSchema - First schema (takes priority)
- `schema2`: ObjectSchema - Second schema

Returns: `ObjectSchema` with merged properties

### mergeMultipleSchemas(...schemas)

Merges multiple ObjectSchemas.

```typescript
import { mergeMultipleSchemas } from '@bett3r-dev/jsonschema-definer'

const personal = S.shape({ name: S.string(), age: S.number() })
const contact = S.shape({ email: S.string(), phone: S.string() })
const address = S.shape({ city: S.string(), country: S.string() })

const merged = mergeMultipleSchemas(personal, contact, address)
// All properties combined
```

**Parameters:**
- `...schemas`: ObjectSchema[] - Schemas to merge

Returns: `ObjectSchema` with all properties

### pickFromSchema(schema, properties)

Creates a new schema with only the specified properties.

```typescript
import { pickFromSchema } from '@bett3r-dev/jsonschema-definer'

const schema = S.shape({
  id: S.number(),
  name: S.string(),
  email: S.string(),
  password: S.string()
})

const publicSchema = pickFromSchema(schema, ['id', 'name', 'email'])
// Type: { id: number, name: string, email: string }
```

**Parameters:**
- `schema`: ObjectSchema - Source schema
- `properties`: string[] - Property names to pick

Returns: `ObjectSchema` with only picked properties

### omitFromSchema(schema, properties)

Creates a new schema without the specified properties.

```typescript
import { omitFromSchema } from '@bett3r-dev/jsonschema-definer'

const schema = S.shape({
  id: S.number(),
  name: S.string(),
  email: S.string(),
  password: S.string()
})

const withoutPassword = omitFromSchema(schema, ['password'])
// Type: { id: number, name: string, email: string }
```

**Parameters:**
- `schema`: ObjectSchema - Source schema
- `properties`: string[] - Property names to omit

Returns: `ObjectSchema` without omitted properties

### pick(keys, object)

Utility function to pick properties from a plain object.

```typescript
import { pick } from '@bett3r-dev/jsonschema-definer'

const obj = { a: 1, b: 2, c: 3, d: 4 }
const picked = pick(['a', 'c'], obj)
// { a: 1, c: 3 }
```

**Parameters:**
- `keys`: string[] - Keys to pick
- `object`: object - Source object

Returns: New object with picked properties

### omit(keys, object)

Utility function to omit properties from a plain object.

```typescript
import { omit } from '@bett3r-dev/jsonschema-definer'

const obj = { a: 1, b: 2, c: 3, d: 4 }
const omitted = omit(['b', 'd'], obj)
// { a: 1, c: 3 }
```

**Parameters:**
- `keys`: string[] - Keys to omit
- `object`: object - Source object

Returns: New object without omitted properties

---

## Advanced Patterns

### Schema Composition

Reuse and compose schemas:

```typescript
// Base schemas
const TimestampSchema = S.shape({
  createdAt: S.date(),
  updatedAt: S.date().optional()
})

const IdentifiableSchema = S.shape({
  id: S.string()
})

// Compose using mergeSchemas
const UserSchema = mergeSchemas(
  mergeSchemas(IdentifiableSchema, TimestampSchema),
  S.shape({
    name: S.string(),
    email: S.string().format('email')
  })
)

// Or use allOf for intersection types
const ProductSchema = S.allOf(
  IdentifiableSchema,
  TimestampSchema,
  S.shape({
    name: S.string(),
    price: S.number().minimum(0)
  })
)
```

### Discriminated Unions

Create type-safe discriminated unions:

```typescript
const SuccessResponse = S.shape({
  status: S.const('success'),
  data: S.any()
})

const ErrorResponse = S.shape({
  status: S.const('error'),
  error: S.shape({
    code: S.string(),
    message: S.string()
  })
})

const ApiResponse = S.oneOf(SuccessResponse, ErrorResponse)

type Response = typeof ApiResponse.type
// { status: 'success', data: any } | { status: 'error', error: { code: string, message: string } }
```

### Recursive Schemas

Define recursive structures using definitions and refs:

```typescript
const TreeNodeSchema = S.shape({
  value: S.any(),
  children: S.list(S.ref<TreeNode>('#/$defs/TreeNode')).optional()
}).definition('TreeNode', S.shape({
  value: S.any(),
  children: S.list(S.ref('#/$defs/TreeNode')).optional()
}))

type TreeNode = typeof TreeNodeSchema.type
```

### Schema Reuse with Definitions

```typescript
const AddressSchema = S.shape({
  street: S.string(),
  city: S.string(),
  country: S.string()
}).id('#/$defs/Address')

const PersonSchema = S.shape({
  name: S.string(),
  homeAddress: S.ref<typeof AddressSchema.type>('#/$defs/Address'),
  workAddress: S.ref<typeof AddressSchema.type>('#/$defs/Address').optional()
}).definition('Address', AddressSchema)
```

### Partial Updates

Create schemas for partial updates:

```typescript
const UserSchema = S.shape({
  id: S.number(),
  name: S.string(),
  email: S.string().format('email'),
  age: S.number()
})

// For updates, all fields except id are optional
const UserUpdateSchema = UserSchema.partial().required(['id'])

type UserUpdate = typeof UserUpdateSchema.type
// { id: number, name?: string, email?: string, age?: number }
```

### Conditional Properties

Use ifThen/ifThenElse for conditional validation:

```typescript
const ShippingSchema = S.shape({
  country: S.string(),
  state: S.string().optional(),
  zipCode: S.string().optional()
}).ifThen(
  S.shape({ country: S.const('US') }),
  S.shape({
    state: S.string(),
    zipCode: S.string().pattern(/^\d{5}$/)
  })
).ifThen(
  S.shape({ country: S.const('CA') }),
  S.shape({
    state: S.string(),
    zipCode: S.string().pattern(/^[A-Z]\d[A-Z] \d[A-Z]\d$/)
  })
)
```

### OpenAPI / Swagger Extensions

Add custom properties for OpenAPI:

```typescript
const schema = S.shape({
  id: S.string().raw({
    example: '123e4567-e89b-12d3-a456-426614174000'
  }),
  email: S.string()
    .format('email')
    .raw({
      'x-faker': 'internet.email'
    })
})
```

---

## Common Use Cases

### REST API Request Validation

```typescript
import S from '@bett3r-dev/jsonschema-definer'

const CreateUserRequest = S.shape({
  name: S.string().minLength(1).maxLength(100),
  email: S.string().format('email'),
  password: S.string().minLength(8),
  age: S.number().minimum(18).optional(),
  role: S.enum('user', 'admin').default('user')
})

type CreateUserDTO = typeof CreateUserRequest.type
```

### Database Model Schema

```typescript
const UserModel = S.shape({
  id: S.string(),
  email: S.string().format('email'),
  username: S.string().minLength(3).maxLength(30),
  passwordHash: S.string(),
  isActive: S.boolean().default(true),
  roles: S.list(S.enum('user', 'admin', 'moderator')),
  profile: S.shape({
    firstName: S.string(),
    lastName: S.string(),
    bio: S.string().maxLength(500).optional(),
    avatar: S.string().format('uri').optional()
  }).optional(),
  createdAt: S.date(),
  updatedAt: S.date()
})

type User = typeof UserModel.type
```

### Configuration Schema

```typescript
const ConfigSchema = S.shape({
  server: S.shape({
    port: S.number().minimum(1).maximum(65535).default(3000),
    host: S.string().default('localhost'),
    ssl: S.shape({
      enabled: S.boolean().default(false),
      cert: S.string().optional(),
      key: S.string().optional()
    })
  }),
  database: S.shape({
    host: S.string(),
    port: S.number(),
    name: S.string(),
    user: S.string(),
    password: S.string()
  }),
  logging: S.shape({
    level: S.enum('error', 'warn', 'info', 'debug').default('info'),
    file: S.string().optional()
  })
})

type Config = typeof ConfigSchema.type
```

### Form Validation

```typescript
const RegistrationForm = S.shape({
  // Personal info
  firstName: S.string().minLength(1),
  lastName: S.string().minLength(1),
  email: S.string().format('email'),

  // Password with confirmation
  password: S.string().minLength(8),
  passwordConfirm: S.string(),

  // Optional fields
  phone: S.string().pattern(/^\+?[\d\s-()]+$/).optional(),
  newsletter: S.boolean().default(false),

  // Agreement
  termsAccepted: S.boolean().const(true)
})

type RegistrationData = typeof RegistrationForm.type
```

### API Response Schema

```typescript
const PaginatedResponse = <T extends BaseSchema>(itemSchema: T) => {
  return S.shape({
    data: S.list(itemSchema),
    pagination: S.shape({
      page: S.number().minimum(1),
      limit: S.number().minimum(1),
      total: S.number().minimum(0),
      totalPages: S.number().minimum(0)
    }),
    meta: S.object().additionalProperties(true).optional()
  })
}

// Usage
const UserListResponse = PaginatedResponse(S.shape({
  id: S.string(),
  name: S.string(),
  email: S.string()
}))

type UserListData = typeof UserListResponse.type
```

### Webhook Payload

```typescript
const WebhookPayload = S.shape({
  event: S.enum('user.created', 'user.updated', 'user.deleted'),
  timestamp: S.string().format('date-time'),
  data: S.anyOf(
    // user.created / user.updated
    S.shape({
      userId: S.string(),
      email: S.string(),
      name: S.string()
    }),
    // user.deleted
    S.shape({
      userId: S.string()
    })
  ),
  metadata: S.object().additionalProperties(true).optional()
})

type Webhook = typeof WebhookPayload.type
```

### Search/Filter Parameters

```typescript
const SearchParams = S.shape({
  query: S.string().optional(),
  filters: S.shape({
    status: S.enum('active', 'inactive', 'pending').optional(),
    category: S.string().optional(),
    minPrice: S.number().minimum(0).optional(),
    maxPrice: S.number().minimum(0).optional(),
    tags: S.list(S.string()).optional()
  }).optional(),
  sort: S.shape({
    field: S.enum('name', 'price', 'createdAt'),
    order: S.enum('asc', 'desc').default('asc')
  }).optional(),
  pagination: S.shape({
    page: S.number().minimum(1).default(1),
    limit: S.number().minimum(1).maximum(100).default(20)
  }).optional()
})

type SearchQuery = typeof SearchParams.type
```

### File Upload Metadata

```typescript
const FileMetadata = S.shape({
  filename: S.string(),
  mimetype: S.string(),
  size: S.number().minimum(0).maximum(10 * 1024 * 1024), // Max 10MB
  encoding: S.string(),
  uploadedBy: S.string(),
  uploadedAt: S.date(),
  metadata: S.shape({
    width: S.number().optional(),
    height: S.number().optional(),
    duration: S.number().optional(),
    checksum: S.string().optional()
  }).optional()
})

type FileInfo = typeof FileMetadata.type
```

---

## Best Practices

1. **Define schemas as constants**: Store your schemas in dedicated files for reuse.

```typescript
// schemas/user.schema.ts
export const UserSchema = S.shape({ ... })
export type User = typeof UserSchema.type
```

2. **Use composition**: Build complex schemas from smaller, reusable pieces.

3. **Type inference over manual types**: Let the library infer types rather than manually defining them.

4. **Validate at boundaries**: Validate data at API endpoints, before database operations, etc.

5. **Use .optional() carefully**: Remember that `.optional()` makes the property optional in ObjectSchema, while `.nullable()` allows null values.

6. **Leverage utility functions**: Use `pickFromSchema`, `omitFromSchema`, and `mergeSchemas` to derive schemas.

7. **Document with .title() and .description()**: Add metadata for better API documentation.

8. **Set up AJV once**: Create a configured validator instance and reuse it.

---

## Troubleshooting

### Type not matching runtime validation

Make sure to use `.optional()` for optional fields in ObjectSchema:

```typescript
// Wrong - field is required but type shows optional
const wrong = S.shape({
  field: S.string().nullable() // Still required!
})

// Correct - field is truly optional
const correct = S.shape({
  field: S.string().optional()
})
```

### Custom validators not working

Ensure you've registered the 'custom' keyword with AJV:

```typescript
ajv.addKeyword({
  keyword: 'custom',
  validate: (schema, data, parentSchema, dataCxt) => {
    return BaseSchema.validators[schema[0]](schema, data, parentSchema, dataCxt)
  }
})
```

### Format validation not working

Install and register `ajv-formats`:

```typescript
import addFormats from 'ajv-formats'
addFormats(ajv)
```

### TypeScript errors with strict mode

The library requires `strictNullChecks: true` in tsconfig.json for proper optional type handling.

---

## License

ISC License - Copyright © 2020 Igor Solomakha

---

## Links

- **NPM**: https://www.npmjs.com/package/@bett3r-dev/jsonschema-definer
- **GitHub**: https://github.com/bett3r-dev/jsonschema-definer
- **Documentation**: https://sujimoshi.github.io/jsonschema-definer/
