import { TemplateResult, render as litRender } from "lit";
import { StateEvent } from "./events/StateEvent.js";
import { View } from "./View.js";
import { Transaction } from "./transaction/Transaction.js";
import type { State } from "./State.js";
import type { CreatedEventDetail, ManagerInit, ManagerRenderOptions, PanelRenderCallback } from "./type.js";
import type SplitView from "./SplitView.js";

export const handleStateChange = Symbol('handleStateChange');
export const handleStateRender = Symbol('handleStateRender');
export const handleStateCreated = Symbol('handleStateCreated');
export const handleFocusIn = Symbol('handleFocusIn');
export const findViewFromEvent = Symbol('findViewFromEvent');
export const notifyRender = Symbol('notifyRender');
export const dispatchStateChange = Symbol('dispatchStateChange');
export const computeManualRendering = Symbol('computeManualRendering');
export const renderLayout = Symbol('renderLayout');
export const manageStateEvents = Symbol('manageStateEvents');

/**
 * The layout manager that manages the rendering process, user interactions,
 * and all the mechanics of representing the sate as the split layout.
 * 
 * @fires render - An event dispatched when the hosting application should trigger DOM update. Note, the event is not dispatched when auto rendering is used.
 * @fires change - When the state has changed through a user interaction or otherwise internal processing the the state should be stored by the application.
 * @fires created - A custom event when an item was created. The detail object contains the `TransactionalItem` object which can be manipulated if needed.
 */
export class Manager extends EventTarget {
  /**
   * The reference to the view object generating the layout.
   */
  protected view: View;

  #state: State;
  
  /**
   * The state object used to represent the layout.
   */
  get state(): State {
    return this.#state;
  }

  set state(value: State) {
    if (this.#state === value) {
      // simple ref check.
      return;
    }
    const old = this.#state;
    this.#state = value;
    this[manageStateEvents](value, old);
  }

  #opts: Readonly<ManagerInit>;

  /**
   * The original configuration options.
   */
  get opts(): Readonly<ManagerInit> {
    return this.#opts;
  }

  #manualRendering: boolean;

  /**
   * When true then the manager won't trigger rendering function
   * automatically (which is the default behavior) and instead the hosting application
   * must listen to the `render` event and render the view when requested.
   */
  get manualRendering(): boolean {
    return this.#manualRendering;
  }

  #renderRoot: HTMLElement | null = null;

  /**
   * The reference to an element where the Manager should render the layout.
   * This is only used when the `render` and `parent` properties are set on the 
   * Manager's configuration object.
   */
  get renderRoot(): HTMLElement | null {
    const { opts, manualRendering } = this;
    if (manualRendering) {
      return null;
    }
    if (this.#renderRoot) {
      return this.#renderRoot;
    }
    // this has to be set per `manualRendering`.
    const render = opts.render as ManagerRenderOptions;
    let target: HTMLElement | null = null;
    if (typeof render.parent === 'string') {
      const node = document.querySelector(render.parent);
      if (node && node.nodeType === Node.ELEMENT_NODE) {
        target = node as HTMLElement;
      }
    } else if (render.parent) {
      target = render.parent;
    }
    this.#renderRoot = target;
    return target;
  }
  
  /**
   * @param state The state object used to represent the layout.
   * @param opts The configuration options.
   */
  constructor(state: State, opts: ManagerInit = {}) {
    super();
    this[handleStateChange] = this[handleStateChange].bind(this);
    this[handleStateRender] = this[handleStateRender].bind(this);
    this[handleStateCreated] = this[handleStateCreated].bind(this);
    this[handleFocusIn] = this[handleFocusIn].bind(this);

    this.#state = state;
    this[manageStateEvents](state);
    this.#opts = Object.freeze(opts);
    this.view = new View(this.opts);
    
    this.#manualRendering = this[computeManualRendering]();
  }

