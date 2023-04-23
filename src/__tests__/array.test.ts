import Ajv from 'ajv'
import S, { BaseSchema } from '../'
import ArraySchema from '../array'
import { ErrorObject } from '../types'

describe('ArraySchema', () => {
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
  it('ArraySchema.prototype.optional', () => {
    const schema = new ArraySchema()
    expect(schema.isRequired).toEqual(true)
    expect(schema.optional().isRequired).toEqual(false)
  })

  it('ArraySchema.prototype.additionalItems', () => {
    const schema = new ArraySchema().items([S.string(), S.number()])
    expect(validate(schema, ['some', 0, 0])[0]).toEqual(true)
    expect(validate(schema.additionalItems(false), ['some', 0, 0])[0]).toEqual(false)
    expect(validate(schema.additionalItems(S.string()), ['some', 0, 'any'])[0]).toEqual(true)
  })

  it('ArraySchema.prototype.contains', () => {
    const schema = new ArraySchema().contains(S.const('some'))
    expect(validate(schema, ['some', 0, 0])[0]).toEqual(true)
    expect(validate(schema, ['any', 0, 0])[0]).toEqual(false)
  })

  it('ArraySchema.prototype.minItems', () => {
    const schema = new ArraySchema().minItems(1)
    expect(validate(schema, ['some', 0, 0])[0]).toEqual(true)
    expect(validate(schema, [])[0]).toEqual(false)
  })

  it('ArraySchema.prototype.maxItems', () => {
    const schema = new ArraySchema().maxItems(1)
    expect(validate(schema, ['some', 0, 0])[0]).toEqual(false)
    expect(validate(schema, [])[0]).toEqual(true)
  })

  it('ArraySchema.prototype.unique', () => {
    const schema = new ArraySchema().uniqueItems()
    expect(validate(schema, ['some', 0])[0]).toEqual(true)
    expect(validate(schema, [1, 1])[0]).toEqual(false)
  })
})
