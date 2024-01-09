# Supporting Drag and Drop

The Manager can support drag and drop of external items. This way, you can program an interaction where the user can drop an element into a split panel and add a new item to that panel. To support that, you should pass the configuration option to the `Manager` with all mime types that the dragged element must have to be accepted by the layout. This is optional though and is only used to limit the number of items the layout is interaction with.

```ts
const layout = new Manager(state, {
  // only items with the following types set on the DataTransfer object are accepted.
  dragTypes: ['item/kind', 'item/key'],
});
```

Then, inside your application, code in a behavior for drag and drop that adds these values to the layout. The layout won't accept dragged objects that do not have these mime types.

```ts
// in your application, say in a tree view of a filesystem.

handleDragStart(e: DragEvent): void {
  const { dataTransfer } = e;
  const target = e.target as HTMLElement;
  const { key, kind } = target.dataset; // suppose these are set on the dragged element.
  dataTransfer.setData('item/kind', kind);
  dataTransfer.setData('item/key', key);
  dataTransfer.setData('item/custom', JSON.stringify({ kind: 'abc' }));
  dataTransfer.effectAllowed = 'copyMove';
}
```

An element prepared this way when the drag starts will be accepted as an item of the layout. 

You may notice that the Manager will insert a new tab with a default label. For that, the State will dispatch the `created` event to the hosting application. It is dispatched when a new item is added to the transaction. Mind, that for convenience, the event is dispatched from the Manager's state, not transaction's.

You can cancel the event to indicate that the item should not be added to the layout, or you can update the state of the created item. The CustomEvent contains an item within a transaction.

```ts
// the detail object is generated dynamically, based on the `dragTypes` property.
layout.addEventListener('created', (e: CustomEvent<TransactionalItem>) => {
  const item = e.detail;
  if (item.key !== 'my-expected-key') {
    e.preventDefault();
    return;
  }
  item.update({ label: 'My item' });
});
```

## Custom Data

An item can have custom data set by the drag and drop operation. Any serialized value set under the `item/custom` type of the `DataTransfer` object (see above) will automatically be used to populate the item's `custom` property.

```ts
// during the dragstart event 
dataTransfer.setData('item/custom', JSON.stringify({ kind: 'abc' })); 
```

```ts
layout.addEventListener('created', (e: CustomEvent<TransactionalItem>) => {
  const item = e.detail;
  if (item.custom.kind !== 'my-expected-kind') {
    e.preventDefault();
    return;
  }
  item.update({ label: 'My kind' });
});
```
