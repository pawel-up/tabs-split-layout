import { assert } from '@open-wc/testing';
import missingIndexes from '../../../src/lib/math/MissingIndexes.js';

describe('lib/math', () => {
  describe('MissingIndexes', () => {
    it('returns an empty array when not missing', () => {
      const result = missingIndexes([0, 1, 2, 3]);
      assert.deepEqual(result, []);
    });

    it('returns an empty array when empty input', () => {
      const result = missingIndexes([]);
      assert.deepEqual(result, []);
    });

    it('returns a single missing index', () => {
      const result = missingIndexes([0, 2, 3]);
      assert.deepEqual(result, [1]);
    });

    it('returns a multiple missing indexes', () => {
      const result = missingIndexes([3]);
      assert.deepEqual(result, [0, 1, 2]);
    });

    it('only returns the requested size below array length', () => {
      const result = missingIndexes([3, 4], 2);
      assert.deepEqual(result, [0, 1]);
    });

    it('returns the requested size above array length', () => {
      const result = missingIndexes([3, 4], 7);
      assert.deepEqual(result, [0, 1, 2, 5, 6]);
    });
  });
});
