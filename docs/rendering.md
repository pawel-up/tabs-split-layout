# Rendering the view

The library renders the layout as a number of panels with tabs in each panel. It is self contained, so minimal effort is required to render the layout. However, you will need to focus on rendering your content for each rendered tab.

## When a tab is rendered?

A tab is rendered each time when the "render" phase is running. It is happening whenever a transaction is committed, so, essentially, every time a user interacts with the layout. This includes opening a tab, closing a tab, moving tabs inside or between panels, splitting a panel, etc.

## Rendering strategies

There are two rendering strategies: hiding unused and removing unused content. Which is best depends on your situation.

### Hiding unused content

Essentially, you set the hide the content of the tab via the CSS so it is not rendered in the view with other tabs.

You would use this strategy when the cost of initialization of the view is high. For example, if the rendered view requires downloading data from the network each time it is initialized, then it's better for the user to keep the generated view in the DOM so when the user returns to the tab it is instantly accessible. However, this strategy may increase your footprint on memory use. The more tabs open the more DOM is generated plus the logic of each tab, and the more memory is used. On the bright side, the memory is to be used, after all.

### Removing unused content

On the other hand, if you don't mind the initialization time, you may completely ignore generating the DOM for tabs that are not visible to the user. The upside is that it requires the minimum memory to handle the application logic. For example, VSCode uses this strategy for extensions. When an extension's tab's content is invisible to the user the view is destroyed. It is recreated when the user goes back to the tab. However, it may require more effort to handle storing user state before the view is destroyed and restore it after the view is revealed again.

## Rendering content

The rendered content should have the `data-key` attribute set to the tab id. It ensures proper initialization, user interaction handling, and accessibility.

### Event based

The `Manager` dispatches the `render` event when the application should render the view for the layout. When handling the event you have the most flexibility and control over the render process.

```ts
import { State, Manager, Item, TemplateResult, html, render } from '@pawel-up/tabs-split-layout';

const state = new State();
const layout = new Manager(state);

layout.addEventListener('render', () => {
  // trigger your application rendering cycle or go straight to the next point.
});
```

Then later in your code, in the rendering cycle, call the `render()` function on the Manager.

```ts
const content = layout.render((item: Item, visible: boolean): TemplateResult => {
  return html`
  <section 
    ?hidden="${!visible}" 
    data-key="${item.key}"
  >Rendering ${item.label} with key ${item.key}</section>
  `;
});
const parent = document.querySelector('.layout-parent');
render(content, parent);
```

A lot to unpack here.

The `layout.render()` function takes a single argument which is the callback function called for each item rendered in each panel. When the callback is called, it has two argument: the item to render and whether the item is currently visible to the user. Depending on your rendering strategy, you can choose to hide the tab content (line in the example above) or you can ignore rendering anything.

If you decide to render the content, add the `data-key` with the item's key to the parent element of the content. The view uses it in some cases, like dispatching the `resize` event on the element when it becomes visible. It is also used to handle accessibility.

The library uses the highly efficient `lit-html` library to render the view. The `lit-html` uses the template literals to render the markup. It uses it's own notation system to manipulate attributes, properties, and events. Learn more about template rendering in [lit documentation](https://lit.dev/docs/components/rendering/).

If you are using VSCode, you can install the [Lit Plugin](https://marketplace.visualstudio.com/items?itemName=runem.lit-plugin) for templates syntax support.

Finally, use the `render` function that is exported by the library to translate the template into valid DOM. The `render` function is a part of the `lit-html` library and is exported unchanged.

### Automatic rendering

On the other hand, you can just point to the container element in the Manager configuration and pass the render function and the manager will take care of rendering the view when needed.

```ts
// Full example

import { State, Manager, Item, TemplateResult, html } from '@pawel-up/tabs-split-layout';

const state = new State();
const layout = new Manager(state, {
  render: {
    parent: '.layout',
    renderer: (item: Item, visible: boolean): TemplateResult => html`
      <section 
        ?hidden="${!visible}" 
        data-key="${item.key}"
      >Rendering ${item.label} with key ${item.key}</section>
      `,
  }
});
```

### Layout container

Recommended setup to begin with is the following:

```css
.layout {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
```

Assuming the `layout` is the class name added to the parent. With this setup the layout will render to the full available height and will force the content to shrink inside the layout instead of pushing whe width of the layout (the `overflow` property).

Note, the layout has minimal styling just to get you started. You can control many aspects of the view rendering through the CSS.

### Events scoping

When you attach events to the template inside the `html` function, by default, the scope of the event will be attached to the element. This is consistent with what you'd expect from regular web browser behavior. Sometimes it is not desired, especially when working with classes.

For that issue, the `lit-html` library allows you to specify the `host` property during the render phase where you can set the scope for the events. Once set, you do not have to `.bind(this)` callback functions.

Example:

```ts
import { State, Manager, Item, TemplateResult, html, render } from '@pawel-up/tabs-split-layout';

class MyPage {
  renderRoot: HTMLElement;
  state: State;
  layout: Manager;

  constructor() {
    this.renderRoot = document.querySelector('.layout') as HTMLElement;
    this.state = new State();
    this.layout = new Manager(state);
    this.layout.addEventListener('render', this.renderLayout.bind(this));
  }

  handleClick(e: Event): void {
    console.log('handler was called', this.renderRoot);
  }

  renderLayout(): void {
    const content = this.layout.render((item: Item, visible: boolean): TemplateResult => {
      return html`
      <section 
        ?hidden="${!visible}" 
        data-key="${item.key}"
      ><button @click="${this.handleClick}">Click me!</button</section>
      `;
    });
    render(content, this.renderRoot, { host: this, });
  }
}
```
