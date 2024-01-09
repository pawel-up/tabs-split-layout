import { assert } from "@open-wc/testing";
import { State } from "../src/State.js";
import { Manager } from "../src/Manager.js";
import { StateHelper } from "../src/StateHelper.js";
import { Item } from "../src/Item.js";
import { TransactionalItem } from "../src/transaction/TransactionalItem.js";

describe('StateHelper', () => {
  describe('removeItem()', () => {
    let state: State;
    let layout: Manager;

    beforeEach(() => {
      state = new State();
      layout = new Manager(state);
    });

    it('removes an item from all panels', () => {
      const tx = layout.transaction();
      const root = tx.add();
      const p1 = root.addPanel({ key: 'p1' });
      const p2 = root.addPanel({ key: 'p2' });
      const i1 = p1.addItem({ key: 'i1' });
      const i2 = p1.addItem({ key: 'i2' });
      p2.addItem(i1);
      const i3 = p2.addItem();
      tx.commit();

      // note, references above won't work below.

      // removes i1 from p1, p2, and definitions.
      // leaves i2 and i3.
      StateHelper.removeItem(layout, i1.key);

      assert.isNull(state.item(i1.key), 'state has no item 1');
      assert.ok(state.item(i2.key), 'state has item 2');
      assert.ok(state.item(i3.key), 'state has item 3');
      
      assert.isFalse(state.panel(p1.key)!.hasItem(i1.key), 'item 1 is not in panel 1');
      assert.isFalse(state.panel(p2.key)!.hasItem(i1.key), 'item 1 is not in panel 2');
    });

    it('removes an item from a panel', () => {
      const tx = layout.transaction();
      const root = tx.add();
      const p1 = root.addPanel({ key: 'p1' });
      const p2 = root.addPanel({ key: 'p2' });
      const i1 = p1.addItem({ key: 'i1' });
      const i2 = p1.addItem({ key: 'i2' });
      p2.addItem(i1);
      const i3 = p2.addItem();
      tx.commit();

      // note, references above won't work below.

      // removes i1 from p1 only.
      // leaves i1 on p2, i2 and i3.
      StateHelper.removeItem(layout, i1.key, p1.key);

      assert.ok(state.item(i1.key), 'state has item 1');
      assert.ok(state.item(i2.key), 'state has item 2');
      assert.ok(state.item(i3.key), 'state has item 3');
      
      assert.isFalse(state.panel(p1.key)!.hasItem(i1.key), 'item 1 is not in panel 1');
      assert.isTrue(state.panel(p2.key)!.hasItem(i1.key), 'item 1 is in panel 2');
    });

    it('removes an item from a panel and removes the panel, does not un-split the parent', () => {
      const tx = layout.transaction();
      const root = tx.add();
      const p1 = root.addPanel({ key: 'p1' });
      const p2 = root.addPanel({ key: 'p2' });
      const p3 = root.addPanel({ key: 'p3' });
      const i1 = p1.addItem({ key: 'i1' });
      const i2 = p2.addItem({ key: 'i2' });
      const i3 = p3.addItem({ key: 'i3' });
      tx.commit();

      // note, references above won't work below.

      // removes i1 from p1 and then removes p1.
      StateHelper.removeItem(layout, i1.key, p1.key);

      assert.isNull(state.item(i1.key), 'state has no item 1');
      assert.ok(state.item(i2.key), 'state has item 2');
      assert.ok(state.item(i3.key), 'state has item 3');
      
      assert.isNull(state.panel(p1.key), 'panel 1 is removed');
      assert.isTrue(state.panel(p2.key)!.hasItem(i2.key), 'item 2 is in panel 2');
      assert.isTrue(state.panel(p3.key)!.hasItem(i3.key), 'item 3 is in panel 3');
    });

    it('removes an item from a panel and removes the panel, un-splits the parent', () => {
      const tx = layout.transaction();
      const root = tx.add({ key: 'root' });
      const p1 = root.addPanel({ key: 'p1' });
      const p2 = root.addPanel({ key: 'p2' });
      const i1 = p1.addItem({ key: 'i1' });
      const i2 = p2.addItem({ key: 'i2' });
      tx.commit();

      // note, references above won't work below.

      StateHelper.removeItem(layout, i1.key, p1.key);

      assert.isNull(state.item(i1.key), 'state has no item 1');
      assert.isNull(state.panel(p1.key), 'panel 1 was removed');
      assert.ok(state.item(i2.key), 'state has item 2');
      assert.isNull(state.panel(p2.key), 'panel 2 was removed');
      assert.equal(state.panel(root.key)!.items[0].key, i2.key, 'item 2 is moved to the root');
    });

    it('throws an error when the item is not found', () => {
      assert.throws(() => {
        StateHelper.removeItem(layout, 'test');
      });
    });

    it('throws an error when the parent is not found', () => {
      const tx = layout.transaction();
      const root = tx.add({ key: 'root' });
      const p1 = root.addPanel({ key: 'p1' });
      const p2 = root.addPanel({ key: 'p2' });
      const i1 = p1.addItem({ key: 'i1' });
      p2.addItem({ key: 'i2' });
      tx.commit();

      assert.throws(() => {
        StateHelper.removeItem(layout, i1.key, 'non-existing');
      });
    });

    it('removes an item from all panels and removes a panel, does not un-split the parent', () => {
      const tx = layout.transaction();
      const root = tx.add();
      const p1 = root.addPanel({ key: 'p1' });
      const p2 = root.addPanel({ key: 'p2' });
      const p3 = root.addPanel({ key: 'p3' });
      const i1 = p1.addItem({ key: 'i1' });
      const i2 = p2.addItem({ key: 'i2' });
      const i3 = p3.addItem({ key: 'i3' });
      p3.addItem(i1);
      tx.commit();

      // note, references above won't work below.

      // removes i1 from p1 and p3 and then removes p1.
      StateHelper.removeItem(layout, i1.key);

      assert.isNull(state.item(i1.key), 'state has no item 1');
      assert.ok(state.item(i2.key), 'state has item 2');
      assert.ok(state.item(i3.key), 'state has item 3');
      
      assert.isNull(state.panel(p1.key), 'panel 1 is removed');
      assert.isTrue(state.panel(p2.key)!.hasItem(i2.key), 'item 2 is in panel 2');
      assert.isTrue(state.panel(p3.key)!.hasItem(i3.key), 'item 3 is in panel 3');
      assert.isFalse(state.panel(p3.key)!.hasItem(i1.key), 'item 3 is in panel 3');
    });

    it('removes an item from all panel and removes the panel, un-splits the parent', () => {
      const tx = layout.transaction();
      const root = tx.add({ key: 'root' });
      const p1 = root.addPanel({ key: 'p1' });
      const p2 = root.addPanel({ key: 'p2' });
      const i1 = p1.addItem({ key: 'i1' });
      const i2 = p2.addItem({ key: 'i2' });
      p2.addItem(i1);
      tx.commit();

      // note, references above won't work below.

      StateHelper.removeItem(layout, i1.key);

      assert.isNull(state.item(i1.key), 'state has no item 1');
      assert.isNull(state.panel(p1.key), 'panel 1 was removed');
      assert.ok(state.item(i2.key), 'state has item 2');
      assert.isNull(state.panel(p2.key), 'panel 2 was removed');
      assert.equal(state.panel(root.key)!.items[0].key, i2.key, 'item 2 is moved to the root');
      assert.isFalse(state.panel(root.key)!.hasItem(i1.key), 'item 1 is removed from p2');
    });
  });

  describe('selectItem()', () => {
    let state: State;
    let layout: Manager;

    beforeEach(() => {
      state = new State();
      layout = new Manager(state);
    });

    it('throws when the item is not found', () => {
      assert.throws(() => {
        StateHelper.selectItem(layout, 'a', 'b');
      }, `The item does not exist on the state.`);
    });

    it('throws when the parent is not found', () => {
      const tx = layout.transaction();
      const root = tx.add();
      const i1 = root.addItem({ key: 'i1' });
      root.addItem({ key: 'i2' });
      tx.commit();

      assert.throws(() => {
        StateHelper.selectItem(layout, i1.key, 'b');
      }, `The parent panel does not exist on the state.`);
    });

    it('throws when the item is already selected', () => {
      const tx = layout.transaction();
      const root = tx.add();
      const i1 = root.addItem({ key: 'i1' });
      tx.commit();

      assert.throws(() => {
        StateHelper.selectItem(layout, i1.key, root.key);
      }, `The item is already selected on the panel.`);
    });

    it('selects an item', () => {
      const tx = layout.transaction();
      const root = tx.add();
      const i1 = root.addItem({ key: 'i1' });
      root.addItem({ key: 'i2' });
      tx.commit();

      StateHelper.selectItem(layout, i1.key, root.key);
      assert.equal(state.panel(root.key)!.selected, i1.key);
    });
  });

  describe('selectItem()', () => {
    let state: State;
    let layout: Manager;

    beforeEach(() => {
      state = new State();
      layout = new Manager(state);
    });

    it('throws when the panel is not found', () => {
      assert.throws(() => {
        StateHelper.createItem(layout, 'a', { key: 'i1' });
      }, `The parent panel of the add operation does not exist.`);
    });

    it('returns the created item', () => {
      const tx = layout.transaction();
      const root = tx.add({ key: 'root' });
      const p1 = root.addPanel({ key: 'p1' });
      tx.commit();

      const result = StateHelper.createItem(layout, p1.key, { key: 'i1' });
      assert.instanceOf(result, Item, 'returns an instance of Item');
      assert.notInstanceOf(result, TransactionalItem, 'not returns an instance of TransactionalItem');
    });

    it('creates the item on the panel', () => {
      const tx = layout.transaction();
      const root = tx.add({ key: 'root' });
      const p1 = root.addPanel({ key: 'p1' });
      tx.commit();

      const result = StateHelper.createItem(layout, p1.key, { key: 'i1' });
      assert.equal(result.key, state.panel(p1.key)!.items[0].key, 'the panel has the item');
    });
  });

  describe('moveItem()', () => {
    let state: State;
    let layout: Manager;

    beforeEach(() => {
      state = new State();
      layout = new Manager(state);
    });

    it('moves an item within a panel', () => {
      const tx = layout.transaction();
      const root = tx.add({ key: 'root' });
      const i1 = root.addItem({ key: 'i1' });
      root.addItem({ key: 'i2' });
      tx.commit();

      StateHelper.moveItem(layout, root.key, root.key, i1.key, { index: 1 });
      const panel = state.panel(root.key)!;
      assert.equal(panel.items[0].index, 1, 'item 1 is on index 1');
      assert.equal(panel.items[1].index, 0, 'item 2 is on index 0');
    });

    it('throws when the item does not exists when mowing within a panel', () => {
      const tx = layout.transaction();
      const root = tx.add({ key: 'root' });
      root.addItem({ key: 'i1' });
      root.addItem({ key: 'i2' });
      tx.commit();

      assert.throws(() => {
        StateHelper.moveItem(layout, root.key, root.key, 'not-exists', { index: 1 });
      }, `The target item of the move operation does not exist.`);
    });

    it('throws when the item does not exists when mowing between panels', () => {
      const tx = layout.transaction();
      const root = tx.add({ key: 'root' });
      const p1 = root.addPanel();
      const p2 = root.addPanel();
      p1.addItem({ key: 'i1' });
      p2.addItem({ key: 'i2' });
      tx.commit();

      assert.throws(() => {
        StateHelper.moveItem(layout, p1.key, p2.key, 'not-exists', { index: 1 });
      }, `The target item of the move operation does not exist.`);
    });

    it('throws when the item does not exists on the parent when mowing between panels', () => {
      const tx = layout.transaction();
      const root = tx.add({ key: 'root' });
      const p1 = root.addPanel();
      const p2 = root.addPanel();
      const p3 = root.addPanel();
      const i1 = p1.addItem({ key: 'i1' });
      p2.addItem({ key: 'i2' });
      tx.commit();

      assert.throws(() => {
        StateHelper.moveItem(layout, p3.key, p2.key, i1.key, { index: 1 });
      }, `The parent panel of the move operation does not exist.`);
    });

    it('throws when the target panel does not exists', () => {
      const tx = layout.transaction();
      const root = tx.add({ key: 'root' });
      const p1 = root.addPanel();
      const p2 = root.addPanel();
      const i1 = p1.addItem({ key: 'i1' });
      p2.addItem({ key: 'i2' });
      tx.commit();

      assert.throws(() => {
        StateHelper.moveItem(layout, p1.key, 'nothing', i1.key, { index: 1 });
      }, `The destination panel of the move operation does not exist.`);
    });

    it('moves the item from one panel to another', () => {
      const tx = layout.transaction();
      const root = tx.add({ key: 'root' });
      const p1 = root.addPanel();
      const p2 = root.addPanel();
      const i1 = p1.addItem({ key: 'i1' });
      const i2 = p1.addItem({ key: 'i2' }); // to keep the panel, for now
      tx.commit();

      StateHelper.moveItem(layout, p1.key, p2.key, i1.key);

      assert.lengthOf(state.panel(p1.key)!.items, 1, 'panel 1 has only one item');
      assert.equal(state.panel(p1.key)!.items[0].key, i2.key, 'panel 1 has only item 2');
      assert.lengthOf(state.panel(p2.key)!.items, 1, 'panel 1 has now one item');
      assert.equal(state.panel(p2.key)!.items[0].key, i1.key, 'panel 1 has the item 1');
    });

    it('removes the panel that has no children', () => {
      const tx = layout.transaction();
      const root = tx.add({ key: 'root' });
      const p1 = root.addPanel();
      const p2 = root.addPanel();
      root.addPanel(); // not to un-split.
      const i1 = p1.addItem({ key: 'i1' });
      tx.commit();

      StateHelper.moveItem(layout, p1.key, p2.key, i1.key);
      assert.isNull(state.panel(p1.key)!, 'panel 1 was removed');
    });

    it('un-split the layout after removing a panel', () => {
      const tx = layout.transaction();
      const root = tx.add({ key: 'root' });
      const p1 = root.addPanel();
      const p2 = root.addPanel();
      const i1 = p1.addItem({ key: 'i1' });
      tx.commit();

      StateHelper.moveItem(layout, p1.key, p2.key, i1.key);
      assert.isNull(state.panel(p1.key)!, 'panel 1 was removed');
      assert.isNull(state.panel(p2.key)!, 'panel 2 was removed');
      assert.equal(state.panel(root.key)!.items[0].key, i1.key, 'the item is moved to the root.');
    });
  });
});
