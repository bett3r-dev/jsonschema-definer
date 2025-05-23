import StringSchema from './string'
import NumericSchema from './numeric'
import ArraySchema from './array'
import ObjectSchema from './object'
import BaseSchema from './base'
import { O } from 'ts-toolbelt'
export { ObjectJsonSchema } from './object'
export * from './utils'

export type Class<T = any> = { new (): T, prototype: T }

export type Optional<T extends object> = O.Optional<T, O.SelectKeys<T, undefined>>

export type Schema =
  BaseSchema
  | StringSchema
  | NumericSchema
  | ArraySchema
  | ObjectSchema

export { BaseSchema, StringSchema, NumericSchema, ArraySchema, ObjectSchema }

export class SchemaFactory extends BaseSchema {
  /**
   * Create an empty schema
   *
   * @exmaple { }
   *
   * @returns {BaseSchema<any>}
   */
  any () {
    return new BaseSchema().copyWith(this)
  }

  /**
   * Create StringSchema
   *
   * @example { "type": "string" }
   *
   * @returns {StringSchema}
   */
  string () {
    return new StringSchema().copyWith(this)
  }

  /** Date Shchema */
  date () {
    return new BaseSchema<string | Date>('string')
      .copyWith({ plain: { format: 'date', coerceDate: true } })
    .copyWith(this)
  }
  /** Date Shchema */
  datetime () {
    return S.oneOf(S.string().format('date-time'), S.object())
      .copyWith({ plain: { coerceDate: true, format: 'date-time' } })
      .copyWith(this)
  }

  /**
   * Create NumericSchema(number)
   *
   * @example { "type": "number" }
   *
   * @returns {NumericSchema}
   */
  number () {
    return new NumericSchema('number').copyWith(this)
  }

  /**
   * Create NumericSchema(integer)
   *
   * @example { "type": "integer" }
   *
   * @returns {NumericSchema}
   */
  integer () {
    return new NumericSchema('integer').copyWith(this)
  }

  /**
   * Create BooleanSchema
   *
   * @example { "type": "boolean" }
   *
   * @returns {BaseSchema<boolean>}
   */
  boolean () {
    return new BaseSchema<boolean>('boolean').copyWith(this)
  }

  /**
   * Create NullSchema
   *
   * @example { "type": "null" }
   *
   * @returns {BaseSchema<null>}
   */
  null () {
    return new BaseSchema<null>('null').copyWith(this)
  }

  /**
   * Create ArraySchema
   *
   * @example { "type": "array" }
   *
   * @returns {ArraySchema}
   */
  array () {
    return new ArraySchema().copyWith(this)
  }

  /**
   * Create ArraySchema
   *
   * @example { "type": "array", "items": { ... } }
   *
   * @returns {ArraySchema}
   */
  list <T extends BaseSchema> (items: T) {
    return new ArraySchema().items(items).copyWith(this)
  }

  /**
   * Create ObjectSchema
   *
   * @example { "type": "object" }
   *
   * @returns {ObjectSchema}
   */
  object () {
    return new ObjectSchema().copyWith(this)
  }

  /**
   * Create ObjectSchema
   *
   * @example { "type": "object", "properties": { ... }, "additionalProperties": false }
   *
   * @returns {ObjectSchema}
   */
  shape <T extends Record<string, BaseSchema<any, boolean>>> (props: T, additional: boolean = false) {
    let res = new ObjectSchema<Optional<{ [K in keyof T]: T[K]['otype'] }>>().additionalProperties(additional).copyWith(this)
    for (const prop in props) res = res.prop(prop, props[prop])
    return res
  }

  /**
   * Check the type of the provided value. Used custom ajv keyword.
   *
   * @param {Class} Type
   */
  instanceOf <P extends Class> (Type: P) {
    return new BaseSchema<InstanceType<P>>().custom((_, data) => data instanceof Type)
  }
}

const S = new SchemaFactory()

export default S
