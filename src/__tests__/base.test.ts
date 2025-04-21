import Ajv from 'ajv'
import { BaseSchema } from '../'

describe('BaseSchema', () => {
  const ajv = new Ajv()
  ajv.addKeyword({
    keyword: 'custom',
    validate: (schema, data, parentSchema, dataCxt) => {
      return BaseSchema.validators[schema[0]](schema ,data, parentSchema, dataCxt)
    }
  })
  function ensure <T> (schema: BaseSchema<T>, data: T): T | Promise<T> {
    if (!ajv.validate(schema.plain, data))
      throw new Error(ajv.errorsText(ajv.errors))
    return data;
  }
  it('BaseSchema.prototype.optional', () => {
    const schema = new BaseSchema()
    expect(schema.isRequired).toEqual(true)
    expect(schema.optional().isRequired).toEqual(false)
  })

  it('BaseSchema.prototype.ensure', () => {
    const schema = new BaseSchema().enum('some', 'any')
    expect(() => ensure(schema, 'fail' as any)).toThrowError()
    expect(() => ensure(schema, 'some' as any)).not.toThrowError()
  })

  it('BaseSchema.prototype.nullable', () => {
    const schema = new BaseSchema().nullable()
    expect(schema.plain.type).toEqual(['null'])
  })

  it('BaseSchema constructor with nullable type', () => {
    const schema = new BaseSchema(['null', 'string'])
    expect(schema.plain.type).toEqual(['null', 'string'])
  })
})
