/* eslint-disable lit/no-classfield-shadowing */
import { html, LitElement, nothing, PropertyValues, TemplateResult } from "lit";
import { eventOptions, property, state } from "lit/decorators.js";
import { classMap, ClassInfo } from "lit/directives/class-map.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { LayoutDirection, SplitRegion } from "./Enum.js";
import { add as addIcon, close as closeIcon } from './lib/icons.js';
import type { Panel } from "./Panel.js";
import type { Item } from "./Item.js";
import type { Manager } from "./Manager.js";
import SplitViewLib from './lib/SplitView.lib.js';
import Interactions from './lib/Interactions.js';
import { StateHelper } from "./StateHelper.js";
import type { InteractionsConfig } from "./type.js";

export const handleStateChange = Symbol('handleStateChange');
export const handleStateUpdate = Symbol('handleStateUpdate');
export const handleElementDragOver = Symbol('handleElementDragOver');
export const handleElementDrop = Symbol('handleElementDrop');
export const notifyTabClosed = Symbol('notifyTabClosed');
export const closeTabFromEvent = Symbol('closeTabFromEvent');
export const handleDocumentDragleave = Symbol('handleDocumentDragleave');
export const handleDocumentDragEnd = Symbol('handleDocumentDragEnd');
export const handleTabDragStart = Symbol('handleTabDragStart');
export const handleTabClick = Symbol('handleTabClick');
export const notifyContentResize = Symbol('notifyContentResize');
export const handleTabPointerDown = Symbol('handleTabPointerDown');
export const handleTabCloseClick = Symbol('handleTabCloseClick');
export const handleTabTouchStart = Symbol('handleTabTouchStart');
export const handleTabKeyDown = Symbol('handleTabKeyDown');
export const handleTabListDragover = Symbol('handleTabListDragover');
export const handleTabListDrop = Symbol('handleTabListDrop');
export const panelCanDrop = Symbol('panelCanDrop');
export const hasDropTypes = Symbol('hasDropTypes');
export const increaseDecreaseSelected = Symbol('increaseDecreaseSelected');
export const handleTabListFocus = Symbol('handleTabListFocus');
export const activateTab = Symbol('activateTab');
export const notifyContextualMenu = Symbol('notifyContextualMenu');
export const mutationObserver = Symbol('mutationObserver');
export const handleMutationChange = Symbol('handleMutationChange');
export const registerPanel = Symbol('registerPanel');
export const unregisterPanel = Symbol('unregisterPanel');
export const setupPanels = Symbol('setupPanels');
export const registeredPanels = Symbol('registeredPanels');
export const handleAddTabClick = Symbol('handleAddTabClick');

/**
 * A split layout element.
 * 
 * It works with the `State` instance to render layout for a panel.
 * 
 * ## Accessibility
 * 
 * The `[role=tablist]` element should have the `aria-label` set on it. It receives a default value but it also 
 * can be set by the author when setting `data-aria-label` on the element.
 * 
 * The tab panels (rendered items) should have the `[role="tabpanel"]` attribute set. If not, the view
 * won't make a connection between the `tab` and the `tabpanel`. Once the `[role="tabpanel"]` is detected
 * it adds the `aria-controls` attribute to the `[role=tab]` element. During this process, the `id` might be set
 * on the `[role="tabpanel"]` element, if not already set.
 * 
 * @fires closetab - A custom event where the detail is the key of the closed tab. Dispatched when a tab was closed.
 * @fires contextmenu - When the user presses F10 with shift key together. It triggers a contextual menu.
 */
export default class SplitView extends LitElement {
  /**
   * The layout direction.
   * 
   * @attribute
   */
  @property({ type: String, reflect: true }) direction?: LayoutDirection = LayoutDirection.horizontal;

  /**
   * The identifier of this view. It is the key of the panel that generated the view.
   * For the view to generate any layout, the `state` property must be set.
   * 
   * @attribute
   */
  @property({ type: String, reflect: true }) key?: string;

  /**
   * A reference to the layout state object.
   * Set the `key` property to inform which panel is being rendered.
   * The panel is computed when both values are set.
   */
  @property({ type: Object }) manager?: Manager;

