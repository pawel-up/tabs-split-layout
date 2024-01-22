import { Item, SerializedItem } from "./Item.js";
import { Panel, SerializedPanel } from "./Panel.js";
import { PanelObject } from "./PanelObject.js";
import type { TransactionalItem } from "./transaction/TransactionalItem.js";
import { CreatedEventDetail, SerializedStateObject, StateObject, TabCreateReason } from "./type.js";
import { LayoutObjectType } from "./Enum.js";

export interface SerializedState {
  definitions: SerializedStateObject[];
  items: PanelObject[];
}

export const reset = Symbol('reset');
export const createItem = Symbol('createItem');
export const createPanel = Symbol('createPanel');

/**
 * The state class that is used by the manager to render the view and control the logic.
 * 
 * @fires render - When the application should trigger a render of the layout.
 * @fires change - When the internal state has changed.
 * @fires created - A custom event when an item was created. The detail object contains the `TransactionalItem` object which can be manipulated if needed.
 */
export class State extends EventTarget {
  /**
   * The list of all definitions of panels and items.
   * The map key is the item key, and the value is an instance of either a panel or an item.
   */
  definitions = new Map<string, StateObject>();

  /**
   * Holds an ordered list of panels in the layout.
   * Though, this interface is consistent with other panels, it can only keep panels, not items.
   */
  items: PanelObject[] = [];

  #currentPanel?: string;

  /**
   * The key of the last focused Panel, if any.
   * This is used to get a reference to the "active Panel".
   */
  get currentPanel(): string | undefined {
    return this.#currentPanel;
  }

  set currentPanel(value: string | undefined) {
    if (this.#currentPanel === value) {
      return;
    }
    this.#currentPanel = value;
    this.notifyRender();
  }

  /**
   * @param restored When available this is the restored state data. When not set it creates an empty state.
   */
  constructor(restored?: SerializedState) {
    super();
    if (restored) {
      this.new(restored);
    }
  }

  [reset](): void {
    this.definitions = new Map();
    this.items = [];
  }

  /**
   * A method to create an item. It is used in child classes to create 
   * different kind of items.
   * @param schema The item schema
   * @returns The created item
   */
  [createItem](schema: SerializedItem): Item {
    return new Item(this, schema);
  }

  /**
   * A method to create a panel. It is used in child classes to create 
   * different kind of panels.
   * @param schema The panel schema
   * @returns The created panel
   */
  [createPanel](schema: SerializedPanel): Panel {
    return new Panel(this, schema);
  }

  /**
   * Overrides the current state.
   * @param schema The state to set.
   */
  new(schema: SerializedState): void {
    this[reset]();
    const { definitions = [], items = [] } = schema;
    for (const value of definitions) {
      if (value.type === LayoutObjectType.item) {
        const instance = this[createItem](value.value as SerializedItem);
        this.definitions.set(instance.key, {
          type: LayoutObjectType.item,
          value: instance,
        });
      } else if (value.type === LayoutObjectType.panel) {
        const instance = this[createPanel](value.value as SerializedPanel);
        this.definitions.set(instance.key, {
          type: LayoutObjectType.panel,
          value: instance,
        });
      }
    }
    for (const value of items) {
      this.items.push({ ...value });
    }
  }

  toJSON(): SerializedState {
    const result: SerializedState = {
      definitions: [],
      items: this.items.map(i => ({ ...i})),
    };
    this.definitions.forEach((value) => {
      const serialized = value.value.toJSON();
      result.definitions.push({
        type: value.type,
        value: serialized,
      });
    });
    return result;
  }

  /**
   * Finds an item in the layout.
   * @param key The key of the item to find.
   */
  get(key: string): Panel | Item | null {
    const def = this.definitions.get(key);
    if (def) {
      return def.value;
    }
    return null;
  }

  /**
   * Finds a `Panel` by its key.
   * 
   * @param key The id of the panel.
   * @returns The panel if found
   */
  panel(key: string): Panel | null {
    const result = this.definitions.get(key);
    if (!result) {
      return null;
    }
    if (result.type !== LayoutObjectType.panel) {
      return null;
    }
    return result.value as Panel;
  }

  /**
   * Finds an `Item` by its key.
   * 
   * @param key The id of the panel's item.
   * @returns The item if found
   */
  item(key: string): Item | null {
    const result = this.definitions.get(key);
    if (!result) {
      return null;
    }
    if (result.type !== LayoutObjectType.item) {
      return null;
    }
    return result.value as Item;
  }

  /**
   * Creates a deep copy of the current state.
   * @returns A clone of this state.
   */
  clone(): State {
    return new State(this.toJSON());
  }

  /**
   * An active panel is the one the user focused last or the first panel that can host items.
   * 
   * @returns The reference to the active panel or null when no panels are defined.
   */
  activePanel(): Panel | null {
    const { currentPanel } = this;
    if (currentPanel) {
      const panel = this.panel(currentPanel);
      if (panel) {
        return panel;
      }
    }
    for (const panel of this.panelsIterator()) {
      if (panel.hasItems || !panel.hasPanels) {
        return panel;
      }
    }
    return null;
  }

  /**
   * Notifies listeners when something changed so the application
   * should trigger a render operation.
   */
  notifyRender(): void {
    this.dispatchEvent(new Event('render'));
  }

  /**
   * Notifies listeners when the internal state has changed.
   */
  notifyChange(): void {
    this.dispatchEvent(new Event('change'));
  }

  /**
   * Notifies listeners about an item being created.
   * @param item The item that just been created.
   */
  notifyItemCreated(item: TransactionalItem, reason: TabCreateReason): CustomEvent<CreatedEventDetail> {
    const event = new CustomEvent<CreatedEventDetail>('created', {
      cancelable: true,
      detail: { item, reason },
    })
    this.dispatchEvent(event);
    return event;
  }

  /**
   * Iterates over panels from the root. 
   * This iterates the panels structure in order defined in the `items` array on 
   * each panel.
   * 
   * @param parentPanel The parent TabsLayout to start the iteration from.
   */
  * panelsIterator(parentPanel?: Panel): Generator<Panel> {
    const root = parentPanel || this;
    const { items } = root;
    for (const info of items) {
      if (info.type === LayoutObjectType.panel) {
        const panel = this.panel(info.key);
        if (panel) {
          yield panel;
          for (const result of this.panelsIterator(panel)) {
            yield result;
          }
        }
      }
    }
  }

  /**
   * Iterates over items in each panel in order.
   * @param parentPanel Optionally the start panel. By default it starts from the root panel.
   */
  * itemsIterator(parentPanel?: Panel): Generator<Item> {
    if (parentPanel) {
      for (const item of parentPanel) {
        yield item;
      }
    }
    for (const panel of this.panelsIterator(parentPanel)) {
      for (const item of panel) {
        yield item;
      }
    }
  }

  /**
   * Checks whether the state has at least one panel that has items.
   * 
   * This is useful to render the empty state when no items are added.
   */
  isEmpty(): boolean {
    for (const panel of this.panelsIterator()) {
      if (panel.hasItems) {
        return false;
      }
    }
    return true;
  }
}
