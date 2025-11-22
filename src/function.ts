import BaseSchema from './base'

export default class FunctionSchema<Args extends any[] = any[], R = any> extends BaseSchema<(...args: Args) => R> {
  constructor() {
    super('function' as any)
  }

  validate(value: any): value is (...args: Args) => R {
    return typeof value === 'function'
  }
} 