import S, { BaseSchema } from '../'
import Ajv, { ErrorObject } from 'ajv'

type Expect<T extends E, E> = T extends E ? true : false;

describe('ObjectSchema', () => {
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
  it('ObjectSchema.prototype.partial', () => {
    const attributesSchema = S.shape({ str: S.string() })
    const schema = S.shape({ 
      arr: S.array().items(attributesSchema).optional(),
      prop: S.shape({ 
        str: S.string().optional(), 
        obj: S.object(), 
        arr: S.array().items(attributesSchema).optional()
      }) 
    });
    const partialSchema = schema.partial();

    expect(validate(partialSchema, {})[0]).toEqual(true)
    expect(validate(partialSchema, { prop: {} })[0]).toEqual(true)
  })

  it('ObjectSchema.prototype.propertyNames', () => {
    const schema = S.object().propertyNames(S.string().pattern(/^some$/))
    type Check = Expect<typeof schema.type, {}>;
    expect(validate(schema, {})[0]).toEqual(true)
    expect(validate(schema, { some: 'string' })[0]).toEqual(true)

    const schema2 = S.shape({})
      .additionalProperties(S.string())
      .propertyNames(S.string().enum('some', 'any'))

    type Check2 = Expect<typeof schema2.type, {}>;
    expect(validate(schema2, {})[0]).toEqual(true)
    expect(validate(schema2, { some: 'string' })[0]).toEqual(true)
    expect(validate(schema2, { any: 'string' })[0]).toEqual(true)
  })

  it('ObjectSchema.prototype.minProperties', () => {
    const schema = S.object().minProperties(1)

    type Check = Expect<typeof schema.type, {}>;
    expect(validate(schema, {})[0]).toEqual(false)
    expect(validate(schema, { some: 'string' })[0]).toEqual(true)
  })

  it('ObjectSchema.prototype.maxProperties', () => {
    const schema = S.object().maxProperties(0)

    type Check = Expect<typeof schema.type, {}>;
    expect(validate(schema, {})[0]).toEqual(true)
    expect(validate(schema, { some: 'string' })[0]).toEqual(false)
  })

  it('ObjectSchema.prototype.dependencies', () => {
    const schema = S.shape({
      some: S.string().optional(),
      any: S.string().optional()
    }).dependencies({ some: ['any'] })

    type Check = Expect<typeof schema.type, { some?: string; any?: string }>;
    expect(validate(schema, { some: 'some', any: 'any' })[0]).toEqual(true)
    expect(validate(schema, { some: 'string' })[0]).toEqual(false)
    expect(validate(schema, { any: 'string' })[0]).toEqual(true)
  })

  it('ObjectSchema.prototype.dependencies with ObjectSchema', () => {
    const schema = S.shape({
      some: S.string().optional(),
      any: S.string().optional()
    }).dependencies({
      some: S.shape({ any: S.string() }, true)
    })

    type Check = Expect<typeof schema.type, { some?: string; any?: string }>;
    expect(validate(schema, { some: 'some', any: 'any' })[0]).toEqual(true)
    expect(validate(schema, { some: 'string' })[0]).toEqual(false)
    expect(validate(schema, { any: 'string' })[0]).toEqual(true)
  })

  it('ObjectSchema.prototype.patternProperties', () => {
    const schema = S.object().patternProperties({
      '^str': S.string(),
      '^num': S.number()
    })

    type Check = Expect<typeof schema.type, {}>;
    expect(validate(schema, { strSome: 'some', numAny: 0 })[0]).toEqual(true)
    expect(validate(schema, { numAny: 'string' })[0]).toEqual(false)
    expect(validate(schema, { strSome: 0 })[0]).toEqual(false)
  })

  it('ObjectSchema.prototype.required', () => {
    const schema = S.object().prop('some', S.string().optional()).prop('any', S.string().optional()).required(['some'])

    type Check = Expect<typeof schema.type, { some?: string; any?: string }>;
    expect(validate(schema, { some: 'some', any: 'any' })[0]).toEqual(true)
    expect(validate(schema, { any: 'any' } as any)[0]).toEqual(false)
  })

  it('ObjectSchema.prototype.optional', () => {
    const schema = S.object().optional()
    expect(schema.isRequired).toEqual(false)
  })
  
  it('ObjectSchema.prototype.notRequired', () => {
    const schema = S.shape({ some: S.string() }).notRequired('some')
    type Check = Expect<typeof schema.type, { some?: string | undefined }>;
    expect(schema.plain.required).toEqual([])
    expect(validate(schema, { some: 'some' })[0]).toEqual(true)
    expect(validate(schema, {})[0]).toEqual(true)
  })

  it('ObjectSchema.prototype.additionalProperties', () => {
    const schema = S.object().additionalProperties(S.string())

    type Check = Expect<typeof schema.type, {}>;
    expect(validate(schema, { strSome: 'some', numAny: 0 } as any)[0]).toEqual(false)
    expect(validate(schema, { numAny: 'string' })[0]).toEqual(true)
    expect(validate(schema, { strSome: 0 } as any)[0]).toEqual(false)
  })

  it('ObjectSchema.prototype.nullable', () => {
    const schema = S.shape({ some: S.string().nullable() })
    expect(schema.plain.properties!.some.type).toEqual(['null', 'string'])
  })

  it('string propertynullable with optional and enum', () => {
    const schema = S.shape({ 
      some: S.string()
        .enum('some', 'any') 
        .nullable()
        .optional()
    })
    expect(schema.plain).toEqual({
      type: 'object',
      additionalProperties: false,
      properties: {
        some: { type: ['null', 'string'], enum: ['some', 'any', null] }
      }
    })

    expect(validate(schema, { some: 'some' })[0]).toEqual(true)
    expect(validate(schema, { some: 'any' })[0]).toEqual(true)
    expect(validate(schema, { some: undefined })[0]).toEqual(true)

    validate(schema, { some: null });

    expect(validate(schema, { some: null })[0]).toEqual(true)
  })
  it('string propertynullable with enum', () => {
    const schema = S.shape({ 
      some: S.string()
        .enum('some', 'any') 
        .nullable()
    })
    expect(schema.plain).toEqual({
      type: 'object',
      required: ['some'],
      additionalProperties: false,
      properties: {
        some: { type: ['null', 'string'], enum: ['some', 'any', null] }
      }
    })
  })

  it('string propertynullable with enum and required', () => {
    const TiendanubeTextSchema = S.shape({
      es: S.string(),
      pt: S.string().optional(),
      en: S.string().optional()
    });
    const schema = S.shape({
      name: S.string(),
      seo_title: S.anyOf( S.string().maxLength( 70 ), TiendanubeTextSchema )
        .nullable()
        .optional()
    })

    expect(schema.plain).toEqual({
      type: 'object',
      required: ['name'],
      additionalProperties: false,
      properties: {
        name: { type: 'string' },
        seo_title: {
          anyOf: [
            { type: 'string', maxLength: 70 },
            { 
              type: 'object', 
              additionalProperties: false, 
              required: ['es'],
              properties: { 
                es: { type: 'string' }, 
                pt: { type: 'string' }, 
                en: { type: 'string' } 
              }
            },
            { type: 'null' }
          ]
        }
      }
    });

    expect(validate(schema, { name: 'name', seo_title: 'seo_title' })[0]).toEqual(true)
    expect(validate(schema, { name: 'name', seo_title: { es: 'es', pt: 'pt', en: 'en' } })[0]).toEqual(true)
    expect(validate(schema, { name: 'name', seo_title: null })[0]).toEqual(true)
    expect(validate(schema, { name: 'name', seo_title: undefined })[0]).toEqual(true)
  })
})
