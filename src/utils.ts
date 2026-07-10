import ObjectSchema, { ObjectJsonSchema } from './object'
import { L, O } from 'ts-toolbelt'

export function pick (keys: string[], obj: any) {
  const result: Record<string, any> = {}

  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key]
    }
  }

  return result
}

export function omit (keys: string[], obj: any) {
  const result: Record<string, any> = {}

  for (const key in obj) {
    if (!keys.includes(key)) {
      result[key] = obj[key]
    }
  }
  return result
}

type HasTail<T extends any[]> =
  T extends ([] | [any])
  ? false
  : true

type MergeSchemasRecursive<S extends ObjectSchema[]> =
  HasTail<S> extends true
    ? O.Merge<L.Head<S>['otype'], MergeSchemasRecursive<L.Tail<S>>>
    : L.Head<S>['otype']

export const mergeMultipleSchemas = <S extends ObjectSchema[]> (...schemas: S): ObjectSchema<MergeSchemasRecursive<S>> => {
  const resultSchema = schemas.reverse().slice(1).reduce((s1, s2) => mergeSchemas(s1, s2), schemas[0])
  return resultSchema as ObjectSchema<MergeSchemasRecursive<S>>
}

type AdditionalProperties = ObjectJsonSchema['additionalProperties']

/**
 * Resolves two `additionalProperties` values to the STRICTER of the two, so that merging a
 * strict schema onto a permissive one never silently loosens validation.
 *
 * Strictness ranking (highest wins):
 *   false            -> strictest, no extra properties allowed
 *   schema (object)  -> extra properties allowed only if they match the schema
 *   true / undefined -> permissive, any extra property allowed (undefined === omitted === true)
 *
 * When both are schema-valued the first (master) is kept, matching mergeSchemas' precedence.
 */
const stricterAdditionalProperties = (a: AdditionalProperties, b: AdditionalProperties): AdditionalProperties => {
  const rank = (value: AdditionalProperties): number => {
    if (value === false) return 2
    if (value === true || value === undefined) return 0
    return 1
  }
  return rank(a) >= rank(b) ? a : b
}

/**
 * Merges the properties of 2 schemas into a new one taking the first one as master.
 * `additionalProperties` is an exception: the STRICTER of the two is kept (see
 * {@link stricterAdditionalProperties}) so a strict shape merged onto a permissive base
 * stays strict.
 *
 * @reference https://json-schema.org/latest/json-schema-validation.html#rfc.section.6.5.4
 *
 * @param {ObjectSchema} schema1
 * @param {ObjectSchema} schema2
 * @returns {ObjectSchema}
 */
export const mergeSchemas = <S1 extends ObjectSchema, S2 extends ObjectSchema> (schema1: S1, schema2: S2): ObjectSchema<O.Merge<S1['otype'], S2['otype']>> => {
  const additionalProperties = stricterAdditionalProperties(schema1.plain.additionalProperties, schema2.plain.additionalProperties)
  return schema1.copyWith({
    plain: {
      properties: { ...schema1.plain.properties, ...schema2.plain.properties },
      ...(additionalProperties !== undefined && { additionalProperties }),
      ...(schema1.isRequired && { required: [...schema1.plain.required || [], ...schema2.plain.required || []] })
    }
  }) as unknown as ObjectSchema<O.Merge<S1['otype'], S2['otype']>>
}

/**
   * Picks properties from the schema
   *
   * @param modifyObject
   */
export const pickFromSchema = <S extends ObjectSchema, PROPS extends (keyof S['otype'])[]>(schema: S, props: PROPS) => {
  return Object.assign(
    Object.create(schema.constructor.prototype),
    {
      ...schema,
      plain: {
        ...schema.plain,
        properties: pick(props as string[], schema.plain.properties),
        required: schema.plain.required?.filter(r => props.includes(r as keyof S['otype']))
      }
    }
  ) as ObjectSchema<O.Pick<S['otype'], L.UnionOf<typeof props>>>
}
/**
   * Omits properties from the schema
   *
   * @param modifyObject
   */
export const omitFromSchema = <S extends ObjectSchema, PROPS extends (keyof S['otype'])[]>(schema: S, props: PROPS) => {
  return Object.assign(
    Object.create(schema.constructor.prototype),
    {
      ...schema,
      plain: {
        ...schema.plain,
        properties: omit(props as string[], schema.plain.properties),
        required: schema.plain.required?.filter(r => !props.includes(r as keyof S['otype']))
      }
    }
  ) as ObjectSchema<O.Omit<S['otype'], L.UnionOf<typeof props>>>
}
