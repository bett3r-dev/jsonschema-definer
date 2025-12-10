import S, { FunctionSchema } from '../'

describe('FunctionSchema', () => {
  it('should validate functions', () => {
    const schema = new FunctionSchema<[number, string], boolean>()
    expect(schema.validate((a: number, b: string) => true)).toBe(true)
    expect(schema.validate(123)).toBe(false)
    expect(schema.validate({})).toBe(false)
  })

  it('should work via S.function', () => {
    const schema = S.function<[number, string], boolean>()
    expect(schema.validate((a: number, b: string) => true)).toBe(true)
    expect(schema.validate(() => 1)).toBe(true)
    expect(schema.validate('not a function')).toBe(false)
  })

  it('should have correct type inference', () => {
    // TypeScript type test (compile-time only)
    type Fn = (a: number, b: string) => boolean
    const schema = S.function<[number, string], boolean>()
    const fn: Fn = (a, b) => true
    // @ts-expect-error
    const notFn: Fn = 123
    expect(schema.validate(fn)).toBe(true)
  })
}) 