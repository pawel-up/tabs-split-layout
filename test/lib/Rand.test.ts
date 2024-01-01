import { assert } from '@open-wc/testing';
import { Rand } from '../../src/lib/Rand.js';

describe('lib', () => {
  describe('Rand', () => {
    describe('id()', () => {
      it('returns default size string', () => {
        const result = Rand.id();
        assert.lengthOf(result, 8);
      });

      it('returns a requested size string', () => {
        const result = Rand.id(1);
        assert.lengthOf(result, 1);
      });

      it('returns a large string', () => {
        const result = Rand.id(32);
        assert.lengthOf(result, 32);
      });

      it('does not collide', () => {
        // the default value of 8 characters generates
        // ~218.34e+12 probabilities. While possible, 
        // a collision is very unlikely.
        const results: string[] = [];
        for (let i = 0; i < 400; i++) {
          const result = Rand.id(32);
          assert.notInclude(results, result);
          results.push(result);
        }
      });
    });
  });
});
