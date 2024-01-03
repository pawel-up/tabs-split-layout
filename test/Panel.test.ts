import { assert } from "@open-wc/testing";
import { State } from "../src/State.js";
import { Transaction } from "../src/transaction/Transaction.js";
import { TransactionalItem } from "../src/transaction/TransactionalItem.js";
import { TransactionalPanel } from "../src/transaction/TransactionalPanel.js";
import { Panel, SerializedPanel } from "../src/Panel.js";
import { LayoutDirection, LayoutObjectType, PanelState } from "../src/Enum.js";
import { PanelObject } from "../src/PanelObject.js";

describe('Panel', () => {
  describe('new()', () => {
    let state: State;

    beforeEach(() => {
      state = new State();
    });

    it('sets a random key', () => {
      const panel = new Panel(state, { direction: LayoutDirection.horizontal, type: LayoutObjectType.panel } as SerializedPanel);
      assert.isNotEmpty(panel.key);
    });

    it('sets the passed key', () => {
      const panel = new Panel(state, { direction: LayoutDirection.horizontal, key: 'abc', type: LayoutObjectType.panel } as SerializedPanel);
      assert.equal(panel.key, 'abc');
    });

    it('sets the passed direction', () => {
      const panel = new Panel(state, { direction: LayoutDirection.vertical, type: LayoutObjectType.panel } as SerializedPanel);
      assert.equal(panel.direction, LayoutDirection.vertical);
    });

    it('sets the default direction', () => {
      const panel = new Panel(state);
      assert.equal(panel.direction, LayoutDirection.horizontal);
    });

    it('sets the passed selected', () => {
      const panel = new Panel(state, { direction: LayoutDirection.vertical, selected: 'a', type: LayoutObjectType.panel } as SerializedPanel);
      assert.equal(panel.selected, 'a');
    });

    it('sets the default selected', () => {
      const panel = new Panel(state);
      assert.isUndefined(panel.selected);
    });

    it('sets the default state', () => {
      const panel = new Panel(state);
      assert.equal(panel.state, PanelState.idle);
    });

    it('sets copy of the items', () => {
      const items: PanelObject[] = [
        {
          key: 'i1',
          type: LayoutObjectType.item,
        }
      ];
      const panel = new Panel(state, { direction: LayoutDirection.vertical, items, type: LayoutObjectType.panel } as SerializedPanel);
      assert.deepEqual(panel.items, items, 'sets the value');
      items.splice(0, 1);
      assert.lengthOf(panel.items, 1, 'the array is a copy.');
    });

    it('sets default items', () => {
      const items: PanelObject[] = [
        {
          key: 'i1',
          type: LayoutObjectType.item,
        }
      ];
      const panel = new Panel(state, { direction: LayoutDirection.vertical, items, type: LayoutObjectType.panel } as SerializedPanel);
      panel.new({ direction: LayoutDirection.vertical, type: LayoutObjectType.panel } as SerializedPanel);
      assert.lengthOf(panel.items, 0, 'the array is empty');
    });
  });

  describe('toJSON()', () => {
    let state: State;

    beforeEach(() => {
      state = new State();
    });

    it('serializes the layout', () => {
      const panel = new Panel(state, { direction: LayoutDirection.vertical, type: LayoutObjectType.panel } as SerializedPanel);
      const result = panel.toJSON();
      assert.equal(result.direction, LayoutDirection.vertical);
    });

    it('serializes the key', () => {
      const panel = new Panel(state, { direction: LayoutDirection.vertical, key: 'abc', type: LayoutObjectType.panel } as SerializedPanel);
      const result = panel.toJSON();
      assert.equal(result.key, 'abc');
    });

    it('serializes the items', () => {
      const items: PanelObject[] = [
        {
          key: 'i1',
          type: LayoutObjectType.item,
        }
      ];
      const panel = new Panel(state, { direction: LayoutDirection.vertical, items, type: LayoutObjectType.panel } as SerializedPanel);
      const result = panel.toJSON();
      assert.deepEqual(result.items, items);
    });

    it('serialized items are a copy', () => {
      const items: PanelObject[] = [
        {
          key: 'i1',
          type: LayoutObjectType.item,
        }
      ];
      const panel = new Panel(state, { direction: LayoutDirection.vertical, items, type: LayoutObjectType.panel } as SerializedPanel);
      const result = panel.toJSON();
      items[0].key = 'i2';
      assert.equal(result.items![0].key, 'i1');
      items.splice(0, 1);
      assert.lengthOf(result.items!, 1);
    });

    it('ignores items when empty', () => {
      const panel = new Panel(state, { direction: LayoutDirection.vertical, type: LayoutObjectType.panel } as SerializedPanel);
      const result = panel.toJSON();
      assert.isUndefined(result.items);
    });

    it('serializes the selected', () => {
      const panel = new Panel(state, { direction: LayoutDirection.vertical, selected: 'abc', type: LayoutObjectType.panel } as SerializedPanel);
      const result = panel.toJSON();
      assert.equal(result.selected, 'abc');
    });

    it('serializes selected when not set', () => {
      const panel = new Panel(state, { direction: LayoutDirection.vertical, type: LayoutObjectType.panel } as SerializedPanel);
      const result = panel.toJSON();
      assert.isUndefined(result.selected);
    });
  });

  describe('sortedItems()', () => {
    let state: State;
    let transaction: Transaction;
    let panel: TransactionalPanel;
    let items: TransactionalItem[];

    beforeEach(() => {
      state = new State();
      transaction = new Transaction(state);
      panel = transaction.add({ key: 'root' });
      const i1 = panel.addItem({ key: 'i1' });
      const i2 = panel.addItem({ key: 'i2' });
      const i3 = panel.addItem({ key: 'i3' });
      items = [i1, i2, i3];
    });

    it('returns items in order of adding', () => {
      const result = panel.sortedItems();
      assert.deepEqual(result, items);
    });

    it('sorts the items', () => {
      items[0].index = 1;
      items[1].index = 0;
      items[2].index = 2;
      const result = panel.sortedItems();
      assert.deepEqual(result, [items[1], items[0], items[2]]);
    });

    it('the returning array is a copy', () => {
      const result = panel.sortedItems();
      result.splice(0, 1);
      assert.lengthOf(panel.items, 3);
    });
  });

  describe('canDrop()', () => {
    let state: State;
    let transaction: Transaction;
    let panel: TransactionalPanel;

    beforeEach(() => {
      state = new State();
      transaction = new Transaction(state);
      panel = transaction.add({ key: 'root' });
    });

    it('returns true when has no items', () => {
      assert.isTrue(panel.canDrop());
    });

    it('returns false what has a panel', () => {
      const p1 = panel.addPanel();
      p1.addPanel();
      assert.isFalse(p1.canDrop());
    });

    it('returns true what has an item', () => {
      const p1 = panel.addPanel();
      p1.addItem();
      assert.isTrue(p1.canDrop());
    });
  });

  describe('hasItem()', () => {
    let state: State;
    let transaction: Transaction;
    let panel: TransactionalPanel;

    beforeEach(() => {
      state = new State();
      transaction = new Transaction(state);
      panel = transaction.add({ key: 'root' });
    });

    it('returns true when the panel has an item', () => {
      const i1 = panel.addItem({ key: 'i1' });
      assert.isTrue(panel.hasItem(i1.key));
    });

    it('returns false when the panel has no such item', () => {
      panel.addItem({ key: 'i1' });
      assert.isFalse(panel.hasItem('other'));
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
      const instance = new Panel(state);
      const result = instance.getParent();
      assert.isNull(result);
    });

    it('returns the parent panel', () => {
      const p1 = transaction.add();
      const p2 = p1.addPanel();
      const result = p2.getParent();
      assert.deepEqual(result, p1);
    });
  });

  describe('hasSiblings()', () => {
    let state: State;
    let transaction: Transaction;

    beforeEach(() => {
      state = new State();
      transaction = new Transaction(state);
    });

    it('returns false when it is the root panel', () => {
      const root = transaction.add();
      assert.isFalse(root.hasSiblings())
    });

    it('returns false when it is the only panel', () => {
      const root = transaction.add();
      const p1 = root.addPanel();
      assert.isFalse(p1.hasSiblings())
    });

    it('returns true when the parent has more panels', () => {
      const root = transaction.add();
      const p1 = root.addPanel();
      const p2 = root.addPanel();
      assert.isTrue(p1.hasSiblings())
      assert.isTrue(p2.hasSiblings())
    });
  });

  describe('isSibling()', () => {
    let state: State;
    let transaction: Transaction;

    beforeEach(() => {
      state = new State();
      transaction = new Transaction(state);
    });

    it('returns true when one panel is a sibling of the other', () => {
      const root = transaction.add();
      const p1 = root.addPanel();
      const p2 = root.addPanel();
      assert.isTrue(p1.isSibling(p2.key))
      assert.isTrue(p2.isSibling(p2.key))
    });

    it('returns false when different parents', () => {
      const root = transaction.add();
      const p1 = root.addPanel();
      const p2 = root.addPanel();
      const p3 = p1.addPanel();
      const p4 = p2.addPanel();
      assert.isFalse(p3.isSibling(p4.key))
      assert.isFalse(p4.isSibling(p3.key))
    });

    it('returns false when the root node', () => {
      const root = transaction.add();
      const p1 = root.addPanel();
      assert.isFalse(root.isSibling(p1.key))
    });
  });

  describe('itemIndex()', () => {
    let state: State;
    let transaction: Transaction;
    let panel: TransactionalPanel;

    beforeEach(() => {
      state = new State();
      transaction = new Transaction(state);
      panel = transaction.add({ key: 'root' });
    });

    it('returns the index', () => {
      const p1 = panel.addItem();
      const p2 = panel.addItem();
      const p3 = panel.addItem();
      assert.equal(panel.itemIndex(p1.key), 0);
      assert.equal(panel.itemIndex(p2.key), 1);
      assert.equal(panel.itemIndex(p3.key), 2);
    });
  });
});
