import Ajv, { ErrorObject } from 'ajv'
import S, { BaseSchema } from '../'
import formats from 'ajv-formats'

describe('DateSchema', () => {
  const ajv = new Ajv({
    coerceTypes: true,
  })
  formats(ajv);
  
  ajv.addKeyword({
    keyword: "coerceDate",
    modifying: true,
    schema: false,
    validate: (data, dataPath, parentData, key) => {
      const maybeDate = new Date(data);
      if (isNaN(maybeDate.getTime())) {
        return false;
      }
      dataPath.parentData && (dataPath.parentData[dataPath.parentDataProperty as any] = maybeDate);
      return true;
    },
  });
  
  function validate <T> (schema: BaseSchema<T>, data: T): [boolean | PromiseLike<any>, ErrorObject[] | null | undefined] {
    return [ajv.validate(schema.plain, data), ajv.errors]
  }

  it('Coerce types', () => {
    const schema = S.shape({
      dateString: S.datetime(),
      dateObject: S.datetime(),
    });
    let data = { 
      dateString: '2025-01-01T00:00:00.000Z',
      dateObject: new Date('2025-01-01T00:00:00.000Z'),
    };
    const [value, errors] = validate(schema, data);
    expect(value).toEqual(true);
    expect(errors).toBeNull();
    expect(data.dateString).toEqual(new Date('2025-01-01T00:00:00.000Z'));
    expect(data.dateObject).toEqual(new Date('2025-01-01T00:00:00.000Z'));
  })
  
  it('DateSchema.prototype.optional', () => {
    const schema = S.date()
    expect(schema.isRequired).toEqual(true)
    expect(schema.optional().isRequired).toEqual(false)
  })

  it('DateSchema.prototype.format', () => {
    const schema = S.date();
    expect(schema.plain.format).toEqual('date')
  })
  it('DateSchema.prototype.format', () => {
    const schema = S.datetime();
    expect(schema.plain.format).toEqual('date-time')
  })

  it('DateSchema validates a date string', () => {
    const schema = S.date();
    const [value, errors] = validate(schema, '2025-01-01');
    expect(value).toEqual(true);
    expect(errors).toBeNull();
  })
  it('DateSchema validates a datetime string', () => {
    const schema = S.datetime();
    let data = '2025-01-01T00:00:00.000Z';
    const [value, errors] = validate(schema, data);
    expect(value).toEqual(true);
    expect(errors).toBeNull();
  })
 

})