  @property({ type: Array }) dragTypes?: string[];

  /**
   * Whether dragging is occurring over the element.
   */
  @state() inDrag = false;

  /**
   * The drop region the current drag is leaning to.
   */
  @state() dragRegion?: SplitRegion = SplitRegion.center;

  /**
   * When set it adds the `overflow` hidden on the container that holds the tab contents.
   * @attribute
   */
  @property({ type: Boolean, reflect: true }) constrain = false;

  /**
   * The configuration of user interactions, if any.
   * This is usually passed in the Manager's constructor.
   */
  @property({ type: Object }) interactions?: InteractionsConfig;

  /**
   * Reads the current panel for the given `state` and `key`.
   * Do not cache this property as it may change outside of the 
   * scope of state management of a lit element, which won't 
   * trigger an update.
   */
  get panel(): Panel | null {
    const { key, manager } = this;
    if (key && manager) {
      return manager.state.panel(key);
    }
    return null;
  }

  /**
   * Gets a computed value of the `aria-label` to be set on the `[role=tablist]`.
   * By default is sets "Available tabs" but if `data-aria-label` is set on this element
   * then this value is returned instead. 
   */
  get tabListAriaLabel(): string {
    const { dataset } = this;
    const { ariaLabel } = dataset;
    return ariaLabel || 'Available tabs';
  }

  /**
   * Computed value. Returns true when the "add" button should be rendered
   * and the interaction with it is active.
   */
  get shouldRenderAddButton(): boolean {
    const { interactions } = this;
    if (!interactions) {
      return false;
    }
    return !!interactions.addTab;
  }

  /**
   * The mutation observer used to determine tab contents IDs and map them to 
   * the item key. It's used to support the `aria-controls` attribute set on 
   * a tab.
   */
  [mutationObserver]: MutationObserver;

  /**
   * A map where keys are the `key` property of an item and the value
   * is the value of the `id` attribute of a recognized panel.
   * This is used to set the `aria-controls` attribute set on 
   * a tab.
   */
  [registeredPanels] = new Map<string, string>();

  constructor() {
    super();
    this[handleDocumentDragleave] = this[handleDocumentDragleave].bind(this);
    this[handleDocumentDragEnd] = this[handleDocumentDragEnd].bind(this);
    this[handleStateUpdate] = this[handleStateUpdate].bind(this);

    // event's registered on the element are GCed so they don't need to be
    // registered and unregistered with lifecycle methods.
    this.addEventListener('dragover', this[handleElementDragOver].bind(this));
    this.addEventListener('drop', this[handleElementDrop].bind(this));

    this[mutationObserver] = new MutationObserver(this[handleMutationChange].bind(this));
  }

  override connectedCallback(): void {
    super.connectedCallback();
    document.body.addEventListener('dragleave', this[handleDocumentDragleave]);
    document.body.addEventListener('dragend', this[handleDocumentDragEnd]);
    this[mutationObserver].observe(this, {
      attributeFilter: ['id'],
      attributes: true,
      childList: true,
      attributeOldValue: true,
      subtree: true,
    });
    this[setupPanels]();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.body.removeEventListener('dragleave', this[handleDocumentDragleave]);
    document.body.removeEventListener('dragend', this[handleDocumentDragEnd]);
    this[mutationObserver].disconnect();
  }

  protected override willUpdate(cp: PropertyValues<this>): void {
    if (cp.has('manager')) {
      this[handleStateChange](cp.get('manager'));
    }
    super.willUpdate(cp);
  }