  [manageStateEvents](value: State, old?: State): void {
    if (old) {
      old.removeEventListener('change', this[handleStateChange]);
      old.removeEventListener('render', this[handleStateRender]);
      old.removeEventListener('created', this[handleStateCreated]);
    }
    value.addEventListener('change', this[handleStateChange]);
    value.addEventListener('render', this[handleStateRender]);
    value.addEventListener('created', this[handleStateCreated]);
  }

  /**
   * Initializes global events that are used when managing the view.
   * 
   * @param parent The parent on which to handle events. It should be the parent of the layout view.
   */
  connect(parent: EventTarget = document.body): void {
    parent.addEventListener('focusin', this[handleFocusIn]);
  }

  /**
   * Removes events listeners previously set with the `connect()` method.
   * 
   * @param parent Previously set parent.
   */
  disconnect(parent: EventTarget = document.body): void {
    parent.removeEventListener('focusin', this[handleFocusIn]);
  }

  /**
   * Since options don't change after setting them, we compute the 
   * value for `#manualRendering` once.
   * The manual rendering is when `parent` and `render` options 
   * are not set.
   */
  [computeManualRendering](): boolean {
    const { opts } = this;
    if (!opts.render) {
      return true;
    }
    const { renderer, parent } = opts.render;
    return !(typeof renderer === 'function' && !!parent);
  }

  [handleFocusIn](e: Event): void {
    const layout = this[findViewFromEvent](e);
    if (!layout) {
      return;
    }
    const key = layout.key as string;
    const def = this.state.definitions.get(key);
    if (def) {
      this.state.currentPanel = key;
    }
  }

  [findViewFromEvent](e: Event): SplitView | undefined {
    const { viewName = 'split-view' } = this.opts;
    const path = e.composedPath();
    while (path.length) {
      const node = path.shift() as Element;
      if (node.nodeType !== Node.ELEMENT_NODE) {
        continue;
      }
      if (node.localName === viewName) {
        return node as SplitView;
      }
    }
    return undefined;
  }

  render(renderer: PanelRenderCallback): TemplateResult[] {
    const result: TemplateResult[] = [];
    const { state, view } = this;
    for (const info of state.items) {
      const panel = state.panel(info.key);
      if (!panel) {
        continue;
      }
      const content = view.renderPanel(this, panel, renderer);
      if (content) {
        result.push(content);
      }
    }
    return result;
  }

  [notifyRender](): void {
    const { manualRendering } = this;
    if (manualRendering) {
      this.dispatchEvent(new Event('render'));
    } else {
      this[renderLayout]();
    }
  }

  [dispatchStateChange](): void {
    this.dispatchEvent(new StateEvent('change', this.state));
  }

  [handleStateChange](): void {
    this[dispatchStateChange]();
  }

  [handleStateRender](): void {
    this[notifyRender]();
  }

  /**
   * Retargets the `created` event originating from the state.
   * If the event is canceled then the original event is also canceled.
   */
  [handleStateCreated](e: Event): void {
    const orig = e as CustomEvent<CreatedEventDetail>;
    const event = new CustomEvent<CreatedEventDetail>('created', {
      cancelable: true,
      detail: orig.detail,
    })
    this.dispatchEvent(event);
    if (event.defaultPrevented) {
      orig.preventDefault();
    }
  }

  /**
   * @param panelKey The panel key to search for.
   * @returns The `split-view` element in the document
   */
  findView(panelKey: string): SplitView | null {
    const { viewName = 'split-view' } = this.opts;
    return document.querySelector(`${viewName}[key="${panelKey}"]`) as SplitView | null;
  }

  /**
   * Called when the Manager takes over the rendering process.
   * It render the view into the configured parent.
   */
  [renderLayout](): void {
    const { renderRoot, opts } = this;
    if (!renderRoot) {
      // eslint-disable-next-line no-console
      console.warn(`The parent node where to render the layout is not available.`);
      return;
    }
    const { render } = opts;
    if (!render) {
      return;
    }
    if (typeof render.renderer !== 'function') {
      return;
    }
    const content = this.render(render.renderer);
    litRender(content, renderRoot, render.options);
  }

  transaction(): Transaction {
    const result = new Transaction(this.state);
    return result;
  }
}
