import { assert } from "@open-wc/testing";
import { State } from "../src/State.js";
import { Item, SerializedItem } from "../src/Item.js";
import { LayoutObjectType } from "../src/Enum.js";
import { close as closeIcon } from '../src/lib/icons.js';
import { Transaction } from "../src/transaction/Transaction.js";

describe('Item', () => {
  describe('new()', () => {
    let state: State;

    beforeEach(() => {
      state = new State();
    });

    it('sets the key', () => {
      const key = 'test-key';
      const instance = new Item(state, {
        key,
        label: '',
        type: LayoutObjectType.item,
      });
      assert.equal(instance.key, key);
    });

    it('sets the label', () => {
      const label = 'test-label';
      const instance = new Item(state, {
        key: '',
        type: LayoutObjectType.item,
        label,
      });
      assert.equal(instance.label, label);
    });

    it('sets the icon', () => {
      const instance = new Item(state, {
        key: '',
        type: LayoutObjectType.item,
        label: '',
        icon: closeIcon,
      });
      assert.equal(instance.icon, closeIcon);
    });

    it('re-sets the icon', () => {
      const schema: SerializedItem = {
        key: '',
        type: LayoutObjectType.item,
        label: '',
        icon: closeIcon,
      }
      const instance = new Item(state, schema);
      delete schema.icon;
      instance.new(schema);
      assert.isUndefined(instance.icon);
    });

    it('sets the pinned', () => {
      const pinned = true;
      const instance = new Item(state, {
        key: '',
        type: LayoutObjectType.item,
        label: '',
        pinned,
      });
      assert.isTrue(instance.pinned);
    });

    it('re-sets the pinned', () => {
      const schema: SerializedItem = {
        key: '',
        type: LayoutObjectType.item,
        label: '',
        pinned: true,
      }
      const instance = new Item(state, schema);
      delete schema.pinned;
      instance.new(schema);
      assert.isUndefined(instance.pinned);
    });

    it('sets the persistent', () => {
      const persistent = true;
      const instance = new Item(state, {
        key: '',
        type: LayoutObjectType.item,
        label: '',
        persistent,
      });
      assert.isTrue(instance.persistent);
    });

    it('re-sets the persistent', () => {
      const schema: SerializedItem = {
        key: '',
        type: LayoutObjectType.item,
        label: '',
        persistent: true,
      }
      const instance = new Item(state, schema);
      delete schema.persistent;
      instance.new(schema);
      assert.isUndefined(instance.persistent);
    });

    it('sets the loading', () => {
      const loading = true;
      const instance = new Item(state, {
        key: '',
        type: LayoutObjectType.item,
        label: '',
        loading,
      });
      assert.isTrue(instance.loading);
    });

    it('re-sets the loading', () => {
      const schema: SerializedItem = {
        key: '',
        type: LayoutObjectType.item,
        label: '',
        loading: true,
      }
      const instance = new Item(state, schema);
      delete schema.loading;
      instance.new(schema);
      assert.isUndefined(instance.loading);
    });

    it('sets the isDirty', () => {
      const isDirty = true;
      const instance = new Item(state, {
        key: '',
        type: LayoutObjectType.item,
        label: '',
        isDirty,
      });
      assert.isTrue(instance.isDirty);
    });

    it('re-sets the isDirty', () => {
      const schema: SerializedItem = {
        key: '',
        type: LayoutObjectType.item,
        label: '',
        isDirty: true,
      }
      const instance = new Item(state, schema);
      delete schema.isDirty;
      instance.new(schema);
      assert.isUndefined(instance.isDirty);
    });

    it('sets the index', () => {
      const index = 1;
      const instance = new Item(state, {
        key: '',
        type: LayoutObjectType.item,
        label: '',
        index,
      });
      assert.equal(instance.index, index);
    });

    it('re-sets the index', () => {
      const schema: SerializedItem = {
        key: '',
        type: LayoutObjectType.item,
        label: '',
        index: 1,
      }
      const instance = new Item(state, schema);
      delete schema.index;
      instance.new(schema);
      assert.equal(instance.index, 0);
    });

    it('creates an empty custom object', () => {
      const instance = new Item(state);
      assert.deepEqual(instance.custom, {});
    });

    it('restores a custom object', () => {
      const schema: SerializedItem = {
        key: '',
        type: LayoutObjectType.item,
        label: '',
        custom: { a: 'b' },
      }
      const instance = new Item(state, schema);
      assert.deepEqual(instance.custom, { a: 'b' });
    });
  });

  describe('toJSON()', () => {
    let state: State;
    let base: SerializedItem;

    beforeEach(() => {
      state = new State();
      base = {
        key: 'test-key',
        label: 'test-label',
        type: LayoutObjectType.item,
      }
    });

    it('serializes the key', () => {
      const instance = new Item(state, base);
      assert.equal(instance.toJSON().key, 'test-key');
    });

    it('serializes the label', () => {
      const instance = new Item(state, base);
      assert.equal(instance.toJSON().label, 'test-label');
    });

    it('serializes the icon', () => {
      const instance = new Item(state, { ...base, icon: closeIcon });
      assert.equal(instance.toJSON().icon, closeIcon);
    });

    it('serializes the pinned', () => {
      const instance = new Item(state, { ...base, pinned: false });
      assert.isFalse(instance.toJSON().pinned);
    });

    it('serializes the persistent', () => {
      const instance = new Item(state, { ...base, persistent: false });
      assert.isFalse(instance.toJSON().persistent);
    });

    it('serializes the loading', () => {
      const instance = new Item(state, { ...base, loading: false });
      assert.isFalse(instance.toJSON().loading);
    });

    it('serializes the isDirty', () => {
      const instance = new Item(state, { ...base, isDirty: false });
      assert.isFalse(instance.toJSON().isDirty);
    });

    it('serializes the index', () => {
      const instance = new Item(state, { ...base, index: 0 });
      assert.equal(instance.toJSON().index, 0);
    });

    it('serializes the custom object', () => {
      const instance = new Item(state, { ...base, custom: { a: 'b' } });
      assert.deepEqual(instance.toJSON().custom, { a: 'b' });
    });
  });

  describe('getParent()', () => {
    let state: State;
    let transaction: Transaction;

    beforeEach(() => {
      state = new State();
      transaction = new Transaction(state);
    });

    it('returns null when no parent', () => {
      const instance = new Item(state);
      const result = instance.getParent();
      assert.isNull(result);
    });

    it('returns the parent panel', () => {
      const p1 = transaction.add();
      const i1 = p1.addItem();
      const result = i1.getParent();
      assert.deepEqual(result, p1);
    });
  });
});
