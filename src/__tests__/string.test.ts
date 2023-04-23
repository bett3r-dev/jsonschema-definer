import Ajv, { ErrorObject } from 'ajv'
import { BaseSchema } from '../'
import StringSchema from '../string'
import formats from 'ajv-formats'

describe('StringSchema', () => {
  const ajv = new Ajv()
  formats(ajv);
  ajv.addKeyword({
    keyword: 'custom',
    validate: (schema, data, parentSchema, dataCxt) => {
      return BaseSchema.validators[schema[0]](schema ,data, parentSchema, dataCxt)
    }
  })
  function validate <T> (schema: BaseSchema<T>, data: T): [boolean | PromiseLike<any>, ErrorObject[] | null | undefined] {
    return [ajv.validate(schema.plain, data), ajv.errors]
  }
  it('StringSchema.prototype.optional', () => {
    const schema = new StringSchema()
    expect(schema.isRequired).toEqual(true)
    expect(schema.optional().isRequired).toEqual(false)
  })

  it('StringSchema.prototype.contentMediaType', () => {
    const schema = new StringSchema().contentMediaType('application/json')
    expect(schema.valueOf().contentMediaType).toEqual('application/json')
  })

  it('StringSchema.prototype.contentEncoding', () => {
    const schema = new StringSchema().contentEncoding('binary')
    expect(schema.valueOf().contentEncoding).toEqual('binary')
  })

  it('StringSchema.prototype.format', () => {
    const schema = new StringSchema().format('date-time')
    validate(schema, new Date().toISOString())[0];//?
    expect(validate(schema, new Date().toISOString())[0]).toEqual(true)
    expect(validate(schema, 'some')[0]).toEqual(false)
  })

  it('StringSchema.prototype.minLength', () => {
    const schema = new StringSchema().minLength(2)
    expect(validate(schema, 'some')[0]).toEqual(true)
    expect(validate(schema, 's')[0]).toEqual(false)
  })

  it('StringSchema.prototype.maxLength', () => {
    const schema = new StringSchema().maxLength(2)
    expect(validate(schema, 'some')[0]).toEqual(false)
    expect(validate(schema, 's')[0]).toEqual(true)
  })

  it('StringSchema.prototype.pattern', () => {
    const schema = new StringSchema().pattern(/some/)
    expect(validate(schema, 'some')[0]).toEqual(true)
    expect(validate(schema, 's')[0]).toEqual(false)
  })
})
