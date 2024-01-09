import { assert } from "@open-wc/testing";
import { State } from "../../src/State.js";
import { Transaction } from "../../src/transaction/Transaction.js";
import { LayoutDirection, LayoutObjectType, PanelState, SplitRegion, TabCloseDirection } from "../../src/Enum.js";
import { TransactionalPanel, decreaseItemIndex, increaseItemIndex, nextIndex } from "../../src/transaction/TransactionalPanel.js";
import { TransactionalItem } from "../../src/transaction/TransactionalItem.js";

describe('transaction/TransactionalPanel', () => {
  describe('remove()', () => {
    let state: State;
    let transaction: Transaction;
    let panel: TransactionalPanel;

    beforeEach(() => {
      state = new State();
      transaction = new Transaction(state);
      panel = transaction.add({ key: 'root' });
    });

    it('removes the panel from the definitions', () => {
      panel.remove();
      assert.isNull(transaction.state.panel(panel.key));
    });

    it('removes the item from the root', () => {
      panel.remove();
      assert.isEmpty(transaction.state.items);
    });

    it('removes all items from the panel', () => {
      const i1 = panel.addItem({ key: 'i1' });
      const i2 = panel.addItem({ key: 'i2' });
      panel.remove();
      assert.isNull(transaction.state.item(i1.key), 'item 1 is removed');
      assert.isNull(transaction.state.item(i2.key), 'item 2 is removed');
    });

    it('removes all child panels', () => {
      const p1 = panel.addPanel({ key: 'p1' });
      const p2 = panel.addPanel({ key: 'p2' });
      panel.remove();
      assert.isNull(transaction.state.panel(p1.key), 'panel 1 is removed');
      assert.isNull(transaction.state.panel(p2.key), 'panel 2 is removed');
    });

    it('deeply removes all child panels and items', () => {
      const p1 = panel.addPanel({ key: 'p1' });
      const p2 = panel.addPanel({ key: 'p2' });
      const i1 = p1.addItem({ key: 'i1' });
      const i2 = p2.addItem({ key: 'i2' });
      panel.remove();
      assert.isNull(transaction.state.panel(p1.key), 'panel 1 is removed');
      assert.isNull(transaction.state.panel(p2.key), 'panel 2 is removed');
      assert.isNull(transaction.state.item(i1.key), 'item 1 is removed');
      assert.isNull(transaction.state.item(i2.key), 'item 2 is removed');
    });
  });

  describe('removeItem()', () => {
    let state: State;
    let transaction: Transaction;
    let panel: TransactionalPanel;

    beforeEach(() => {
      state = new State();
      transaction = new Transaction(state);
      panel = transaction.add({ key: 'root' });
    });

    it('removes the item from definitions', () => {
      const i1 = panel.addItem({ key: 'i1' });
      const i2 = panel.addItem({ key: 'i2' });
      panel.removeItem(i1.key);
      assert.isNull(transaction.state.item(i1.key), 'has no removed item');
      assert.ok(transaction.state.item(i2.key), 'has the other item');
    });

    it('does nothing if the item is not found on the panel', () => {
      const i1 = panel.addItem({ key: 'i1' });
      const i2 = panel.addItem({ key: 'i2' });
      panel.removeItem('i3');
      assert.ok(transaction.state.item(i1.key), 'has item 1');
      assert.ok(transaction.state.item(i2.key), 'has item 2');
    });

    it('removes the information from panel items when no definition', () => {
      const i1 = panel.addItem({ key: 'i1' });
      const i2 = panel.addItem({ key: 'i2' });
      panel.items.push({
        key: 'i3',
        type: LayoutObjectType.item,
      });
      panel.removeItem('i3');
      assert.ok(transaction.state.item(i1.key), 'has item 1');
      assert.ok(transaction.state.item(i2.key), 'has item 2');
      assert.lengthOf(panel.items, 2, 'the panel has only 2 items'); // i3 was removed
    });

    it('ignores removing a panel', () => {
      const p1 = panel.addPanel({ key: 'p1' });
      const i1 = p1.addItem({ key: 'i1' });
      panel.removeItem(p1.key);
      assert.ok(transaction.state.panel(p1.key), 'has the panel');
      assert.ok(transaction.state.item(i1.key), 'has the item');
    });

    it('decreases indexes of relevant items', () => {
      const i1 = panel.addItem({ key: 'i1' });
      const i2 = panel.addItem({ key: 'i2' });
      const i3 = panel.addItem({ key: 'i3' });
      const i4 = panel.addItem({ key: 'i4' });
      const i5 = panel.addItem({ key: 'i5' });
      panel.removeItem(i3.key);
      assert.equal(panel.getPanelObject(i1.key)!.index, 0, 'i1 index has not changed');
      assert.equal(panel.getPanelObject(i2.key)!.index, 1, 'i2 index has not changed');
      assert.equal(panel.getPanelObject(i4.key)!.index, 2, 'i4 index decreased');
      assert.equal(panel.getPanelObject(i5.key)!.index, 3, 'i5 index decreased');
    });

    it('does not change indexes when removing the last item', () => {
      const i1 = panel.addItem({ key: 'i1' });
      const i2 = panel.addItem({ key: 'i2' });
      const i3 = panel.addItem({ key: 'i3' });
      const i4 = panel.addItem({ key: 'i4' });
      const i5 = panel.addItem({ key: 'i5' });
      panel.removeItem(i5.key);
      assert.equal(panel.getPanelObject(i1.key)!.index, 0, 'i1 index has not changed');
      assert.equal(panel.getPanelObject(i2.key)!.index, 1, 'i2 index has not changed');
      assert.equal(panel.getPanelObject(i3.key)!.index, 2, 'i4 index has not changed');
      assert.equal(panel.getPanelObject(i4.key)!.index, 3, 'i5 index has not changed');
    });

    it('does not change the panel selection when item is not selected', () => {
      const i1 = panel.addItem({ key: 'i1' });
      const i2 = panel.addItem({ key: 'i2' });
      panel.selected = i1.key;
      panel.removeItem(i2.key);
      assert.equal(panel.selected, i1.key);
    });

    it('selects the next item', () => {
      const i1 = panel.addItem({ key: 'i1' });
      const i2 = panel.addItem({ key: 'i2' });
      panel.selected = i1.key;
      panel.removeItem(i1.key);
      assert.equal(panel.selected, i2.key);
    });

    it('selects the previous item', () => {
      const i1 = panel.addItem({ key: 'i1' });
      const i2 = panel.addItem({ key: 'i2' });
      panel.selected = i2.key;
      panel.removeItem(i2.key);
      assert.equal(panel.selected, i1.key);
    });

    it('deselects the item when no more items', () => {
      const i1 = panel.addItem({ key: 'i1' });
      panel.selected = i1.key;
      panel.removeItem(i1.key);
      assert.isUndefined(panel.selected);
    });
  });

  describe('[decreaseItemIndex]()', () => {
    let state: State;
    let transaction: Transaction;
    let panel: TransactionalPanel;

    beforeEach(() => {
      state = new State();
      transaction = new Transaction(state);
      panel = transaction.add({ key: 'root' });
    });

    it('ignores panels', () => {
      const p1 = panel.addPanel();
      const p2 = panel.addPanel();
      panel[decreaseItemIndex](1);
      // @ts-ignore
      assert.isUndefined(transaction.state.panel(p1.key)!.index, 'panel 1 has no index');
      // @ts-ignore
      assert.isUndefined(transaction.state.panel(p2.key)!.index, 'panel 2 has no index');
    });

    it('ignores items without definitions', () => {
      panel.items.push({
        key: 'i1',
        type: LayoutObjectType.item,
      });
      panel[decreaseItemIndex](1);
      // no error
    });

    it('decreases indexes from the passed index', () => {
      const i1 = panel.addItem();
      const i2 = panel.addItem();
      const i3 = panel.addItem();
      panel[decreaseItemIndex](1);
      assert.equal(panel.getPanelObject(i1.key)!.index, 0);
      assert.equal(panel.getPanelObject(i2.key)!.index, 0);
      assert.equal(panel.getPanelObject(i3.key)!.index, 1);
    });

    it('ignores index out-of-bounds', () => {
      const i1 = panel.addItem();
      const i2 = panel.addItem();
      const i3 = panel.addItem();
      panel[decreaseItemIndex](5);
      assert.equal(panel.getPanelObject(i1.key)!.index, 0);
      assert.equal(panel.getPanelObject(i2.key)!.index, 1);
      assert.equal(panel.getPanelObject(i3.key)!.index, 2);
    });
  });

  describe('[increaseItemIndex]()', () => {
    let state: State;
    let transaction: Transaction;
    let panel: TransactionalPanel;

    beforeEach(() => {
      state = new State();
      transaction = new Transaction(state);
      panel = transaction.add({ key: 'root' });
    });

    it('ignores panels', () => {
      const p1 = panel.addPanel();
      const p2 = panel.addPanel();
      panel[increaseItemIndex](1);
      // @ts-ignore
      assert.isUndefined(transaction.state.panel(p1.key)!.index, 'panel 1 has no index');
      // @ts-ignore
      assert.isUndefined(transaction.state.panel(p2.key)!.index, 'panel 2 has no index');
    });

    it('ignores items without definitions', () => {
      panel.items.push({
        key: 'i1',
        type: LayoutObjectType.item,
      });
      panel[increaseItemIndex](1);
      // no error
    });

    it('increases indexes from the passed index', () => {
      const i1 = panel.addItem();
      const i2 = panel.addItem();
      const i3 = panel.addItem();
      panel[increaseItemIndex](1);
      assert.equal(panel.getPanelObject(i1.key)!.index, 0);
      assert.equal(panel.getPanelObject(i2.key)!.index, 2);
      assert.equal(panel.getPanelObject(i3.key)!.index, 3);
    });

    it('ignores index out-of-bounds', () => {
      const i1 = panel.addItem();
      const i2 = panel.addItem();
      const i3 = panel.addItem();
      panel[increaseItemIndex](5);
      assert.equal(panel.getPanelObject(i1.key)!.index, 0);
      assert.equal(panel.getPanelObject(i2.key)!.index, 1);
      assert.equal(panel.getPanelObject(i3.key)!.index, 2);
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

    it('moves the item to the end', () => {
      const i1 = panel.addItem();
      const i2 = panel.addItem();
      const i3 = panel.addItem();
      panel.move(i1.key);
      assert.equal(panel.getPanelObject(i1.key)!.index, 2, 'the item is moved to the end');
      assert.equal(panel.getPanelObject(i2.key)!.index, 0, 'item 2 is now first');
      assert.equal(panel.getPanelObject(i3.key)!.index, 1, 'item 3 is now second');
    });

    it('moves the item to a specific index', () => {
      const i1 = panel.addItem();
      const i2 = panel.addItem();
      const i3 = panel.addItem();
      panel.move(i2.key, { index: 0 });
      assert.equal(panel.getPanelObject(i1.key)!.index, 1, 'item 1 is moved to position 2');
      assert.equal(panel.getPanelObject(i2.key)!.index, 0, 'item 2 is moved to position 0');
      assert.equal(panel.getPanelObject(i3.key)!.index, 2, 'item 3 stays in the same place');
    });

    it('moves the item to the east region', () => {
      const i1 = panel.addItem();
      const i2 = panel.addItem();
      const i3 = panel.addItem();
      panel.move(i2.key, { region: SplitRegion.east });
      const [p1i, p2i] = panel.items;
      const p1 = transaction.state.panel(p1i.key)!;
      const p2 = transaction.state.panel(p2i.key)!;
      assert.equal(p1.items[0].key, i1.key, 'item 1 is in the west region');
      assert.equal(p1.items[1].key, i3.key, 'item 3 is in the west region');
      assert.equal(p2.items[0].key, i2.key, 'item 2 is in the east region');
      assert.equal(p1.getPanelObject(i1.key)!.index, 0, 'item 1 has unchanged index');
      assert.equal(p2.getPanelObject(i2.key)!.index, 0, 'item 2 has new index');
      assert.equal(p1.getPanelObject(i3.key)!.index, 1, 'item 3 has decreased index');
    });

    it('moves the item to the west region', () => {
      const i1 = panel.addItem();
      const i2 = panel.addItem();
      const i3 = panel.addItem();
      panel.move(i2.key, { region: SplitRegion.west });
      const [p1i, p2i] = panel.items;
      const p1 = transaction.state.panel(p1i.key)!;
      const p2 = transaction.state.panel(p2i.key)!;
      assert.equal(p2.items[0].key, i1.key, 'item 1 is in the east region');
      assert.equal(p2.items[1].key, i3.key, 'item 3 is in the east region');
      assert.equal(p1.items[0].key, i2.key, 'item 2 is in the west region');
      assert.equal(p2.getPanelObject(i1.key)!.index, 0, 'item 1 has unchanged index');
      assert.equal(p2.getPanelObject(i3.key)!.index, 1, 'item 3 has decreased index');
      assert.equal(p1.getPanelObject(i2.key)!.index, 0, 'item 2 has new index');
    });

    it('moves the item to the north region', () => {
      const i1 = panel.addItem();
      const i2 = panel.addItem();
      const i3 = panel.addItem();
      panel.move(i2.key, { region: SplitRegion.north });
      const [p1i, p2i] = panel.items;
      const p1 = transaction.state.panel(p1i.key)!;
      const p2 = transaction.state.panel(p2i.key)!;
      assert.equal(p2.items[0].key, i1.key, 'item 1 is in the south region');
      assert.equal(p2.items[1].key, i3.key, 'item 3 is in the south region');
      assert.equal(p1.items[0].key, i2.key, 'item 2 is in the north region');
      assert.equal(p2.getPanelObject(i1.key)!.index, 0, 'item 1 has unchanged index');
      assert.equal(p2.getPanelObject(i3.key)!.index, 1, 'item 3 has decreased index');
      assert.equal(p1.getPanelObject(i2.key)!.index, 0, 'item 2 has new index');
    });

    it('moves the item to the south region', () => {
      const i1 = panel.addItem();
      const i2 = panel.addItem();
      const i3 = panel.addItem();
      panel.move(i2.key, { region: SplitRegion.south });
      const [p1i, p2i] = panel.items;
      const p1 = transaction.state.panel(p1i.key)!;
      const p2 = transaction.state.panel(p2i.key)!;
      assert.equal(p1.items[0].key, i1.key, 'item 1 is in the north region');
      assert.equal(p1.items[1].key, i3.key, 'item 3 is in the north region');
      assert.equal(p2.items[0].key, i2.key, 'item 2 is in the south region');
      assert.equal(p1.getPanelObject(i1.key)!.index, 0, 'item 1 has unchanged index');
      assert.equal(p1.getPanelObject(i3.key)!.index, 1, 'item 3 has decreased index');
      assert.equal(p2.getPanelObject(i2.key)!.index, 0, 'item 2 has new index');
    });

    it('does not move to a region when only one item', () => {
      const i1 = panel.addItem();
      panel.move(i1.key, { region: SplitRegion.south });
      assert.equal(panel.items[0].key, i1.key, 'item 1 is not changed');
    });

    it('keeps the item in the center', () => {
      const i1 = panel.addItem();
      const i2 = panel.addItem();
      const i3 = panel.addItem();
      panel.move(i2.key, { region: SplitRegion.center });
      assert.equal(panel.items[0].key, i1.key, 'item 1 is not changed');
      assert.equal(panel.items[1].key, i2.key, 'item 2 is not changed');
      assert.equal(panel.items[2].key, i3.key, 'item 3 is not changed');
    });

    it('selects the next item on the panel', () => {
      panel.addItem();
      const i2 = panel.addItem();
      const i3 = panel.addItem();
      panel.selected = i2.key;
      panel.move(i2.key, { region: SplitRegion.south });
      const [p1i] = panel.items;
      const p1 = transaction.state.panel(p1i.key)!;
      assert.equal(p1.selected, i3.key);
    });

    it('selects the previous item on the panel', () => {
      panel.addItem();
      const i2 = panel.addItem();
      const i3 = panel.addItem();
      panel.selected = i3.key;
      panel.move(i3.key, { region: SplitRegion.south });
      const [p1i] = panel.items;
      const p1 = transaction.state.panel(p1i.key)!;
      assert.equal(p1.selected, i2.key);
    });

    it('throws when no item found', () => {
      assert.throws(() => {
        panel.move('test', { region: SplitRegion.east });
      });
    });

    it('throws when no item definition found', () => {
      panel.items = [{ key: 'test', type: LayoutObjectType.item }];
      assert.throws(() => {
        panel.move('test', { region: SplitRegion.east });
      });
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
      const p1 = panel.addPanel({ key: 'p1' });
      p1.update({ key: 'p2' });
      assert.equal(p1.key, 'p1');
    });

    it('does not update the items', () => {
      const p1 = panel.addPanel();
      p1.items = [{ key: 'a', type: LayoutObjectType.item }];
      p1.update({ items: [] });
      assert.isNotEmpty(p1.items);
    });

    it('does not update the type', () => {
      const p1 = panel.addPanel();
      p1.update({ type: LayoutObjectType.item });
      assert.equal(p1.type, LayoutObjectType.panel);
    });

    it('does not update when the value is set ', () => {
      const p1 = panel.addPanel({ state: PanelState.busy });
      p1.update({ state: PanelState.busy }); // it's for coverage
    });

    it('updates other properties ', () => {
      const p1 = panel.addPanel({ state: PanelState.idle });
      p1.update({ state: PanelState.busy });
      assert.equal(p1.state, PanelState.busy);
    });
  });

  describe('addPanel()', () => {
    let state: State;
    let transaction: Transaction;
    let panel: TransactionalPanel;

    beforeEach(() => {
      state = new State();
      transaction = new Transaction(state);
      panel = transaction.add({ key: 'root' });
    });

    it('ignores panel type', () => {
      const p1 = panel.addPanel({ type: LayoutObjectType.item });
      assert.equal(p1.type, LayoutObjectType.panel);
    });

    it('ignores panel the items', () => {
      const p1 = panel.addPanel({ items: [{ key: 'a', type: LayoutObjectType.item }] });
      assert.isEmpty(p1.items);
    });

    it('throws when the panel has items', () => {
      panel.addItem();
      assert.throws(() => {
        panel.addPanel();
      });
    });

    it('adds the panel to the items', () => {
      const p1 = panel.addPanel();
      const [item] = panel.items;
      assert.equal(item.key, p1.key, 'sets the key');
      assert.equal(item.type, p1.type, 'sets the type');
    });

    it('adds the panel to the definitions', () => {
      const p1 = panel.addPanel();
      const item = transaction.state.definitions.get(p1.key)!;
      assert.deepEqual(item.value, p1);
    });
  });

  describe('addItem()', () => {
    describe('east region', () => {
      let state: State;
      let transaction: Transaction;
      let panel: TransactionalPanel;

      beforeEach(() => {
        state = new State();
        transaction = new Transaction(state);
        panel = transaction.add({ key: 'root' });
        panel.addItem({ key: 'pre' });
      });

      it('splits the layout horizontally', () => {
        panel.addItem({ key: 'i1' }, { region: SplitRegion.east });
        assert.equal(panel.direction, LayoutDirection.horizontal);
      });

      it('adds 2 split panels as items', () => {
        panel.addItem({ key: 'i1' }, { region: SplitRegion.east });
        const [p1, p2] = panel.items;
        assert.ok(p1, 'has the first panel');
        assert.ok(p2, 'has the second panel');
        assert.equal(p1.type, LayoutObjectType.panel, '#1 has the panel type')
        assert.equal(p2.type, LayoutObjectType.panel, '#2 has the panel type')
      });

      it('moves the existing items to the first panel', () => {
        panel.addItem({ key: 'i1' }, { region: SplitRegion.east });
        const [p1] = panel.items;
        const def = transaction.state.panel(p1.key)!;
        assert.lengthOf(def.items, 1, 'the panel has an item');
        assert.equal(def.items[0].key, 'pre', 'the panel has the moved item');
      });

      it('adds the new item to the other panel', () => {
        const i1 = panel.addItem({ key: 'i1' }, { region: SplitRegion.east });
        const [, p2] = panel.items;
        const def = transaction.state.panel(p2.key)!;
        assert.lengthOf(def.items, 1, 'the panel has an item');
        assert.equal(def.items[0].key, i1.key, 'the panel has the created item');
      });
    });

    describe('west region', () => {
      let state: State;
      let transaction: Transaction;
      let panel: TransactionalPanel;

      beforeEach(() => {
        state = new State();
        transaction = new Transaction(state);
        panel = transaction.add({ key: 'root' });
        panel.addItem({ key: 'pre' });
      });

      it('splits the layout horizontally', () => {
        panel.addItem({ key: 'i1' }, { region: SplitRegion.west });
        assert.equal(panel.direction, LayoutDirection.horizontal);
      });

      it('adds 2 split panels as items', () => {
        panel.addItem({ key: 'i1' }, { region: SplitRegion.west });
        const [p1, p2] = panel.items;
        assert.ok(p1, 'has the first panel');
        assert.ok(p2, 'has the second panel');
        assert.equal(p1.type, LayoutObjectType.panel, '#1 has the panel type')
        assert.equal(p2.type, LayoutObjectType.panel, '#2 has the panel type')
      });

      it('moves the existing items to the second panel', () => {
        panel.addItem({ key: 'i1' }, { region: SplitRegion.west });
        const [, p2] = panel.items;
        const def = transaction.state.panel(p2.key)!;
        assert.lengthOf(def.items, 1, 'the panel has an item');
        assert.equal(def.items[0].key, 'pre', 'the panel has the moved item');
      });

      it('adds the new item to the other panel', () => {
        const i1 = panel.addItem({ key: 'i1' }, { region: SplitRegion.west });
        const [p1] = panel.items;
        const def = transaction.state.panel(p1.key)!;
        assert.lengthOf(def.items, 1, 'the panel has an item');
        assert.equal(def.items[0].key, i1.key, 'the panel has the created item');
      });
    });

    describe('south region', () => {
      let state: State;
      let transaction: Transaction;
      let panel: TransactionalPanel;

      beforeEach(() => {
        state = new State();
        transaction = new Transaction(state);
        panel = transaction.add({ key: 'root' });
        panel.addItem({ key: 'pre' });
      });

      it('splits the layout vertical', () => {
        panel.addItem({ key: 'i1' }, { region: SplitRegion.south });
        assert.equal(panel.direction, LayoutDirection.vertical);
      });

      it('adds 2 split panels as items', () => {
        panel.addItem({ key: 'i1' }, { region: SplitRegion.south });
        const [p1, p2] = panel.items;
        assert.ok(p1, 'has the first panel');
        assert.ok(p2, 'has the second panel');
        assert.equal(p1.type, LayoutObjectType.panel, '#1 has the panel type')
        assert.equal(p2.type, LayoutObjectType.panel, '#2 has the panel type')
      });

      it('moves the existing items to the first panel', () => {
        panel.addItem({ key: 'i1' }, { region: SplitRegion.south });
        const [p1] = panel.items;
        const def = transaction.state.panel(p1.key)!;
        assert.lengthOf(def.items, 1, 'the panel has an item');
        assert.equal(def.items[0].key, 'pre', 'the panel has the moved item');
      });

      it('adds the new item to the other panel', () => {
        const i1 = panel.addItem({ key: 'i1' }, { region: SplitRegion.south });
        const [, p2] = panel.items;
        const def = transaction.state.panel(p2.key)!;
        assert.lengthOf(def.items, 1, 'the panel has an item');
        assert.equal(def.items[0].key, i1.key, 'the panel has the created item');
      });
    });

    describe('north region', () => {
      let state: State;
      let transaction: Transaction;
      let panel: TransactionalPanel;

      beforeEach(() => {
        state = new State();
        transaction = new Transaction(state);
        panel = transaction.add({ key: 'root' });
        panel.addItem({ key: 'pre' });
      });

      it('splits the layout vertical', () => {
        panel.addItem({ key: 'i1' }, { region: SplitRegion.north });
        assert.equal(panel.direction, LayoutDirection.vertical);
      });

      it('adds 2 split panels as items', () => {
        panel.addItem({ key: 'i1' }, { region: SplitRegion.north });
        const [p1, p2] = panel.items;
        assert.ok(p1, 'has the first panel');
        assert.ok(p2, 'has the second panel');
        assert.equal(p1.type, LayoutObjectType.panel, '#1 has the panel type')
        assert.equal(p2.type, LayoutObjectType.panel, '#2 has the panel type')
      });

      it('moves the existing items to the other panel', () => {
        panel.addItem({ key: 'i1' }, { region: SplitRegion.north });
        const [, p2] = panel.items;
        const def = transaction.state.panel(p2.key)!;
        assert.lengthOf(def.items, 1, 'the panel has an item');
        assert.equal(def.items[0].key, 'pre', 'the panel has the moved item');
      });

      it('adds the new item to the first panel', () => {
        const i1 = panel.addItem({ key: 'i1' }, { region: SplitRegion.north });
        const [p1] = panel.items;
        const def = transaction.state.panel(p1.key)!;
        assert.lengthOf(def.items, 1, 'the panel has an item');
        assert.equal(def.items[0].key, i1.key, 'the panel has the created item');
      });
    });

    describe('center region', () => {
      let state: State;
      let transaction: Transaction;
      let panel: TransactionalPanel;

      beforeEach(() => {
        state = new State();
        transaction = new Transaction(state);
        panel = transaction.add({ key: 'root' });
      });

      it('ignores the type', () => {
        const i1 = panel.addItem({ type: LayoutObjectType.panel });
        assert.equal(i1.type, LayoutObjectType.item);
      });

      it('throws when the panel has panels', () => {
        panel.addPanel();
        assert.throws(() => {
          panel.addItem();
        });
      });

      it('adds the item to the items', () => {
        const i1 = panel.addItem();
        const [item] = panel.items;
        assert.equal(item.key, i1.key, 'sets the key');
        assert.equal(item.type, i1.type, 'sets the type');
      });

      it('adds the item to the definitions', () => {
        const i1 = panel.addItem();
        const item = transaction.state.definitions.get(i1.key)!;
        assert.deepEqual(item.value, i1);
      });

      it('creates a linked item when adding the same item to another panel', () => {
        const p1 = panel.addPanel();
        const p2 = panel.addPanel();
        const i1 = p1.addItem();
        const i2 = p2.addItem(i1);
        assert.equal(i1.key, i2.key, 'definition items have the same key');
        const p1Object = p1.getPanelObject(i1.key)!;
        const p2Object = p2.getPanelObject(i2.key)!;
        assert.deepEqual(p1Object, p2Object, 'created panel items are the same');
      });

      it('creates a linked with an index', () => {
        const p1 = panel.addPanel();
        const p2 = panel.addPanel();
        const i1 = p1.addItem();
        p2.addItem();
        const i3 = p2.addItem(i1);
        assert.equal(i1.key, i3.key, 'definition items have the same key');
        const p1Object = p1.getPanelObject(i1.key)!;
        const p2Object = p2.getPanelObject(i3.key)!;
        assert.equal(p1Object.key, p2Object.key, 'created panel items have the same keys');
        assert.equal(p1Object.index, 0, 'item 1 has index 0');
        assert.equal(p2Object.index, 1, 'item 3 has index 1');
      });

      it('uses the passed key', () => {
        const i1 = panel.addItem({ key: 'i1' });
        assert.equal(i1.key, 'i1');
      });

      it('selects the item when already on the panel', () => {
        const i1 = panel.addItem();
        panel.addItem();
        panel.addItem(i1);
        assert.equal(panel.selected, i1.key);
      });

      it('adds an item to a region', () => {
        const i1 = panel.addItem();
        const i2 = panel.addItem();
        const i3 = panel.addItem({}, { region: SplitRegion.east });
        const [p1i, p2i] = panel.items;
        const p1 = transaction.state.panel(p1i.key)!;
        const p2 = transaction.state.panel(p2i.key)!;
        assert.equal(p1.items[0].key, i1.key, 'item 1 is in the west region');
        assert.equal(p1.items[1].key, i2.key, 'item 2 is in the west region');
        assert.equal(p2.items[0].key, i3.key, 'item 3 is in the east region');
        assert.equal(p1.getPanelObject(i1.key)!.index, 0, 'item 1 has index = 0');
        assert.equal(p1.getPanelObject(i2.key)!.index, 1, 'item 2 has index = 1');
        assert.equal(p2.getPanelObject(i3.key)!.index, 0, 'item 3 has index = 0');
      });

      it('adds an item to a specific index', () => {
        const i1 = panel.addItem();
        const i2 = panel.addItem();
        const i3 = panel.addItem({}, { index: 1 });
        assert.equal(panel.getPanelObject(i1.key)!.index, 0, 'item 1 is unchanged');
        assert.equal(panel.getPanelObject(i2.key)!.index, 2, 'item 2 increased index');
        assert.equal(panel.getPanelObject(i3.key)!.index, 1, 'item 3 has the set index');
      });

      it('sets the item selected', () => {
        const i1 = panel.addItem();
        assert.equal(panel.selected, i1.key);
        const i2 = panel.addItem();
        assert.equal(panel.selected, i2.key);
      });
    });
  });

  describe('nextIndex()', () => {
    let state: State;
    let transaction: Transaction;
    let panel: TransactionalPanel;

    beforeEach(() => {
      state = new State();
      transaction = new Transaction(state);
      panel = transaction.add({ key: 'root' });
    });

    it('sets the index when no items', () => {
      const result = panel[nextIndex]();
      assert.equal(result, 0);
    });

    it('sets the next available index', () => {
      panel.addItem({ key: 'i1' });
      const result = panel[nextIndex]();
      assert.equal(result, 1);
    });

    it('sets the next available index with a gap', () => {
      const i1 = panel.addItem({ key: 'i1' });
      panel.getPanelObject(i1.key)!.index = 4;
      const result = panel[nextIndex]();
      assert.equal(result, 0);
    });

    it('returns the index after multiple items', () => {
      const i1 = panel.addItem({ key: 'i1' });
      panel.getPanelObject(i1.key)!.index = 0;
      const i2 = panel.addItem({ key: 'i2' });
      panel.getPanelObject(i2.key)!.index = 1;
      const i3 = panel.addItem({ key: 'i3' });
      panel.getPanelObject(i3.key)!.index = 2;
      const result = panel[nextIndex]();
      assert.equal(result, 3);
    });

    it('returns the index with a gap', () => {
      const i1 = panel.addItem({ key: 'i1' });
      panel.getPanelObject(i1.key)!.index = 0;
      const i2 = panel.addItem({ key: 'i2' });
      panel.getPanelObject(i2.key)!.index = 2;
      const i3 = panel.addItem({ key: 'i3' });
      panel.getPanelObject(i3.key)!.index = 3;
      const result = panel[nextIndex]();
      assert.equal(result, 1);
    });
  });

  describe('closeRelative()', () => {
    let state: State;
    let transaction: Transaction;
    let panel: TransactionalPanel;
    let items: TransactionalItem[];

    beforeEach(() => {
      state = new State();
      transaction = new Transaction(state);
      panel = transaction.add({ key: 'root' });
      items = new Array(5).fill('').map((_, index) => {
        const item = panel.addItem({ key: `i${index}`, label: `i${index}`, });
        return item;
      });
    });

    it('removes items to the left', () => {
      panel.closeRelative(items[2].key, TabCloseDirection.left);
      assert.lengthOf(panel.items, 3, 'has 3 remaining items');
      assert.equal(panel.items[0].key, items[2].key, 'leaves the item');
      assert.equal(panel.items[1].key, items[3].key, 'has the right item #1');
      assert.equal(panel.items[2].key, items[4].key, 'has the right item #2');
    });

    it('removes items to the right', () => {
      panel.closeRelative(items[2].key, TabCloseDirection.right);
      assert.lengthOf(panel.items, 3, 'has 3 remaining items');
      assert.equal(panel.items[0].key, items[0].key, 'has the left item #1');
      assert.equal(panel.items[1].key, items[1].key, 'has the left item #2');
      assert.equal(panel.items[2].key, items[2].key, 'leaves the item');
    });

    it('removes items on the both sides', () => {
      panel.closeRelative(items[2].key, TabCloseDirection.both);
      assert.lengthOf(panel.items, 1, 'has single item');
      assert.equal(panel.items[0].key, items[2].key, 'leaves the item');
    });

    it('does not remove items on the left when selecting first item', () => {
      panel.closeRelative(items[4].key, TabCloseDirection.right);
      assert.lengthOf(panel.items, 5, 'has all items');
    });

    it('does not remove items on the right when selecting first item', () => {
      panel.closeRelative(items[0].key, TabCloseDirection.left);
      assert.lengthOf(panel.items, 5, 'has all items');
    });

    it('removes definitions for removed items', () => {
      panel.closeRelative(items[1].key, TabCloseDirection.both);
      assert.isUndefined(transaction.state.definitions.get(items[0].key), 'has no item on the left');
      assert.isUndefined(transaction.state.definitions.get(items[2].key), 'has no item on the right');
      assert.ok(transaction.state.definitions.get(items[1].key), 'has the item');
    });
  });

  describe('unSplit()', () => {
    let state: State;
    let transaction: Transaction;
    let panel: TransactionalPanel;

    beforeEach(() => {
      state = new State();
      transaction = new Transaction(state);
      panel = transaction.add({ key: 'root' });
    });

    it('does nothing to the root panel', () => {
      panel.unSplit();
      assert.equal(transaction.state.items[0].key, panel.key);
    });

    it('moves items from child panes to the panel', () => {
      const p1 = panel.addPanel();
      const i1 = p1.addItem();
      panel.unSplit();
      assert.lengthOf(panel.items, 1, 'the root panel has one item');
      assert.equal(panel.items[0].type, LayoutObjectType.item, 'the item was moved to the parent panel');
      assert.equal(panel.items[0].key, i1.key, 'has the moved item');
    });

    it('moves items from all panels', () => {
      const p1 = panel.addPanel();
      const p2 = panel.addPanel();
      const i1 = p1.addItem();
      const i2 = p2.addItem();
      panel.unSplit();
      assert.lengthOf(panel.items, 2, 'the root panel has one item');
      assert.equal(panel.items[0].type, LayoutObjectType.item, 'item 1 was moved to the parent panel');
      assert.equal(panel.items[0].key, i1.key, 'item 1 was moved');
      assert.equal(panel.items[1].type, LayoutObjectType.item, 'item 2 was moved to the parent panel');
      assert.equal(panel.items[1].key, i2.key, 'item 2 was moved');
    });

    it('removes panel definitions', () => {
      const p1 = panel.addPanel();
      const p2 = panel.addPanel();
      panel.unSplit();
      assert.isNull(transaction.state.panel(p1.key), 'panel 1 was removed');
      assert.isNull(transaction.state.panel(p2.key), 'panel 1 was removed');
    });

    it('sets the last item selected', () => {
      const p1 = panel.addPanel();
      const p2 = panel.addPanel();
      p1.addItem();
      const i2 = p2.addItem();
      panel.unSplit();
      assert.equal(panel.selected, i2.key);
    });
  });
});
