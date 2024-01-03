import { assert } from "@open-wc/testing";
import { State } from "../../src/State.js";
import { Transaction } from "../../src/transaction/Transaction.js";
import { TransactionalState, tx as txSymbol } from "../../src/transaction/TransactionalState.js";
import { LayoutDirection, LayoutObjectType } from "../../src/Enum.js";
import type { SerializedItem } from "../../src/Item.js";
import { TransactionalItem } from "../../src/transaction/TransactionalItem.js";
import { SerializedPanel } from "../../src/Panel.js";
import { TransactionalPanel } from "../../src/transaction/TransactionalPanel.js";

describe('transaction/TransactionalState', () => {
  describe('constructor()', () => {
    it('sets the transaction reference', () => {
      const state = new State();
      const tx = new Transaction(state);
      const ts = new TransactionalState(tx);
      assert.isTrue(ts[txSymbol] === tx);
    });

    it('restores the state with an item', () => {
      const state = new State();
      const tx = new Transaction(state);
      const ts = new TransactionalState(tx, {
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

      assert.equal(ts.definitions.size, 1, 'has a single definition');
      const read = ts.definitions.get('test-key')!;
      assert.ok(read, 'definitions have the item')
      
      assert.instanceOf(read.value, TransactionalItem, 'has the value');
      assert.equal(read.type, LayoutObjectType.item, 'has the type');
      assert.isTrue((read.value as TransactionalItem).transaction === tx, 'has the transaction set');
    });

    it('restores the state with a panel', () => {
      const state = new State();
      const tx = new Transaction(state);
      const ts = new TransactionalState(tx, {
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

      assert.equal(ts.definitions.size, 1, 'has a single definition');
      const read = ts.definitions.get('test-key')!;
      assert.ok(read, 'definitions have the item')
      
      assert.instanceOf(read.value, TransactionalPanel, 'has the value');
      assert.equal(read.type, LayoutObjectType.panel, 'has the type');
      assert.isTrue((read.value as TransactionalPanel).transaction === tx, 'has the transaction set');
    });
  });

  describe('activePanel()', () => {
    let state: State;
    let transaction: Transaction;
    let tState: TransactionalState;

    beforeEach(() => {
      state = new State();
      transaction = new Transaction(state);
      tState = new TransactionalState(transaction);
    });

    // this is to make sure the super method is called.
    it('returns the active panel', () => {
      tState.new({
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
      tState.currentPanel = 'test-key1';
      const result = tState.activePanel();
      assert.ok(result);
    });
  });

  describe('addPanel()', () => {
    let state: State;
    let transaction: Transaction;
    let tState: TransactionalState;

    beforeEach(() => {
      state = new State();
      transaction = new Transaction(state);
      tState = new TransactionalState(transaction);
    });

    it('adds a panel to the definitions', () => {
      const p1 = tState.addPanel();
      const def = tState.definitions.get(p1.key)!;
      assert.deepEqual(def.value, p1);
    });

    it('adds a panel to the root items', () => {
      const p1 = tState.addPanel();
      const item = tState.items.find(i => i.key === p1.key)!;
      assert.ok(item, 'has the item');
      assert.equal(item.type, LayoutObjectType.panel, 'has the correct type');
    });

    it('sets the default direction', () => {
      const p1 = tState.addPanel();
      assert.equal(p1.direction, LayoutDirection.horizontal);
    });
    
    it('sets the configured layout', () => {
      const p1 = tState.addPanel({ direction: LayoutDirection.vertical });
      assert.equal(p1.direction, LayoutDirection.vertical);
    });
  });

  describe('panel()', () => {
    let state: State;
    let transaction: Transaction;
    let tState: TransactionalState;

    beforeEach(() => {
      state = new State();
      transaction = new Transaction(state);
      tState = new TransactionalState(transaction);
    });

    // this is to make sure the super method is called.
    it('returns the panel', () => {
      tState.new({
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
      const result = tState.panel('test-key1');
      assert.ok(result);
    });
  });

  describe('item()', () => {
    let state: State;
    let transaction: Transaction;
    let tState: TransactionalState;

    beforeEach(() => {
      state = new State();
      transaction = new Transaction(state);
      tState = new TransactionalState(transaction);
    });

    // this is to make sure the super method is called.
    it('returns the active item', () => {
      tState.new({
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
      const result = tState.item('test-key');
      assert.ok(result);
    });
  });

  describe('panelsIterator()', () => {
    let state: State;
    let transaction: Transaction;

    beforeEach(() => {
      state = new State();
      transaction = new Transaction(state);
    });

    // this is to make sure the super method is called.
    it('returns the active item', () => {
      const p1 = transaction.add({ direction: LayoutDirection.horizontal });
      const p2 = p1.addPanel();
      p1.addPanel();
      p2.addPanel();
      
      const results: string[] = [];
      for (const panel of transaction.state.panelsIterator()) {
        results.push(panel.key);
      }
      assert.lengthOf(results, 4);
    });
  });
});
