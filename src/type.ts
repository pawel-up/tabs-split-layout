import type { RenderOptions, TemplateResult } from "lit";
import type { Item, SerializedItem } from "./Item.js";
import type { Panel, SerializedPanel } from "./Panel.js";
import type { LayoutDirection, LayoutObjectType, SplitPanelTarget, SplitRegion } from "./Enum.js";

export interface TabsLayoutAddOptions {
  /**
   * The region to add the item.
   * When other than `center` it splits the panel.
   */
  region?: SplitRegion;
  /**
   * The index at which to put the item.
   * By default it is added as a last item.
   */
  index?: number;
}

export interface PanelSplitOptions {
  /**
   * The layout direction.
   */
  direction?: LayoutDirection;
  /**
   * Directs where to put existing items.
   * It's either the first or the other panel.
   */
  itemsTarget?: SplitPanelTarget;
}

export interface PanelAddOptions {
  /**
   * The direction of the new panel.
   */
  direction?: LayoutDirection;
}

export interface StateObject {
  type: LayoutObjectType;
  value: Item | Panel;
}

export interface SerializedStateObject {
  type: LayoutObjectType;
  value: SerializedItem | SerializedPanel;
}

export type PanelRenderCallback = (item: Item, visible: boolean) => TemplateResult;

export interface ManagerInit {
  /**
   * When set the Manager takes control over the rendering process.
   * The `render` event won't be dispatched and you won't be notified when the 
   * render should happen.
   */
  render?: ManagerRenderOptions;

  /**
   * The list of DataTransfer types to test against when handling drag and drop.
   * When set it checks whether all types are set on the dragged item.
   * If not set all items are allowed.
   */
  dragTypes?: string[];

  /**
   * When set it adds the `overflow` hidden on the container that holds the tab contents.
   */
  constrain?: boolean;

  /**
   * The registered name of the `<split-view>` element, if different than default.
   * If you need to register own name of the component, populate this with the registered name.
   */
  viewName?: string;
}

export interface ManagerRenderOptions {
  /**
   * The CSS selector or a reference to the parent element where the layout is rendered.
   * This is used in the "auto" configuration when the layout is rendered outside of 
   * scope of your application.
   * 
   * Must be set with the `render` property or it will be ignored.
   */
  parent: string | HTMLElement;
  /**
   * A callback function called for each item in the layout during the rendering phase.
   * Use the `item` to get a reference to the layout data stored with the state. The
   * `visible` flag tells you whether the item is currently rendered in that view.
   * 
   * It is up to you to decide whether the item should be still attached to the DOM 
   * when it's not visible or whether it should be just hidden. If the rendered 
   * element has expensive initialization then you may consider leaving the element 
   * hidden in the DOM.
   * 
   * This must be set with the `parent` property. Otherwise you must render layout manually,
   * giving you more control over how the rendering process looks like.
   * 
   * @param item The rendered item.
   * @param visible Whether the item is visible in the layout.
   * @returns The template result for the rendered DOM.
   */
  renderer: (item: Item, visible: boolean) => TemplateResult;
  /**
   * Lit render options.
   * 
   * You may want to set the `host` property to correctly scope events.
   * 
   * Example:
   * 
   * ```
   * class MyPage {
   *  handleClick(e: Event): void {
   *   // your code here.
   *  }
   *  
   *  initialize(): void {
   *    const state = new State();
   *    const layout = new Manager(state, {
   *      render: {
   *        parent: '.layout',
   *        host: this,
   *        renderer: (item: Item, visible: boolean): TemplateResult => html`
   *          <section 
   *            ?hidden="${!visible}" 
   *            data-key="${item.key}"
   *          ><button @click="${this.handleClick}">Click me!</button</section>
   *       `,
   *   }
   *  }
   * }
   * ```
   */
  options?: RenderOptions;
}
