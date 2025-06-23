import S, { BaseSchema } from '../'
import Ajv, { ErrorObject } from 'ajv'
type Expect<T extends E, E> = T extends E ? true : false;

describe('root instance', () => {
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
  it('S.string()', () => {
    const schema = S.string()

    type Check = Expect<typeof schema.type, string>;
    expect(validate(schema, 'valid')[0]).toEqual(true)
  })

  it('S.number()', () => {
    const schema = S.number()

    type Check = Expect<typeof schema.type, number>;
    expect(validate(schema, 0)[0]).toEqual(true)
    expect(validate(schema, 0.1)[0]).toEqual(true)
  })

  it('S.integer()', () => {
    const schema = S.integer()

    type Check = Expect<typeof schema.type, number>;
    expect(validate(schema, 999)[0]).toEqual(true)
    expect(validate(schema, 999.1)[0]).toEqual(false)
  })

  it('S.boolean()', () => {
    const schema = S.boolean()

    type Check = Expect<typeof schema.type, boolean>;
    expect(validate(schema, true)[0]).toEqual(true)
    expect(validate(schema, false)[0]).toEqual(true)
  })

  it('S.null()', () => {
    const schema = S.null()

    type Check = Expect<typeof schema.type, null>;
    expect(validate(schema, null)[0]).toEqual(true)
  })

  it('S.array()', () => {
    const schema = S.array()

    type Check = Expect<typeof schema.type, any[]>;
    expect(validate(schema, [])[0]).toEqual(true)
  })

  it('S.list()', () => {
    const schema = S.list(S.string())

    type Check = Expect<typeof schema.type, string[]>;
    expect(validate(schema, ['some'])[0]).toEqual(true)
  })

  it('S.object()', () => {
    const schema = S.object()

    type Check = Expect<typeof schema.type, Record<string, any>>;
    expect(validate(schema, { some: 'any' })[0]).toEqual(true)
  })

  it('S.shape()', () => {
    type Type = { str: string, num?: number }
    const schema = S.shape({
      str: S.string(),
      num: S.number().optional()
    })

    type Check = Expect<typeof schema.type, Type>;
    expect(validate(schema, { str: 'any', num: 0 })[0]).toEqual(true)
    expect(validate(schema, { str: 'any', num: undefined })[0]).toEqual(true)
  })

  it('S.enum()', () => {
    enum Type { Some = 'some', Any = 'any' }
    const schema = S.enum(Type.Some, Type.Any)

    type Check = Expect<typeof schema.type, Type>;
    expect(validate(schema, Type.Some)[0]).toEqual(true)
  })

  it('S.const()', () => {
    const schema = S.const('some')

    type Check = Expect<typeof schema.type, 'some'>;
    expect(validate(schema, 'some')[0]).toEqual(true)
  })

  it('S.anyOf()', () => {
    const schema = S.anyOf(S.string(), S.number())

    type CheckSchema = Expect<typeof schema, BaseSchema<string | number>>;
    type CheckType = Expect<typeof schema.type, string | number>;
    expect(validate(schema, 'some')[0]).toEqual(true)
    expect(validate(schema, 999)[0]).toEqual(true)
  })

  it('S.oneOf()', () => {
    const schema = S.oneOf(S.string(), S.number())

    type CheckSchema = Expect<typeof schema, BaseSchema<string | number>>;
    type CheckType = Expect<typeof schema.type, string | number>;
    expect(validate(schema, 'some')[0]).toEqual(true)
    expect(validate(schema, 999)[0]).toEqual(true)
  })

  it('S.allOf()', () => {
    const schema = S.allOf(S.shape({ some: S.string() }), S.shape({ any: S.number() }))

    type CheckSchema = Expect<typeof schema, BaseSchema<{ some: string } & { any: number }>>;
    type CheckType = Expect<typeof schema.type, { some: string } & { any: number }>;
    expect(validate(schema, { some: 'string', any: 0 })[0]).toEqual(false)
    expect(validate(schema, { some: 'string' } as any)[0]).toEqual(false)
  })

  it('S.not()', () => {
    const schema = S.not(S.string())

    type CheckSchema = Expect<typeof schema, BaseSchema<any>>;
    type CheckType = Expect<typeof schema.type, any>;
    expect(validate(schema, 'some')[0]).toEqual(false)
    expect(validate(schema, 999)[0]).toEqual(true)
  })

  it('S.any()', () => {
    const schema = S.any()

    type CheckSchema = Expect<typeof schema, BaseSchema<any>>;
    type CheckType = Expect<typeof schema.type, any>;
    expect(validate(schema, 'some')[0]).toEqual(true)
    expect(validate(schema, 999)[0]).toEqual(true)
    expect(validate(schema, true)[0]).toEqual(true)
    expect(validate(schema, null)[0]).toEqual(true)
    expect(validate(schema, undefined)[0]).toEqual(true)
    expect(validate(schema, {})[0]).toEqual(true)
  })

  it('S.raw()', () => {
    const schema = S.raw({ some: 'any' })

    type CheckSchema = Expect<typeof schema, BaseSchema<any>>;
    type CheckType = Expect<typeof schema.type, any>;
    expect(schema.valueOf().some).toEqual('any')
  })

  it('S.id()', () => {
    const schema = S.id('some')

    type CheckSchema = Expect<typeof schema, BaseSchema<any>>;
    type CheckType = Expect<typeof schema.type, any>;
    expect(schema.valueOf().$id).toEqual('some')
  })

  it('S.schema()', () => {
    const schema = S.schema('some.com')

    type CheckSchema = Expect<typeof schema, BaseSchema<any>>;
    type CheckType = Expect<typeof schema.type, any>;
    expect(schema.valueOf().$schema).toEqual('some.com')
  })

  it('S.ref()', () => {
    const schema = S.ref('some')

    type CheckSchema = Expect<typeof schema, BaseSchema<any>>;
    type CheckType = Expect<typeof schema.type, any>;
    expect(schema.valueOf().$ref).toEqual('some')
  })
  it('S.ref() with type inference', () => {
    const schemaReferenced = S.shape({
      some: S.string()
    }).id('some')
    const deepSchema = S.shape({
      string: S.string(),
      number: S.number(),
      reference: S.ref<typeof schemaReferenced.type>('some')
    })

    type CheckSchema = Expect<typeof deepSchema, BaseSchema<any>>;
    type CheckType = Expect<typeof deepSchema.type, any>;
    expect((deepSchema.valueOf().properties!.reference as any).$ref.valueOf()).toEqual('some')
  })

  it('S.title()', () => {
    const schema = S.title('some')

    type CheckSchema = Expect<typeof schema, BaseSchema<any>>;
    type CheckType = Expect<typeof schema.type, any>;
    expect(schema.valueOf().title).toEqual('some')
  })

  it('S.description()', () => {
    const schema = S.description('some')

    type CheckSchema = Expect<typeof schema, BaseSchema<any>>;
    type CheckType = Expect<typeof schema.type, any>;
    expect(schema.valueOf().description).toEqual('some')
  })

  it('S.examples()', () => {
    const schema = S.examples('some', 'any')

    type CheckSchema = Expect<typeof schema, BaseSchema<any>>;
    type CheckType = Expect<typeof schema.type, any>;
    expect(schema.valueOf().examples).toEqual(['some', 'any'])
  })

  it('S.default()', () => {
    const schema = S.default('some')

    type CheckSchema = Expect<typeof schema, BaseSchema<any>>;
    type CheckType = Expect<typeof schema.type, any>;
    expect(schema.valueOf().default).toEqual('some')
  })

  it('S.definition()', () => {
    const schema = S.definition('some', S.string())

    type CheckSchema = Expect<typeof schema, BaseSchema<any>>;
    type CheckType = Expect<typeof schema.type, any>;
    expect(schema.valueOf().$defs).toEqual({ some: S.string().plain })
  })

  it('S.instanceOf()', () => {
    const schema = S.shape({
      date: S.instanceOf(Date),
      number: S.instanceOf(Number)
    })

    type CheckSchema = Expect<typeof schema, BaseSchema<{ date:Date, number: Number }>>;
    type CheckType = Expect<typeof schema.type.date, Date>;
    type CheckType2 = Expect<typeof schema.type.number, Number>;
    const [valid, error] = validate(schema, { date: new Date(), number: new Number(10) }) // eslint-disable-line
    console.log(error)
    expect(valid).toEqual(true)
  })

  it('S.ifThen()', () => {
    const schema = S.ifThen(S.string(), S.const('string'))

    type CheckSchema = Expect<typeof schema, BaseSchema<any>>;
    type CheckType = Expect<typeof schema.type, any>;
    expect(validate(schema, 'string')[0]).toEqual(true)
  })

  it('S.ifThenElse()', () => {
    const schema = S.ifThenElse(S.string(), S.const('string'), S.const(0))

    type CheckSchema = Expect<typeof schema, BaseSchema<any>>;
    type CheckType = Expect<typeof schema.type, any>;
    expect(validate(schema, 'string')[0]).toEqual(true)
    expect(validate(schema, 0)[0]).toEqual(true)
    expect(validate(schema, 999)[0]).toEqual(false)
  })
})
