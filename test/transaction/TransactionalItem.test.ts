import { assert } from "@open-wc/testing";
import sinon from 'sinon';
import { State } from "../../src/State.js";
import { Transaction } from "../../src/transaction/Transaction.js";
import { LayoutObjectType } from "../../src/Enum.js";
import { TransactionalPanel } from "../../src/transaction/TransactionalPanel.js";
import { Item } from "../../src/Item.js";

describe('transaction/TransactionalItem', () => {
  describe('remove()', () => {
    let state: State;
    let transaction: Transaction;
    let panel: TransactionalPanel;

    beforeEach(() => {
      state = new State();
      transaction = new Transaction(state);
      panel = transaction.add({ key: 'root' });
    });

    it('removes the item from all parents', () => {
      const p1 = panel.addPanel();
      const p2 = panel.addPanel();
      const i1 = p1.addItem();
      const i2 = p1.addItem();
      const i3 = p2.addItem();
      p2.addItem(i1);
      i1.remove();
      assert.lengthOf(p1.items, 1, 'panel 1 has one item only');
      assert.lengthOf(p2.items, 1, 'panel 2 has one item only');
      assert.equal(p1.items[0].key, i2.key, 'panel 1 has item 2');
      assert.equal(p2.items[0].key, i3.key, 'panel 2 has item 3');
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

    it('returns parent transactional panels', () => {
      const root = transaction.add();
      const p1 = root.addPanel();
      const p2 = root.addPanel();
      const i1 = p1.addItem();
      p2.addItem(i1);
      const result = i1.getParents();
      assert.deepEqual(result, [p1, p2], 'parents are returned');
      assert.instanceOf(p1, TransactionalPanel, 'panel 1 is a transactional panel');
      assert.instanceOf(p2, TransactionalPanel, 'panel 2 is a transactional panel');
    });
  });

  describe('update()', () => {
    let state: State;
    let transaction: Transaction;
    let panel: TransactionalPanel;

    beforeEach(() => {
      state = new State();
      transaction = new Transaction(state);
      panel = transaction.add({ key: 'root' });
    });

    it('does not update the key', () => {
      const i1 = panel.addItem({ key: 'i1' });
      i1.update({ key: 'i2' });
      assert.equal(i1.key, 'i1');
    });

    it('does not update the type', () => {
      const p1 = panel.addItem();
      p1.update({ type: LayoutObjectType.panel });
      assert.equal(p1.type, LayoutObjectType.item);
    });

    it('does not update when the value is set ', () => {
      const p1 = panel.addItem({ label: 'abc' });
      p1.update({ label: 'abc' }); // it's for coverage
    });

    it('updates other properties ', () => {
      const p1 = panel.addItem({ label: 'abc' });
      p1.update({ label: 'def' });
      assert.equal(p1.label, 'def');
    });
  });

  describe('move()', () => {
    let state: State;
    let transaction: Transaction;
    let panel: TransactionalPanel;

    beforeEach(() => {
      state = new State();
      transaction = new Transaction(state);
      panel = transaction.add({ key: 'root' });
    });

    it('calls the panel\'s move() method', () => {
      const p1 = panel.addPanel();
      const i1 = p1.addItem();
      const spy = sinon.spy(p1, 'move');
      i1.move(p1.key, { index: 1 });
      assert.isTrue(spy.calledOnce, 'panel method called once');
      assert.equal(spy.args[0][0], i1.key, 'passed the first argument');
      assert.deepEqual(spy.args[0][1], { index: 1 }, 'passed the second argument');
    });

    it('throws when parent cannot be found', () => {
      const p1 = panel.addPanel();
      const i1 = p1.addItem();
      assert.throws(() => {
        i1.move('unknown');
      });
    });
  });

  describe('moveTo()', () => {
    let state: State;
    let transaction: Transaction;
    let panel: TransactionalPanel;

    beforeEach(() => {
      state = new State();
      transaction = new Transaction(state);
      panel = transaction.add({ key: 'root' });
    });

    it('moves the item from one panel to another', () => {
      const p1 = panel.addPanel();
      const p2 = panel.addPanel();
      const i1 = p1.addItem();
      const i2 = p1.addItem();
      i1.moveTo(p1.key, p2.key);
      assert.lengthOf(p1.items, 1, 'panel 1 has only one item left');
      assert.lengthOf(p2.items, 1, 'panel 2 has one item now');
      assert.equal(p1.items[0].key, i2.key, 'panel 1 has not moved item');
      assert.equal(p2.items[0].key, i1.key, 'panel 2 has the moved item');
    });

    it('throws when from panel is not found', () => {
      const p1 = panel.addPanel();
      const p2 = panel.addPanel();
      const i1 = p1.addItem();
      assert.throw(() => {
        i1.moveTo('from panel', p2.key);
      });
    });

    it('throws when to panel is not found', () => {
      const p1 = panel.addPanel();
      panel.addPanel();
      const i1 = p1.addItem();
      assert.throw(() => {
        i1.moveTo(p1.key, 'to panel');
      });
    });

    it('selects the next item on the source panel, if available', () => {
      const p1 = panel.addPanel();
      const p2 = panel.addPanel();
      const i1 = p1.addItem();
      const i2 = p1.addItem();
      p1.selected = i1.key;
      i1.moveTo(p1.key, p2.key);
      assert.equal(p1.selected, i2.key);
    });

    it('selects the previous item on the source panel, if available', () => {
      const p1 = panel.addPanel();
      const p2 = panel.addPanel();
      const i1 = p1.addItem();
      const i2 = p1.addItem();
      p1.selected = i2.key;
      i2.moveTo(p1.key, p2.key);
      assert.equal(p1.selected, i1.key);
    });

    it('clears selection on the source panel when no more items', () => {
      const p1 = panel.addPanel();
      const p2 = panel.addPanel();
      const i1 = p1.addItem();
      i1.moveTo(p1.key, p2.key);
      assert.isUndefined(p1.selected);
    });

    it('selects the new item on the target panel', () => {
      const p1 = panel.addPanel();
      const p2 = panel.addPanel();
      const i1 = p1.addItem();
      p2.addItem();
      i1.moveTo(p1.key, p2.key);
      assert.equal(p2.selected, i1.key);
    });

    it('removes the item from source panel but does not add the duplicate', () => {
      const p1 = panel.addPanel();
      const p2 = panel.addPanel();
      const i1 = p1.addItem();
      p2.addItem(i1);
      i1.moveTo(p1.key, p2.key);
      assert.deepEqual(p1.items, [], 'panel 1 has no items');
      assert.lengthOf(p2.items, 1, 'panel 2 has only one item');
      assert.equal(p2.items[0].key, i1.key, 'panel 2 the item');
    });
  });
});