  [handleMutationChange](mutations: MutationRecord[]): void {
    for (const mutation of mutations) {
      if (mutation.target === this && mutation.type === 'childList') {
        // only accept direct children.
        for (const node of Array.from(mutation.addedNodes)) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const typedElement = node as Element;
            if (typedElement.role === 'tabpanel') {
              this[registerPanel](typedElement as HTMLElement);
            }
          }
        }
        for (const node of Array.from(mutation.removedNodes)) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const typedElement = node as Element;
            if (typedElement.role === 'tabpanel') {
              this[unregisterPanel](typedElement as HTMLElement);
            }
          }
        }
        continue;
      } else if (mutation.target.nodeName === this.nodeName) {
        // coming from child `split-view`s.
        continue;
      }
      if (mutation.type === 'attributes' && mutation.target.nodeType === Node.ELEMENT_NODE) {
        const typedElement = mutation.target as Element;
        if (typedElement.role === 'tabpanel') {
          if (!Array.from(this.children).includes(typedElement)) {
            // making sure it's a direct child
            return;
          }
          this[registerPanel](typedElement as HTMLElement);
        }
      }
    }
  }

  /**
   * Adds event listeners on the state object to update the view
   * when the state change.
   * 
   * @param old The old state object, if any, to remove event listeners.
   */
  [handleStateChange](old?: Manager): void {
    if (old) {
      old.state.removeEventListener('change', this[handleStateUpdate]);
    }
    const { manager } = this;
    if (manager) {
      manager.state.addEventListener('change', this[handleStateUpdate]);
    }
  }

  /**
   * A handler for the state's `change` event.
   * Requests an update when a change happens.
   */
  [handleStateUpdate](): void {
    this.requestUpdate();
  }
  
  /**
   * A handler for the drag over event on the element.
   * Sets the drag region when the dragged element can be dropped.
   */
  [handleElementDragOver](e: DragEvent): void {
    if (!this[panelCanDrop](e)) {
      return;
    }
    e.preventDefault();
    const region = SplitViewLib.getDropRegionFromEvent(e, this.localName);
    if (!region) {
      this.inDrag = false;
      return;
    }
    const dt = e.dataTransfer as DataTransfer;
    if (e.shiftKey) {
      dt.dropEffect = 'link';
    } else {
      dt.dropEffect = 'move';
    }
    this.inDrag = true;
    this.dragRegion = region;
  }

  /**
   * A handler for the drag leave on the document's body.
   * Clears the drag state when needed.
   */
  [handleDocumentDragleave](e: DragEvent): void {
    const elm = SplitViewLib.findLayout(e, this.localName);
    if (!elm || elm !== this) {
      this.inDrag = false;
      this.dragRegion = SplitRegion.center;
    }
  }

  /**
   * A handler for the drag end on the document's body.
   * Clears the drag state when needed.
   */
  [handleDocumentDragEnd](): void {
    this.inDrag = false;
    this.dragRegion = SplitRegion.center;
  }

  /**
   * Checks whether the drag event has appropriate `types`
   * that matches set `dragTypes`.
   * 
   * The hosting application can restrict what data types can be accepted 
   * on the panel by setting `dragTypes` property. These types must then be 
   * set on when the drag starts.
   * 
   * @param dt The drag event's DataTransfer object.
   * @returns True when the types match the set types.
   */
  [hasDropTypes](dt: DataTransfer): boolean {
    const { dragTypes } = this;
    if (!Array.isArray(dragTypes)) {
      return true;
    }
    const eventTypes = [...dt.types].map(i => i.toLowerCase());
    const allowedTypes = dragTypes.map(i => i.toLowerCase());
    return !allowedTypes.some(type => !eventTypes.includes(type));
  }

  /**
   * Checks whether a drag target can be dropped on the panel.
   * 
   * @param e The originating drag event.
   * @returns True when the event is allowed on this panel.
   */
  [panelCanDrop](e: DragEvent): boolean {
    if (e.defaultPrevented) {
      return false;
    }
    const dataTransfer = e.dataTransfer as DataTransfer;
    if (!this[hasDropTypes](dataTransfer)) {
      return false;
    }
    const { panel } = this;
    if (!panel) {
      return true;
    }
    return panel.canDrop();
  }

  /**
   * Sets up the `dataTransfer` property of the drag element 
   * to indicate that the dragged element comes from this panel.
   * 
   * It is used when dragging items between panels or within a panel.
   */
  [handleTabDragStart](e: DragEvent): void {
    const dt = e.dataTransfer as DataTransfer;
    const { key, manager } = this;
    if (!key || !manager) {
      return;
    }
    const tab = SplitViewLib.findTab(e);
    if (!tab) {
      return;
    }
    const { key: itemKey } = tab.dataset;
    if (!itemKey) {
      return;
    }
    const item = manager.state.item(itemKey);
    if (!item) {
      return;
    }
    dt.effectAllowed = 'linkMove';
    dt.setData('item/key', itemKey);
    dt.setData('item/source', this.localName);
    dt.setData('item/custom', JSON.stringify(item.custom));
    dt.setData('layout/key', key);
  }

  /**
   * A handler for the tab list drag over event.
   * If the element can be dropped on the panel then it sets the drop effects.
   */
  [handleTabListDragover](e: DragEvent): void {
    const dt = e.dataTransfer;
    if (!dt || !this[panelCanDrop](e)) {
      return;
    }
    e.preventDefault();
    dt.effectAllowed = 'move';
    if (e.shiftKey) {
      dt.dropEffect = 'link';
    } else {
      dt.dropEffect = 'move';
    }
  }

  /**
   * A handler for the tab list drop event.
   * The difference between the content drop is that it won't split the layout 
   * and will drop the item on a specific index.
   * 
   * Above that an item can be moved to another panel or linked.
   * When an item is linked, it creates a copy of the item (regenerating the `key`)
   * and inserted as a new item.
   */
  [handleTabListDrop](e: DragEvent): void {
    const { key, manager } = this;
    if (!this[panelCanDrop](e) || !key || !manager) {
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    const dt = e.dataTransfer as DataTransfer;
    const src = dt.getData('item/source');
    const itemKey = dt.getData('item/key');
    const srcPanelKey = dt.getData('layout/key');
    const movingTab = src === this.localName;
    const overTab = SplitViewLib.findTab(e);
    const toIndex = overTab && overTab.dataset.index ? Number(overTab.dataset.index) : undefined;
    if (movingTab && !srcPanelKey) {
      return;
    }
    if (movingTab) {
      if (e.shiftKey && srcPanelKey !== this.key) {
        // with the shift key it links an item between panels.
        const item = manager.state.item(itemKey);
        if (!item) {
          // This likely belongs to another state. Should we support this? How?
          return;
        }
        StateHelper.createItem(manager, key, item, { index: toIndex, reason: 'dnd' });
      } else {
        StateHelper.moveItem(manager, srcPanelKey, key, itemKey, {
          index: toIndex,
        });
      }
      return;
    }
    const custom = dt.getData('item/custom');
    const def: Partial<Item> = {
      key: itemKey, 
      label: 'New tab',
    };
    if (custom) {
      def.custom = JSON.parse(custom);
    }
    StateHelper.createItem(manager, key, def, { index: toIndex, reason: 'dnd' });
  }

  /**
   * A handler for the drop event on the element.
   * Clears the drag regions and adds an item to a panel
   * or moves an item between panels.
   */
  [handleElementDrop](e: DragEvent): void {
    const { key, manager } = this;
    if (!key || !manager || !this[panelCanDrop](e)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const dt = e.dataTransfer as DataTransfer;
    const itemKey = dt.getData('item/key');
    if (!itemKey) {
      return;
    }
    this.inDrag = false;
    const srcPanelKey = dt.getData('layout/key');
    if (srcPanelKey) {
      if (e.shiftKey) {
        // with the shift key it adds the existing item to another panel.
        const item = manager.state.item(itemKey);
        if (!item) {
          // This likely belongs to another state. Should we support this? How?
          return;
        }
        StateHelper.createItem(manager, key, item, { region: this.dragRegion, reason: 'dnd' });
      } else {
        // moving within the same panel, but to another region, or between panels.
        StateHelper.moveItem(manager, srcPanelKey, key, itemKey, {
          region: this.dragRegion,
        });
      }
      return;
    }
    const custom = dt.getData('item/custom');
    const def: Partial<Item> = {
      key: itemKey, 
      label: 'New tab',
    };
    if (custom) {
      def.custom = JSON.parse(custom);
    }
    StateHelper.createItem(manager, key, def, { region: this.dragRegion, reason: 'dnd' });
  }

  /**
   * A handler for the click event on a tab.
   * Selects the clicked tab and dispatched the resize `event` on the target content.
   */
  [handleTabClick](e: Event): void {
    const key = (e.currentTarget as HTMLElement).dataset.key as string;
    if (!key) {
      return;
    }
    this.selectTab(key)
  }

  /**
   * It awaits for the DOM update, finds the item's content,
   * and dispatches the `resize` event on the container element.
   * 
   * This way the content can be notified that it's being rendered and
   * should adjust its size, when needed. The event does not bubble.
   * 
   * @param key The key of the item to notify.
   */
  async [notifyContentResize](key: string): Promise<void> {
    await this.updateComplete;
    const child = this.querySelector(`[data-key="${key}"]`);
    if (child) {
      child.dispatchEvent(new Event('resize'));
    }
  }

  /**
   * A handler for the `pointerdown` event on a tab.
   * Closes a tab when the middle mouse button was pressed.
   */
  [handleTabPointerDown](e: PointerEvent): void {
    if (!Interactions.isMiddleButton(e)) {
      return;
    }
    this[closeTabFromEvent](e);
  }

  /**
   * A handler for the `close` icon click in the UI.
   */
  [handleTabCloseClick](e: Event): void {
    this[closeTabFromEvent](e);
  }

  /**
   * A handler for the touch event on a tab.
   * Closes a tab when touched by 3 fingers.
   */
  @eventOptions({ passive: true })
  [handleTabTouchStart](e: TouchEvent): void {
    if (Interactions.isCloseTouch(e)) {
      this[closeTabFromEvent](e);
    }
  }

  /**
   * Closes a tab that is found from the passed event.
   * @param e The originating event
   */
  [closeTabFromEvent](e: Event): void {
    const tab = SplitViewLib.findTab(e);
    if (!tab) {
      return;
    }
    const { key } = tab.dataset;
    if (!key) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    this.closeTab(key);
  }

  /**
   * Selects a given tab in the current panel.
   */
  selectTab(itemKey: string): void {
    const { key, manager } = this;
    if (!key || !manager) {
      throw new Error(`The "state" or "key" is not set.`);
    }
    try {
      StateHelper.selectItem(manager, itemKey, key);
      this[notifyContentResize](key);
      this[activateTab](itemKey);
    } catch (e) {
      // suppress.
    }
  }

  /**
   * Closes a tab for the given item's key.
   * @param itemKey The key of the item to close.
   */
  closeTab(itemKey: string): void {
    const { manager, key } = this;
    if (!manager || !key) {
      return;
    }
    StateHelper.removeItem(manager, itemKey, key);
    this[notifyTabClosed](itemKey);
  }

  /**
   * Dispatches the `closetab` custom event where the detail is the key of the closed tab.
   * 
   * @param key The key of the closed tab. Added as the detail of the event.
   */
  [notifyTabClosed](key: string): void {
    this.dispatchEvent(new CustomEvent('closetab', {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail: key,
    }));
  }

  /**
   * A handler for the keydown event on a tab.
   * Selects the tab for "Enter" key.
   */
  [handleTabKeyDown](e: KeyboardEvent): void {
    const { key } = e;
    let cancel = false;
    if (key === 'Enter') {
      this[handleTabClick](e);
      cancel = true;
    } else if (key === 'Delete') {
      this[closeTabFromEvent](e);
      cancel = true;
    } else if (key === 'ArrowRight') {
      this.activateNext();
      cancel = true;
    } else if (key === 'ArrowLeft') {
      this.activatePrevious();
      cancel = true;
    } else if (key === 'Home') {
      this.activateFirst();
      cancel = true;
    } else if (key === 'End') {
      this.activateLast();
      cancel = true;
    } else if (key === 'F10' && e.shiftKey) {
      this[notifyContextualMenu](e);
      cancel = true;
    }
    if (cancel) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  /**
   * Activates next to the current tab.
   * Part of a11y.
   */
  activateNext(): void {
    this[increaseDecreaseSelected](1);
  }

  /**
   * Activates next to the current tab.
   * Part of a11y.
   */
  activatePrevious(): void {
    this[increaseDecreaseSelected](-1);
  }

  /**
   * Activates the first tab on the list, if any.
   */
  activateFirst(): void {
    const { panel } = this;
    if (!panel) {
      return;
    }
    const items = panel.sortedItems();
    if (!items.length) {
      return;
    }
    const { key } = items[0];
    this.selectTab(key);
  }

  /**
   * Activates the last tab on the list, if any.
   */
  activateLast(): void {
    const { panel } = this;
    if (!panel) {
      return;
    }
    const items = panel.sortedItems();
    if (!items.length) {
      return;
    }
    const { key } = items[items.length - 1];
    this.selectTab(key);
  }

  /**
   * A handler for the tab list element focus event.
   * This only happens when the panel has no item selected.
   * In such case the view sets the `tabindex` on the list instead of a 
   * particular tab. When focus is given on the list, it selects the first
   * tab and removes `tabindex` from the list.
   */
  [handleTabListFocus](): void {
    this[increaseDecreaseSelected](1);
  }

  async [increaseDecreaseSelected](delta: number): Promise<void> {
    const { panel } = this;
    if (!panel) {
      return;
    }
    const items = panel.sortedItems();
    if (!items.length) {
      return;
    }
    const currentIndex = items.findIndex(i => i.key === panel.selected);
    const offset = delta < 0 ? items.length : 0;
    const nextIndex = (currentIndex + delta + offset) % items.length;
    const { key } = items[nextIndex];
    this.selectTab(key);
  }

  async [activateTab](key: string): Promise<void> {
    await this.updateComplete;
    // focus on the tab
    const tab = this.shadowRoot!.querySelector(`[role="tab"][data-key="${key}"]`) as HTMLElement | null;
    if (tab) {
      tab.focus();
    }
    // dispatches the resize event
    this[notifyContentResize](key);
  }

  /**
   * Dispatches a bubbling `contextmenu` event from the tab.
   * This is used as a a11y measure when the tabs should support tabs menu.
   */
  [notifyContextualMenu](e: KeyboardEvent): void {
    const tab = SplitViewLib.findTab(e);
    if (!tab) {
      return;
    }
    const box = tab.getBoundingClientRect();
    const { top, left, width, height } = box;
    const x = top + height / 2;
    const y = left + width / 2;
    tab.dispatchEvent(new PointerEvent('contextmenu', {
      bubbles: true,
      composed: true,
      cancelable: true,
      altKey: e.altKey,
      button: 2,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      metaKey: e.metaKey,
      clientX: x,
      clientY: y,
      movementX: 0,
      movementY: 0,
      width: 1,
      height: 1,
      pressure: 1,
    }));
  }

  /**
   * Gets all children that are `[role=tabpanel]` and registers them
   * with the `this[registeredPanels]` map.
   */
  [setupPanels](): void {
    for (const node of Array.from(this.children)) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const typedElement = node as Element;
        if (typedElement.role === 'tabpanel') {
          this[registerPanel](typedElement as HTMLElement);
        }
      }
    }
  }

  /**
   * If the passed node is an Element node that has `role` set to "tabpanel"
   * then it ensures it has the `id` attribute set and registers this id
   * on the `this[registeredPanels]` map.
   * This is then used with accessibility.
   */
  [registerPanel](typedElement: HTMLElement): void {
    const { key } = typedElement.dataset;
    if (!key) {
      // we have no reference to a specific item.
      return;
    }
    if (!typedElement.id) {
      // eslint-disable-next-line no-param-reassign
      typedElement.id = `tlc-${key}`;
    }
    this[registeredPanels].set(key, typedElement.id);
    this.requestUpdate();
  }

  /**
   * If the passed node has the `data-key` attribute then it deregisters
   * a panel from the `this[registeredPanels]` map.
   * This is then used with accessibility.
   */
  [unregisterPanel](typedElement: HTMLElement): void {
    const { key } = typedElement.dataset;
    if (!key) {
      return;
    }
    this[registeredPanels].delete(key);
  }

  /**
   * A handler for the new tab click event.
   * When `shouldRenderAddButton` is computed to `true` then 
   * it creates a new item with the `user` reason.
   */
  [handleAddTabClick](): void {
    const { shouldRenderAddButton, manager, key } = this;
    if (!shouldRenderAddButton || !manager || !key) {
      return;
    }
    StateHelper.createItem(manager, key, {}, { reason: 'user' });
  }

  override render(): TemplateResult | typeof nothing {
    const { panel } = this;
    if (!panel) {
      return nothing;
    }
    const contentClasses: ClassInfo = {
      content: true,
      constrain: !!this.constrain,
    };
    return html`
    ${this.dragRegionTemplate()}
    ${this.tabsTemplate(panel)}
    <div class="${classMap(contentClasses)}">
      <slot></slot>
    </div>
    `;
  }

  protected dragRegionTemplate(): TemplateResult | typeof nothing {
    const { inDrag, dragRegion } = this;
    if (!inDrag) {
      return nothing;
    }
    return html`
    <div class="drag-region ${dragRegion}" aria-dropeffect="link"></div>
    `;
  }

  protected tabsTemplate(panel: Panel): TemplateResult | typeof nothing {
    if (panel.hasPanels) {
      // do not render the tab list view if the current panel has only panels.
      return nothing;
    }
    const items = panel.sortedItems();
    const hasSelectedItem = items.some(i => i.key === panel.selected);
    const listTabIndex = hasSelectedItem ? undefined : "0";
    const size = items.length;
    return html`
    <div 
      class="layout-tabs" 
      role="tablist"
      aria-label="${this.tabListAriaLabel}"
      tabindex="${ifDefined(listTabIndex)}"
      @dragover="${this[handleTabListDragover]}" 
      @drop="${this[handleTabListDrop]}"
      @focus="${this[handleTabListFocus]}"
    >
    ${items.map((tab, i) => this.tabTemplate(panel, tab, i + 1 === size, items[i + 1]?.key))}
    ${this.renderAddTabButton()}
    </div>
    `;
  }

  protected tabTemplate(panel: Panel, item: Item, last: boolean, nextKey?: string): TemplateResult {
    const info = panel.items.find(i => i.key === item.key);
    if (!info) {
      // this should not ever happen as the sorted items comes directly from `items`.
      return html``;
    }
    const { index = 0, pinned = false } = info;
    const { key, label = '', icon, isDirty = false } = item;
    const selected = panel.selected === key;
    const nextSelected = !!nextKey && panel.selected === nextKey;
    const closable = !pinned;
    const classes = {
      'layout-tab': true,
      'is-dirty': isDirty,
      pinned: !!pinned,
      selected,
    };
    let title = label;
    if (isDirty) {
      title += ' (Unsaved changes)';
    }
    const dividerHidden = last || selected || nextSelected;
    const controls = this[registeredPanels].get(key);
    return html`
    <div 
      id="tlt-${key}"
      data-key="${key}"
      data-index="${index}"
      data-dirty="${isDirty}"
      data-panel="${ifDefined(panel?.key)}"
      class="${classMap(classes)}" 
      draggable="${pinned ? "false" : "true"}"
      tabindex="${selected ? "0" : "-1"}"
      title="${title}"
      role="tab"
      aria-selected="${selected ? "true" : "false"}"
      aria-controls="${ifDefined(controls)}"
      @dragstart="${this[handleTabDragStart]}"
      @click="${this[handleTabClick]}" 
      @pointerdown="${this[handleTabPointerDown]}"
      @touchstart="${this[handleTabTouchStart]}"
      @keydown="${this[handleTabKeyDown]}"
    >
      ${icon ? html`<span class="tab-favicon icon" role="presentation">${icon}</span>` : ''}
      <span class="tab-label" role="presentation">${label}</span>
      ${closable ? html`<span role="presentation" class="close-icon icon" @click="${this[handleTabCloseClick]}">${closeIcon}</span>` : ''}
    </div>
    <div class="tab-divider ${dividerHidden ? 'hidden' : ''}" role="presentation"></div>
    `;
  }

  /**
   * @returns The template for the "add" icon, when configured.
   */
  protected renderAddTabButton(): TemplateResult | typeof nothing {
    const { shouldRenderAddButton } = this;
    if (!shouldRenderAddButton) {
      return nothing;
    }
    return html`
    <button class="icon-button add-button" aria-label="New tab" title="Add new tab" @click="${this[handleAddTabClick]}">
      <span class="icon" role="presentation">${addIcon}</span>
    </button>
    `;
  }
}
