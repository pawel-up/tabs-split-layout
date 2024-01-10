# State Management

Manipulate the state through a transaction. It's a special kind of `Panel` or `Item` with methods that allow changing the state reflected in the DOM as efficiently as possible.

## Reacting to State Changes

The state can change outside of your code's control through user interaction. To store the state, you can add the `change` event listener to the manager, like the following:

```ts
layout.addEventListener('change', (e: StateEvent) => {
  const { state } = e; // the instance of the state, if needed.
  localStorage.setItem(storeKey, JSON.stringify(state));
  // note, for IDB, you would call `state.toJSON()` when inserting the state value.
});
```

### Changing the State

Consider the state as an immutable object. Changing any property of the `State` object won't trigger any change in the UI. The change would be transparent to the manager or the state itself and could produce unexpected results.

Instead, we introduced a `Transaction` that allows manipulating objects in the state.

```ts
const transaction = layout.transaction();
const panel = transaction.panel('panel-key');  // returns a panel for a given key.
panel.addItem({ key: 'item key', label: 'My item' });
transaction.commit();
```

First, we create a transaction. During this process, the state is copied as a new object that can be manipulated without triggering the render process. Then, we search for a panel by its key. The `.panel()` method on a `Transaction` object returns an instance of a panel with methods allowing you to manipulate the panel's properties and items. Here, we add an item (a tab) to the panel. Note that you can only add an item to a panel that has no other panels as children.

Finally, we `.commit()` the transaction. In this step, the changed state is copied back to the manager's state, and the render cycle is triggered. At the same time, the `change` event is dispatched so you can store the state.

### Adding an Item

To add an item to a panel (a layout that renders tabs and not other panels), you call the `addItem()` on that panel.

```ts
const activePanel = state.activePanel(); // the currently (or last) focused panel, or a panel that can host items.
// if the panel is not returned here it mens the layout is empty.
const transaction = layout.transaction();
let parent: TransactionalPanel;
if (activePanel) {
  parent = tx.state.panel(activePanel.key);
} else {
  parent = transaction.add();
}
const addedItem = parent.addItem({ label: 'My item' });
addedItem.update({ isDirty: true }); // this is just to show that you can change this item. Normally, you would do this in the line above.
transaction.commit();
```

### Removing an Item From a Layout

You can add the same item to multiple layouts, but a layout can only render one item with the same `key.` Because of that, make sure you remove an item through its parent layout, not the item itself. Removing an item from a panel would only remove the item from that layout. However, removing an item through the item handle will remove the item from all panels.

```ts
// Adding an item to multiple panels.
const transaction = layout.transaction();
const root = transaction.add(); // a root to split.
const left = root.add({ key: 'left' });
const right = root.add({ key: 'right' });
const item = { key: '3', label: 'I am the same' };
// the index is optional. When having multiple items you can move them around.
left.addItem(item, { index: 0 }); 
right.addItem(item);
transaction.commit();
```

Only one `item` is inserted into the internal state during the `commit` phase. If you open the same item in each split layout, you will get the same reference to the item object when rendering the DOM. While you must render the markup for that item multiple times, essentially, the same state is propagated to these views.

Note that the `index` and `pinned` properties of an `Item` are not stored within the `Item` instance as they are panel-dependent. Instead, it is stored within `Panel.items` array.

```ts
// Removing an item from one panel.
const transaction = layout.transaction();
const left = tx.state.panel('left');
left.removeItem('3');
transaction.commit();
```

```ts
// Removing an item from all panels.
const transaction = layout.transaction();
const item = tx.state.item('3');
item.remove();
transaction.commit();
```

## The StateHelper

From the previous example, you may notice that you have left with two empty layouts. With that, we can check whether these layouts have children and remove them. However, for common use cases we have the `StateHelper` class that deals with common scenarios.

### Removing an Item

Assuming we have added the same item to multiple panels but we want to remove the item from only one panel.

```ts
import { StateHelper } from '@pawel-up/tabs-split-layout';

StateHelper.removeItem(layout, 'item key', 'panel key');
```

That's it. It creates a transaction, removes an item, and removes empty panels. It also "un-splits" panels that have a single child as another panel.

The "panel key" argument is optional, and when not provided, it removes the item from all panels and the state.

### Selecting an Item on a Panel

You need to specify which panel you mean. We do not allow defaults here to avoid confusing you with what is happening.

```ts
StateHelper.selectItem(layout, 'item key', 'panel key');
```

### Moving an Item

An item can be moved within a panel or between them. In both cases, you can specify whether you want to move an item into a position (default behavior, moves an item to the end) or to a split region.

#### Moving Within a Single Panel

Let's start with moving an item within the same panel. If you specify the `index` option, the item only changes the index in the tab list.

```ts
StateHelper.moveItem(layout, 'panel key', 'panel key', 'item key', { index: 2 });
// this is the same as 
StateHelper.moveItemWithinPanel(layout, 'item key', 'panel key', { index: 2 });
```

All other indexes are also recalculated (increased or decreased depending on the direction) so you don't need to do this yourself.

#### Splitting a Panel

The power of this layout system is that you can easily split the layout into two by defining the target `region` where the item should be placed. YOu can choose between `west`, `east`, `north`, `south`, and `center`. The `center` is the default value and means that the move is without splitting the layout. Depending on the region, the layout is split horizontally (`west` and `east`) or vertically (`north` and `south`).

```ts
// split layout by moving the item to the east (right) panel.
StateHelper.moveItem(layout, 'panel key', 'panel key', 'item key', { region: 'east' });
// this is the same as 
StateHelper.moveItemWithinPanel(layout, 'item key', 'panel key', { region: 'east' });
```

This operation changes the structure of the panel by removing items from it, inserting two panels as children, and then distributing the items between the panels, as requested.

#### Moving Within Different Panels

For moving items between panels, you would use the `StateHelper.moveItem()` method, and you should then specify the source and the target panel.

```ts
// split layout by moving the item to the east (right) panel.
StateHelper.moveItem(layout, 'from panel', 'to panel', 'item key', { region: 'east', index: 1 });
// this is the same as 
StateHelper.moveItemBetweenPanels(layout, 'from panel', 'to panel', 'item key', { region: 'east', index: 1 });
```

### Creating an Item

```ts
const createdItem = StateHelper.createItem(layout, 'on panel', { label: 'test' }, { index: 1 });
```

The resulting `createdItem` is a reference to the created item after the transaction was committed. You can't use it to manipulate the item state.

Previous step: [Rendering](rendering.md)
Next step: [Drag and drop](dnd.md)
