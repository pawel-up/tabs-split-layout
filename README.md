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

The library consists of two primary objects: the state and the layout. Use the state object to manipulate the rendered panels, the direction of each panel, and the rendered tabs in each panel. The layout manager renders panels and handles user interactions (drag and drop, closing tabs, moving panels, etc).

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

See the detailed documentation in [the Initialization documentation](docs/Initialization.md).

### Rendering the Layout

See the detailed documentation in [the Rendering documentation](docs/rendering.md).

## State Management

See the detailed documentation in [the State Management documentation](docs/state.md).

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
