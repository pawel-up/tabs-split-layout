import { assert } from '@open-wc/testing';
import sinon from 'sinon';
import { State } from '../src/State.js';
import { LayoutDirection, LayoutObjectType } from '../src/Enum.js';
import { Panel, SerializedPanel } from '../src/Panel.js';
import { Item, SerializedItem } from '../src/Item.js';
import { Transaction } from '../src/transaction/Transaction.js';

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

  describe('new()', () => {
    let state: State;

    beforeEach(() => {
      state = new State();
    });

    it('restores the items', () => {
      state.new({
        definitions: [],
        items: [{ key: 'test-id', type: LayoutObjectType.panel }],
      });
      assert.lengthOf(state.items, 1, 'has a single item');
      const [item] = state.items;
      assert.equal(item.type, LayoutObjectType.panel, 'has the type');
      assert.equal(item.key, 'test-id', 'the key is restored');
    });

    it('restores a panel', () => {
      state.new({
        definitions: [{
          type: LayoutObjectType.panel,
          value: {
            direction: LayoutDirection.vertical,
            key: 'test-key',
            type: LayoutObjectType.panel
          } as SerializedPanel,
        }],
        items: [],
      });
      assert.equal(state.definitions.size, 1, 'has a single definition');
      const read = state.definitions.get('test-key')!;
      assert.ok(read, 'definitions have the item')
      
      assert.instanceOf(read.value, Panel, 'has the value');
      assert.equal(read.type, LayoutObjectType.panel, 'has the type');
    });

    it('restores an item', () => {
      state.new({
        definitions: [{
          type: LayoutObjectType.item,
          value: {
            key: 'test-key',
            type: LayoutObjectType.item,
            label: 'abc',
          } as SerializedItem,
        }],
        items: [],
      });
      assert.equal(state.definitions.size, 1, 'has a single definition');
      const read = state.definitions.get('test-key')!;
      assert.ok(read, 'definitions have the item')
      
      assert.instanceOf(read.value, Item, 'has the value');
      assert.equal(read.type, LayoutObjectType.item, 'has the type');
    });
  });

  describe('toJSON()', () => {
    let state: State;

    beforeEach(() => {
      state = new State();
    });

    it('serializes an item', () => {
      state.new({
        definitions: [{
          type: LayoutObjectType.item,
          value: {
            key: 'test-key',
            type: LayoutObjectType.item,
            label: 'abc',
          } as SerializedItem,
        }],
        items: [],
      });

      const result = state.toJSON();
      const { definitions } = result;
      assert.lengthOf(definitions, 1, 'definitions has one item');
      const [item] = definitions;
      assert.equal(item.type, LayoutObjectType.item, 'the item is the "item" type');
      assert.equal(item.value.key, 'test-key', 'the item has the key');
    });

    it('serializes a panel', () => {
      state.new({
        definitions: [{
          type: LayoutObjectType.panel,
          value: {
            key: 'test-key',
            type: LayoutObjectType.panel,
            direction: LayoutDirection.horizontal,
          } as SerializedPanel,
        }],
        items: [],
      });

      const result = state.toJSON();
      const { definitions } = result;
      assert.lengthOf(definitions, 1, 'definitions has one item');
      const [item] = definitions;
      assert.equal(item.type, LayoutObjectType.panel, 'the item is the "item" type');
      assert.equal(item.value.key, 'test-key', 'the item has the key');
    });
  });

  describe('get()', () => {
    let state: State;

    beforeEach(() => {
      state = new State();
    });

    it('returns an item', () => {
      state.new({
        definitions: [{
          type: LayoutObjectType.item,
          value: {
            key: 'test-key',
            type: LayoutObjectType.item,
            label: 'abc',
          } as SerializedItem,
        }],
        items: [],
      });
      const result = state.get('test-key');
      assert.ok(result, 'returns a value');
      assert.instanceOf(result, Item, 'has the item');
    });

    it('returns a panel', () => {
      state.new({
        definitions: [{
          type: LayoutObjectType.panel,
          value: {
            key: 'test-key',
            type: LayoutObjectType.panel,
            direction: LayoutDirection.horizontal,
          } as SerializedPanel,
        }],
        items: [],
      });

      const result = state.get('test-key');
      assert.ok(result, 'returns a value');
      assert.instanceOf(result, Panel, 'has the item');
    });

    it('returns a null', () => {
      state.new({
        definitions: [{
          type: LayoutObjectType.panel,
          value: {
            key: 'test-key1',
            type: LayoutObjectType.panel,
            direction: LayoutDirection.horizontal,
          } as SerializedPanel,
        }, {
          type: LayoutObjectType.item,
          value: {
            key: 'test-key2',
            type: LayoutObjectType.item,
            label: 'abc',
          } as SerializedItem,
        }],
        items: [],
      });

      const result = state.get('test-key3');
      assert.isNull(result);
    });
  });

  describe('panel()', () => {
    let state: State;

    beforeEach(() => {
      state = new State();
    });

    it('returns a null for an item', () => {
      state.new({
        definitions: [{
          type: LayoutObjectType.item,
          value: {
            key: 'test-key',
            type: LayoutObjectType.item,
            label: 'abc',
          } as SerializedItem,
        }],
        items: [],
      });
      const result = state.panel('test-key');
      assert.isNull(result);
    });

    it('returns a panel', () => {
      state.new({
        definitions: [{
          type: LayoutObjectType.panel,
          value: {
            key: 'test-key',
            type: LayoutObjectType.panel,
            direction: LayoutDirection.horizontal,
          } as SerializedPanel,
        }],
        items: [],
      });

      const result = state.panel('test-key');
      assert.ok(result, 'returns a value');
      assert.instanceOf(result, Panel, 'has the item');
    });

    it('returns a null for invalid', () => {
      state.new({
        definitions: [{
          type: LayoutObjectType.panel,
          value: {
            key: 'test-key1',
            type: LayoutObjectType.panel,
            direction: LayoutDirection.horizontal,
          } as SerializedPanel,
        }, {
          type: LayoutObjectType.item,
          value: {
            key: 'test-key2',
            type: LayoutObjectType.item,
            label: 'abc',
          } as SerializedItem,
        }],
        items: [],
      });

      const result = state.panel('test-key3');
      assert.isNull(result);
    });
  });

  describe('item()', () => {
    let state: State;

    beforeEach(() => {
      state = new State();
    });

    it('returns an item', () => {
      state.new({
        definitions: [{
          type: LayoutObjectType.item,
          value: {
            key: 'test-key',
            type: LayoutObjectType.item,
            label: 'abc',
          } as SerializedItem,
        }],
        items: [],
      });
      const result = state.item('test-key');
      assert.ok(result, 'returns a value');
      assert.instanceOf(result, Item, 'has the item');
      
    });

    it('returns a null for a panel', () => {
      state.new({
        definitions: [{
          type: LayoutObjectType.panel,
          value: {
            key: 'test-key',
            type: LayoutObjectType.panel,
            direction: LayoutDirection.horizontal,
          } as SerializedPanel,
        }],
        items: [],
      });
      const result = state.item('test-key');
      assert.isNull(result);
    });

    it('returns a null for invalid', () => {
      state.new({
        definitions: [{
          type: LayoutObjectType.panel,
          value: {
            key: 'test-key1',
            type: LayoutObjectType.panel,
            direction: LayoutDirection.horizontal,
          } as SerializedPanel,
        }, {
          type: LayoutObjectType.item,
          value: {
            key: 'test-key2',
            type: LayoutObjectType.item,
            label: 'abc',
          } as SerializedItem,
        }],
        items: [],
      });

      const result = state.item('test-key3');
      assert.isNull(result);
    });
  });

  describe('clone()', () => {
    let state: State;
    beforeEach(() => {
      state = new State({
        definitions: [{
          type: LayoutObjectType.panel,
          value: {
            key: 'test-key1',
            type: LayoutObjectType.panel,
            direction: LayoutDirection.horizontal,
          } as SerializedPanel,
        }, {
          type: LayoutObjectType.item,
          value: {
            key: 'test-key2',
            type: LayoutObjectType.item,
            label: 'abc',
          } as SerializedItem,
        }],
        items: [],
      });
    });

    it('makes a deep copy', () => {
      const copy = state.clone();
      assert.ok(copy, 'returns a value');
      assert.instanceOf(copy, State, 'returns a State object');
      assert.isFalse(copy === state, 'returns a different State object');
      const i = copy.item('test-key2')!;
      i.label = 'test';
      assert.equal(state.item('test-key2')!.label, 'abc', 'are deeply copied');
    });
  });

  describe('activePanel()', () => {
    let state: State;

    beforeEach(() => {
      state = new State();
    });

    it('returns null when no active panel', () => {
      const result = state.activePanel();
      assert.isNull(result);
    });

    it('returns the active panel', () => {
      state.new({
        definitions: [{
          type: LayoutObjectType.panel,
          value: {
            key: 'test-key1',
            type: LayoutObjectType.panel,
            direction: LayoutDirection.horizontal,
          } as SerializedPanel,
        }],
        items: [],
      });
      state.currentPanel = 'test-key1';
      const result = state.activePanel();
      assert.ok(result);
    });

    it('returns an active panel with items', () => {
      state.new({
        definitions: [{
          type: LayoutObjectType.panel,
          value: {
            key: 'test-key1',
            type: LayoutObjectType.panel,
            direction: LayoutDirection.horizontal,
            items: [{ key: 'test-key2', type: LayoutObjectType.item }],
          } as SerializedPanel,
        }, {
          type: LayoutObjectType.item,
          value: {
            key: 'test-key2',
            type: LayoutObjectType.item,
            label: 'abc',
          } as SerializedItem,
        }],
        items: [{ key: 'test-key1', type: LayoutObjectType.panel }],
      });
      const result = state.activePanel();
      assert.ok(result);
    });
  });

  describe('notifyRender()', () => {
    let state: State;

    beforeEach(() => {
      state = new State();
    });

    it('dispatches the event', () => {
      const spy = sinon.spy();
      state.addEventListener('render', spy);
      state.notifyRender();
      assert.isTrue(spy.calledOnce);
    });
  });

  describe('notifyChange()', () => {
    let state: State;

    beforeEach(() => {
      state = new State();
    });

    it('dispatches the event', () => {
      const spy = sinon.spy();
      state.addEventListener('change', spy);
      state.notifyChange();
      assert.isTrue(spy.calledOnce);
    });
  });

  describe('notifyItemCreated()', () => {
    let state: State;

    beforeEach(() => {
      state = new State();
    });

    it('dispatches the event', () => {
      const tx = new Transaction(state);
      const panel = tx.add({ direction: LayoutDirection.horizontal });
      const item = panel.addItem({ label: 'test' });
      const spy = sinon.spy();
      state.addEventListener('created', spy);
      state.notifyItemCreated(item);
      assert.isTrue(spy.calledOnce, 'the event was called once');
      const { detail } = spy.args[0][0] as CustomEvent;
      assert.isTrue(detail === item, 'the detail is the item');
    });
  });

  describe('panelsIterator()', () => {
    let state: State;

    beforeEach(() => {
      state = new State();
    });

    it('iterates over panels in order', () => {
      const tx = new Transaction(state);
      const p1 = tx.add({ direction: LayoutDirection.horizontal });
      const p2 = p1.addPanel();
      const p3 = p1.addPanel();
      const p4 = p2.addPanel();
      tx.commit();
      const results: string[] = [];
      for (const panel of state.panelsIterator()) {
        results.push(panel.key);
      }
      assert.deepEqual(results, [p1.key, p2.key, p4.key, p3.key]);
    });

    it('starts with a given parent', () => {
      const tx = new Transaction(state);
      const p1 = tx.add();
      const p2 = p1.addPanel();
      const p3 = p1.addPanel();
      const p4 = p2.addPanel();
      p3.addPanel();
      tx.commit();
      const results: string[] = [];
      for (const panel of state.panelsIterator(p2)) {
        results.push(panel.key);
      }
      assert.deepEqual(results, [p4.key]);
    });

    it('ignores panels that are not defined', () => {
      const tx = new Transaction(state);
      const p1 = tx.add({ direction: LayoutDirection.horizontal });
      const p2 = p1.addPanel();
      p2.items.push({
        type: LayoutObjectType.panel,
        key: 'unknown',
      });
      tx.commit();
      const results: string[] = [];
      for (const panel of state.panelsIterator()) {
        results.push(panel.key);
      }
      assert.deepEqual(results, [p1.key, p2.key]);
    });
  });

  describe('itemsIterator()', () => {
    let state: State;

    beforeEach(() => {
      state = new State();
    });

    it('iterates over items in order', () => {
      const tx = new Transaction(state);
      const p1 = tx.add({ direction: LayoutDirection.horizontal });
      const p2 = p1.addPanel();
      const p3 = p1.addPanel();
      const p4 = p1.addPanel();
      const i1 = p2.addItem({
        key: 'i1',
        label: '',
      });
      const i2 = p2.addItem({
        key: 'i2',
        label: '',
      });
      const i3 = p3.addItem({
        key: 'i3',
        label: '',
      });
      const i4 = p4.addItem({
        key: 'i4',
        label: '',
      });
      tx.commit();
      const results: string[] = [];
      for (const item of state.itemsIterator()) {
        results.push(item.key);
      }
      assert.deepEqual(results, [i1.key, i2.key, i3.key, i4.key]);
    });

    it('starts with the given parent', () => {
      const tx = new Transaction(state);
      const p1 = tx.add({ direction: LayoutDirection.horizontal });
      const p2 = p1.addPanel();
      const p3 = p2.addPanel();
      const p4 = p2.addPanel();
      const i1 = p3.addItem({
        key: 'i1',
        label: '',
      });
      const i2 = p3.addItem({
        key: 'i2',
        label: '',
      });
      p4.addItem({
        key: 'i3',
        label: '',
      });
      p4.addItem({
        key: 'i4',
        label: '',
      });
      tx.commit();
      const results: string[] = [];
      for (const item of state.itemsIterator(state.panel(p3.key)!)) {
        results.push(item.key);
      }
      assert.deepEqual(results, [i1.key, i2.key]);
    });
  });

  describe('isEmpty()', () => {
    let state: State;

    beforeEach(() => {
      state = new State();
    });

    it('returns true when empty', () => {
      assert.isTrue(state.isEmpty());
    });

    it('returns true when has only empty panels', () => {
      const tx = new Transaction(state);
      const p1 = tx.add({ direction: LayoutDirection.horizontal });
      p1.addPanel();
      p1.addPanel();
      p1.addPanel();
      tx.commit();
      assert.isTrue(state.isEmpty());
    });

    it('returns false when has an item on a panel', () => {
      const tx = new Transaction(state);
      const p1 = tx.add({ direction: LayoutDirection.horizontal });
      p1.addPanel();
      p1.addPanel();
      const p4 = p1.addPanel();
      p4.addItem({ label: 'test' });
      tx.commit();
      assert.isFalse(state.isEmpty());
    });
  });
});
