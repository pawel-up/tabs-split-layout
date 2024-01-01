import { assert } from '@open-wc/testing';
import { State } from '../src/State.js';

console.log(State);


describe('State', () => {
  describe('constructor()', () => {
    it('has the empty definitions by default', () => {
      const instance = new State();
      assert.equal(instance.definitions.size, 0);
    });

    it('has the empty items by default', () => {
      const instance = new State();
      assert.equal(instance.items.length, 0);
    });

    it('has the currentPanel set to undefined', () => {
      const instance = new State();
      assert.isUndefined(instance.currentPanel);
    });
  });
});
