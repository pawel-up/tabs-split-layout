# Initialization

The library consists of two primary objects: the state and the layout. Use the state object to manipulate the number of rendered panels, the direction of each panel, and the rendered tabs in each panel. The layout manager generates the view and some user interactions.

## State Initialization

Initialize the state object as empty or restore the previously stored state. The state object is serializable by the `JSON.stringify()` function. Therefore, passing the state instance to the indexed DB is safe when storing user data.

```ts
import { State, SerializedState, Manager } from '@pawel-up/tabs-split-layout';

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

When initializing the manager, you must pass the `State` class instance as the first argument. The second parameter is the configuration options, if any. We will show different configurations depending on other use cases.

```ts
const layout = new Manager(state, {
  // ...
});

layout.connect();
```

The `connect()` method registers event listeners the manager uses to manage user interactions. By default, it listens for events on `document.body` node. However, if you want to limit the scope, you can pass the reference to the layout's parent container. The entire tab layout needs to be inside the light DOM of the passed parent element.

Previous step: [Installation](readme.md)
Next step: [Rendering the view](rendering.md)
