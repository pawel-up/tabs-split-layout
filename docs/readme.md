# Installation

The library is available on NPM.

```sh
npm i -S @pawel-up/tabs-split-layout
```

## Core Concepts

### State

The state represents the current layout structure. It can be modified through a transaction.

### Transaction

By default you should not modify the state object by directly changing it's properties. The effect of such changed won't be represented in the view and won't trigger lifecycle methods, including dispatching events to the hosting application. Instead, we introduced transactions.

A transaction is a modified State object that has methods that allow you change the current state. After a transaction is committed the lifecycle methods are triggered, the state is actually updated, and the view is rendered again.

### Panel

A panel is a part of the layout that holds items. A panels is a split panel, that is, can host more panels in a horizontal or vertical direction configuration. A panel can host either other panels or items only.

### Item

An item represents a tab in a panel. In the layout system it just an information you use to generate a tab content when requested during the render phase. An item belongs to at least one panel. If an item is added to multiple panels the same state is shared between panels. The layout system knows nothing about the underlying content the item represents. The hosting application is responsible for rendering the content in the opened tab.

### Manager

The manager uses the State to render the view and to manage some interactions.

Next step: [Initialization](Initialization.md)
