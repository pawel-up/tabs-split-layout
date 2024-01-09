import { assert } from "@open-wc/testing";
import sinon from 'sinon';
import { State } from "../../src/State.js";
import { Transaction } from "../../src/transaction/Transaction.js";
import { LayoutObjectType, PanelState, TransactionState } from "../../src/Enum.js";
import { TransactionalPanel } from "../../src/transaction/TransactionalPanel.js";
import type { PanelObject } from "../../src/PanelObject.js";

describe('transaction/Transaction', () => {
  describe('constructor()', () => {
    let state: State;

    beforeEach(() => {
      state = new State({
        definitions: [{ type: LayoutObjectType.item, value: { key: 'test', type: LayoutObjectType.item } }],
        items: [{ key: 'test', type: LayoutObjectType.item }],
      });
    });

    it('sets the working state', () => {
      const transaction = new Transaction(state);
      assert.lengthOf(transaction.state.definitions, 1, 'has definitions');
      assert.lengthOf(transaction.state.items, 1, 'has items');
    });

    it('sets the status to running', () => {
      const transaction = new Transaction(state);
      assert.equal(transaction.status, TransactionState.running);
    });

    it('creates a copy of the state', () => {
      const transaction = new Transaction(state);
      transaction.add();
      assert.lengthOf(state.definitions, 1, 'has definitions');
      assert.lengthOf(state.items, 1, 'has items');
      assert.lengthOf(transaction.state.definitions, 2, 'the transaction definitions has changed');
    });
  });

  describe('add()', () => {
    let state: State;
    let transaction: Transaction;

    beforeEach(() => {
      state = new State();
      transaction = new Transaction(state);
    });

    it('adds a panel and returns it', () => {
      const result = transaction.add();
      assert.lengthOf(transaction.state.definitions, 1, 'has definitions');
      assert.lengthOf(transaction.state.items, 1, 'has items');
      assert.equal(transaction.state.items[0].key, result.key, 'inserts panel into "items"');
      assert.ok(transaction.state.definitions.get(result.key), 'inserts panel into "definitions"');
    });

    it('returns a TransactionalPanel', () => {
      const result = transaction.add();
      assert.instanceOf(result, TransactionalPanel);
    });

    it('adds a copy of items', () => {
      const items: PanelObject[] = [
        {
          key: 'p1',
          type: LayoutObjectType.panel,
        }
      ];
      const result = transaction.add({ items });
      assert.deepEqual(result.items, items, 'creates the items');
      items.push({
        key: 'p2',
        type: LayoutObjectType.panel,
      });
      assert.lengthOf(result.items, 1, 'creates a copy of items');
    });

    it('sets the passed key', () => {
      const result = transaction.add({ key: 'abc' });
      assert.equal(result.key, 'abc');
    });

    it('sets the passed selected', () => {
      const result = transaction.add({ selected: 'abc' });
      assert.equal(result.selected, 'abc');
    });

    it('sets the passed state', () => {
      const result = transaction.add({ state: PanelState.busy });
      assert.equal(result.state, PanelState.busy);
    });
  });

  describe('commit()', () => {
    let state: State;
    let transaction: Transaction;

    beforeEach(() => {
      state = new State();
      transaction = new Transaction(state);
    });

    it('transfers changes to the original state', () => {
      const p1 = transaction.add();
      const i1 = p1.addItem();
      transaction.commit();
      assert.ok(state.item(i1.key), 'the state has the created item');
      assert.ok(state.panel(p1.key), 'the state has the created panel');
    });

    it('calls the notifyChange() on the original state', () => {
      transaction.add();
      const spy = sinon.spy(state, 'notifyChange');
      transaction.commit();
      assert.isTrue(spy.calledOnce);
    });

    it('calls the notifyRender() on the original state', () => {
      transaction.add();
      const spy = sinon.spy(state, 'notifyRender');
      transaction.commit();
      assert.isTrue(spy.calledOnce);
    });

    it('sets the transaction status to done', () => {
      transaction.add();
      transaction.commit();
      assert.equal(transaction.status, TransactionState.done);
    });

    it('throws when the transaction was committed', () => {
      transaction.add();
      transaction.commit();
      assert.throws(() => {
        transaction.commit();
      });
    });
  });

  describe('reset()', () => {
    let state: State;
    let transaction: Transaction;

    beforeEach(() => {
      state = new State();
      transaction = new Transaction(state);
    });

    it('resets the changes', () => {
      const p1 = transaction.add();
      p1.addItem();
      transaction.reset();
      assert.lengthOf(transaction.state.definitions, 0, 'resets definitions');
      assert.lengthOf(transaction.state.items, 0, 'resets items');
    });

    it('does not change the status value', () => {
      transaction.add();
      transaction.commit();
      transaction.reset();
      assert.equal(transaction.status, TransactionState.done);
    });
  });
});
