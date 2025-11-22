import { pick } from '../';

describe( 'utils', () => {
  describe( 'pick', () => {
    it( 'picks properties from object', () => {
      const res = pick([ 'a', 'b' ], { a: 1, b: 2, c: 3 });
      expect( res ).toEqual({ a: 1, b: 2 });
    });
  });
});
