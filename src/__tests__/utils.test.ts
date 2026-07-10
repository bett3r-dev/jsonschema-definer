import S, { pick, mergeSchemas, mergeMultipleSchemas } from '../';
import Ajv from 'ajv';

describe( 'utils', () => {
  describe( 'pick', () => {
    it( 'picks properties from object', () => {
      const res = pick([ 'a', 'b' ], { a: 1, b: 2, c: 3 });
      expect( res ).toEqual({ a: 1, b: 2 });
    });
  });

  describe( 'mergeSchemas', () => {
    it( 'keeps the stricter additionalProperties: strict (false) merged onto permissive (true) stays strict', () => {
      const permissive = S.shape({ a: S.string() }, true );
      const strict = S.shape({ b: S.string() });

      const merged = mergeSchemas( permissive, strict );

      expect( merged.plain.additionalProperties ).toEqual( false );

      // Behavioural check: the merged schema must reject unknown properties.
      const ajv = new Ajv();
      expect( ajv.validate( merged.plain, { a: 'x', b: 'y' } ) ).toEqual( true );
      expect( ajv.validate( merged.plain, { a: 'x', b: 'y', c: 'z' } ) ).toEqual( false );
    });

    it( 'strict base (false) merged with permissive (true) stays strict regardless of order', () => {
      const strict = S.shape({ a: S.string() });
      const permissive = S.shape({ b: S.string() }, true );

      expect( mergeSchemas( strict, permissive ).plain.additionalProperties ).toEqual( false );
    });

    it( 'permissive (true) merged with permissive (true) stays permissive', () => {
      const a = S.shape({ a: S.string() }, true );
      const b = S.shape({ b: S.string() }, true );

      expect( mergeSchemas( a, b ).plain.additionalProperties ).toEqual( true );
    });

    it( 'preserves a schema-valued additionalProperties over permissive (true)', () => {
      const permissive = S.shape({ a: S.string() }, true );
      const constrained = S.object().additionalProperties( S.string() );

      expect( mergeSchemas( permissive, constrained ).plain.additionalProperties ).toEqual({ type: 'string' });
    });

    it( 'lets false win over a schema-valued additionalProperties', () => {
      const constrained = S.object().additionalProperties( S.string() );
      const strict = S.shape({ b: S.string() });

      expect( mergeSchemas( constrained, strict ).plain.additionalProperties ).toEqual( false );
    });
  });

  describe( 'mergeMultipleSchemas', () => {
    it( 'keeps the stricter additionalProperties across the reduce path', () => {
      const permissiveA = S.shape({ a: S.string() }, true );
      const strict = S.shape({ b: S.string() });
      const permissiveC = S.shape({ c: S.string() }, true );

      const merged = mergeMultipleSchemas( permissiveA, strict, permissiveC );

      expect( merged.plain.additionalProperties ).toEqual( false );
    });
  });
});
