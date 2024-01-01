# Tabs layout

It is a library to create a split layout with tabs. Think of it as a library for VScode's split layout. It's the same concept but is OSS and has pluggable architecture.

- Minimal dependencies (depends on the `lit` library)
- Supports types (written in TypeScript)
- General purpose - it makes no assumptions about the content
- Open source - install and use, regardless of the type of the project.

## Installation

```sh
npm i -S @pawel-up/tabs-split-layout
```

## Usage

The library consists of two primary objects: the state and the layout. Use the state object to manipulate the number of rendered panels, the direction of each panel, and the rendered tabs in each panel. The layout manager renders panels and handles user interactions (drag and drop, closing tabs, moving panels, etc).

### State Initialization

Initialize the state object as empty or restore the previously stored state. The state object is serializable by the `JSON.stringify()` function.

```ts
import { State, Manager, render, html, TemplateResult, SerializedState, StateEvent } from '@pawel-up/tabs-split-layout';

const storeKey = 'app.layout';
let init: SerializedState | undefined;
const stored = localStore.getItem(storeKey);
if (stored) {
  init = JSON.parse(stored);
}
const state = new State(init);
```

You can initialize the State class without data, rendering an empty layout. You can pass the previously stored state to the constructor to restore a state.

### Manager Initialization

When initializing the manager, you must pass the `State` class instance as the first argument. The second parameter is the configuration options, if any.

```ts
const layout = new Manager(state, {
  // ...
});
```

### Rendering the Layout

Under the hood, the library uses the `lit` library as the rendering engine. That means the rendering process returns the `TemplateResult` instance from the `lit` library. You can use the `render()` function from the `lit` library to render the content into the DOM. This library exports the lit's `render` function so that you can import it from the same library. However, if your application already uses `lit` as the rendering engine, you just need to produce templates and return them with the normal rendering process.

```ts
function renderLayout(): void {
  const templates = layout.render((item: Item, visible: boolean) => {
    switch (item.kind) {
      default: 
        return html`<p 
          ?hidden="${!visible}" 
          data-key="${item.key}"
        >Rendering: ${item.label} ${item.kind} ${item.key}</p>`;
    }
  });
  // For non-lit rendering you can use the render() function.
  // The second argument is the node where the content should be rendered.
  render(templates, document.body);
}
```

It is up to you to decide how to render the content in the DOM. For example, remove a tab content not visible to the user to release memory. On the other hand, keep it in the DOM so you don't need to initialize the content when the tab becomes visible again. It's a fight between memory management and the performance.

Note, do not hold a reference to the `item` anywhere outside the render function. The layout may recreate this item any time or remove it. If you hold a reference to the item you may have access to stale data and you will prohibit the garbage collector from releasing the memory creating a memory leak.

### The Render Event

There are many situations where the manager will ask the hosting application to re-render the layout content, such as when the user closes a tab, rearranges tabs, drags and drops a new content, moves a tab from one layout to another, and so on. Since the manager does not render the content into the DOM, the application has to call its rendering process to update the view. In such situations, the manager dispatches the `render` event. Handle this event and perform the DOM update.

```ts
layout.addEventListener('render', () => {
  renderLayout();
});
```

Note that I made the library work this way so the library performs a minimal number of updates and the hosting application is in complete control of when the DOM update is performed.

### Auto Rendering

Suppose you don't care about how and when the content of the layout is rendered. In that case, you can pass the configuration option to the manager, providing a reference to the parent element or the CSS selector to the parent element within the same document root. The manager will then perform all of the above tasks for you.

```ts
const layout = new Manager(state, {
  parent: '.layout',
  render: (item: SplitItem, visible: boolean): TemplateResult => { ... },
});
```

You still need to provide the function rendering each layout's content.

## State Management

### Reacting to State Changes

The state can change outside of your code's control through user interaction. To store the state, you should add an event listener to the manager, like the following:

```ts
layout.addEventListener('change', (e: StateEvent) => {
  const { state } = e; // the instance of the state, if needed.
  localStorage.setItem(storeKey, JSON.stringify(state));
});
```

### Changing the State

Consider the state as an immutable object. Changing any property of the `State` object won't trigger any change in the UI. It would be transparent to the manager instance or the state and could produce unexpected results.

Instead, find an item you want to update, make a clone of it, change its properties, create the update transaction, and commit the changes through the manager.

```ts
const transaction = state.transaction();
const item = transaction.get('1');  // returns an item for the given key.
item.label = 'Other label';
layout.commit(transaction);
```

A new state description is created as a copy of the current state when completing a transaction. So far, everything has stayed the same in the current state and the manager. When you call the `layout.commit(transaction)` function, the new state is unpacked and replaces the old state. The original reference to the `state` is still valid but would have an updated state description. After the `commit()` function is called, the manager dispatches the `render` event so your application can re-render the layout.

### Adding an Item

To add an item to a panel (a layout that renders tabs and not other panels), you call the `add()` on that panel.

```ts
const { currentPanel } = state; // the currently (or last) focused panel.
const transaction = currentPanel.add({ key: '2', ... });
layout.commit(transaction);
```

### Removing an Item From a Layout

You can add the same item to multiple layouts, but a layout can only render one item with the same `key.` Because of that, make sure you remove an item through its parent layout, not the item itself. Removing an item from a panel would only remove the item from that layout. However, removing an item through the item handle will remove the item from all panels.

```ts
// Adding an item to multiple panels.
const item = { key: '3', ... };
const { panels } = state;
const transactions = panels.map((panel) => panel.add(item));
layout.commit(transactions);
```

Only a single `item` is inserted into the internal state during the `commit` phase. If you open the same item in each split layout, you will get the same reference to the item object when rendering the DOM. While you must render the markup for that item multiple times, essentially, the same state is propagated to these views.

```ts
// Removing an item from a single panel.
const panel = state.get('panel-2');
const transaction = panel.removeChild('3');
layout.commit(transaction);
```

## Supporting Drag and Drop

The Manager can support drag and drop of external to the state items. This way, you can program an interaction where the user can drop an element into a split panel and add a new item to that panel. To support that, you should pass the configuration option to the `Manager` with all mime types that the dragged element must have to be accepted by the layout.

```ts
const layout = new Manager(state, {
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
  dataTransfer.effectAllowed = 'copyMove';
}
```

An element prepared this way when the drag starts will be accepted as an item of the layout. But now you may notice that the Manager will insert a new tab, but the tab will need the proper label or an icon. For that, the Manager has dispatched the `drop` event to the hosting application.

You can cancel the event to indicate that the item should not be added to the layout, or you can update the state.

```ts
// the detail object is generated dynamically, based on the `dragTypes` property.
layout.addEventListener('drop', (e: CustomEvent<{ info: Record<'item/kind' | 'item/key', string>}>) => {
  const { info } = e.detail;
  const kind = info['item/kind'];
  if (kind !== 'my-expected-kind') {
    e.preventDefault();
    return;
  }
  const key = info['item/key'];
  const item = state.get(key)?.clone();
  item.label = 'My item';
  const transaction = state.update(item);
  layout.commit(transaction);
});
```

## Contributing

You are welcome to contribute to the library. I'll be happy to review pull requests from the community. Just remember to always write tests for whatever you are doing.
