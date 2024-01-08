import { assert } from "@open-wc/testing";
import { State } from "../src/State.js";
import { Item, SerializedItem } from "../src/Item.js";
import { LayoutObjectType } from "../src/Enum.js";
import { close as closeIcon } from '../src/lib/icons.js';
import { Transaction } from "../src/transaction/Transaction.js";
import { Panel } from "../src/Panel.js";
import { TransactionalPanel } from "../src/transaction/TransactionalPanel.js";

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

    it('serializes the loading', () => {
      const instance = new Item(state, { ...base, loading: false });
      assert.isFalse(instance.toJSON().loading);
    });

    it('serializes the isDirty', () => {
      const instance = new Item(state, { ...base, isDirty: false });
      assert.isFalse(instance.toJSON().isDirty);
    });

    it('serializes the custom object', () => {
      const instance = new Item(state, { ...base, custom: { a: 'b' } });
      assert.deepEqual(instance.toJSON().custom, { a: 'b' });
    });
  });

  describe('getParents()', () => {
    let state: State;
    let transaction: Transaction;

    beforeEach(() => {
      state = new State();
      transaction = new Transaction(state);
    });

    it('returns empty array when no parent', () => {
      const instance = new Item(state);
      const result = instance.getParents();
      assert.deepEqual(result, []);
    });

    it('returns the single parent panel', () => {
      const p1 = transaction.add();
      const i1 = p1.addItem();
      transaction.commit();
      const i1i = state.item(i1.key)!;
      const result = i1i.getParents();
      assert.instanceOf(result[0], Panel, 'is an instance of Panel');
      assert.notInstanceOf(result[0], TransactionalPanel, 'is not an instance of TransactionalPanel');
    });

    it('returns multiple parent panel', () => {
      const root = transaction.add();
      const p1 = root.addPanel();
      const p2 = root.addPanel();
      const i1 = p1.addItem();
      p2.addItem(i1);
      const result = i1.getParents();
      assert.deepEqual(result, [p1, p2]);
    });
  });
});
