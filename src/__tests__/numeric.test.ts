import Ajv, { ErrorObject } from 'ajv'
import { BaseSchema } from '../'
import NumericSchema from '../numeric'

describe('NumericSchema', () => {
  const ajv = new Ajv()
  ajv.addKeyword({
    keyword: 'custom',
    validate: (schema, data, parentSchema, dataCxt) => {
      return BaseSchema.validators[schema[0]](schema ,data, parentSchema, dataCxt)
    }
  })
  function validate <T> (schema: BaseSchema<T>, data: T): [boolean | PromiseLike<any>, ErrorObject[] | null | undefined] {
    return [ajv.validate(schema.plain, data), ajv.errors]
  }
  it('NumericSchema.constructor(integer)', () => {
    const schema = new NumericSchema('integer')
    expect(validate(schema, 0.1)[0]).toEqual(false)
    expect(validate(schema, 0)[0]).toEqual(true)
  })

  it('NumericSchema.constructor(number)', () => {
    const schema = new NumericSchema('number')
    expect(validate(schema, 0)[0]).toEqual(true)
    expect(validate(schema, 0.1)[0]).toEqual(true)
  })

  it('NumericSchema.prototype.optional', () => {
    const schema = new NumericSchema('number')
    expect(schema.isRequired).toEqual(true)
    expect(schema.optional().isRequired).toEqual(false)
  })

  it('NumericSchema.prototype.minimum', () => {
    const schema = new NumericSchema('number').minimum(1)
    expect(validate(schema, 2)[0]).toEqual(true)
    expect(validate(schema, 1)[0]).toEqual(true)
    expect(validate(schema, 0)[0]).toEqual(false)
  })

  it('NumericSchema.prototype.maximum', () => {
    const schema = new NumericSchema('number').maximum(1)
    expect(validate(schema, 0)[0]).toEqual(true)
    expect(validate(schema, 1)[0]).toEqual(true)
    expect(validate(schema, 2)[0]).toEqual(false)
  })

  it('NumericSchema.prototype.exclusiveMinimum', () => {
    const schema = new NumericSchema('number').minimum(1, true)
    expect(validate(schema, 2)[0]).toEqual(true)
    expect(validate(schema, 1)[0]).toEqual(false)
    expect(validate(schema, 0)[0]).toEqual(false)
  })

  it('NumericSchema.prototype.exclusiveMaximum', () => {
    const schema = new NumericSchema('number').maximum(1, true)
    expect(validate(schema, 0)[0]).toEqual(true)
    expect(validate(schema, 1)[0]).toEqual(false)
    expect(validate(schema, 2)[0]).toEqual(false)
  })

  it('NumericSchema.prototype.multipleOf', () => {
    const schema = new NumericSchema('number').multipleOf(2)
    expect(validate(schema, 4)[0]).toEqual(true)
    expect(validate(schema, 3)[0]).toEqual(false)
  })

  it('NumericSchema.prototype.nullable', () => {
    const schema = new NumericSchema('number').nullable()
    expect(schema.plain.type).toEqual(['null', 'number'])
  })
})
