import BaseSchema, { BaseJsonSchema } from './base'
import { Schema } from '.'
import StringSchema from './string'
import { O, A } from 'ts-toolbelt'

export interface ObjectJsonSchema extends BaseJsonSchema {
  type: 'object'
  properties?: Record<string, Schema['plain']>
  required?: string[]
  additionalProperties?: Schema['plain'] | boolean
  propertyNames?: StringSchema['plain']
  minProperties?: number
  maxProperties?: number
  dependencies?: Record<string, string[] | Schema['plain']>
  patternProperties?: Record<string, Schema['plain']>
}

export default class ObjectSchema<T extends Record<string, any> = {}, R extends boolean = true> extends BaseSchema<T, R, Readonly<ObjectJsonSchema>> {
  constructor () {
    super('object')
  }

  /**
   * The value of "properties" MUST be an object. Each value of this object MUST be a valid JSON Schema
   *
   * @reference https://json-schema.org/latest/json-schema-validation.html#rfc.section.6.5.4
   *
   * @param {string} name
   * @param {ObjectSchema} schema
   * @returns {ObjectSchema}
   */
  prop <K extends string, S extends BaseSchema<any, boolean>> (name: K, schema: S) {
    return this.copyWith({
      plain: {
        properties: { ...this.plain.properties, [name]: schema.plain },
        ...(schema.isRequired && { required: [...this.plain.required || [], name] })
      }
    })
  }

  /**
   * This keyword determines how child instances validate for objects, and does not directly validate the immediate instance itself.
   * Validation with "additionalProperties" applies only to the child values of instance names that do not match any names in "properties",
   * and do not match any regular expression in "patternProperties".
   * For all such properties, validation succeeds if the child instance validates against the "additionalProperties" schema.
   * Omitting this keyword has the same behavior as an empty schema.
   *
   * @reference https://json-schema.org/latest/json-schema-validation.html#rfc.section.6.5.6
   *
   * @param {BaseSchema|boolean} value
   * @returns {ObjectSchema}
   */
  additionalProperties <P extends BaseSchema | boolean> (schema: P): P extends BaseSchema ? ObjectSchema<O.MergeUp<T, Record<string, P['otype']>>, R> : this {
    return this.copyWith({ plain: { additionalProperties: typeof schema === 'boolean' ? schema : (schema as BaseSchema).plain } }) as any
  }

  /**
   * If the instance is an object, this keyword validates if every property name in the instance validates against the provided schema.
   * Note the property name that the schema is testing will always be a string.
   *
   * @reference https://json-schema.org/latest/json-schema-validation.html#rfc.section.6.5.7
   *
   * @param {BaseSchema} nameSchema
   * @returns {ObjectSchema}
   */
  propertyNames <K extends string>(nameSchema: BaseSchema<K>): ObjectSchema<Partial<Record<K, T[K]>>, R> {
    return this.copyWith({ plain: { propertyNames: nameSchema.plain } }) as ObjectSchema<Partial<Record<K, T[K]>>, R>
  }

  /**
   * An object instance is valid against "minProperties" if its number of properties is greater than, or equal to, the value of this keyword.
   *
   * @reference https://json-schema.org/latest/json-schema-validation.html#rfc.section.6.5.2
   *
   * @param {number} minProperties
   * @returns {ObjectSchema}
   */
  minProperties (minProperties: number) {
    return this.copyWith({ plain: { minProperties } })
  }

  /**
   * An object instance is valid against "maxProperties" if its number of properties is less than, or equal to, the value of this keyword.
   *
   * @reference https://json-schema.org/latest/json-schema-validation.html#rfc.section.6.5.1
   *
   * @param {number} maxProperties
   * @returns {ObjectSchema}
   */
  maxProperties (maxProperties: number) {
    return this.copyWith({ plain: { maxProperties } })
  }

  /**
   * This keyword specifies rules that are evaluated if the instance is an object and contains a certain property.
   * This keyword's value MUST be an object. Each property specifies a dependency. Each dependency value MUST be an array or a valid JSON Schema.
   * If the dependency value is a subschema, and the dependency key is a property in the instance, the entire instance must validate against the dependency value.
   * If the dependency value is an array, each element in the array, if any, MUST be a string, and MUST be unique. If the dependency key is a property in the instance, each of the items in the dependency value must be a property that exists in the instance.
   *
   * @reference https://json-schema.org/latest/json-schema-validation.html#rfc.section.6.5.7
   *
   * @param {Record<string, string[] | BaseSchema>} deps
   * @returns {ObjectSchema}
   */
  dependencies (deps: Record<string, string[] | BaseSchema>) {
    const dependencies: ObjectJsonSchema['dependencies'] = {}
    for (const dep in deps) {
      dependencies[dep] = Array.isArray(deps[dep]) ? (deps[dep] as string[]) : (deps[dep] as BaseSchema).plain
    }
    return this.copyWith({ plain: { dependencies } })
  }

  /**
   * Each property name of this object SHOULD be a valid regular expression, according to the ECMA 262 regular expression dialect.
   * Each property value of this object MUST be a valid JSON Schema.
   * This keyword determines how child instances validate for objects, and does not directly validate the immediate instance itself.
   * Validation of the primitive instance type against this keyword always succeeds.
   * Validation succeeds if, for each instance name that matches any regular expressions that appear as a property name in this keyword's value, the child instance for that name successfully validates against each schema that corresponds to a matching regular expression.
   *
   * @reference https://json-schema.org/latest/json-schema-validation.html#rfc.section.6.5.5
   *
   * @param {Record<string, BaseSchema>} props
   * @returns {ObjectSchema}
   */
  patternProperties (props: Record<string, BaseSchema>) {
    const patternProperties: ObjectJsonSchema['patternProperties'] = {}
    for (const prop in props) patternProperties[prop] = props[prop].plain
    return this.copyWith({ plain: { patternProperties } })
  }

  /**
   * Set required array
   *
   * @reference https://json-schema.org/latest/json-schema-validation.html#rfc.section.6.5.3
   *
   * @returns {ObjectSchema}
   */
  required <S extends string[]> (...fields: S): ObjectSchema<O.Required<T, S[number]>, R> {
    return this.copyWith({ plain: { required: fields } }) as any
  }

  /**
   * Specifies a property that can be optional
   *
   * @returns {ObjectSchema}
   */
  notRequired <S extends string[]> (...fields: S): ObjectSchema<O.Optional<T, S[number]>, R> {
    return this.copyWith({ plain: { required: this.plain.required?.filter(field => !fields.includes(field)) } }) as any
  }

  /**
   * Make schema optional in {ObjectSchema}
   *
   * @returns {ObjectSchema}
   */
  optional (): ObjectSchema<T, false> {
    return this.copyWith({ isRequired: false }) as any
  }

  /**
   * Return new ObjectSchema with removed required fields (recursively)
   *
   * @returns {ObjectSchema}
   */
  partial (): ObjectSchema<O.Partial<T, 'deep'>, R> {
    const plain = (function partial (schema: any) {
      for (const key in schema.properties || {}) {
        if (schema.properties[key].type === 'object') {
          schema = { ...schema, properties: { ...schema.properties, [key]: partial({ ...schema.properties[key] }) } }
        }
      }
      const { required, ...partialSchema } = schema // eslint-disable-line @typescript-eslint/no-unused-vars
      return partialSchema
    })(this.valueOf())
    return Object.assign(Object.create(this.constructor.prototype), { ...this, plain })
  }
}
