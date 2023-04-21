import ObjectSchema from './object'
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

/**
 * Merges the properties of 2 schemas into a new one taking the first one as master.
 *
 * @reference https://json-schema.org/latest/json-schema-validation.html#rfc.section.6.5.4
 *
 * @param {ObjectSchema} schema1
 * @param {ObjectSchema} schema2
 * @returns {ObjectSchema}
 */
export const mergeSchemas = <S1 extends ObjectSchema, S2 extends ObjectSchema> (schema1: S1, schema2: S2): ObjectSchema<O.Merge<S1['otype'], S2['otype']>> => {
  return schema1.copyWith({
    plain: {
      properties: { ...schema1.plain.properties, ...schema2.plain.properties },
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
